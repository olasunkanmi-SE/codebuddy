import * as vscode from "vscode";
import { Orchestrator } from "../orchestrator";
import {
  IFileToolConfig,
  IFileToolResponse,
} from "../application/interfaces/agent.interface";
import { Logger } from "../infrastructure/logger/logger";
import { getAPIKeyAndModel, getGenerativeAiModel } from "./../utils/utils";
import { EmbeddingService } from "./embedding";
import { LogLevel } from "./telemetry";
import { WebSearchService } from "./web-search-service";
import {
  TavilySearchProvider,
  SearchResponseFormatter,
} from "../agents/tools/websearch";
import { SqliteVectorStore } from "./sqlite-vector-store";

export class ContextRetriever {
  private readonly embeddingService: EmbeddingService;
  private static readonly SEARCH_RESULT_COUNT = 5;
  private readonly logger: Logger;
  private static instance: ContextRetriever;
  private readonly webSearchService: WebSearchService;
  protected readonly orchestrator: Orchestrator;
  private readonly tavilySearch: TavilySearchProvider;
  private vectorStore: SqliteVectorStore;

  constructor(context?: vscode.ExtensionContext) {
    const provider = getGenerativeAiModel() || "Gemini";
    const { apiKey, baseUrl } = getAPIKeyAndModel(provider);

    this.embeddingService = new EmbeddingService({
      apiKey,
      provider,
      baseUrl,
    });

    this.logger = Logger.initialize("ContextRetriever", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.webSearchService = WebSearchService.getInstance();
    this.tavilySearch = TavilySearchProvider.getInstance();
    this.orchestrator = Orchestrator.getInstance();

    // Use the shared singleton vector store
    this.vectorStore = SqliteVectorStore.getInstance();
    if (context) {
      this.vectorStore.initialize(context).catch((err) => {
        this.logger.error("Failed to initialize vector store", err);
      });
    }
  }

  static initialize(context?: vscode.ExtensionContext) {
    if (!ContextRetriever.instance) {
      ContextRetriever.instance = new ContextRetriever(context);
    }
    return ContextRetriever.instance;
  }

  async retrieveContext(input: string): Promise<string> {
    if (!this.vectorStore.isReady) {
      return "Semantic search is not available (Vector Store not initialized).";
    }

    let results: any[] = [];
    let searchMethod = "Semantic";

    try {
      this.logger.info(`Generating embedding for query: ${input}`);
      const embedding = await this.embeddingService.generateEmbedding(input);
      this.logger.info("Retrieving context from Vector Store");

      results = await this.vectorStore.search(
        embedding,
        ContextRetriever.SEARCH_RESULT_COUNT,
      );
    } catch (error: any) {
      this.logger.warn(
        "Embedding generation failed, falling back to keyword search",
        error,
      );
      searchMethod = "Keyword (Fallback)";

      results = await this.vectorStore.keywordSearch(
        input,
        ContextRetriever.SEARCH_RESULT_COUNT,
      );
    }

    // Check if query is general/architectural
    const isGeneralQuery = this.isGeneralQuery(input);

    // Determine if we should include common files:
    // 1. If semantic search failed (fallback)
    // 2. If it's a general query about the application
    if (results.length === 0 || isGeneralQuery) {
      this.logger.info(
        `Retrieving common files. Reason: ${results.length === 0 ? "Fallback (No results)" : "General Query"}`,
      );
      const commonFilesResults = await this.retrieveCommonFiles();

      // If it was a general query, append common files to existing results
      // If it was a fallback, we just use common files (and any keyword matches if we had them)
      results = [...results, ...commonFilesResults];

      if (results.length === 0 && searchMethod.includes("Fallback")) {
        searchMethod = "Keyword (Fallback) + Common Files";
      } else if (isGeneralQuery) {
        searchMethod += " + Common Files";
      }
    }

    // Deduplicate by file path
    const seenPaths = new Set();
    results = results.filter((r) => {
      const filePath = r.document.filePath || r.document.metadata?.filePath;
      if (!filePath || seenPaths.has(filePath)) return false;
      seenPaths.add(filePath);
      return true;
    });

    // Limit results
    results = results.slice(0, 15);

    if (results.length === 0) {
      return `No relevant context found in the knowledge base using ${searchMethod} search.`;
    }

    return results
      .map(
        (r) =>
          `File: ${r.document.filePath || r.document.metadata?.filePath}\nRelevance: ${r.score.toFixed(2)} (${searchMethod})\nContent:\n${r.document.text}`,
      )
      .join("\n\n---\n\n");
  }

  private isGeneralQuery(input: string): boolean {
    const generalKeywords = [
      "overview",
      "architecture",
      "structure",
      "stack",
      "codebase",
      "project",
      "scaffold",
      "how does the app work",
    ];

    const lowerInput = input.toLowerCase();
    return generalKeywords.some((keyword) => lowerInput.includes(keyword));
  }

  private async retrieveCommonFiles(): Promise<any[]> {
    const commonFiles = [
      "README.md",
      "readme.md",
      "package.json",
      "CONTRIBUTING.md",
      "docs/README.md",
      "docs/architecture.md", // Added potential architecture doc
    ];

    const results: any[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      this.logger.warn("No workspace folders found for common file retrieval.");
      return [];
    }

    for (const folder of workspaceFolders) {
      for (const fileName of commonFiles) {
        try {
          // Construct URI directly instead of using findFiles
          const fileUri = vscode.Uri.joinPath(folder.uri, fileName);

          // Try to read file attributes to confirm existence (and strict case matching if filesystem is sensitive)
          // But readDirectory or just readFile is easier.
          // We'll just try to read it. If it fails (FileNotFound), we catch it.

          let content = "";
          try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            content = Buffer.from(fileContent).toString("utf-8");
          } catch (e) {
            // File doesn't exist or other error
            continue;
          }

          if (content) {
            // Truncate if too long (e.g., 5KB)
            const truncated =
              content.length > 5000
                ? content.substring(0, 5000) + "\n...(truncated)"
                : content;

            results.push({
              document: {
                id: `common:${fileUri.fsPath}`,
                text: truncated,
                metadata: { filePath: fileUri.fsPath },
              },
              score: 1.0, // High relevance for common files
            });

            this.logger.info(`Successfully retrieved common file: ${fileName}`);
          }
        } catch (error) {
          this.logger.warn(
            `Unexpected error retrieving common file ${fileName}`,
            error,
          );
        }
      }
    }

    return results;
  }

  async readFiles(
    fileConfigs: IFileToolConfig[],
  ): Promise<IFileToolResponse[]> {
    const files = fileConfigs.flatMap((file) => file);
    const promises = files.map(async (file) => {
      try {
        if (file.file_path) {
          const content = await this.readFileContent(file.file_path);
          const response: IFileToolResponse = {
            content,
            function: file.function_name,
          };
          return response;
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

      // Fallback if Tavily key is missing/invalid
      if (
        result.results.length === 0 &&
        result.answer &&
        result.answer.includes("Tavily API key is missing")
      ) {
        this.logger.warn(
          "Tavily API key missing, falling back to WebSearchService (Startpage)",
        );
        try {
          const webResult = await this.webSearchService.run(query);
          if (
            typeof webResult === "string" &&
            webResult.length > 0 &&
            !webResult.includes("No web results found") &&
            !webResult.includes("Query too short")
          ) {
            return `(Fallback Results from Startpage - Please configure 'tavily.apiKey' for better results)\n\n${webResult}`;
          }
        } catch (fallbackError) {
          this.logger.error("Fallback search failed", fallbackError);
        }
      }

      return SearchResponseFormatter.format(result);
    } catch (error: any) {
      this.logger.error("[WebSearch] Execution Error:", error);

      // Fallback on error
      try {
        const webResult = await this.webSearchService.run(query);
        if (
          typeof webResult === "string" &&
          webResult.length > 0 &&
          !webResult.includes("No web results found")
        ) {
          return `(Fallback Results from Startpage - Error: ${error.message})\n\n${webResult}`;
        }
      } catch (fallbackError) {
        this.logger.error("Fallback search failed", fallbackError);
      }

      return `Error performing web search: ${error.message}`;
    }
  }
}
