/**
 * Vector Database Worker - Handles ChromaDB operations in a separate thread
 * to prevent blocking the main VS Code UI thread
 */
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
// ChromaDB will be imported dynamically in the worker
// import { ChromaClient } from 'chromadb';

// Types for worker communication
export interface VectorWorkerTask {
  type:
    | "initialize"
    | "indexSnippets"
    | "semanticSearch"
    | "deleteByFile"
    | "clearAll"
    | "getStats";
  payload: any;
}

export interface VectorWorkerResponse {
  success: boolean;
  data?: any;
  error?: string;
  progress?: number;
}

export interface CodeSnippet {
  id: string;
  content: string;
  filePath: string;
  embedding?: number[]; // Add embedding at top level
  metadata: {
    type: "function" | "class" | "interface" | "enum";
    name?: string;
    filePath: string;
    startLine: number;
    endLine: number;
  };
}

export interface SearchResult {
  content: string;
  relevanceScore: number;
  metadata: CodeSnippet["metadata"];
}

// Worker thread code
if (!isMainThread && parentPort) {
  let chroma: any; // ChromaClient
  let collection: any;
  let isInitialized = false;
  const collectionName = "codebuddy-code-snippets";
  parentPort.on("message", async (task: VectorWorkerTask) => {
    try {
      switch (task.type) {
        case "initialize":
          await initializeInWorker(task.payload);
          parentPort?.postMessage({
            success: true,
            data: { initialized: true },
          });
          break;

        case "indexSnippets":
          const indexResult = await indexSnippetsInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: indexResult });
          break;

        case "semanticSearch":
          const searchResult = await semanticSearchInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: searchResult });
          break;

        case "deleteByFile":
          await deleteByFileInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: { deleted: true } });
          break;

        case "clearAll":
          await clearAllInWorker();
          parentPort?.postMessage({ success: true, data: { cleared: true } });
          break;

        case "getStats":
          const stats = getStatsInWorker();
          parentPort?.postMessage({ success: true, data: stats });
          break;

        default:
          parentPort?.postMessage({
            success: false,
            error: `Unknown task type: ${task.type}`,
          });
      }
    } catch (error) {
      parentPort?.postMessage({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Initialize ChromaDB in worker thread
   */
  async function initializeInWorker(config: {
    chromaUrl?: string;
  }): Promise<void> {
    // Dynamic import of ChromaDB
    const { ChromaClient } = await import("chromadb");
    chroma = new ChromaClient({
      path: config.chromaUrl || "http://localhost:8000",
    });

    try {
      // Try to get existing collection
      collection = await chroma.getCollection({ name: collectionName });
    } catch {
      // Create new collection if it doesn't exist
      collection = await chroma.createCollection({
        name: collectionName,
        metadata: { "hnsw:space": "cosine" },
      });
    }

    isInitialized = true;
  }

  /**
   * Index code snippets in worker thread
   */
  async function indexSnippetsInWorker(
    snippets: CodeSnippet[],
  ): Promise<{ indexed: number }> {
    if (!isInitialized || !collection) {
      throw new Error("Vector database not initialized");
    }

    const batchSize = 10;
    let indexed = 0;

    for (let i = 0; i < snippets.length; i += batchSize) {
      const batch = snippets.slice(i, i + batchSize);

      const ids = batch.map((s) => s.id);
      const embeddings = batch.map((s) => s.embedding || []);
      const documents = batch.map((s) => s.content);
      const metadatas = batch.map((s) => ({
        filePath: s.filePath,
        type: s.metadata.type,
        name: s.metadata.name || "",
        startLine: s.metadata.startLine,
        endLine: s.metadata.endLine,
      }));

      // Filter out items without embeddings
      const validIndices = embeddings
        .map((emb, idx) => (emb.length > 0 ? idx : -1))
        .filter((idx) => idx !== -1);

      if (validIndices.length > 0) {
        await collection.add({
          ids: validIndices.map((idx) => ids[idx]),
          embeddings: validIndices.map((idx) => embeddings[idx]),
          documents: validIndices.map((idx) => documents[idx]),
          metadatas: validIndices.map((idx) => metadatas[idx]),
        });

        indexed += validIndices.length;
      }

      // Report progress
      const progress = ((i + batch.length) / snippets.length) * 100;
      parentPort?.postMessage({
        success: true,
        progress,
        data: { indexed, total: snippets.length },
      });

      // Small delay to prevent overwhelming ChromaDB
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return { indexed };
  }

  /**
   * Perform semantic search in worker thread
   */
  async function semanticSearchInWorker(params: {
    queryEmbedding: number[];
    nResults: number;
    filterOptions?: Record<string, any>;
  }): Promise<SearchResult[]> {
    if (!isInitialized || !collection) {
      throw new Error("Vector database not initialized");
    }

    const { queryEmbedding, nResults, filterOptions } = params;

    const queryResult = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
      where: filterOptions,
    });

    const results: SearchResult[] = [];

    if (queryResult.documents && queryResult.documents[0]) {
      for (let i = 0; i < queryResult.documents[0].length; i++) {
        const document = queryResult.documents[0][i];
        const metadata = queryResult.metadatas?.[0]?.[i];
        const distance = queryResult.distances?.[0]?.[i];

        if (document && metadata) {
          results.push({
            content: document,
            relevanceScore: 1 - (distance || 0), // Convert distance to similarity
            metadata: {
              type: metadata.type as any,
              name: metadata.name,
              filePath: metadata.filePath,
              startLine: metadata.startLine,
              endLine: metadata.endLine,
            },
          });
        }
      }
    }

    return results;
  }

  /**
   * Delete embeddings by file path in worker thread
   */
  async function deleteByFileInWorker(filePath: string): Promise<void> {
    if (!isInitialized || !collection) {
      throw new Error("Vector database not initialized");
    }

    await collection.delete({
      where: { filePath },
    });
  }

  /**
   * Clear all embeddings in worker thread
   */
  async function clearAllInWorker(): Promise<void> {
    if (!isInitialized || !collection) {
      throw new Error("Vector database not initialized");
    }

    // Delete the collection and recreate it
    await chroma.deleteCollection({ name: collectionName });
    collection = await chroma.createCollection({
      name: collectionName,
      metadata: { "hnsw:space": "cosine" },
    });
  }

  /**
   * Get database statistics in worker thread
   */
  function getStatsInWorker(): {
    isInitialized: boolean;
    collectionName?: string;
  } {
    return {
      isInitialized,
      collectionName: isInitialized ? collectionName : undefined,
    };
  }
}

/**
 * Main thread vector database service that uses worker threads
 */
export class WorkerVectorDatabaseService {
  private worker: Worker | null = null;
  private isInitialized = false;

  constructor(
    private extensionPath: string,
    private chromaUrl?: string,
  ) {}

  /**
   * Initialize the worker and vector database
   */
  async initialize(): Promise<void> {
    // Create worker
    this.worker = new Worker(__filename, {
      workerData: {},
    });

    // Initialize vector database in worker
    const response = await this.sendTaskToWorker({
      type: "initialize",
      payload: { chromaUrl: this.chromaUrl },
    });

    this.isInitialized = response.success;

    if (!this.isInitialized) {
      throw new Error("Failed to initialize vector database worker");
    }
  }

  /**
   * Index code snippets with progress reporting
   */
  async indexCodeSnippets(
    snippets: CodeSnippet[],
    progressCallback?: (
      progress: number,
      indexed: number,
      total: number,
    ) => void,
  ): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error("Vector database not initialized");
    }

    // Set up progress listener
    if (progressCallback) {
      const progressListener = (message: VectorWorkerResponse) => {
        if (message.progress !== undefined && message.data) {
          progressCallback(
            message.progress,
            message.data.indexed || 0,
            message.data.total || snippets.length,
          );
        }
      };

      this.worker.on("message", progressListener);

      try {
        await this.sendTaskToWorker({
          type: "indexSnippets",
          payload: snippets,
        });
      } finally {
        this.worker.off("message", progressListener);
      }
    } else {
      await this.sendTaskToWorker({
        type: "indexSnippets",
        payload: snippets,
      });
    }
  }

  /**
   * Perform semantic search
   */
  async semanticSearch(
    queryEmbedding: number[],
    nResults: number = 10,
    filterOptions?: Record<string, any>,
  ): Promise<SearchResult[]> {
    if (!this.isInitialized || !this.worker) {
      throw new Error("Vector database not initialized");
    }

    const response = await this.sendTaskToWorker({
      type: "semanticSearch",
      payload: { queryEmbedding, nResults, filterOptions },
    });

    return response.data;
  }

  /**
   * Delete embeddings by file path
   */
  async deleteByFilePath(filePath: string): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error("Vector database not initialized");
    }

    await this.sendTaskToWorker({
      type: "deleteByFile",
      payload: filePath,
    });
  }

  /**
   * Clear all embeddings
   */
  async clearAll(): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error("Vector database not initialized");
    }

    await this.sendTaskToWorker({
      type: "clearAll",
      payload: null,
    });
  }

  /**
   * Get database statistics
   */
  getStats(): { isInitialized: boolean; collectionName?: string } {
    return {
      isInitialized: this.isInitialized,
      collectionName: this.isInitialized
        ? "codebuddy-code-snippets"
        : undefined,
    };
  }

  /**
   * Send task to worker and wait for response
   */
  private async sendTaskToWorker(
    task: VectorWorkerTask,
  ): Promise<VectorWorkerResponse> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Worker timeout"));
      }, 60000); // Longer timeout for indexing operations

      const messageHandler = (response: VectorWorkerResponse) => {
        // Only resolve for non-progress messages
        if (response.progress === undefined) {
          clearTimeout(timeout);
          this.worker?.off("message", messageHandler);

          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        }
      };

      this.worker!.on("message", messageHandler);
      this.worker!.postMessage(task);
    });
  }

  /**
   * Cleanup worker
   */
  async dispose(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}
