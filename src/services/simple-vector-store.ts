import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface SimpleVectorEntry {
  id: string;
  embedding: number[];
  document: string;
  metadata: Record<string, any>;
}

export interface SimpleSearchResult {
  id: string;
  document: string;
  metadata: Record<string, any>;
  similarity: number;
}

/**
 * Simple in-memory vector store that works reliably in VS Code without external dependencies
 * This is a fallback when ChromaDB fails, providing core vector search functionality
 */
export class SimpleVectorStore {
  private entries: Map<string, SimpleVectorEntry> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = Logger.initialize("SimpleVectorStore", {
      minLevel: LogLevel.INFO,
    });
  }

  /**
   * Add vectors to the store
   */
  async add(entries: {
    ids: string[];
    embeddings: number[][];
    documents: string[];
    metadatas: Record<string, any>[];
  }): Promise<void> {
    const { ids, embeddings, documents, metadatas } = entries;

    for (let i = 0; i < ids.length; i++) {
      const entry: SimpleVectorEntry = {
        id: ids[i],
        embedding: embeddings[i],
        document: documents[i],
        metadata: metadatas[i] || {},
      };

      this.entries.set(ids[i], entry);
    }

    this.logger.debug(`Added ${ids.length} entries to simple vector store`);
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  async query(params: {
    queryEmbeddings: number[][];
    nResults: number;
  }): Promise<{ documents: string[][]; metadatas: any[][]; distances: number[][] }> {
    const { queryEmbeddings, nResults } = params;
    const queryEmbedding = queryEmbeddings[0]; // Use first query embedding

    const results: SimpleSearchResult[] = [];

    // Calculate similarity for all entries
    for (const entry of this.entries.values()) {
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);

      results.push({
        id: entry.id,
        document: entry.document,
        metadata: entry.metadata,
        similarity,
      });
    }

    // Sort by similarity (highest first) and take top N
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, nResults);

    // Format results to match ChromaDB interface
    return {
      documents: [topResults.map((r) => r.document)],
      metadatas: [topResults.map((r) => r.metadata)],
      distances: [topResults.map((r) => 1 - r.similarity)], // Convert similarity to distance
    };
  }

  /**
   * Get count of stored vectors
   */
  async count(): Promise<number> {
    return this.entries.size;
  }

  /**
   * Delete entries by ID
   */
  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.entries.delete(id);
    }
    this.logger.debug(`Deleted ${ids.length} entries from simple vector store`);
  }

  /**
   * Get entries by metadata filter (simple implementation)
   */
  async get(params: { where?: Record<string, any> }): Promise<{ ids: string[] }> {
    const { where } = params;
    const matchingIds: string[] = [];

    for (const [id, entry] of this.entries) {
      if (!where) {
        matchingIds.push(id);
        continue;
      }

      // Simple metadata matching
      let matches = true;
      for (const [key, value] of Object.entries(where)) {
        if (entry.metadata[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        matchingIds.push(id);
      }
    }

    return { ids: matchingIds };
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.entries.clear();
    this.logger.debug("Cleared all entries from simple vector store");
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Get statistics about the vector store
   */
  getStats(): {
    entryCount: number;
    memoryUsage: number;
  } {
    const entryCount = this.entries.size;
    const memoryUsage = entryCount * 1000; // Rough estimate

    return {
      entryCount,
      memoryUsage,
    };
  }
}
