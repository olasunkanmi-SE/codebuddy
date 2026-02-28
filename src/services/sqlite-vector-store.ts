import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface VectorDocument {
  id: string;
  text: string;
  vector: number[];
  filePath: string;
  startLine: number;
  endLine: number;
  chunkType: string;
  language: string;
}

export interface VectorSearchResult {
  document: VectorDocument;
  score: number;
}

interface FileMetadata {
  filePath: string;
  fileHash: string;
  chunkCount: number;
  indexedAt: string;
}

/**
 * SQLite-backed vector store using sql.js (WASM).
 * Singleton — shared between AstIndexingService (writes) and ContextRetriever (reads).
 *
 * Vectors are stored as binary BLOBs (Float32Array) for efficient storage.
 * Search uses in-memory cosine similarity with event-loop yielding.
 * Supports incremental indexing via file content hashing.
 */
export class SqliteVectorStore implements vscode.Disposable {
  private static instance: SqliteVectorStore;
  private db: any = null;
  private SQL: any = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly logger: Logger;
  private dbPath = "";
  private isDirty = false;
  private saveTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = Logger.initialize("SqliteVectorStore", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): SqliteVectorStore {
    return (SqliteVectorStore.instance ??= new SqliteVectorStore());
  }

  async initialize(context: vscode.ExtensionContext): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize(context);
    return this.initPromise;
  }

  private async _initialize(context: vscode.ExtensionContext): Promise<void> {
    try {
      const initSqlJs = (await import("sql.js")).default;

      const wasmPath = path.join(
        context.extensionPath,
        "dist",
        "grammars",
        "sql-wasm.wasm",
      );
      // Fallback: check __dirname for dev mode
      const resolvedWasmPath = fs.existsSync(wasmPath)
        ? wasmPath
        : path.join(__dirname, "grammars", "sql-wasm.wasm");

      this.SQL = await initSqlJs({
        locateFile: (file: string) =>
          file.endsWith(".wasm") ? resolvedWasmPath : file,
      });

      // Store in workspace storage (project-specific vectors)
      // Falls back to global storage if no workspace is open
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      let storageDir: string;

      if (workspaceFolder) {
        storageDir = path.join(workspaceFolder.uri.fsPath, ".codebuddy");
      } else {
        storageDir = context.globalStorageUri.fsPath;
      }

      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      this.dbPath = path.join(storageDir, "vector_store.db");

      // Load existing database or create new
      let data: Uint8Array | undefined;
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        data = new Uint8Array(buffer);
      }

      this.db = new this.SQL.Database(data);
      this.createTables();
      this.saveToDisk();

      this.initialized = true;
      const stats = this.getStatsSync();
      this.logger.info(
        `Vector store initialized: ${stats.totalChunks} chunks from ${stats.totalFiles} files`,
      );
    } catch (error: any) {
      this.initPromise = null;
      this.logger.error("Failed to initialize vector store", error);
      throw error;
    }
  }

  private createTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        vector BLOB,
        file_path TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        chunk_type TEXT NOT NULL DEFAULT 'text_chunk',
        language TEXT NOT NULL DEFAULT '',
        indexed_at TEXT NOT NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_chunks_file_path ON chunks(file_path)
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS file_metadata (
        file_path TEXT PRIMARY KEY,
        file_hash TEXT NOT NULL,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        indexed_at TEXT NOT NULL
      )
    `);
  }

  // --- File hash management for incremental indexing ---

  /**
   * Compute SHA-256 hash of file content.
   */
  static computeFileHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Check if a file needs re-indexing by comparing content hash.
   * Returns true if the file is new or has changed.
   */
  isFileChanged(filePath: string, contentHash: string): boolean {
    if (!this.initialized) {
      return true;
    }
    const stmt = this.db.prepare(
      "SELECT file_hash FROM file_metadata WHERE file_path = ?",
    );
    stmt.bind([filePath]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.file_hash !== contentHash;
    }
    stmt.free();
    return true;
  }

  /**
   * Remove all chunks for a given file path.
   */
  removeFile(filePath: string): void {
    if (!this.initialized) {
      return;
    }
    this.db.run("DELETE FROM chunks WHERE file_path = ?", [filePath]);
    this.db.run("DELETE FROM file_metadata WHERE file_path = ?", [filePath]);
    this.scheduleSave();
  }

  // --- Document storage ---

  /**
   * Add a chunk with its embedding vector.
   */
  addDocument(doc: VectorDocument): void {
    if (!this.initialized) {
      return;
    }
    const vectorBlob =
      doc.vector && doc.vector.length > 0
        ? Buffer.from(new Float32Array(doc.vector).buffer)
        : null;

    this.db.run(
      `INSERT OR REPLACE INTO chunks (id, text, vector, file_path, start_line, end_line, chunk_type, language, indexed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.text,
        vectorBlob,
        doc.filePath,
        doc.startLine,
        doc.endLine,
        doc.chunkType,
        doc.language,
        new Date().toISOString(),
      ],
    );
    this.scheduleSave();
  }

  /**
   * Add multiple documents in a transaction.
   */
  addDocuments(docs: VectorDocument[]): void {
    if (!this.initialized || docs.length === 0) {
      return;
    }
    this.db.run("BEGIN TRANSACTION");
    try {
      for (const doc of docs) {
        const vectorBlob =
          doc.vector && doc.vector.length > 0
            ? Buffer.from(new Float32Array(doc.vector).buffer)
            : null;

        this.db.run(
          `INSERT OR REPLACE INTO chunks (id, text, vector, file_path, start_line, end_line, chunk_type, language, indexed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            doc.id,
            doc.text,
            vectorBlob,
            doc.filePath,
            doc.startLine,
            doc.endLine,
            doc.chunkType,
            doc.language,
            new Date().toISOString(),
          ],
        );
      }
      this.db.run("COMMIT");
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    }
    this.scheduleSave();
  }

  /**
   * Update file metadata after indexing all chunks for a file.
   */
  updateFileMetadata(
    filePath: string,
    fileHash: string,
    chunkCount: number,
  ): void {
    if (!this.initialized) {
      return;
    }
    this.db.run(
      `INSERT OR REPLACE INTO file_metadata (file_path, file_hash, chunk_count, indexed_at)
       VALUES (?, ?, ?, ?)`,
      [filePath, fileHash, chunkCount, new Date().toISOString()],
    );
    this.scheduleSave();
  }

  // --- Search ---

  /**
   * Semantic vector search using cosine similarity.
   * Loads vectors from SQLite in batches and yields the event loop to prevent UI freezing.
   *
   * TODO: Replace brute-force scan with an ANN index (e.g. HNSW via sqlite-vss)
   * once the chunk count exceeds ~50k and latency becomes noticeable.
   */
  async search(
    queryVector: number[],
    k = 5,
    threshold = 0.0,
  ): Promise<VectorSearchResult[]> {
    if (!this.initialized) {
      return [];
    }

    const results: VectorSearchResult[] = [];
    const stmt = this.db.prepare(
      "SELECT id, text, vector, file_path, start_line, end_line, chunk_type, language FROM chunks WHERE vector IS NOT NULL",
    );

    let count = 0;
    while (stmt.step()) {
      const row = stmt.getAsObject({ ":id": null });
      const vectorBlob = row.vector as Uint8Array;
      if (!vectorBlob || vectorBlob.length === 0) {
        continue;
      }

      const vector = new Float32Array(
        vectorBlob.buffer,
        vectorBlob.byteOffset,
        vectorBlob.byteLength / 4,
      );

      const score = this.cosineSimilarity(queryVector, vector);
      if (score >= threshold) {
        results.push({
          document: {
            id: row.id as string,
            text: row.text as string,
            vector: Array.from(vector),
            filePath: row.file_path as string,
            startLine: row.start_line as number,
            endLine: row.end_line as number,
            chunkType: row.chunk_type as string,
            language: row.language as string,
          },
          score,
        });
      }

      count++;
      // Yield event loop every 500 rows to keep VS Code responsive
      if (count % 500 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
    stmt.free();

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  /**
   * Keyword-based search fallback.
   */
  async keywordSearch(query: string, k = 5): Promise<VectorSearchResult[]> {
    if (!this.initialized) {
      return [];
    }

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    if (terms.length === 0) {
      return [];
    }

    const results: VectorSearchResult[] = [];
    const stmt = this.db.prepare(
      "SELECT id, text, file_path, start_line, end_line, chunk_type, language FROM chunks",
    );

    let count = 0;
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const text = (row.text as string).toLowerCase();
      let score = 0;

      for (const term of terms) {
        if (text.includes(term)) {
          score += 1;
        }
      }

      if (score > 0) {
        results.push({
          document: {
            id: row.id as string,
            text: row.text as string,
            vector: [],
            filePath: row.file_path as string,
            startLine: row.start_line as number,
            endLine: row.end_line as number,
            chunkType: row.chunk_type as string,
            language: row.language as string,
          },
          score,
        });
      }

      count++;
      if (count % 1000 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
    stmt.free();

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  // --- Stats ---

  getStatsSync(): { totalFiles: number; totalChunks: number } {
    if (!this.initialized) {
      return { totalFiles: 0, totalChunks: 0 };
    }
    const chunkRow = this.db.exec("SELECT COUNT(*) as cnt FROM chunks")?.[0]
      ?.values?.[0];
    const fileRow = this.db.exec(
      "SELECT COUNT(*) as cnt FROM file_metadata",
    )?.[0]?.values?.[0];

    return {
      totalChunks: (chunkRow?.[0] as number) || 0,
      totalFiles: (fileRow?.[0] as number) || 0,
    };
  }

  /**
   * Get list of all indexed file paths.
   */
  getIndexedFiles(): string[] {
    if (!this.initialized) {
      return [];
    }
    const result = this.db.exec("SELECT file_path FROM file_metadata");
    if (!result.length) {
      return [];
    }
    return result[0].values.map((row: any[]) => row[0] as string);
  }

  /**
   * Clear the entire store.
   */
  clear(): void {
    if (!this.initialized) {
      return;
    }
    this.db.run("DELETE FROM chunks");
    this.db.run("DELETE FROM file_metadata");
    this.scheduleSave();
  }

  // --- Persistence ---

  private scheduleSave(): void {
    this.isDirty = true;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => this.saveToDisk(), 5000);
  }

  saveToDisk(): void {
    if (!this.db) {
      return;
    }
    try {
      const data: Uint8Array = this.db.export();
      fs.writeFileSync(this.dbPath, data);
      this.isDirty = false;
    } catch (error) {
      this.logger.error("Failed to save vector store to disk", error);
    }
  }

  // --- Utilities ---

  private cosineSimilarity(a: number[], b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  get isReady(): boolean {
    return this.initialized;
  }

  dispose(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    if (this.isDirty) {
      this.saveToDisk();
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }
}
