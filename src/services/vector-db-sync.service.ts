import * as vscode from "vscode";
import * as path from "path";
import { VectorDatabaseService, CodeSnippet } from "./vector-database.service";
import { CodeIndexingService } from "./code-indexing";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import {
  VECTOR_OPERATIONS,
  VectorOperationType,
} from "./vector-db-worker-manager";
import { IFunctionData } from "../application/interfaces";
import {
  LanguageUtils,
  FileUtils,
  AsyncUtils,
  DisposableUtils,
} from "../utils/common-utils";

// Interface for code indexing to support dependency injection
export interface ICodeIndexer {
  generateEmbeddings(): Promise<IFunctionData[]>;
}

// Adapter to make CodeIndexingService compatible with ICodeIndexer interface
export class CodeIndexingAdapter implements ICodeIndexer {
  constructor(private codeIndexingService: CodeIndexingService) {}

  async generateEmbeddings(): Promise<IFunctionData[]> {
    return await this.codeIndexingService.generateEmbeddings();
  }
}

export interface SyncOperation {
  type: "created" | "modified" | "deleted";
  filePath: string;
  timestamp: number;
}

export interface VectorDbSyncStats {
  filesMonitored: number;
  syncOperations: number;
  lastSync: string | null;
  failedOperations: number;
  queueSize: number;
}

/**
 * VectorDbSyncService handles file monitoring and real-time synchronization
 * with the vector database. It uses debounced batch processing for efficiency.
 */
export class VectorDbSyncService implements vscode.Disposable {
  private vectorDb: VectorDatabaseService;
  private codeIndexer: ICodeIndexer;
  private logger: Logger;

  private syncQueue = new Set<string>();
  private syncTimer: NodeJS.Timeout | null = null;
  private readonly SYNC_DELAY = 1000; // 1 second debounce
  private readonly BATCH_SIZE = 10;

  private fileWatchers: vscode.FileSystemWatcher[] = [];
  private disposables: vscode.Disposable[] = [];
  private isInitialized = false;

  private stats: VectorDbSyncStats = {
    filesMonitored: 0,
    syncOperations: 0,
    lastSync: null,
    failedOperations: 0,
    queueSize: 0,
  };

  constructor(vectorDb: VectorDatabaseService, codeIndexer: ICodeIndexer) {
    this.vectorDb = vectorDb;
    this.codeIndexer = codeIndexer;
    this.logger = Logger.initialize("VectorDbSyncService", {
      minLevel: LogLevel.INFO,
    });
  }

  /**
   * Initialize the sync service and set up file monitoring
   */
  async initialize(): Promise<void> {
    try {
      if (!this.vectorDb.isReady()) {
        throw new Error(
          "VectorDatabaseService must be initialized before sync service",
        );
      }

      await this.setupFileWatchers();
      await this.performInitialSync();

      this.isInitialized = true;
      this.logger.info("VectorDbSyncService initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize VectorDbSyncService:", error);
      throw error;
    }
  }

  /**
   * Set up file system watchers for different file types
   */
  private async setupFileWatchers(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      this.logger.warn("No workspace folders found");
      return;
    }

    // File patterns to monitor
    const patterns = [
      "**/*.ts",
      "**/*.js",
      "**/*.tsx",
      "**/*.jsx",
      "**/*.py",
      "**/*.java",
      "**/*.cpp",
      "**/*.c",
      "**/*.cs",
    ];

    for (const folder of workspaceFolders) {
      for (const pattern of patterns) {
        const watcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(folder, pattern),
        );

        // File created
        watcher.onDidCreate((uri) => {
          this.queueSyncOperation("created", uri.fsPath);
        });

        // File modified
        watcher.onDidChange((uri) => {
          this.queueSyncOperation("modified", uri.fsPath);
        });

        // File deleted
        watcher.onDidDelete((uri) => {
          this.queueSyncOperation("deleted", uri.fsPath);
        });

        this.fileWatchers.push(watcher);
        this.disposables.push(watcher);
      }
    }

    this.stats.filesMonitored = this.fileWatchers.length;
    this.logger.info(`Set up ${this.fileWatchers.length} file watchers`);
  }

  /**
   * Queue a sync operation with debouncing
   */
  private queueSyncOperation(
    type: "created" | "modified" | "deleted",
    filePath: string,
  ): void {
    // Filter out unwanted files
    if (this.shouldIgnoreFile(filePath)) {
      return;
    }

    const operation = `${type}:${filePath}`;
    this.syncQueue.add(operation);
    this.stats.queueSize = this.syncQueue.size;

    this.logger.debug(
      `Queued ${type} operation for: ${path.basename(filePath)}`,
    );

    // Reset debounce timer
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.processSyncQueue();
    }, this.SYNC_DELAY);
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(filePath: string): boolean {
    const ignoredPatterns = [
      "node_modules",
      ".git",
      "dist",
      "build",
      "out",
      ".vscode-test",
      "coverage",
    ];

    const ignoredExtensions = [".map", ".d.ts", ".min.js", ".bundle.js"];

    // Check ignored directories
    for (const pattern of ignoredPatterns) {
      if (filePath.includes(pattern)) {
        return true;
      }
    }

    // Check ignored file extensions
    for (const ext of ignoredExtensions) {
      if (filePath.endsWith(ext)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Process the sync queue in batches
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.size === 0) return;

    const operations = Array.from(this.syncQueue);
    this.syncQueue.clear();
    this.stats.queueSize = 0;

    const created: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    // Categorize operations
    for (const op of operations) {
      const [operation, filePath] = op.split(":");
      switch (operation) {
        case "created":
          created.push(filePath);
          break;
        case "modified":
          modified.push(filePath);
          break;
        case "deleted":
          deleted.push(filePath);
          break;
      }
    }

    try {
      // Process deletions first
      if (deleted.length > 0) {
        await this.handleDeletedFiles(deleted);
      }

      // Process modifications and creations
      const filesToProcess = [...created, ...modified];
      if (filesToProcess.length > 0) {
        await this.handleModifiedFiles(filesToProcess);
      }

      this.stats.syncOperations += operations.length;
      this.stats.lastSync = new Date().toISOString();

      this.logger.info(`Processed ${operations.length} file operations`, {
        created: created.length,
        modified: modified.length,
        deleted: deleted.length,
      });
    } catch (error) {
      this.stats.failedOperations += operations.length;
      this.logger.error("Error processing sync queue:", error);
    }
  }

  /**
   * Handle deleted files by removing them from vector database with batch processing and error recovery
   */
  private async handleDeletedFiles(deletedFiles: string[]): Promise<void> {
    if (deletedFiles.length === 0) return;

    this.logger.info(`Processing ${deletedFiles.length} deleted files`);

    const batchSize = 10; // Process deletions in batches
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < deletedFiles.length; i += batchSize) {
      const batch = deletedFiles.slice(i, i + batchSize);

      // Process batch in parallel for better performance
      const results = await Promise.allSettled(
        batch.map(async (filePath) => {
          try {
            // Attempt to delete with retry logic
            await this.deleteFileEmbeddingsWithRetry(filePath, 2);
            successCount++;
            this.logger.debug(
              `Removed embeddings for deleted file: ${path.basename(filePath)}`,
            );
            return { success: true, filePath };
          } catch (error) {
            failureCount++;
            this.logger.error(
              `Failed to remove embeddings for ${filePath}:`,
              error,
            );
            this.stats.failedOperations++;
            return { success: false, filePath, error };
          }
        }),
      );

      // Log batch results
      const batchSuccess = results.filter(
        (r) => r.status === "fulfilled" && (r.value as any).success,
      ).length;
      const batchFailures = results.filter(
        (r) => r.status === "rejected" || !(r.value as any).success,
      ).length;

      this.logger.debug(
        `Batch ${Math.floor(i / batchSize) + 1}: ${batchSuccess} successful, ${batchFailures} failed`,
      );

      // Small delay between batches to prevent overwhelming the vector DB
      if (i + batchSize < deletedFiles.length) {
        await AsyncUtils.delay(200);
      }
    }

    this.logger.info(
      `File deletion processing complete: ${successCount} successful, ${failureCount} failed`,
    );

    // Update stats
    this.stats.syncOperations += successCount;
  }

  /**
   * Delete file embeddings with retry logic
   */
  private async deleteFileEmbeddingsWithRetry(
    filePath: string,
    maxRetries: number = 2,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.vectorDb.deleteByFile(filePath);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Deletion attempt ${attempt}/${maxRetries} failed for ${filePath}:`,
          error,
        );

        if (attempt < maxRetries) {
          // Short delay before retry for deletion operations
          await AsyncUtils.delay(500 * attempt);
        }
      }
    }

    throw (
      lastError ||
      new Error(
        `Failed to delete embeddings for ${filePath} after ${maxRetries} attempts`,
      )
    );
  }

  /**
   * Handle modified/created files by reindexing them
   */
  private async handleModifiedFiles(modifiedFiles: string[]): Promise<void> {
    // Process files in batches to avoid overwhelming the system
    for (let i = 0; i < modifiedFiles.length; i += this.BATCH_SIZE) {
      const batch = modifiedFiles.slice(i, i + this.BATCH_SIZE);

      await Promise.all(
        batch.map(async (filePath) => {
          try {
            await this.reindexSingleFile(filePath);
          } catch (error) {
            this.logger.error(`Reindexing failed for ${filePath}:`, error);
            this.stats.failedOperations++;
          }
        }),
      );

      // Small delay between batches
      if (i + this.BATCH_SIZE < modifiedFiles.length) {
        await AsyncUtils.delay(100);
      }
    }
  }

  /**
   * Reindex a single file with retry logic and circuit breaker pattern
   */
  async reindexSingleFile(
    filePath: string,
    retryCount: number = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Remove existing embeddings
        await this.vectorDb.deleteByFile(filePath);

        // Extract new code snippets
        const snippets = await this.extractSnippetsFromFile(filePath);

        if (snippets.length > 0) {
          await this.vectorDb.indexCodeSnippets(snippets);
          this.logger.debug(
            `Reindexed ${snippets.length} snippets from ${path.basename(filePath)} (attempt ${attempt})`,
          );
        }

        // Success - break the retry loop
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Reindexing failed for ${filePath} (attempt ${attempt}/${retryCount}):`,
          error,
        );

        if (attempt < retryCount) {
          // Exponential backoff with jitter
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;

          this.logger.debug(`Retrying ${filePath} in ${Math.round(delay)}ms`);
          await AsyncUtils.delay(delay);
        }
      }
    }

    // All retries failed
    this.logger.error(
      `Reindexing failed after ${retryCount} attempts for ${filePath}:`,
      lastError,
    );
    this.stats.failedOperations++;

    // Don't throw the error to prevent batch failure, but mark as failed
    // In a production system, you might want to add this to a dead letter queue
  }

  /**
   * Extract code snippets from a file using a more efficient approach
   */
  private async extractSnippetsFromFile(
    filePath: string,
  ): Promise<CodeSnippet[]> {
    try {
      // For now, create a simple file-based snippet
      // In the future, this could be enhanced with more sophisticated parsing
      const content = await AsyncUtils.safeExecute(
        async () => {
          const uri = vscode.Uri.file(filePath);
          const bytes = await vscode.workspace.fs.readFile(uri);
          return new TextDecoder().decode(bytes);
        },
        "",
        (error) => this.logger.warn(`Could not read file ${filePath}:`, error),
      );

      if (!content) {
        return [];
      }

      // Create a single snippet for the entire file
      // This is a simplified approach - in practice, you might want to parse functions/classes
      return [
        {
          id: `file::${filePath}`,
          filePath,
          type: "module" as const,
          name: FileUtils.getRelativePath(filePath),
          content: content.substring(0, 2000), // Limit content size
          metadata: {
            language: LanguageUtils.getLanguageFromPath(filePath),
            fileSize: content.length,
            startLine: 1,
            endLine: content.split("\n").length,
          },
        },
      ];
    } catch (error) {
      this.logger.error(`Error extracting snippets from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Perform initial sync when service starts
   */
  private async performInitialSync(): Promise<void> {
    try {
      this.logger.info("Starting initial sync...");

      // Get all existing embeddings
      const stats = this.vectorDb.getStats();

      if (stats.documentCount === 0) {
        this.logger.info("No existing embeddings found, skipping initial sync");
        return;
      }

      // Check if any files have been modified since last sync
      const workspaceFiles = await this.getAllWorkspaceFiles();
      const modifiedFiles: string[] = [];

      for (const filePath of workspaceFiles) {
        if (await this.hasFileChanged(filePath)) {
          modifiedFiles.push(filePath);
        }
      }

      if (modifiedFiles.length > 0) {
        this.logger.info(
          `Found ${modifiedFiles.length} modified files, syncing...`,
        );
        await this.handleModifiedFiles(modifiedFiles);
      }

      this.logger.info("Initial sync completed");
    } catch (error) {
      this.logger.error("Error during initial sync:", error);
    }
  }

  /**
   * Get all workspace files that should be indexed
   */
  private async getAllWorkspaceFiles(): Promise<string[]> {
    const files: string[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) return files;

    for (const folder of workspaceFolders) {
      const pattern = "**/*.{ts,js,tsx,jsx,py,java,cpp,c,cs}";
      const foundFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, pattern),
        "**/node_modules/**",
      );

      files.push(...foundFiles.map((uri) => uri.fsPath));
    }

    return files.filter((file) => !this.shouldIgnoreFile(file));
  }

  /**
   * Check if file has changed since last sync
   */
  private async hasFileChanged(filePath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      const lastModified = new Date(stat.mtime);

      // Compare with last sync time
      if (this.stats.lastSync) {
        const lastSyncTime = new Date(this.stats.lastSync);
        return lastModified > lastSyncTime;
      }

      return true; // No previous sync, consider as changed
    } catch (error) {
      return false; // File might not exist
    }
  }

  /**
   * Get sync service statistics
   */
  getStats(): VectorDbSyncStats {
    return { ...this.stats };
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.vectorDb.isReady();
  }

  /**
   * Force sync of all workspace files
   */
  async performFullReindex(): Promise<void> {
    try {
      const files = await this.getAllWorkspaceFiles();
      this.logger.info(`Starting full reindex of ${files.length} files...`);

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Reindexing workspace files",
          cancellable: false,
        },
        async (progress) => {
          for (let i = 0; i < files.length; i += this.BATCH_SIZE) {
            const batch = files.slice(i, i + this.BATCH_SIZE);

            await this.handleModifiedFiles(batch);

            progress.report({
              increment: (batch.length / files.length) * 100,
              message: `Processed ${i + batch.length}/${files.length} files`,
            });
          }
        },
      );

      this.logger.info("Full reindex completed");
    } catch (error) {
      this.logger.error("Error during full reindex:", error);
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clear sync timer
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    // Dispose of all watchers and disposables
    DisposableUtils.safeDispose(this.disposables);
    this.fileWatchers = [];
    this.disposables = [];

    this.isInitialized = false;
    this.logger.info("VectorDbSyncService disposed");
  }
}
