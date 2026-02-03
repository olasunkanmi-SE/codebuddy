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
    if (!this.vectorStore) {
      return "Semantic search is not available (Vector Store not initialized).";
    }
    try {
      this.logger.info(`Generating embedding for query: ${input}`);
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
}
