import { rgPath } from "@vscode/ripgrep";
import { spawnSync } from "child_process";
import * as vscode from "vscode";
import { Orchestrator } from "../orchestrator";
import {
  IFileToolConfig,
  IFileToolResponse,
} from "../application/interfaces/agent.interface";
import { Logger } from "../infrastructure/logger/logger";
import { getAPIKeyAndModel } from "./../utils/utils";
import { EmbeddingService } from "./embedding";
import { LogLevel } from "./telemetry";
import { WebSearchService } from "./web-search-service";
import {
  TavilySearchProvider,
  SearchResponseFormatter,
} from "../agents/tools/websearch";

export class ContextRetriever {
  // private readonly codeRepository: CodeRepository;
  private readonly embeddingService: EmbeddingService; // Always uses Gemini for consistency
  private static readonly SEARCH_RESULT_COUNT = 2;
  private readonly logger: Logger;
  private static instance: ContextRetriever;
  private readonly webSearchService: WebSearchService;
  protected readonly orchestrator: Orchestrator;
  private readonly tavilySearch: TavilySearchProvider;
  constructor() {
    // this.codeRepository = CodeRepository.getInstance();
    // Always use Gemini for embeddings to ensure consistency
    // regardless of the selected chat model (Groq, Anthropic, etc.)
    const embeddingProvider = "Gemini";
    const { apiKey: embeddingApiKey } = getAPIKeyAndModel(embeddingProvider);
    this.embeddingService = new EmbeddingService(embeddingApiKey);
    this.logger = Logger.initialize("ContextRetriever", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.webSearchService = WebSearchService.getInstance();
    this.tavilySearch = TavilySearchProvider.getInstance();
    this.orchestrator = Orchestrator.getInstance();
  }

  static initialize() {
    if (!ContextRetriever.instance) {
      ContextRetriever.instance = new ContextRetriever();
    }
    return ContextRetriever.instance;
  }

  // async retrieveContext(input: string): Promise<Row[] | undefined> {
  //   try {
  //     const embedding = await this.embeddingService.generateEmbedding(input);
  //     this.logger.info("Retrieving context from DB");
  //     // this.orchestrator.publish("onUpdate", "Retrieving context from DB");
  //     return await this.codeRepository.searchSimilarFunctions(
  //       embedding,
  //       ContextRetriever.SEARCH_RESULT_COUNT,
  //     );
  //   } catch (error:any) {
  //     this.logger.error("Unable to retrieve context", error);
  //     throw error;
  //   }
  // }

  async readFiles(
    fileConfigs: IFileToolConfig[],
  ): Promise<IFileToolResponse[]> {
    const files = fileConfigs.flatMap((file) => file);
    const promises = files.map(async (file) => {
      try {
        if (file.file_path) {
          const content = await this.readFileContent(file.file_path);
          return { function: file.function_name, content: content };
        }
      } catch (error: any) {
        this.logger.error(`Error reading file ${file.file_path}:`, error);
        throw new Error(`Error reading file ${file.file_path}: ${error}`);
      }
    });
    const results = await Promise.all(promises);
    return results.filter(
      (result): result is IFileToolResponse => result !== undefined,
    );
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(fileContent).toString("utf-8");
    } catch (error: any) {
      this.logger.error("Error reading file:", error);
      throw error;
    }
  }

  async webSearch(query: string) {
    try {
      const text = Array.isArray(query) ? query.join("") : query;
      return await this.webSearchService.run(text);
    } catch (error: any) {
      this.logger.error("Error reading file:", error);
      throw error;
    }
  }

  async travilySearch(query: string) {
    const defaults = {
      maxResults: 5,
      includeRawContent: false,
      timeout: 30000,
    };
    try {
      const result = await this.tavilySearch.search(query, defaults);
      return SearchResponseFormatter.format(result);
    } catch (error: any) {
      this.logger.error("[WebSearch] Execution Error:", error);
      return `Error performing web search: ${error.message}`;
    }
  }

  async grepWorkspace(params: {
    pattern: string;
    glob?: string;
    caseSensitive?: boolean;
    maxResults?: number;
  }): Promise<string> {
    const { pattern, glob, caseSensitive = false, maxResults = 200 } = params;

    if (!pattern || !pattern.trim()) {
      return "Error: Search pattern must not be empty.";
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return "Error: No workspace folder is currently open.";
    }

    const cwd = workspaceFolder.uri.fsPath;
    const args: string[] = ["-n", "--color", "never", "--no-heading"]; // Flatten output for parsing

    if (!caseSensitive) {
      args.push("-i");
    }

    if (glob) {
      args.push("-g", glob);
    }

    args.push(pattern, ".");

    this.logger.debug(
      `[ContextRetriever] Running ripgrep with args: ${JSON.stringify(args)}`,
    );

    const result = spawnSync(rgPath, args, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.error) {
      this.logger.error("[ContextRetriever] Ripgrep execution failed", {
        error: result.error,
      });
      return `Error running ripgrep: ${result.error.message ?? String(result.error)}`;
    }

    if (result.status !== 0 && result.status !== 1) {
      const stderr = result.stderr?.toString().trim();
      this.logger.error("[ContextRetriever] Ripgrep returned non-zero status", {
        status: result.status,
        stderr,
      });
      return stderr || `Error: ripgrep exited with status ${result.status}`;
    }

    const lines = result.stdout
      .toString()
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (!lines.length) {
      return `No matches found for pattern "${pattern}".`;
    }

    const limited =
      maxResults && maxResults > 0 ? lines.slice(0, maxResults) : lines;
    const truncated = limited.length < lines.length;

    let output = limited.join("\n");
    if (truncated) {
      output += `\n… (${lines.length - limited.length} more matches truncated)`;
    }

    return output;
  }

  async runTests(options: {
    language?: string;
    framework?: string;
    command?: string;
    args?: string[];
    watch?: boolean;
    testTarget?: string;
    cwd?: string;
  }): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const cwd = options.cwd || workspaceFolder?.uri.fsPath;

    if (!cwd) {
      return "Error: No workspace folder is currently open.";
    }

    const commandConfig = this.resolveTestCommand(options);

    if (!commandConfig) {
      return "Error: Unable to determine test command for the specified language or framework.";
    }

    const { command, args } = commandConfig;

    this.logger.debug(
      `[ContextRetriever] Running tests with command: ${command} ${args.join(" ")}`,
    );

    const result = spawnSync(command, args, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
    });

    if (result.error) {
      this.logger.error("[ContextRetriever] Test execution failed", {
        error: result.error,
      });
      return `Error running tests: ${result.error.message ?? String(result.error)}`;
    }

    const stderr = result.stderr?.toString().trim();
    const stdout = result.stdout?.toString().trim();

    if (result.status !== 0) {
      this.logger.warn(
        "[ContextRetriever] Test command exited with non-zero status",
        {
          status: result.status,
          stderr,
        },
      );
      return [stdout, stderr]
        .filter((segment) => segment && segment.length > 0)
        .join("\n\n");
    }

    return stdout || "Test command completed with no output.";
  }

  private resolveTestCommand(options: {
    language?: string;
    framework?: string;
    command?: string;
    args?: string[];
    watch?: boolean;
    testTarget?: string;
  }): { command: string; args: string[] } | undefined {
    if (options.command) {
      return {
        command: options.command,
        args: options.args ?? [],
      };
    }

    const normalizedLanguage = options.language?.toLowerCase();
    const normalizedFramework = options.framework?.toLowerCase();
    const target = options.testTarget ? options.testTarget.trim() : undefined;
    const includeWatch = Boolean(options.watch);

    const appendTarget = (baseArgs: string[]): string[] => {
      if (!target) {
        return baseArgs;
      }
      return [...baseArgs, target];
    };

    const NODE_ARGS = (script: string): { command: string; args: string[] } => {
      const args: string[] = ["run", script];
      if (includeWatch) {
        args.push("--", "--watch");
      }
      return {
        command: "npm",
        args: target ? [...args, "--", target] : args,
      };
    };

    switch (normalizedFramework ?? normalizedLanguage) {
      case "jest":
      case "vitest":
      case "mocha":
      case "ava":
      case "cypress":
      case "typescript":
      case "javascript":
      case "tsx":
      case "jsx":
        return NODE_ARGS("test");
      case "python":
      case "pytest":
        if (includeWatch) {
          return {
            command: "ptw",
            args: target ? [target] : [],
          };
        }
        return {
          command: "pytest",
          args: target ? [target] : [],
        };
      case "go":
        return {
          command: "go",
          args: target ? ["test", target] : ["test", "./..."],
        };
      case "rust":
        return {
          command: "cargo",
          args: appendTarget(["test"]),
        };
      case "java":
        return {
          command: "mvn",
          args: appendTarget(["test"]),
        };
      case "php":
        return {
          command: "vendor/bin/phpunit",
          args: target ? [target] : [],
        };
      default:
        return undefined;
    }
  }
}
