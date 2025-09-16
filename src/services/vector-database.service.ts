import * as path from "path";
import * as lancedb from "@lancedb/lancedb";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import * as vscode from "vscode";
import { EmbeddingService } from "./embedding";
import { SimpleVectorStore } from "./simple-vector-store";
import { Float32, Utf8, Int32, Schema, Field } from "apache-arrow";

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
 * VectorDatabaseService manages vector operations for semantic code search.
 * Uses LanceDB for efficient, local vector storage with TypeScript support.
 * Always uses Gemini embeddings for consistency across the application.
 */
export class VectorDatabaseService {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private simpleStore: SimpleVectorStore;
  private useSimpleStore: boolean = false; // Use LanceDB as primary
  private logger: Logger;
  private isInitialized = false;
  private embeddingService: EmbeddingService | null = null;
  private stats: VectorDbStats;
  private readonly dbPath: string;
  private readonly tableName = "codebase_embeddings";

  constructor(
    private context: vscode.ExtensionContext,
    private geminiApiKey?: string,
  ) {
    this.logger = Logger.initialize("VectorDatabaseService", {
      minLevel: LogLevel.INFO,
    });

    // Initialize simple vector store as fallback
    this.simpleStore = new SimpleVectorStore();

    // Set LanceDB database path - use workspace root for project-specific storage
    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    if (workspaceRoot) {
      this.dbPath = path.join(workspaceRoot, ".codebuddy", "lancedb");
    } else {
      // Fallback to extension path if no workspace is open
      this.dbPath = path.join(this.context.extensionPath, "lancedb");
      this.logger.warn(
        "No workspace found, using extension directory for LanceDB storage",
      );
    }

    // Always use Gemini for embeddings to maintain consistency
    if (!this.geminiApiKey) {
      const config = vscode.workspace.getConfiguration();
      this.geminiApiKey = config.get<string>("google.gemini.apiKeys") || "";
    }

    if (!this.geminiApiKey) {
      this.logger.warn(
        "Gemini API key not found. Vector database will be disabled.",
      );
    } else {
      this.embeddingService = new EmbeddingService(this.geminiApiKey);
    }

    this.stats = {
      isInitialized: false,
      collectionName: this.tableName,
      documentCount: 0,
      lastSync: null,
      memoryUsage: 0,
    };
  }

  /**
   * Initialize LanceDB with local persistence and Gemini embeddings
   */
  async initialize(): Promise<void> {
    try {
      if (!this.geminiApiKey) {
        this.logger.warn(
          "Gemini API key not found. Using SimpleVectorStore fallback.",
        );
        this.useSimpleStore = true;
        this.isInitialized = true;
        this.stats.isInitialized = true;
        return;
      }

      // Ensure storage directory exists
      const fs = await import("fs");
      if (!fs.existsSync(path.dirname(this.dbPath))) {
        fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
        this.logger.info(
          `Created LanceDB storage directory: ${path.dirname(this.dbPath)}`,
        );
      }

      // Connect to LanceDB
      this.db = await lancedb.connect(this.dbPath);

      // Try to open existing table or create new one
      try {
        this.table = await this.db.openTable(this.tableName);
        this.logger.info("Opened existing LanceDB table");
      } catch (error) {
        // Table doesn't exist, we'll create it when first documents are added
        this.logger.info(
          "LanceDB table doesn't exist yet, will create on first document",
        );
      }

      this.useSimpleStore = false; // Use LanceDB as primary
      this.isInitialized = true;
      this.stats.isInitialized = true;
      this.stats.lastSync = new Date().toISOString();

      // Get current document count if table exists
      const count = this.table ? await this.getDocumentCount() : 0;
      this.stats.documentCount = count;

      this.logger.info("LanceDB vector database initialized successfully", {
        mode: "lancedb",
        dbPath: this.dbPath,
        tableName: this.tableName,
        documentCount: count,
      });
    } catch (error) {
      this.logger.error(
        "Failed to initialize LanceDB, falling back to SimpleVectorStore:",
        error,
      );

      // Fallback to SimpleVectorStore
      this.useSimpleStore = true;
      this.isInitialized = true;
      this.stats.isInitialized = true;
      this.stats.lastSync = new Date().toISOString();

      const count = await this.simpleStore.count();
      this.stats.documentCount = count;
    }
  }

  /**
   * Get document count from LanceDB table
   */
  private async getDocumentCount(): Promise<number> {
    if (!this.table) return 0;

    try {
      const result = await this.table.countRows();
      return result;
    } catch (error) {
      this.logger.warn("Failed to get document count:", error);
      return 0;
    }
  }

  /**
   * Create LanceDB table with schema for code snippets
   */
  private async createTable(sampleData: any[]): Promise<void> {
    if (!this.db || sampleData.length === 0) return;

    try {
      this.table = await this.db.createTable(this.tableName, sampleData);
      this.logger.info("Created new LanceDB table");
    } catch (error) {
      this.logger.error("Failed to create LanceDB table:", error);
      throw error;
    }
  }

  // ChromaDB initialization removed - using SimpleVectorStore as primary implementation

  /**
   * Index code snippets using Gemini embeddings
   */
  async indexCodeSnippets(snippets: CodeSnippet[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Vector database not initialized");
    }

    if (snippets.length === 0) return;

    try {
      this.logger.info(`Indexing ${snippets.length} code snippets`);

      if (this.useSimpleStore) {
        // Fallback to SimpleVectorStore
        return await this.indexWithSimpleStore(snippets);
      }

      // Use LanceDB
      const { embeddingService } = this.assertReady();
      const documents: any[] = [];

      for (const snippet of snippets) {
        try {
          // Generate embedding using Gemini
          const embedding = await embeddingService.generateEmbedding(
            snippet.content,
          );

          documents.push({
            id: snippet.id,
            vector: embedding,
            content: snippet.content,
            filePath: snippet.filePath,
            type: snippet.type,
            name: snippet.name,
            metadata: JSON.stringify(snippet.metadata || {}),
          });
        } catch (error) {
          this.logger.error(
            `Failed to generate embedding for snippet ${snippet.id}:`,
            error,
          );
          // Continue with other snippets
        }
      }

      if (documents.length === 0) {
        this.logger.warn("No embeddings generated for snippets");
        return;
      }

      // Create table if it doesn't exist
      if (!this.table) {
        await this.createTable(documents);
      } else {
        // Add documents to existing table
        await this.table.add(documents);
      }

      // Update stats
      this.stats.documentCount = await this.getDocumentCount();
      this.stats.lastSync = new Date().toISOString();

      this.logger.info(
        `Successfully indexed ${documents.length} code snippets with LanceDB`,
        {
          totalDocuments: this.stats.documentCount,
        },
      );
    } catch (error) {
      this.logger.error("Failed to index code snippets:", error);
      throw error;
    }
  }

  /**
   * Index snippets using SimpleVectorStore fallback
   */
  private async indexWithSimpleStore(snippets: CodeSnippet[]): Promise<void> {
    if (!this.embeddingService) {
      throw new Error("Embedding service not available");
    }

    const embeddings: number[][] = [];
    const ids: string[] = [];
    const metadatas: Record<string, any>[] = [];
    const documents: string[] = [];

    for (const snippet of snippets) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(
          snippet.content,
        );

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
        this.logger.error(
          `Failed to generate embedding for snippet ${snippet.id}:`,
          error,
        );
      }
    }

    if (embeddings.length === 0) {
      this.logger.warn("No embeddings generated for snippets");
      return;
    }

    await this.simpleStore.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });

    this.stats.documentCount = await this.simpleStore.count();
    this.stats.lastSync = new Date().toISOString();

    this.logger.info(
      `Successfully indexed ${embeddings.length} code snippets with SimpleVectorStore`,
      {
        totalDocuments: this.stats.documentCount,
      },
    );
  }

  /**
   * Perform semantic search using Gemini embeddings
   */
  async semanticSearch(query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.isReady()) {
      this.logger.warn(
        "Vector database not initialized, returning empty results",
      );
      return [];
    }

    const { embeddingService } = this.assertReady();

    try {
      // Generate query embedding using Gemini
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      if (this.useSimpleStore) {
        // Use SimpleVectorStore fallback
        return await this.searchWithSimpleStore(queryEmbedding, limit, query);
      }

      // Use LanceDB
      if (!this.table) {
        this.logger.warn(
          "LanceDB table not available, returning empty results",
        );
        return [];
      }

      const results = await this.table
        .search(queryEmbedding)
        .limit(limit)
        .toArray();

      // Transform LanceDB results to SearchResult format
      const searchResults: SearchResult[] = results.map((result: any) => {
        const distance = result._distance || 0;
        const relevanceScore = Math.max(0, 1 - distance);

        return {
          content: result.content,
          metadata: {
            filePath: result.filePath,
            type: result.type,
            name: result.name,
            ...(result.metadata ? JSON.parse(result.metadata) : {}),
          },
          distance,
          relevanceScore,
        };
      });

      this.logger.debug(
        `LanceDB search returned ${searchResults.length} results for query: "${query}"`,
      );
      return searchResults;
    } catch (error) {
      this.logger.error("Semantic search failed:", error);
      return [];
    }
  }

  /**
   * Search using SimpleVectorStore fallback
   */
  private async searchWithSimpleStore(
    queryEmbedding: number[],
    limit: number,
    query: string,
  ): Promise<SearchResult[]> {
    const results = await this.simpleStore.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
    });

    const searchResults: SearchResult[] = [];

    if (results.documents && results.metadatas && results.distances) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const distance = results.distances[0][i];
        const document = results.documents[0][i];
        const metadata = results.metadatas[0][i];

        if (distance !== null && document !== null && metadata !== null) {
          const relevanceScore = Math.max(0, 1 - distance);

          searchResults.push({
            content: document,
            metadata: metadata as Record<string, any>,
            distance,
            relevanceScore,
          });
        }
      }
    }

    this.logger.debug(
      `SimpleVectorStore search returned ${searchResults.length} results for query: "${query}"`,
    );
    return searchResults;
  }

  /**
   * Delete documents by file path
   */
  async deleteByFile(filePath: string): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      if (this.useSimpleStore) {
        // Use SimpleVectorStore fallback
        const results = await this.simpleStore.get({
          where: { filePath },
        });

        if (results.ids && results.ids.length > 0) {
          await this.simpleStore.delete(results.ids);
          this.stats.documentCount = await this.simpleStore.count();
          this.logger.info(
            `Deleted ${results.ids.length} documents for file: ${filePath}`,
          );
        }
        return;
      }

      // Use LanceDB
      if (!this.table) {
        this.logger.warn("LanceDB table not available for deletion");
        return;
      }

      // Delete documents with matching filePath
      await this.table.delete(`filePath = '${filePath}'`);

      this.stats.documentCount = await this.getDocumentCount();
      this.logger.info(`Deleted documents for file: ${filePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete documents for file ${filePath}:`,
        error,
      );
    }
  }

  /**
   * Update existing document
   */
  async updateDocument(snippet: CodeSnippet): Promise<void> {
    if (!this.isReady()) {
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
    if (!this.isReady()) {
      return;
    }

    try {
      if (this.useSimpleStore) {
        // Clear SimpleVectorStore
        const results = await this.simpleStore.get({});
        if (results.ids && results.ids.length > 0) {
          await this.simpleStore.delete(results.ids);
        }
      } else if (this.table) {
        // Drop and recreate the LanceDB table
        await this.db?.dropTable(this.tableName);
        this.table = null;
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
    return this.isInitialized && !!this.embeddingService;
  }

  /**
   * Assert that the service is ready and return non-null references
   */
  private assertReady(): {
    embeddingService: EmbeddingService;
  } {
    if (!this.isReady()) {
      throw new Error(
        "Vector database not initialized or Gemini API key missing",
      );
    }
    return {
      embeddingService: this.embeddingService!,
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.isInitialized = false;
    this.table = null;
    this.db = null;
    this.logger.info("LanceDB vector database service disposed");
  }
}
