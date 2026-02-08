import * as vscode from "vscode";
import { Worker } from "worker_threads";
import * as path from "path";
import { Logger } from "../infrastructure/logger/logger";
import { SimpleVectorStore } from "./simple-vector-store";
import { EmbeddingService } from "./embedding";
import { getAPIKeyAndModel } from "../utils/utils";

export class AstIndexingService {
  private worker: Worker | undefined;
  private readonly logger: Logger;
  private vectorStore: SimpleVectorStore;
  private embeddingService: EmbeddingService;
  private queue: string[] = [];
  private isProcessing = false;

  private static instance: AstIndexingService;

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.initialize("AstIndexingService", {});
    this.vectorStore = new SimpleVectorStore(context);

    // Initialize embedding service
    const { apiKey } = getAPIKeyAndModel("gemini");
    this.embeddingService = new EmbeddingService(apiKey);

    this.initializeWorker(context);
  }

  public static getInstance(
    context?: vscode.ExtensionContext,
  ): AstIndexingService {
    if (!AstIndexingService.instance) {
      if (!context) {
        throw new Error(
          "AstIndexingService not initialized. Context required for first initialization.",
        );
      }
      AstIndexingService.instance = new AstIndexingService(context);
    }
    return AstIndexingService.instance;
  }

  private initializeWorker(context: vscode.ExtensionContext) {
    // Determine the worker execution path (dist for prod, out for dev)
    const isProd = __filename.includes("dist");
    const workerRelativePath = isProd
      ? "./workers/ast-analyzer.worker.js"
      : "../../out/workers/ast-analyzer.worker.js";

    const workerPath = path.resolve(__dirname, workerRelativePath);

    try {
      this.logger.info(`Initializing Indexing Worker at: ${workerPath}`);
      this.worker = new Worker(workerPath);

      this.worker.on("message", this.handleWorkerMessage.bind(this));
      this.worker.on("error", (err) => this.logger.error("Worker error:", err));
      this.worker.on("exit", (code) => {
        if (code !== 0) {
          this.logger.error(`Worker stopped with exit code ${code}`);
          // Restart specific worker logic could go here
        }
      });
    } catch (error) {
      this.logger.error("Failed to initialize worker", error);
    }
  }

  private async handleWorkerMessage(message: any) {
    if (message.type === "RESULT") {
      const { chunks, filePath } = message.data;
      this.logger.info(
        `Worker finished file: ${filePath}, generated ${chunks.length} chunks`,
      );

      // Process embeddings in main thread (or separate worker)
      // Emitting to LLM API is I/O bound, so doing it here in batches is okay
      // provided we don't block.
      await this.processChunks(chunks);
    } else if (message.type === "ERROR") {
      this.logger.error("Worker processing error", message.error);
    }
  }

  private async processChunks(chunks: any[]) {
    // We'll generate embeddings for these chunks
    for (const chunk of chunks) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(
          chunk.text,
        );
        if (embedding) {
          await this.vectorStore.addDocument({
            id: chunk.id,
            text: chunk.text,
            vector: embedding,
            metadata: chunk.metadata,
          });
        }
      } catch (err) {
        this.logger.warn(
          `Failed to generate embedding for chunk ${chunk.id}`,
          err,
        );
      }
    }
    this.logger.info(`Persisted ${chunks.length} chunks to vector store`);
  }

  public indexFile(filePath: string, content: string) {
    if (!this.worker) return;

    // Send to worker
    this.worker.postMessage({
      type: "INDEX_FILE",
      data: { filePath, content },
    });
  }
}
