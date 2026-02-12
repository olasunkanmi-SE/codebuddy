/**
 * Embedding Worker - Runs embedding generation in a separate thread
 * to prevent blocking the main VS Code UI thread
 */
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IFunctionData } from "../application/interfaces";
import { pipeline, env } from "@huggingface/transformers";

// Worker-safe logger
class WorkerLogger {
  constructor(private module: string) {}
  debug(msg: string, data?: any) {
    console.debug(`[DEBUG] [${this.module}] ${msg}`, data || "");
  }
  info(msg: string, data?: any) {
    console.info(`[INFO] [${this.module}] ${msg}`, data || "");
  }
  warn(msg: string, data?: any) {
    console.warn(`[WARN] [${this.module}] ${msg}`, data || "");
  }
  error(msg: string, data?: any) {
    console.error(`[ERROR] [${this.module}] ${msg}`, data || "");
  }
}

const logger = new WorkerLogger("embedding-worker");

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
  logger.info("Embedding worker starting...");
  try {
    new GoogleGenerativeAI(workerData.apiKey || "dummy-key");
  } catch (err) {
    logger.error("Failed to initialize GoogleGenerativeAI in worker", err);
  }
  let extractor: any | undefined;
  let initializationPromise: Promise<void> | null = null;

  /**
   * Initialize Transformers.js extractor in worker
   */
  const initTransformers = async () => {
    if (extractor) return;

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      try {
        logger.info("Initializing Transformers.js in worker (dtype: q8)...");

        // Configure environment for worker
        if (env) {
          env.allowLocalModels = true;
          env.allowRemoteModels = true;
          env.useWasmCache = false; // Disable WASM cache to avoid blob: URL issues in worker

          // Force WASM backend by disabling native node backend
          if (env.backends && env.backends.onnx) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            env.backends.onnx.node = false;

            if (env.backends.onnx.wasm) {
              // Ensure WASM paths are configured if needed
              const isProd = __filename.includes("dist");
              // In prod, worker is in dist/workers/, so wasm is in ../wasm/
              // But we also copy it to dist/workers/ as a fallback
              const wasmDir = isProd
                ? path.resolve(__dirname, "..", "wasm")
                : path.resolve(__dirname, "..", "..", "dist", "wasm");

              // Fallback to current directory if wasmDir doesn't exist (though it should)
              const finalWasmDir =
                isProd && !fs.existsSync(wasmDir) ? __dirname : wasmDir;

              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              (env.backends.onnx.wasm as any).wasmPaths = {
                "ort-wasm-simd-threaded.wasm": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.wasm")}`,
                "ort-wasm-simd-threaded.mjs": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.mjs")}`,
                "ort-wasm-simd-threaded.asyncify.wasm": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.asyncify.wasm")}`,
                "ort-wasm-simd-threaded.asyncify.mjs": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.asyncify.mjs")}`,
              };
            }
          }
        }

        extractor = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
          {
            dtype: "q8", // Use quantized model to save memory and avoid std::bad_alloc
          },
        );
        logger.info("Transformers.js initialized in worker");
      } catch (error) {
        logger.error("Failed to initialize Transformers.js in worker", error);
        initializationPromise = null; // Reset on failure
        throw error;
      }
    })();

    return initializationPromise;
  };

  /**
   * Centralized error formatting for consistent error handling
   */
  const formatError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

  /**
   * Generate embeddings for a single text in worker thread
   */
  const generateEmbeddingsInWorker = async (
    text: string,
  ): Promise<number[]> => {
    // Only use Transformers.js for embeddings in worker
    try {
      await initTransformers();
      if (extractor) {
        const output = await extractor(text, {
          pooling: "mean",
          normalize: true,
        });
        return Array.from(output.data) as number[];
      }
    } catch (error) {
      logger.error("Transformers.js in worker failed", error);
      throw error;
    }

    throw new Error(
      "Local embedding provider (Transformers.js) not available in worker",
    );
  };

  /**
   * Process a batch of function data in worker thread
   */
  const processBatchInWorker = async (
    batch: IFunctionData[],
  ): Promise<IFunctionData[]> => {
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

        // No delay needed for local Transformers.js processing
      } catch (error: any) {
        logger.error(
          `Failed to process item ${item.name || item.path || "unknown"}:`,
          error,
        );
        // Continue with next item
      }
    }

    return results;
  };

  parentPort.on("message", async (task: WorkerTask) => {
    switch (task.type) {
      case "ping":
        try {
          parentPort?.postMessage({ success: true, data: "pong" });
        } catch (error: any) {
          parentPort?.postMessage({
            success: false,
            error: formatError(error),
          });
        }
        break;

      case "generateEmbeddings":
        try {
          const result = await generateEmbeddingsInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: result });
        } catch (error: any) {
          parentPort?.postMessage({
            success: false,
            error: formatError(error),
          });
        }
        break;

      case "generateBatch":
        try {
          const batchResult = await processBatchInWorker(task.payload);
          parentPort?.postMessage({ success: true, data: batchResult });
        } catch (error: any) {
          parentPort?.postMessage({
            success: false,
            error: formatError(error),
          });
        }
        break;

      default:
        parentPort?.postMessage({
          success: false,
          error: `Unknown task type: ${task.type}`,
        });
    }
  });
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
    private readonly options: EmbeddingWorkerOptions = {},
  ) {
    this.maxWorkers = Math.min(4, os.cpus().length);
  }

  /**
   * Initialize worker pool
   */
  async initialize(): Promise<void> {
    // Determine the worker execution path (dist for prod, out for dev)
    const isProd = __filename.includes("dist");
    const workerRelativePath = isProd
      ? "./workers/embedding-worker.js"
      : "../../out/workers/embedding-worker.js";
    const workerPath = path.resolve(__dirname, workerRelativePath);

    logger.info(`Initializing Embedding Worker Pool at: ${workerPath}`);

    // Create worker pool
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = new Worker(workerPath, {
          workerData: { apiKey: this.apiKey },
        });

        worker.on("error", (err) => {
          logger.error(`Worker ${i} error:`, err);
        });

        worker.on("exit", (code) => {
          if (code !== 0) {
            logger.error(`Worker ${i} exited with code ${code}`);
          }
        });

        this.workers.push(worker);
        logger.info(`Created embedding worker ${i}`);
      } catch (err) {
        logger.error(`Failed to create worker ${i}:`, err);
        throw err;
      }
    }

    // Test workers
    logger.info(`Testing ${this.workers.length} workers with ping...`);
    try {
      await Promise.all(
        this.workers.map((worker, i) =>
          this.sendTaskToWorker(worker, { type: "ping", payload: null })
            .then(() => logger.info(`Worker ${i} ping successful`))
            .catch((err) => {
              logger.error(`Worker ${i} ping failed:`, err);
              throw err;
            }),
        ),
      );
      logger.info("All embedding workers initialized successfully");
    } catch (err) {
      logger.error("One or more workers failed to respond to ping", err);
      throw err;
    }
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
    progressCallback?: (
      progress: number,
      completed: number,
      total: number,
    ) => void,
  ): Promise<IFunctionData[]> {
    const batchSize = this.options.batchSize || 10;
    const batches = this.chunkArray(data, batchSize);

    // Process batches in parallel using multiple workers
    const workerPromises = batches.map(async (batch, index) => {
      const worker = this.workers[index % this.workers.length];

      // Set up progress listener for this worker
      const progressListener = (message: WorkerResponse) => {
        if (message.progress !== undefined && progressCallback) {
          const overallProgress =
            ((index + message.progress / 100) / batches.length) * 100;
          progressCallback(
            overallProgress,
            message.data?.completed || 0,
            message.data?.total || batch.length,
          );
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
      } catch (error: any) {
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
  private async sendTaskToWorker(
    worker: Worker,
    task: WorkerTask,
  ): Promise<WorkerResponse> {
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
