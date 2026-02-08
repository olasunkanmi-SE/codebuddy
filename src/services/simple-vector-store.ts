import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface Document {
  id: string;
  text: string;
  vector?: number[];
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
  private isDirty = false;
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

  public async search(queryVector: number[], k = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Convert map values to array for iteration
    const docs = Array.from(this.documents.values());

    // Optimization: Process in chunks to avoid blocking event loop if many docs
    const chunkSize = 1000;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);

      // Calculate cosine similarity
      for (const doc of chunk) {
        if (!doc.vector || !queryVector) continue;
        const score = this.cosineSimilarity(queryVector, doc.vector);
        results.push({ document: doc, score });
      }

      // Yield to event loop to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  public async keywordSearch(query: string, k = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const docs = Array.from(this.documents.values());
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTerms.length === 0) return [];

    const chunkSize = 1000;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);

      for (const doc of chunk) {
        const text = doc.text.toLowerCase();
        let score = 0;

        // Simple scoring: +1 for each term found
        for (const term of queryTerms) {
          if (text.includes(term)) {
            score += 1;
          }
        }

        if (score > 0) {
          // Normalize score by length to prefer shorter, denser matches?
          // Or just raw count. Let's stick to raw count for simplicity/robustness.
          results.push({ document: doc, score });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  public clear() {
    this.documents.clear();
    this.scheduleSave();
  }
}
