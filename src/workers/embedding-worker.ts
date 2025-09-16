/**
 * Embedding Worker - Runs embedding generation in a separate thread
 * to prevent blocking the main VS Code UI thread
 */
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IFunctionData } from "../application/interfaces";
import { EmbeddingsConfig } from "../application/constant";

// Types for worker communication
export interface WorkerTask {
  type: "generateEmbeddings" | "generateBatch" | "ping";
  payload: any;
}

export interface WorkerResponse {
  success: boolean;
  data?: any;
  error?: string;
  progress?: number;
}

export interface EmbeddingWorkerOptions {
  batchSize?: number;
  maxRetries?: number;
}

// Worker thread code (runs when this file is executed as a worker)
if (!isMainThread && parentPort) {
  const genAI = new GoogleGenerativeAI(workerData.apiKey);

  parentPort.on("message", async (task: WorkerTask) => {
    try {
      switch (task.type) {
        case "ping":
          parentPort?.postMessage({ success: true, data: "pong" });
          break;

        case "generateEmbeddings":
          const result = await generateEmbeddingsInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: result });
          break;

        case "generateBatch":
          const batchResult = await processBatchInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: batchResult });
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
   * Generate embeddings for a single text in worker thread
   */
  async function generateEmbeddingsInWorker(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({
      model: EmbeddingsConfig.embeddingModel,
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Process a batch of function data in worker thread
   */
  async function processBatchInWorker(batch: IFunctionData[]): Promise<IFunctionData[]> {
    const results: IFunctionData[] = [];

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      try {
        const embedding = await generateEmbeddingsInWorker(item.compositeText);
        results.push({
          ...item,
          embedding,
          processedAt: new Date().toISOString(),
        });

        // Report progress
        const progress = ((i + 1) / batch.length) * 100;
        parentPort?.postMessage({
          success: true,
          progress,
          data: { completed: i + 1, total: batch.length },
        });

        // Small delay to prevent overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process item ${item.name || item.path || "unknown"}:`, error);
        // Continue with next item
      }
    }

    return results;
  }
}

/**
 * Main thread embedding service that uses worker threads
 */
export class WorkerEmbeddingService {
  private workers: Worker[] = [];
  private readonly maxWorkers: number;
  private workerId = 0;

  constructor(
    private readonly apiKey: string,
    private readonly options: EmbeddingWorkerOptions = {}
  ) {
    this.maxWorkers = Math.min(4, require("os").cpus().length);
  }

  /**
   * Initialize worker pool
   */
  async initialize(): Promise<void> {
    // Create worker pool
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(__filename, {
        workerData: { apiKey: this.apiKey },
      });

      this.workers.push(worker);
    }

    // Test workers
    await Promise.all(this.workers.map((worker) => this.sendTaskToWorker(worker, { type: "ping", payload: null })));
  }

  /**
   * Generate embedding using worker thread
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const worker = this.getNextWorker();
    const response = await this.sendTaskToWorker(worker, {
      type: "generateEmbeddings",
      payload: text,
    });

    return response.data;
  }

  /**
   * Process function data using worker threads with progress reporting
   */
  async processFunctions(
    data: IFunctionData[],
    progressCallback?: (progress: number, completed: number, total: number) => void
  ): Promise<IFunctionData[]> {
    const batchSize = this.options.batchSize || 10;
    const batches = this.chunkArray(data, batchSize);
    const results: IFunctionData[] = [];

    // Process batches in parallel using multiple workers
    const workerPromises = batches.map(async (batch, index) => {
      const worker = this.workers[index % this.workers.length];

      // Set up progress listener for this worker
      const progressListener = (message: WorkerResponse) => {
        if (message.progress !== undefined && progressCallback) {
          const overallProgress = ((index + message.progress / 100) / batches.length) * 100;
          progressCallback(overallProgress, message.data?.completed || 0, message.data?.total || batch.length);
        }
      };

      worker.on("message", progressListener);

      try {
        const response = await this.sendTaskToWorker(worker, {
          type: "generateBatch",
          payload: batch,
        });

        worker.off("message", progressListener);
        return response.data as IFunctionData[];
      } catch (error) {
        worker.off("message", progressListener);
        throw error;
      }
    });

    const batchResults = await Promise.all(workerPromises);
    return batchResults.flat();
  }

  /**
   * Send task to worker and wait for response
   */
  private async sendTaskToWorker(worker: Worker, task: WorkerTask): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Worker timeout"));
      }, 30000);

      const messageHandler = (response: WorkerResponse) => {
        // Only resolve for non-progress messages
        if (response.progress === undefined) {
          clearTimeout(timeout);
          worker.off("message", messageHandler);

          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        }
      };

      worker.on("message", messageHandler);
      worker.postMessage(task);
    });
  }

  /**
   * Get next worker in round-robin fashion
   */
  private getNextWorker(): Worker {
    const worker = this.workers[this.workerId % this.workers.length];
    this.workerId++;
    return worker;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Cleanup workers
   */
  async dispose(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];
  }
}
