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
import { SimpleVectorStore } from "./simple-vector-store";

export class ContextRetriever {
  // private readonly codeRepository: CodeRepository;
  private readonly embeddingService: EmbeddingService; // Always uses Gemini for consistency
  private static readonly SEARCH_RESULT_COUNT = 5;
  private readonly logger: Logger;
  private static instance: ContextRetriever;
  private readonly webSearchService: WebSearchService;
  protected readonly orchestrator: Orchestrator;
  private readonly tavilySearch: TavilySearchProvider;
  private vectorStore: SimpleVectorStore | undefined;

  constructor(context?: vscode.ExtensionContext) {
    // this.codeRepository = CodeRepository.getInstance();

    // Use the currently selected provider for embeddings
    const provider = getGenerativeAiModel() || "Gemini";
    const { apiKey, baseUrl, model } = getAPIKeyAndModel(provider);

    this.embeddingService = new EmbeddingService({
      apiKey,
      provider,
      baseUrl,
      model,
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

    if (context) {
      this.vectorStore = new SimpleVectorStore(context);
    }
  }

  static initialize(context?: vscode.ExtensionContext) {
    if (!ContextRetriever.instance) {
      ContextRetriever.instance = new ContextRetriever(context);
    } else if (context && !ContextRetriever.instance.vectorStore) {
      // Initialize vector store if it wasn't initialized before
      ContextRetriever.instance.vectorStore = new SimpleVectorStore(context);
    }
    return ContextRetriever.instance;
  }

  async retrieveContext(input: string): Promise<string> {
    let results: any[] = [];
    let searchMethod = "Semantic";

    if (this.vectorStore) {
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

        // Fallback to keyword search
        results = await this.vectorStore.keywordSearch(
          input,
          ContextRetriever.SEARCH_RESULT_COUNT,
        );
      }
    } else {
      this.logger.warn(
        "Vector Store not initialized, skipping semantic search",
      );
      searchMethod = "Common Files Only";
    }

    // Check if query is general/architectural
    const isGeneralQuery = this.isGeneralQuery(input);

    // Determine if we should include common files:
    // 1. If semantic search failed (fallback)
    // 2. If it's a general query about the application
    // 3. If vector store is not available
    if (results.length === 0 || isGeneralQuery || !this.vectorStore) {
      this.logger.info(
        `Retrieving common files. Reason: ${results.length === 0 ? "No results" : isGeneralQuery ? "General Query" : "No Vector Store"}`,
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
      const path = r.document.metadata.filePath;
      if (seenPaths.has(path)) return false;
      seenPaths.add(path);
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
          `File: ${r.document.metadata.filePath}\nRelevance: ${r.score.toFixed(2)} (${searchMethod})\nContent:\n${r.document.text}`,
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
      "tech stack",
      "folder structure",
      "high level",
      "design patterns",
      "orchestration",
      "how it works",
      "what is this",
      "tell me about",
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
      "docs/architecture.md",
    ];

    const results: any[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      this.logger.warn("No workspace folders found for common file retrieval.");
      return [];
    }

    // Phase 1: Hardcoded critical files
    for (const folder of workspaceFolders) {
      for (const fileName of commonFiles) {
        try {
          const fileUri = vscode.Uri.joinPath(folder.uri, fileName);
          let content = "";
          try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            content = Buffer.from(fileContent).toString("utf-8");
          } catch (e) {
            continue;
          }

          if (content) {
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
              score: 1.0,
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

      // Phase 2: Dynamic discovery of architecture/doc files
      try {
        const docFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, "docs/**/*.{md,txt}"),
          "**/node_modules/**",
          5, // Limit to 5 most relevant looking docs
        );

        for (const fileUri of docFiles) {
          // Skip if already added in Phase 1
          if (
            results.some((r) => r.document.metadata.filePath === fileUri.fsPath)
          )
            continue;

          try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(fileContent).toString("utf-8");
            if (content) {
              const truncated =
                content.length > 5000
                  ? content.substring(0, 5000) + "\n...(truncated)"
                  : content;

              results.push({
                document: {
                  id: `common-discovery:${fileUri.fsPath}`,
                  text: truncated,
                  metadata: { filePath: fileUri.fsPath },
                },
                score: 0.9,
              });
              this.logger.info(
                `Successfully discovered doc file: ${fileUri.fsPath}`,
              );
            }
          } catch (e) {
            continue;
          }
        }
      } catch (error) {
        this.logger.warn("Error discovering doc files", error);
      }
    }

    return results;
  }

  async indexFile(filePath: string, content: string): Promise<void> {
    if (!this.vectorStore) return;

    try {
      // Simple chunking strategy: 500 characters overlap 100
      // For better results, use a proper text splitter
      const chunkSize = 1000;
      const overlap = 200;

      for (let i = 0; i < content.length; i += chunkSize - overlap) {
        const chunk = content.slice(i, i + chunkSize);
        if (chunk.length < 100) continue; // Skip small chunks

        const id = `${filePath}::${i}`;
        // Note: Generating embeddings one by one is slow.
        // In production, batch these. Here we rely on EmbeddingService to handle rate limits/batching or we accept slowness for safety.
        // To prevent freezing, we yield.
        await new Promise((resolve) => setTimeout(resolve, 10));

        let embedding: number[] | undefined;
        try {
          embedding = await this.embeddingService.generateEmbedding(chunk);
        } catch (error) {
          this.logger.warn(
            `Failed to generate embedding for ${id}, storing text only`,
            error,
          );
        }

        await this.vectorStore.addDocument({
          id,
          text: chunk,
          vector: embedding,
          metadata: { filePath },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to index file ${filePath}`, error);
    }
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
