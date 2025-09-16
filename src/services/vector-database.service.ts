import * as path from "path";
import { ChromaClient, Collection } from "chromadb";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import * as vscode from "vscode";
import { EmbeddingService } from "./embedding";

export interface CodeSnippet {
  id: string;
  filePath: string;
  type: "function" | "class" | "interface" | "enum" | "module";
  name: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  distance: number;
  relevanceScore: number;
}

export interface VectorDbStats {
  isInitialized: boolean;
  collectionName: string;
  documentCount: number;
  lastSync: string | null;
  memoryUsage: number;
}

/**
 * VectorDatabaseService manages ChromaDB operations for semantic code search.
 * Always uses Gemini embeddings for consistency across the application.
 */
export class VectorDatabaseService {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;
  private logger: Logger;
  private isInitialized = false;
  private embeddingService: EmbeddingService | null = null;
  private stats: VectorDbStats;

  constructor(
    private context: vscode.ExtensionContext,
    private geminiApiKey?: string
  ) {
    this.logger = Logger.initialize("VectorDatabaseService", {
      minLevel: LogLevel.INFO,
    });

    // Always use Gemini for embeddings to maintain consistency
    if (!this.geminiApiKey) {
      const config = vscode.workspace.getConfiguration();
      this.geminiApiKey = config.get<string>("google.gemini.apiKeys") || "";
    }

    if (!this.geminiApiKey) {
      this.logger.warn("Gemini API key not found. Vector database will be disabled.");
    } else {
      this.embeddingService = new EmbeddingService(this.geminiApiKey);
    }

    this.stats = {
      isInitialized: false,
      collectionName: "codebase_embeddings",
      documentCount: 0,
      lastSync: null,
      memoryUsage: 0,
    };
  }

  /**
   * Initialize ChromaDB with local persistence and Gemini embeddings
   */
  async initialize(): Promise<void> {
    try {
      if (!this.geminiApiKey) {
        throw new Error("Gemini API key is required for vector database initialization");
      }

      // Initialize ChromaDB with local persistence
      const dbPath = path.join(this.context.extensionPath, "vector_db");

      this.client = new ChromaClient({
        path: dbPath,
      });

      // Create or get collection without embedding function (we'll handle embeddings manually)
      this.collection = await this.client.getOrCreateCollection({
        name: "codebase_embeddings",
        // Note: We don't use ChromaDB's embedding function because we want
        // to use our consistent Gemini embedding service
      });

      this.isInitialized = true;
      this.stats.isInitialized = true;
      this.stats.lastSync = new Date().toISOString();

      // Get current document count
      const count = (await this.collection?.count()) || 0;
      this.stats.documentCount = count;

      this.logger.info("Vector database initialized successfully", {
        dbPath,
        collectionName: this.stats.collectionName,
        documentCount: count,
      });
    } catch (error) {
      this.logger.error("Failed to initialize vector database:", error);
      this.isInitialized = false;
      this.stats.isInitialized = false;
      throw error;
    }
  }

  /**
   * Index code snippets using Gemini embeddings
   */
  async indexCodeSnippets(snippets: CodeSnippet[]): Promise<void> {
    if (!this.isInitialized || !this.collection || !this.embeddingService) {
      throw new Error("Vector database not initialized or Gemini API key missing");
    }

    try {
      this.logger.info(`Indexing ${snippets.length} code snippets`);

      // Generate embeddings using our consistent Gemini service
      const embeddings: number[][] = [];
      const ids: string[] = [];
      const metadatas: Record<string, any>[] = [];
      const documents: string[] = [];

      for (const snippet of snippets) {
        try {
          // Use Gemini embedding service for consistency
          const embedding = await this.embeddingService.generateEmbedding(snippet.content);

          embeddings.push(embedding);
          ids.push(snippet.id);
          documents.push(snippet.content);
          metadatas.push({
            filePath: snippet.filePath,
            type: snippet.type,
            name: snippet.name,
            ...snippet.metadata,
          });
        } catch (error) {
          this.logger.error(`Failed to generate embedding for snippet ${snippet.id}:`, error);
          // Continue with other snippets
        }
      }

      if (embeddings.length === 0) {
        this.logger.warn("No embeddings generated for snippets");
        return;
      }

      // Add to ChromaDB collection
      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents,
      });

      // Update stats
      this.stats.documentCount = await this.collection.count();
      this.stats.lastSync = new Date().toISOString();

      this.logger.info(`Successfully indexed ${embeddings.length} code snippets`, {
        totalDocuments: this.stats.documentCount,
      });
    } catch (error) {
      this.logger.error("Failed to index code snippets:", error);
      throw error;
    }
  }

  /**
   * Perform semantic search using Gemini embeddings
   */
  async semanticSearch(query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.isInitialized || !this.collection || !this.embeddingService) {
      this.logger.warn("Vector database not initialized, returning empty results");
      return [];
    }

    try {
      // Generate query embedding using Gemini
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search in ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ["documents", "metadatas", "distances"],
      });

      // Transform results
      const searchResults: SearchResult[] = [];

      if (results.documents && results.metadatas && results.distances) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances[0][i];
          const document = results.documents[0][i];
          const metadata = results.metadatas[0][i];

          if (distance !== null && document !== null && metadata !== null) {
            const relevanceScore = Math.max(0, 1 - distance); // Convert distance to relevance score

            searchResults.push({
              content: document,
              metadata: metadata as Record<string, any>,
              distance,
              relevanceScore,
            });
          }
        }
      }

      this.logger.debug(`Semantic search returned ${searchResults.length} results for query: "${query}"`);
      return searchResults;
    } catch (error) {
      this.logger.error("Semantic search failed:", error);
      return [];
    }
  }

  /**
   * Delete documents by file path
   */
  async deleteByFile(filePath: string): Promise<void> {
    if (!this.isInitialized || !this.collection) {
      return;
    }

    try {
      // Query documents by file path
      const results = await this.collection.get({
        where: { filePath },
      });

      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids,
        });

        this.stats.documentCount = await this.collection.count();
        this.logger.info(`Deleted ${results.ids.length} documents for file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete documents for file ${filePath}:`, error);
    }
  }

  /**
   * Update existing document
   */
  async updateDocument(snippet: CodeSnippet): Promise<void> {
    if (!this.isInitialized || !this.collection || !this.embeddingService) {
      return;
    }

    try {
      // Delete existing document if it exists
      await this.deleteByFile(snippet.filePath);

      // Add updated document
      await this.indexCodeSnippets([snippet]);

      this.logger.debug(`Updated document: ${snippet.id}`);
    } catch (error) {
      this.logger.error(`Failed to update document ${snippet.id}:`, error);
    }
  }

  /**
   * Clear all documents from the collection
   */
  async clearAll(): Promise<void> {
    if (!this.isInitialized || !this.collection) {
      return;
    }

    try {
      // Get all document IDs
      const results = await this.collection.get();

      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids,
        });
      }

      this.stats.documentCount = 0;
      this.stats.lastSync = new Date().toISOString();

      this.logger.info("Cleared all documents from vector database");
    } catch (error) {
      this.logger.error("Failed to clear vector database:", error);
    }
  }

  /**
   * Get database statistics
   */
  getStats(): VectorDbStats {
    return { ...this.stats };
  }

  /**
   * Check if the service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && !!this.collection && !!this.embeddingService;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.isInitialized = false;
    this.collection = null;
    this.client = null;
    this.logger.info("Vector database service disposed");
  }
}
