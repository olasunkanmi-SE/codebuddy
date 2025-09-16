/**
 * Vector Database Worker Manager
 * Orchestrates embedding and vector database workers to prevent main thread blocking
 */
import * as vscode from "vscode";
import { IFunctionData } from "../application/interfaces";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { WorkerEmbeddingService } from "../workers/embedding-worker";
import { WorkerVectorDatabaseService, CodeSnippet, SearchResult } from "../workers/vector-db-worker";
import { getAPIKeyAndModel } from "../utils/utils";

export interface WorkerManagerOptions {
  maxEmbeddingWorkers?: number;
  batchSize?: number;
  progressCallback?: (operation: string, progress: number, details?: string) => void;
}

// Strongly typed operation constants
export const VECTOR_OPERATIONS = {
  EMBEDDING: "embedding" as const,
  INDEXING: "indexing" as const,
  SEARCHING: "searching" as const,
  SYNCHRONIZING: "synchronizing" as const,
} as const;

export type VectorOperationType = (typeof VECTOR_OPERATIONS)[keyof typeof VECTOR_OPERATIONS];

export interface VectorOperationProgress {
  operation: VectorOperationType;
  progress: number;
  details: string;
}

/**
 * Non-blocking vector database service using worker threads
 */
export class VectorDbWorkerManager implements vscode.Disposable {
  private embeddingService: WorkerEmbeddingService | null = null;
  private vectorDbService: WorkerVectorDatabaseService | null = null;
  private isInitialized = false;
  private readonly logger = Logger.initialize("VectorDbWorkerManager", { minLevel: LogLevel.DEBUG });
  private progressCallback?: (progress: VectorOperationProgress) => void;

  constructor(
    private context: vscode.ExtensionContext,
    private options: WorkerManagerOptions = {}
  ) {}

  /**
   * Initialize both embedding and vector database workers
   */
  async initialize(): Promise<void> {
    try {
      this.reportProgress(VECTOR_OPERATIONS.EMBEDDING, 0, "Initializing embedding worker...");

      // Always use Gemini for embeddings (consistency requirement)
      const { apiKey: geminiApiKey } = getAPIKeyAndModel("Gemini");

      // Initialize embedding worker
      this.embeddingService = new WorkerEmbeddingService(geminiApiKey, {
        batchSize: this.options.batchSize || 10,
      });
      await this.embeddingService.initialize();

      this.reportProgress(VECTOR_OPERATIONS.INDEXING, 25, "Embedding worker ready");

      // Initialize vector database worker
      this.vectorDbService = new WorkerVectorDatabaseService(
        this.context.extensionPath,
        "http://localhost:8000" // ChromaDB URL
      );

      await this.vectorDbService.initialize();

      this.reportProgress(VECTOR_OPERATIONS.INDEXING, 100, "Vector database ready");
      this.isInitialized = true;

      this.logger.info("Vector database worker manager initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize vector database workers:", error);
      throw error;
    }
  }

  /**
   * Index function data in background without blocking main thread
   */
  async indexFunctionData(
    functionData: IFunctionData[],
    progressCallback?: (progress: VectorOperationProgress) => void
  ): Promise<void> {
    if (!this.isInitialized || !this.embeddingService || !this.vectorDbService) {
      throw new Error("Worker manager not initialized");
    }

    this.progressCallback = progressCallback;

    try {
      this.reportProgress(
        VECTOR_OPERATIONS.EMBEDDING,
        0,
        `Generating embeddings for ${functionData.length} functions...`
      );

      // Step 1: Generate embeddings using worker threads (non-blocking)
      const embeddedData = await this.embeddingService.processFunctions(
        functionData,
        (progress: number, completed: number, total: number) => {
          this.reportProgress(VECTOR_OPERATIONS.EMBEDDING, progress, `Embedded ${completed}/${total} functions`);
        }
      );

      this.reportProgress(VECTOR_OPERATIONS.INDEXING, 0, "Converting to code snippets...");

      // Step 2: Convert to code snippets format
      const codeSnippets: CodeSnippet[] = embeddedData.map((func: IFunctionData) => ({
        id: `${func.path}::${func.className}::${func.name}`,
        content: func.content,
        filePath: func.path,
        embedding: func.embedding,
        metadata: {
          type: "function" as const,
          name: func.name,
          filePath: func.path,
          startLine: 1, // You might want to extract this from your AST analysis
          endLine: func.content.split("\\n").length,
        },
      }));

      this.reportProgress(VECTOR_OPERATIONS.INDEXING, 25, "Indexing into vector database...");

      // Step 3: Index into vector database using worker (non-blocking)
      await this.vectorDbService.indexCodeSnippets(codeSnippets, (progress: number, indexed: number, total: number) => {
        this.reportProgress(VECTOR_OPERATIONS.INDEXING, 25 + progress * 0.75, `Indexed ${indexed}/${total} snippets`);
      });

      this.reportProgress(VECTOR_OPERATIONS.INDEXING, 100, `Successfully indexed ${embeddedData.length} functions`);
    } catch (error) {
      this.reportProgress(VECTOR_OPERATIONS.INDEXING, -1, `Indexing failed: ${error}`);
      throw error;
    }
  }

  /**
   * Perform semantic search with query embedding generation
   */
  async semanticSearch(
    query: string,
    maxResults: number = 10,
    filterOptions?: Record<string, any>
  ): Promise<SearchResult[]> {
    if (!this.isInitialized || !this.embeddingService || !this.vectorDbService) {
      throw new Error("Worker manager not initialized");
    }

    try {
      this.reportProgress(VECTOR_OPERATIONS.SEARCHING, 0, "Generating query embedding...");

      // Generate query embedding (non-blocking)
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      this.reportProgress(VECTOR_OPERATIONS.SEARCHING, 50, "Searching vector database...");

      // Perform semantic search (non-blocking)
      const results = await this.vectorDbService.semanticSearch(queryEmbedding, maxResults, filterOptions);

      this.reportProgress(VECTOR_OPERATIONS.SEARCHING, 100, `Found ${results.length} relevant results`);

      return results;
    } catch (error) {
      this.reportProgress(VECTOR_OPERATIONS.SEARCHING, -1, `Search failed: ${error}`);
      throw error;
    }
  }

  /**
   * Reindex a single file (non-blocking)
   */
  async reindexFile(filePath: string, functionData: IFunctionData[]): Promise<void> {
    if (!this.isInitialized || !this.vectorDbService) {
      throw new Error("Worker manager not initialized");
    }

    try {
      this.reportProgress(VECTOR_OPERATIONS.SYNCHRONIZING, 0, `Removing old entries for ${filePath}...`);

      // Remove old entries for this file
      await this.vectorDbService.deleteByFilePath(filePath);

      this.reportProgress(VECTOR_OPERATIONS.SYNCHRONIZING, 50, `Reindexing ${filePath}...`);

      // Reindex with new data
      if (functionData.length > 0) {
        await this.indexFunctionData(functionData);
      }

      this.reportProgress(VECTOR_OPERATIONS.SYNCHRONIZING, 100, `Successfully reindexed ${filePath}`);
    } catch (error) {
      this.reportProgress(VECTOR_OPERATIONS.SYNCHRONIZING, -1, `Reindexing failed: ${error}`);
      throw error;
    }
  }

  /**
   * Check if the worker manager is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.embeddingService !== null && this.vectorDbService !== null;
  }

  /**
   * Get comprehensive status
   */
  getStatus(): {
    initialized: boolean;
    embeddingWorkerReady: boolean;
    vectorDbReady: boolean;
    stats: any;
  } {
    return {
      initialized: this.isInitialized,
      embeddingWorkerReady: this.embeddingService !== null,
      vectorDbReady: this.vectorDbService !== null,
      stats: this.vectorDbService?.getStats() || { isInitialized: false },
    };
  }

  /**
   * Report progress to callback if available
   */
  private reportProgress(operation: VectorOperationType, progress: number, details: string): void {
    if (this.options.progressCallback) {
      this.options.progressCallback(operation, progress, details);
    }

    if (this.progressCallback) {
      this.progressCallback({
        operation,
        progress,
        details,
      });
    }

    this.logger.debug(`${operation}: ${progress}% - ${details}`);
  }

  /**
   * Set progress callback for operations
   */
  setProgressCallback(callback: (progress: VectorOperationProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Dispose of all workers and cleanup
   */
  dispose(): void {
    Promise.all([this.embeddingService?.dispose(), this.vectorDbService?.dispose()]).catch((error) => {
      this.logger.error("Error disposing workers:", error);
    });

    this.embeddingService = null;
    this.vectorDbService = null;
    this.isInitialized = false;
  }
}

/**
 * Factory function to create and initialize worker manager
 */
export async function createVectorDbWorkerManager(
  context: vscode.ExtensionContext,
  options: WorkerManagerOptions = {}
): Promise<VectorDbWorkerManager> {
  const manager = new VectorDbWorkerManager(context, options);

  // Show progress to user during initialization
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Initializing Vector Database",
      cancellable: false,
    },
    async (progress) => {
      const progressCallback = (operation: string, percent: number, details?: string) => {
        progress.report({
          increment: percent / 4, // Divide by 4 since we have multiple steps
          message: details,
        });
      };

      const managerWithProgress = new VectorDbWorkerManager(context, {
        ...options,
        progressCallback,
      });

      await managerWithProgress.initialize();
      return managerWithProgress;
    }
  );

  return manager;
}
