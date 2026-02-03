import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface Document {
  id: string;
  text: string;
  vector: number[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  document: Document;
  score: number;
}

export class SimpleVectorStore {
  private documents: Map<string, Document> = new Map();
  private readonly logger: Logger;
  private persistPath: string;
  private isDirty: boolean = false;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.initialize("SimpleVectorStore", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });

    // Store in global storage or workspace storage
    const storagePath =
      context.storageUri?.fsPath || context.globalStorageUri.fsPath;
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    this.persistPath = path.join(storagePath, "vector_store.json");

    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = fs.readFileSync(this.persistPath, "utf-8");
        const rawDocs: Document[] = JSON.parse(data);
        this.documents = new Map(rawDocs.map((d) => [d.id, d]));
        this.logger.info(
          `Loaded ${this.documents.size} documents from vector store.`,
        );
      }
    } catch (error) {
      this.logger.error("Failed to load vector store", error);
    }
  }

  public async save() {
    if (!this.isDirty) return;

    try {
      const data = JSON.stringify(Array.from(this.documents.values()));
      await fs.promises.writeFile(this.persistPath, data, "utf-8");
      this.isDirty = false;
      this.logger.debug("Saved vector store to disk.");
    } catch (error) {
      this.logger.error("Failed to save vector store", error);
    }
  }

  private scheduleSave() {
    this.isDirty = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 5000); // Debounce save
  }

  public async addDocument(doc: Document) {
    this.documents.set(doc.id, doc);
    this.scheduleSave();
  }

  public async addDocuments(docs: Document[]) {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    this.scheduleSave();
  }

  public async search(
    queryVector: number[],
    k: number = 5,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Convert map values to array for iteration
    const docs = Array.from(this.documents.values());

    // Optimization: Process in chunks to avoid blocking event loop if many docs
    const chunkSize = 1000;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);

      for (const doc of chunk) {
        const score = this.cosineSimilarity(queryVector, doc.vector);
        results.push({ document: doc, score });
      }

      // Yield to event loop every chunk
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Sort by score descending and take top k
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public clear() {
    this.documents.clear();
    this.scheduleSave();
  }
}
