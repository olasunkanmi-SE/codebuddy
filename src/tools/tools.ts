import { SchemaType } from "@google/generative-ai";
import { IFileToolConfig } from "../application/interfaces/agent.interface";
import { ContextRetriever } from "../services/context-retriever";
import { Terminal } from "../utils/terminal";
import { z } from "zod";
import * as vscode from "vscode";
import { DiffReviewService } from "../services/diff-review.service";
import * as path from "path";
import { TodoTool } from "./todo";
import { MemoryTool } from "./memory";
export { TodoTool, MemoryTool };

export class SearchTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(query: string) {
    return await this.contextRetriever?.retrieveContext(query);
  }

  config() {
    return {
      name: "search_vector_db",
      description:
        "Search the codebase knowledge base for information related to the user's query. Use this to find code snippets, architectural decisions, or existing solutions within the project.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description:
              "The user's question or topic to search for in the codebase knowledge base.",
          },
        },
        example: ["How is user authentication handled in this project?"],
        required: ["query"],
      },
    };
  }
}

export class WebTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(query: string) {
    return await this.contextRetriever?.webSearch(query);
  }

  config() {
    return {
      name: "web_search",
      description:
        "Search the internet for general programming knowledge, best practices, or solutions to common coding problems. Useful for understanding concepts, exploring different approaches, or finding external libraries.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description:
              "The search query to use when searching the web for relevant information.",
          },
        },
        example: [
          "Best practices for handling user sessions in web applications",
        ],
        required: ["query"],
      },
    };
  }
}

export class TravilySearchTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  async execute(query: string) {
    return await this.contextRetriever?.travilySearch(query);
  }

  SearchSchema = z.object({
    query: z.string().min(1).describe("Search query"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results"),
    includeRawContent: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include raw HTML content"),
    timeout: z
      .number()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  });

  config() {
    return {
      name: "web_search",
      description: `Search the web for current information, documentation, or solutions.
          Use this when you need:
          - Current events or real-time data
          - External documentation
          - Stack Overflow solutions
          - API references

          Returns formatted results with titles, URLs, and content snippets.`,
      schema: this.SearchSchema,
    };
  }
}

export class FileTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(fileConfigs: IFileToolConfig[]) {
    return await this.contextRetriever?.readFiles(fileConfigs);
  }
  config() {
    return {
      name: "analyze_files_for_question",
      description:
        "Read the content of specific code files. Use this tool when you need to examine existing code, configuration files, or documentation.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          files: {
            type: SchemaType.ARRAY,
            description: "An array of file configurations to read.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                file_path: {
                  type: SchemaType.STRING,
                  description: "The absolute path to the file to read.",
                },
                class_name: {
                  type: SchemaType.STRING,
                  description:
                    "(Optional) The class name to focus on (metadata only).",
                },
                function_name: {
                  type: SchemaType.STRING,
                  description:
                    "(Optional) The function name to focus on (metadata only).",
                },
              },
              required: ["file_path"],
            },
          },
        },
        required: ["files"],
      },
    };
  }
}

export class ListFilesTool {
  public async execute(dirPath?: string): Promise<string> {
    try {
      const targetDir = dirPath
        ? vscode.Uri.file(dirPath)
        : vscode.workspace.workspaceFolders?.[0]?.uri;

      if (!targetDir) {
        return "No workspace folder open and no directory path provided.";
      }

      const entries = await vscode.workspace.fs.readDirectory(targetDir);
      const formatted = entries.map(([name, type]) => {
        const typeName =
          type === vscode.FileType.Directory
            ? "DIR"
            : type === vscode.FileType.File
              ? "FILE"
              : "OTHER";
        return `[${typeName}] ${name}`;
      });

      return `Contents of ${targetDir.fsPath}:\n` + formatted.join("\n");
    } catch (e: any) {
      return `Error listing files: ${e.message}`;
    }
  }

  config() {
    return {
      name: "list_files",
      description:
        "List files and directories in a given path. Use this to explore the project structure.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          dirPath: {
            type: SchemaType.STRING,
            description:
              "The absolute path to the directory to list. If omitted, lists the root workspace directory.",
          },
        },
        required: [],
      },
    };
  }
}

export class EditFileTool {
  public async execute(
    filePath: string,
    mode: "overwrite" | "replace",
    content: string, // For overwrite
    search?: string, // For replace
    replace?: string, // For replace
  ): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      let newContent = "";

      if (mode === "overwrite") {
        newContent = content;
      } else if (mode === "replace") {
        if (!search || replace === undefined) {
          return "Error: 'search' and 'replace' arguments are required for replace mode.";
        }

        const existingData = await vscode.workspace.fs.readFile(uri);
        const existingContent = Buffer.from(existingData).toString("utf8");

        if (!existingContent.includes(search)) {
          return `Error: Search text not found in ${filePath}.`;
        }

        // Replace only the first occurrence to be safe
        newContent = existingContent.replace(search, replace);
      } else {
        return "Error: Invalid mode. Use 'overwrite' or 'replace'.";
      }

      // Safe Apply: Create a pending change instead of writing directly
      const change = await DiffReviewService.getInstance().addPendingChange(
        filePath,
        newContent,
      );

      const fileName = path.basename(filePath);
      // Format link so VS Code command handler receives the ID string
      // Note: command args in markdown links are JSON encoded
      const args = encodeURIComponent(JSON.stringify(change.id));

      return `I have prepared changes for **${fileName}**. [Review & Apply](command:codebuddy.reviewChange?${args})`;
    } catch (e: any) {
      return `Error editing file: ${e.message}`;
    }
  }

  config() {
    return {
      name: "edit_file",
      description:
        "Edit a file. Supports overwriting the entire file or replacing a specific text segment. CAUTION: Use 'replace' mode whenever possible to preserve other parts of the file.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          filePath: {
            type: SchemaType.STRING,
            description: "The absolute path to the file to edit.",
          },
          mode: {
            type: SchemaType.STRING,
            enum: ["overwrite", "replace"],
            description:
              "The editing mode. 'overwrite' replaces the whole file. 'replace' substitutes a string.",
          },
          content: {
            type: SchemaType.STRING,
            description:
              "The new content for the file (required for 'overwrite' mode).",
          },
          search: {
            type: SchemaType.STRING,
            description:
              "The exact text to search for (required for 'replace' mode).",
          },
          replace: {
            type: SchemaType.STRING,
            description:
              "The text to replace the search text with (required for 'replace' mode).",
          },
        },
        required: ["filePath", "mode"],
      },
    };
  }
}

// export class SynthesisTool {
//   public async execute(content: string) {
//     return content;
//   }
//   config() {
//     return {
//       name: "synthesize_web_data",
//       description:
//         "Use this tool for combining information from web searches into a concise answer.",
//       parameters: {
//         type: SchemaType.OBJECT,
//         properties: {
//           content: {
//             type: SchemaType.STRING,
//             description: "constains information from different web results",
//           },
//         },
//         required: ["content"],
//       },
//     };
//   }
// }

export class ThinkTool {
  public async execute(thought: string) {
    return thought;
  }

  config() {
    return {
      name: "think",
      description:
        "Use this tool to think through complex problems, analyze information, or plan multi-step solutions before taking action" +
        "This creates space for structured reasoning about code architecture, debugging approaches, " +
        "or implementation strategies. Use when analyzing tool outputs, making sequential decisions, " +
        "or following complex guidelines. This tool does not execute code or retrieve new information.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          thought: {
            type: SchemaType.STRING,
            description:
              "Describe your detailed analysis, thought process, reasoning steps, or plan of action.",
          },
        },
        required: ["thought"],
      },
    };
  }
}

export class TerminalTool {
  public async execute(command: string, background?: boolean) {
    return await Terminal.getInstance().executeAnyCommand(
      command,
      undefined,
      background,
    );
  }

  config() {
    return {
      name: "run_terminal_command",
      description:
        "Execute a shell command in the terminal. Requires user confirmation. Use this to run tests, build scripts, check file status, or perform other system operations. The output will be returned and also displayed to the user. Set 'background' to true for long-running processes like servers.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          command: {
            type: SchemaType.STRING,
            description: "The shell command to execute.",
          },
          background: {
            type: SchemaType.BOOLEAN,
            description:
              "Set to true if the command starts a long-running process (e.g., a server) that should run in the background. Returns immediately with PID.",
          },
        },
        required: ["command"],
      },
    };
  }
}

export class WebPreviewTool {
  public async execute(url: string) {
    try {
      await vscode.commands.executeCommand("simpleBrowser.show", url);
      return `Preview opened for ${url}`;
    } catch (e: any) {
      return `Error opening preview: ${e.message}`;
    }
  }

  config() {
    return {
      name: "open_web_preview",
      description:
        "Open a web preview in the editor (Simple Browser). Use this to view localhost servers or external URLs.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          url: {
            type: SchemaType.STRING,
            description: "The URL to preview (e.g., http://localhost:3000).",
          },
        },
        required: ["url"],
      },
    };
  }
}

import { DeepTerminalService } from "../services/deep-terminal.service";

export class DeepTerminalTool {
  public async execute(
    action: "start" | "execute" | "read" | "terminate",
    sessionId: string,
    command?: string,
    waitMs?: number,
  ): Promise<string> {
    const service = DeepTerminalService.getInstance();
    try {
      switch (action) {
        case "start":
          return await service.startSession(sessionId);
        case "execute": {
          if (!command) return "Error: Command required for execute action.";
          const result = await service.executeCommand(sessionId, command);
          if (waitMs && waitMs > 0) {
            await new Promise((r) => setTimeout(r, waitMs));
            return result + "\nOutput:\n" + service.readOutput(sessionId);
          }
          return result;
        }
        case "read":
          return service.readOutput(sessionId) || "(No new output)";
        case "terminate":
          return service.terminateSession(sessionId);
        default:
          return "Invalid action. Use 'start', 'execute', 'read', or 'terminate'.";
      }
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }

  config() {
    return {
      name: "manage_terminal",
      description:
        "Manage persistent terminal sessions. Allows starting sessions, running interactive commands (input), reading streaming output, and terminating sessions. Use this for complex tasks requiring state (e.g. 'cd', env vars) or monitoring long-running processes.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING,
            enum: ["start", "execute", "read", "terminate"],
            description: "The action to perform.",
          },
          sessionId: {
            type: SchemaType.STRING,
            description:
              "Unique identifier for the terminal session (e.g., 'main', 'test-server').",
          },
          command: {
            type: SchemaType.STRING,
            description:
              "The shell command to execute (required for 'execute').",
          },
          waitMs: {
            type: SchemaType.INTEGER,
            description:
              "Optional time (ms) to wait after executing before returning output. Useful to capture immediate response.",
          },
        },
        required: ["action", "sessionId"],
      },
    };
  }
}

export class RipgrepSearchTool {
  public async execute(pattern: string, glob?: string): Promise<string> {
    const results: string[] = [];
    const limit = 200; // Limit results to avoid context overflow

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (vscode.workspace as any).findTextInFiles(
        { pattern, isRegExp: true },
        { include: glob },
        (result: any) => {
          if (results.length >= limit) return;

          if ("ranges" in result) {
            const relativePath = vscode.workspace.asRelativePath(result.uri);
            // result.preview.text is the line content usually
            // We strip whitespace to keep it compact
            const text = result.preview.text.trim();
            // result.ranges[0].start.line is 0-indexed
            const line = result.ranges[0]
              ? result.ranges[0].start.line + 1
              : "?";
            results.push(`${relativePath}:${line}: ${text}`);
          }
        },
      );
    } catch (e: any) {
      return `Error executing search: ${e.message}`;
    }

    if (results.length === 0) return "No matches found.";
    const truncated =
      results.length >= limit ? `\n... (truncated after ${limit} matches)` : "";
    return results.join("\n") + truncated;
  }

  config() {
    return {
      name: "ripgrep_search",
      description:
        "Search the codebase using regex patterns (powered by ripgrep). Efficiently finds text strings or patterns across files.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          pattern: {
            type: SchemaType.STRING,
            description: "The regex pattern to search for.",
          },
          glob: {
            type: SchemaType.STRING,
            description:
              "Optional glob pattern to include/filter files (e.g., 'src/**/*.ts').",
          },
        },
        required: ["pattern"],
      },
    };
  }
}

export class DiagnosticsTool {
  public async execute(filePath?: string): Promise<string> {
    try {
      let diagnostics: [vscode.Uri, vscode.Diagnostic[]][];

      if (filePath) {
        // Get diagnostics for specific file
        const uri = vscode.Uri.file(filePath);
        const fileDiagnostics = vscode.languages.getDiagnostics(uri);
        diagnostics = [[uri, fileDiagnostics]];
      } else {
        // Get all diagnostics
        diagnostics = vscode.languages.getDiagnostics();
      }

      // Filter and format
      const formatted = diagnostics.flatMap(([uri, diags]) => {
        if (diags.length === 0) return [];
        const relativePath = vscode.workspace.asRelativePath(uri);

        return diags.map((d) => {
          const severity =
            d.severity === vscode.DiagnosticSeverity.Error
              ? "Error"
              : d.severity === vscode.DiagnosticSeverity.Warning
                ? "Warning"
                : "Info";
          const line = d.range.start.line + 1;
          return `[${severity}] ${relativePath}:${line}: ${d.message}`;
        });
      });

      if (formatted.length === 0) return "No problems found.";

      // Limit output size
      const limit = 50;
      const result = formatted.slice(0, limit).join("\n");
      const truncated =
        formatted.length > limit
          ? `\n... (and ${formatted.length - limit} more)`
          : "";

      return result + truncated;
    } catch (e: any) {
      return `Error getting diagnostics: ${e.message}`;
    }
  }

  config() {
    return {
      name: "get_diagnostics",
      description:
        "Get compilation errors and warnings from the editor's Language Server Protocol (LSP). Use this to check for syntax errors or type issues without running a build.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          filePath: {
            type: SchemaType.STRING,
            description:
              "Optional absolute path to filter diagnostics for a specific file. If omitted, returns all workspace diagnostics.",
          },
        },
        required: [],
      },
    };
  }
}

export class GitTool {
  private git: any; // Using any to avoid direct dependency on simple-git types in this file if not imported
  private rootPath: string;

  constructor() {
    // We'll initialize lazily or assume we can get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    this.rootPath = workspaceFolders
      ? workspaceFolders[0].uri.fsPath
      : process.cwd();
  }

  private async getGit() {
    if (!this.git) {
      const simpleGit = (await import("simple-git")).default;
      this.git = simpleGit({
        baseDir: this.rootPath,
        binary: "git",
        maxConcurrentProcesses: 6,
      });
    }
    return this.git;
  }

  public async execute(operation: string, args?: any): Promise<string> {
    try {
      const git = await this.getGit();

      switch (operation) {
        case "status": {
          const status = await git.status();
          return JSON.stringify(status, null, 2);
        }

        case "add":
          if (!args?.files)
            return "Error: 'files' argument required for 'add' operation (use '.' for all)";
          await git.add(args.files);
          return `Added ${args.files}`;

        case "commit": {
          if (!args?.message)
            return "Error: 'message' argument required for 'commit' operation";
          const result = await git.commit(args.message);
          return `Committed ${result.summary.changes} changes. Commit: ${result.commit}`;
        }

        case "log": {
          const log = await git.log({ maxCount: args?.limit || 10 });
          return JSON.stringify(
            log.all.map((l: any) => ({
              hash: l.hash,
              date: l.date,
              message: l.message,
              author: l.author_name,
            })),
            null,
            2,
          );
        }

        case "diff": {
          const diff = await git.diff(args?.staged ? ["--staged"] : []);
          return diff || "No diff found.";
        }

        case "checkout":
          if (!args?.branch)
            return "Error: 'branch' argument required for 'checkout' operation";
          if (args?.create) {
            await git.checkoutLocalBranch(args.branch);
            return `Created and checked out branch ${args.branch}`;
          } else {
            await git.checkout(args.branch);
            return `Checked out branch ${args.branch}`;
          }

        default:
          return `Unknown operation: ${operation}. Supported: status, add, commit, log, diff, checkout`;
      }
    } catch (e: any) {
      return `Git Error: ${e.message}`;
    }
  }

  config() {
    return {
      name: "git_ops",
      description:
        "Perform Git version control operations. Use this to stage changes, commit work, check status, or switch branches.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          operation: {
            type: SchemaType.STRING,
            description:
              "The git operation to perform: 'status', 'add', 'commit', 'log', 'diff', 'checkout'.",
            enum: ["status", "add", "commit", "log", "diff", "checkout"],
          },
          args: {
            type: SchemaType.OBJECT,
            description: "Arguments for the operation.",
            properties: {
              files: {
                type: SchemaType.STRING,
                description: "For 'add': File paths or '.' for all.",
              },
              message: {
                type: SchemaType.STRING,
                description: "For 'commit': Commit message.",
              },
              limit: {
                type: SchemaType.INTEGER,
                description: "For 'log': Number of commits to show.",
              },
              staged: {
                type: SchemaType.BOOLEAN,
                description: "For 'diff': Show staged changes.",
              },
              branch: {
                type: SchemaType.STRING,
                description: "For 'checkout': Branch name.",
              },
              create: {
                type: SchemaType.BOOLEAN,
                description: "For 'checkout': Create new branch if true.",
              },
            },
          },
        },
        required: ["operation"],
      },
    };
  }
}

export class SymbolSearchTool {
  public async execute(query: string): Promise<string> {
    try {
      // Execute workspace symbol search
      const symbols = await vscode.commands.executeCommand<
        vscode.SymbolInformation[]
      >("vscode.executeWorkspaceSymbolProvider", query);

      if (!symbols || symbols.length === 0) {
        return "No symbols found.";
      }

      // Format results
      const limit = 20;
      const formatted = symbols.slice(0, limit).map((s) => {
        const relativePath = vscode.workspace.asRelativePath(s.location.uri);
        const line = s.location.range.start.line + 1;
        const kind = vscode.SymbolKind[s.kind];
        return `[${kind}] ${s.name} (${relativePath}:${line})`;
      });

      const truncated =
        symbols.length > limit
          ? `\n... (and ${symbols.length - limit} more)`
          : "";
      return formatted.join("\n") + truncated;
    } catch (e: any) {
      return `Error searching symbols: ${e.message}`;
    }
  }

  config() {
    return {
      name: "search_symbols",
      description:
        "Search for symbols (classes, functions, variables) across the workspace using the editor's LSP. Good for finding definitions without knowing the exact file.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "The symbol name or partial name to search for.",
          },
        },
        required: ["query"],
      },
    };
  }
}

export const TOOL_CONFIGS = {
  FileTool: { tool: FileTool, useContextRetriever: true },
  WebTool: { tool: WebTool, useContextRetriever: true },
  ThinkTool: { tool: ThinkTool, useContextRetriever: true },
  TerminalTool: { tool: TerminalTool, useContextRetriever: false },
  RipgrepSearchTool: { tool: RipgrepSearchTool, useContextRetriever: false },
  DiagnosticsTool: { tool: DiagnosticsTool, useContextRetriever: false },
  GitTool: { tool: GitTool, useContextRetriever: false },
  SymbolSearchTool: { tool: SymbolSearchTool, useContextRetriever: false },
  ListFilesTool: { tool: ListFilesTool, useContextRetriever: false },
  EditFileTool: { tool: EditFileTool, useContextRetriever: false },
  WebPreviewTool: { tool: WebPreviewTool, useContextRetriever: false },
  TodoTool: { tool: TodoTool, useContextRetriever: false },
  MemoryTool: { tool: MemoryTool, useContextRetriever: false },
};
