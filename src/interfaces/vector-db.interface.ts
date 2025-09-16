import * as vscode from "vscode";

/**
 * Interface for code indexing and embedding generation
 */
export interface ICodeIndexer {
  /**
   * Generate embeddings for code content
   */
  generateEmbeddings(content: string, metadata?: any): Promise<number[]>;

  /**
   * Index a single file
   */
  indexFile(filePath: string, content: string): Promise<void>;

  /**
   * Index multiple files in batch
   */
  indexFiles(files: Array<{ path: string; content: string }>): Promise<void>;

  /**
   * Remove a file from the index
   */
  removeFromIndex(filePath: string): Promise<void>;

  /**
   * Update an existing file in the index
   */
  updateFileIndex(filePath: string, content: string): Promise<void>;

  /**
   * Search for similar code based on query
   */
  searchSimilar(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Get indexing statistics
   */
  getIndexStats(): Promise<IndexStats>;

  /**
   * Check if a file is indexed
   */
  isFileIndexed(filePath: string): Promise<boolean>;

  /**
   * Clear all indexed data
   */
  clearIndex(): Promise<void>;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Search options for similarity search
 */
export interface SearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Minimum similarity threshold */
  threshold?: number;
  /** File types to include in search */
  fileTypes?: string[];
  /** Whether to include file content in results */
  includeContent?: boolean;
}

/**
 * Search result from similarity search
 */
export interface SearchResult {
  /** File path */
  filePath: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** File content (if requested) */
  content?: string;
  /** Metadata about the match */
  metadata?: {
    lineStart?: number;
    lineEnd?: number;
    functionName?: string;
    className?: string;
  };
}

/**
 * Indexing statistics
 */
export interface IndexStats {
  /** Total number of indexed files */
  totalFiles: number;
  /** Total number of code chunks indexed */
  totalChunks: number;
  /** Size of index in bytes */
  indexSize: number;
  /** Last update timestamp */
  lastUpdated: Date;
  /** Status of the index */
  status: "ready" | "indexing" | "error";
}

/**
 * Interface for vector database synchronization
 */
export interface IVectorDbSync {
  /**
   * Initialize the sync service
   */
  initialize(): Promise<void>;

  /**
   * Start monitoring for file changes
   */
  startMonitoring(): Promise<void>;

  /**
   * Stop monitoring for file changes
   */
  stopMonitoring(): void;

  /**
   * Perform a full reindex of the workspace
   */
  performFullReindex(): Promise<void>;

  /**
   * Get synchronization statistics
   */
  getStats(): SyncStats;

  /**
   * Check if sync is active
   */
  isActive(): boolean;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Synchronization statistics
 */
export interface SyncStats {
  /** Number of files being monitored */
  filesMonitored: number;
  /** Number of sync operations performed */
  syncOperations: number;
  /** Number of failed operations */
  failedOperations: number;
  /** Current queue size */
  queueSize: number;
  /** Last sync timestamp */
  lastSync?: string;
  /** Sync status */
  status: "idle" | "syncing" | "error";
}

/**
 * Interface for smart context extraction
 */
export interface ISmartContextExtractor {
  /**
   * Extract relevant context using vector search
   */
  extractRelevantContextWithVector(query: string, currentFilePath?: string): Promise<SmartContextResult>;

  /**
   * Extract context using traditional methods as fallback
   */
  extractTraditionalContext(query: string, currentFilePath?: string): Promise<SmartContextResult>;

  /**
   * Configure extraction options
   */
  configure(options: ContextExtractionOptions): void;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Options for context extraction
 */
export interface ContextExtractionOptions {
  /** Maximum number of files to include */
  maxFiles?: number;
  /** Maximum tokens per context */
  maxTokens?: number;
  /** Whether to include file content */
  includeContent?: boolean;
  /** Search method preference */
  searchMethod?: "vector" | "keyword" | "hybrid";
}

/**
 * Result from smart context extraction
 */
export interface SmartContextResult {
  /** Extracted context content */
  content: string;
  /** Source files used */
  sources: Array<{
    filePath: string;
    relevanceScore: number;
    clickableReference: string;
  }>;
  /** Total tokens in the result */
  totalTokens: number;
  /** Search method used */
  searchMethod: "vector" | "keyword" | "hybrid" | "fallback";
  /** Performance metrics */
  metrics?: {
    searchTime: number;
    processingTime: number;
    filesScanned: number;
  };
}

/**
 * Interface for embedding orchestration
 */
export interface IEmbeddingOrchestrator {
  /**
   * Initialize the orchestrator
   */
  initialize(): Promise<void>;

  /**
   * Start orchestration process
   */
  start(): Promise<void>;

  /**
   * Stop orchestration process
   */
  stop(): Promise<void>;

  /**
   * Get orchestration status
   */
  getStatus(): OrchestrationStatus;

  /**
   * Force immediate embedding of high-priority files
   */
  forceImmediateEmbedding(filePaths: string[]): Promise<void>;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Orchestration status
 */
export interface OrchestrationStatus {
  /** Current phase */
  currentPhase: "idle" | "immediate" | "background" | "on-demand";
  /** Files in queue */
  queueSize: number;
  /** Processing status */
  isProcessing: boolean;
  /** Last activity timestamp */
  lastActivity?: Date;
  /** Performance metrics */
  metrics: {
    filesProcessed: number;
    averageProcessingTime: number;
    errorCount: number;
  };
}
