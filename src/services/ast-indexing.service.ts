import * as vscode from "vscode";
import { Worker } from "worker_threads";
import * as path from "path";
import { Logger } from "../infrastructure/logger/logger";
import { SqliteVectorStore, VectorDocument } from "./sqlite-vector-store";
import { EmbeddingService } from "./embedding";
import { getAPIKeyAndModel, getGenerativeAiModel } from "../utils/utils";

const EMBEDDING_BATCH_SIZE = 5;

export class AstIndexingService {
  private worker: Worker | undefined;
  private readonly logger: Logger;
  private vectorStore: SqliteVectorStore;
  private embeddingService: EmbeddingService;
  private isProcessing = false;

  private static instance: AstIndexingService;

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.initialize("AstIndexingService", {});
    this.vectorStore = SqliteVectorStore.getInstance();

    // Lazy init — don't block constructor
    this.vectorStore.initialize(context).catch((err) => {
      this.logger.error("Failed to initialize vector store", err);
    });

    // Initialize embedding service
    const provider = getGenerativeAiModel() || "Gemini";
    const { apiKey, baseUrl } = getAPIKeyAndModel(provider);
    this.embeddingService = new EmbeddingService({
      apiKey,
      provider,
      baseUrl,
    });

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

      await this.processChunks(chunks, filePath);

      // Update file metadata after worker completes
      if (filePath) {
        try {
          const doc = await vscode.workspace.openTextDocument(
            vscode.Uri.file(filePath),
          );
          const contentHash = SqliteVectorStore.computeFileHash(doc.getText());
          this.vectorStore.updateFileMetadata(
            filePath,
            contentHash,
            chunks.length,
          );
        } catch {
          // File may no longer exist; skip metadata update
        }
      }
    } else if (message.type === "ERROR") {
      this.logger.error("Worker processing error", message.error);
    }
  }

  private async processChunks(
    chunks: any[],
    filePath?: string,
    embeddingsAvailable = true,
  ) {
    const docs: VectorDocument[] = [];
    const lang = filePath ? this.detectLanguage(filePath) : "";

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);

      for (const chunk of batch) {
        let embedding: number[] | undefined;

        if (embeddingsAvailable) {
          try {
            embedding = await this.embeddingService.generateEmbedding(
              chunk.text,
            );
          } catch (err) {
            this.logger.warn(
              `Failed to generate embedding for chunk ${chunk.id}`,
              err,
            );
          }
        }

        // Store chunk even without embedding — keyword search still works
        docs.push({
          id: chunk.id,
          text: chunk.text,
          vector: embedding || [],
          filePath: chunk.metadata?.filePath || filePath || "",
          startLine: chunk.startLine || 0,
          endLine: chunk.endLine || 0,
          chunkType: chunk.type || "text_chunk",
          language: lang,
        });
      }

      // Yield event loop between batches to keep VS Code responsive
      await new Promise((resolve) => setImmediate(resolve));
    }

    if (docs.length > 0) {
      this.vectorStore.addDocuments(docs);
    }
    this.logger.info(`Persisted ${docs.length} chunks to vector store`);
  }

  public async indexFile(filePath: string, content: string) {
    if (!this.vectorStore.isReady) {
      this.logger.warn("Vector store not ready, skipping indexing");
      return;
    }

    // Incremental check — skip unchanged files
    const contentHash = SqliteVectorStore.computeFileHash(content);
    if (!this.vectorStore.isFileChanged(filePath, contentHash)) {
      this.logger.debug(`File unchanged, skipping: ${filePath}`);
      return;
    }

    // Remove old chunks for this file before re-indexing
    this.vectorStore.removeFile(filePath);

    if (this.worker) {
      this.worker.postMessage({
        type: "INDEX_FILE",
        data: { filePath, content },
      });
    } else {
      this.logger.warn(
        `Worker not initialized, falling back to main thread chunking for ${filePath}`,
      );
      const chunks = this.simpleChunk(content, filePath);
      await this.processChunks(chunks, filePath);
      this.vectorStore.updateFileMetadata(filePath, contentHash, chunks.length);
    }
  }

  /**
   * Pre-flight check: try a single embedding to see if the API is reachable.
   */
  private async checkEmbeddingAvailability(): Promise<boolean> {
    try {
      await this.embeddingService.generateEmbedding("test");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Index multiple files with batching, progress reporting, and cancellation.
   * Falls back to text-only indexing (keyword search) when embeddings are unavailable.
   */
  public async indexFiles(
    files: vscode.Uri[],
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
    token?: vscode.CancellationToken,
  ): Promise<{
    indexed: number;
    skipped: number;
    errors: number;
    embeddingsAvailable: boolean;
  }> {
    const total = files.length;
    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    // Pre-flight: check if embeddings are available before processing all files
    progress?.report({ message: "Checking embedding API availability..." });
    const embeddingsAvailable = await this.checkEmbeddingAvailability();

    if (!embeddingsAvailable) {
      this.logger.warn(
        "Embedding API unavailable — indexing in text-only mode (keyword search only)",
      );
      progress?.report({
        message:
          "Embedding API unavailable. Indexing text-only (keyword search)...",
      });
    }

    for (let i = 0; i < total; i++) {
      if (token?.isCancellationRequested) {
        break;
      }

      const file = files[i];
      const relativePath = vscode.workspace.asRelativePath(file);

      try {
        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();
        const contentHash = SqliteVectorStore.computeFileHash(content);

        if (!this.vectorStore.isFileChanged(file.fsPath, contentHash)) {
          skipped++;
          progress?.report({
            message: `Skipped (unchanged) ${i + 1}/${total}: ${relativePath}`,
            increment: (1 / total) * 100,
          });
          continue;
        }

        // Remove old data for this file
        this.vectorStore.removeFile(file.fsPath);

        // Chunk the file
        const chunks = this.simpleChunk(content, file.fsPath);

        progress?.report({
          message: `Indexing ${i + 1}/${total}: ${relativePath} (${chunks.length} chunks)`,
          increment: (1 / total) * 100,
        });

        // Generate embeddings (or store text-only) and persist
        await this.processChunks(chunks, file.fsPath, embeddingsAvailable);
        this.vectorStore.updateFileMetadata(
          file.fsPath,
          contentHash,
          chunks.length,
        );
        indexed++;
      } catch (error) {
        errors++;
        this.logger.error(`Failed to index file: ${file.fsPath}`, error);
      }

      // Yield between files
      await new Promise((resolve) => setImmediate(resolve));
    }

    // Ensure data is persisted
    this.vectorStore.saveToDisk();

    return { indexed, skipped, errors, embeddingsAvailable };
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".cpp": "cpp",
      ".c": "c",
      ".h": "c",
      ".cs": "csharp",
      ".rb": "ruby",
      ".php": "php",
    };
    return langMap[ext] || "";
  }

  // Simple text splitter as fallback (copied from worker for robustness)
  private simpleChunk(content: string, filePath: string): any[] {
    const chunks: any[] = [];
    const chunkSize = 1000;
    const overlap = 200;

    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const chunkText = content.slice(i, i + chunkSize);
      if (chunkText.length < 50) continue;

      // Calculate approximate lines
      const beforeText = content.slice(0, i);
      const startLine = beforeText.split("\n").length;
      const endLine = startLine + chunkText.split("\n").length - 1;

      chunks.push({
        id: `${filePath}::${i}`,
        text: chunkText,
        startLine,
        endLine,
        type: "text_chunk",
        metadata: { filePath },
      });
    }
    return chunks;
  }
}
