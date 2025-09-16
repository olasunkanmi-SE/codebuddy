import * as vscode from "vscode";

/**
 * Interface for Vector Database Service operations
 */
export interface IVectorDatabaseService {
  /**
   * Initialize the vector database
   */
  initialize(): Promise<void>;

  /**
   * Store embeddings for a code chunk
   */
  storeEmbedding(
    id: string,
    embedding: number[],
    metadata: {
      filePath: string;
      content: string;
      language: string;
      chunkIndex?: number;
    }
  ): Promise<void>;

  /**
   * Search for similar code using vector similarity
   */
  searchSimilar(
    queryEmbedding: number[],
    options?: {
      limit?: number;
      threshold?: number;
      filters?: Record<string, any>;
    }
  ): Promise<SearchResult[]>;

  /**
   * Delete embeddings for a file
   */
  deleteEmbeddings(filePath: string): Promise<void>;

  /**
   * Get collection statistics
   */
  getStats(): Promise<DatabaseStats>;

  /**
   * Health check for the database
   */
  isHealthy(): Promise<boolean>;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Search result from vector database
 */
export interface SearchResult {
  id: string;
  score: number;
  metadata: {
    filePath: string;
    content: string;
    language: string;
    chunkIndex?: number;
  };
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  totalDocuments: number;
  totalEmbeddings: number;
  collectionSize: number;
  lastUpdated: Date;
}

/**
 * Interface for Vector Database Worker Manager
 */
export interface IVectorDbWorkerManager {
  /**
   * Initialize the worker manager
   */
  initialize(): Promise<void>;

  /**
   * Process a file for embedding generation
   */
  processFile(filePath: string, content: string): Promise<ProcessResult>;

  /**
   * Get worker status and statistics
   */
  getStatus(): WorkerStatus;

  /**
   * Queue a file for processing
   */
  queueFile(filePath: string, priority?: "high" | "normal" | "low"): Promise<void>;

  /**
   * Cancel processing for a specific file
   */
  cancelFile(filePath: string): Promise<void>;

  /**
   * Dispose of all workers and resources
   */
  dispose(): void;
}

/**
 * Result from file processing
 */
export interface ProcessResult {
  filePath: string;
  success: boolean;
  embeddings?: number[][];
  chunks?: string[];
  error?: string;
  processingTime: number;
}

/**
 * Worker manager status
 */
export interface WorkerStatus {
  activeWorkers: number;
  queueSize: number;
  processedFiles: number;
  failedFiles: number;
  isProcessing: boolean;
  averageProcessingTime: number;
}

/**
 * Interface for Smart Context Extraction Service
 */
export interface ISmartContextExtractor {
  /**
   * Extract relevant context using vector search
   */
  extractRelevantContextWithVector(query: string, currentFilePath?: string): Promise<ContextResult>;

  /**
   * Extract traditional context as fallback
   */
  extractTraditionalContext(query: string, currentFilePath?: string): Promise<ContextResult>;

  /**
   * Configure extraction parameters
   */
  configure(options: ContextExtractionOptions): void;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Context extraction result
 */
export interface ContextResult {
  content: string;
  sources: Array<{
    filePath: string;
    relevanceScore: number;
    clickableReference: string;
  }>;
  totalTokens: number;
  searchMethod: "vector" | "keyword" | "hybrid" | "fallback";
  metrics?: {
    searchTime: number;
    processingTime: number;
    filesScanned: number;
  };
}

/**
 * Context extraction options
 */
export interface ContextExtractionOptions {
  maxFiles?: number;
  maxTokens?: number;
  includeContent?: boolean;
  searchMethod?: "vector" | "keyword" | "hybrid";
  enableFallback?: boolean;
}

/**
 * Interface for User Feedback Service
 */
export interface IUserFeedbackService {
  /**
   * Update status bar with information
   */
  updateStatus(status: { text: string; tooltip: string }): void;

  /**
   * Show success message
   */
  showSuccess(message: string, actions?: string[]): Thenable<string | undefined>;

  /**
   * Show warning message
   */
  showWarning(message: string, actions?: string[]): Thenable<string | undefined>;

  /**
   * Show error message
   */
  showError(message: string, actions?: string[]): Thenable<string | undefined>;

  /**
   * Show sync status
   */
  showSyncStatus(filesQueued: number, processing?: boolean): void;

  /**
   * Show search metrics
   */
  showSearchMetrics(resultsCount: number, searchTime: number): void;

  /**
   * Check if vector database is enabled
   */
  isVectorDbEnabled(): boolean;

  /**
   * Get progress notification preference
   */
  getProgressNotificationPreference(): vscode.ProgressLocation;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Interface for Configuration Management
 */
export interface IConfigurationManager<T> {
  /**
   * Get current configuration
   */
  getConfig(): T;

  /**
   * Update a configuration value
   */
  updateConfig<K extends keyof T>(key: K, value: T[K], target?: vscode.ConfigurationTarget): Promise<void>;

  /**
   * Validate current configuration
   */
  validateConfiguration(): boolean;

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(target?: vscode.ConfigurationTarget): Promise<void>;

  /**
   * Export configuration as JSON
   */
  exportConfiguration(): string;

  /**
   * Import configuration from JSON
   */
  importConfiguration(configJson: string, target?: vscode.ConfigurationTarget): Promise<void>;

  /**
   * Listen for configuration changes
   */
  onConfigChange(listener: (config: T) => void): vscode.Disposable;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

/**
 * Dependency injection container interface
 */
export interface IDependencyContainer {
  /**
   * Register a service with the container
   */
  register<T>(token: string, factory: () => T): void;

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: string, factory: () => T): void;

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: string): T;

  /**
   * Check if a service is registered
   */
  isRegistered(token: string): boolean;

  /**
   * Dispose of all services
   */
  dispose(): void;
}
