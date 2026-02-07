import { Orchestrator } from "../orchestrator";
import {
  IFileToolConfig,
  IFileToolResponse,
} from "../application/interfaces/agent.interface";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getAPIKeyAndModel, getGenerativeAiModel } from "./../utils/utils";
import { EmbeddingService } from "./embedding";

import { WebSearchService } from "./web-search-service";
import {
  TavilySearchProvider,
  SearchResponseFormatter,
} from "../agents/tools/websearch";
import { SimpleVectorStore } from "./simple-vector-store";
import { EditorHostService } from "./editor-host.service";

export class ContextRetriever {
  // private readonly codeRepository: CodeRepository;
  private readonly embeddingService: EmbeddingService | undefined; // Always uses Gemini for consistency
  private static readonly SEARCH_RESULT_COUNT = 5;
  private readonly logger: Logger;
  private static instance: ContextRetriever;
  private readonly webSearchService: WebSearchService;
  protected readonly orchestrator: Orchestrator;
  private readonly tavilySearch: TavilySearchProvider;
  private vectorStore: SimpleVectorStore | undefined;

  constructor(storagePath?: string) {
    // this.codeRepository = CodeRepository.getInstance();
    // Always use Gemini for embeddings to ensure consistency
    // regardless of the selected chat model (Groq, Anthropic, etc.)
    const embeddingProvider = "Gemini";
    try {
      const { apiKey: embeddingApiKey } = getAPIKeyAndModel(embeddingProvider);
      this.embeddingService = new EmbeddingService(embeddingApiKey);
    } catch (error) {
      // console.warn(
      //   "Gemini API key not found. Context retrieval will be disabled.",
      // );
      this.embeddingService = undefined;
    }
    this.logger = Logger.initialize("ContextRetriever", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.webSearchService = WebSearchService.getInstance();
    this.tavilySearch = TavilySearchProvider.getInstance();
    this.orchestrator = Orchestrator.getInstance();

    if (storagePath) {
      this.vectorStore = new SimpleVectorStore(storagePath);
      this.vectorStore.initialize().catch((err) => {
        this.logger.error("Failed to initialize vector store", err);
      });
    }
  }

  static initialize(storagePath?: string) {
    if (!ContextRetriever.instance) {
      ContextRetriever.instance = new ContextRetriever(storagePath);
    } else if (storagePath && !ContextRetriever.instance.vectorStore) {
      // Initialize vector store if it wasn't initialized before
      ContextRetriever.instance.vectorStore = new SimpleVectorStore(
        storagePath,
      );
      ContextRetriever.instance.vectorStore.initialize().catch((err) => {
        console.error("Failed to initialize vector store", err);
      });
    }
    return ContextRetriever.instance;
  }

  async retrieveContext(input: string): Promise<string> {
    if (!this.vectorStore) {
      return "Semantic search is not available (Vector Store not initialized).";
    }
    try {
      this.logger.info(`Generating embedding for query: ${input}`);
      if (!this.embeddingService) {
        return "Context retrieval is disabled because Gemini API key is missing.";
      }
      const embedding = await this.embeddingService.generateEmbedding(input);
      this.logger.info("Retrieving context from Vector Store");

      const results = await this.vectorStore.search(
        embedding,
        ContextRetriever.SEARCH_RESULT_COUNT,
      );

      if (results.length === 0) {
        return "No relevant context found in the knowledge base.";
      }

      return results
        .map(
          (r) =>
            `File: ${r.document.metadata.filePath}\nRelevance: ${r.score.toFixed(2)}\nContent:\n${r.document.text}`,
        )
        .join("\n\n---\n\n");
    } catch (error: any) {
      this.logger.error("Unable to retrieve context", error);
      return `Error retrieving context: ${error.message}`;
    }
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

        if (!this.embeddingService) continue;

        const embedding = await this.embeddingService.generateEmbedding(chunk);
        if (embedding && embedding.length > 0) {
          await this.vectorStore.addDocument({
            id,
            text: chunk,
            vector: embedding,
            metadata: { filePath },
          });
        }
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
      const fs = EditorHostService.getInstance().getHost().fs;
      // BackendProtocol should have readRaw, if not we might need to cast or check.
      // Assuming VscodeFsBackend logic where readRaw returns { content: string[] }
      const fileData = await (fs as any).readRaw(filePath);
      return Array.isArray(fileData.content)
        ? fileData.content.join("\n")
        : String(fileData.content);
    } catch (error: any) {
      this.logger.error(`Error reading file ${filePath}:`, error);
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
