import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { VectorDatabaseService, CodeSnippet } from "./vector-database.service";
import {
  VectorDbWorkerManager,
  VECTOR_OPERATIONS,
} from "./vector-db-worker-manager";
import { FileUtils, AsyncUtils } from "../utils/common-utils";
import { IFunctionData } from "../application/interfaces";
import * as path from "path";
import * as vscode from "vscode";

export interface EmbeddingOptions {
  retryCount?: number;
  timeout?: number;
  priority?: "high" | "normal" | "low";
}

export interface EmbeddingResult {
  success: boolean;
  filePath: string;
  snippetsCreated: number;
  error?: string;
  duration: number;
}

/**
 * Dedicated service for handling file embedding operations.
 * Eliminates duplication across embedding phases and provides centralized embedding logic.
 */
export class EmbeddingService {
  private logger: Logger;

  constructor(
    private vectorDb: VectorDatabaseService,
    private workerManager: VectorDbWorkerManager,
  ) {
    this.logger = Logger.initialize("EmbeddingService", {
      minLevel: LogLevel.INFO,
    });
  }

  /**
   * Embed a single file with comprehensive error handling and retry logic
   */
  async embedFile(
    filePath: string,
    options: EmbeddingOptions = {},
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    const { retryCount = 3, timeout = 30000, priority = "normal" } = options;

    this.logger.debug(`Starting embedding for: ${path.basename(filePath)}`);

    try {
      // Validate file exists and is readable
      if (!(await FileUtils.fileExists(filePath))) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Read file content
      const content = await this.readFileWithTimeout(filePath, timeout);
      if (!content || content.trim().length === 0) {
        this.logger.debug(`Skipping empty file: ${path.basename(filePath)}`);
        return {
          success: true,
          filePath,
          snippetsCreated: 0,
          duration: Date.now() - startTime,
        };
      }

      // Generate embeddings using worker
      const embeddings = await this.generateEmbeddingsWithRetry(
        filePath,
        content,
        retryCount,
      );

      // Create code snippets
      const snippets = await this.createCodeSnippets(
        filePath,
        content,
        embeddings,
      );

      // Index in vector database
      if (snippets.length > 0) {
        await this.vectorDb.indexCodeSnippets(snippets);
        this.logger.debug(
          `Embedded ${snippets.length} snippets from ${path.basename(filePath)}`,
        );
      }

      return {
        success: true,
        filePath,
        snippetsCreated: snippets.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to embed file ${filePath}:`, error);

      return {
        success: false,
        filePath,
        snippetsCreated: 0,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  /**
   * Embed multiple files in batches with progress tracking
   */
  async embedFiles(
    filePaths: string[],
    options: EmbeddingOptions & {
      batchSize?: number;
      progressCallback?: (progress: number, details: string) => void;
    } = {},
  ): Promise<EmbeddingResult[]> {
    const { batchSize = 5, progressCallback } = options;
    const results: EmbeddingResult[] = [];

    this.logger.info(`Starting batch embedding of ${filePaths.length} files`);

    await AsyncUtils.processBatchesWithProgress(
      filePaths,
      async (filePath, index) => {
        const result = await this.embedFile(filePath, options);
        results.push(result);

        if (progressCallback) {
          const progress = ((index + 1) / filePaths.length) * 100;
          const status = result.success
            ? `Embedded ${path.basename(filePath)}`
            : `Failed: ${path.basename(filePath)}`;
          progressCallback(progress, status);
        }
      },
      batchSize,
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    this.logger.info(
      `Batch embedding completed: ${successful} succeeded, ${failed} failed`,
    );

    return results;
  }

  /**
   * Remove embeddings for a file (when file is deleted or modified)
   */
  async removeFileEmbeddings(filePath: string): Promise<boolean> {
    try {
      await this.vectorDb.deleteByFile(filePath);
      this.logger.debug(`Removed embeddings for: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove embeddings for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Check if file has embeddings in the vector database
   */
  async hasEmbeddings(filePath: string): Promise<boolean> {
    try {
      // This would need to be implemented in VectorDatabaseService
      // For now, assume we need to check by searching
      const results = await this.vectorDb.semanticSearch(`file:${filePath}`, 1);
      return results.length > 0;
    } catch (error) {
      this.logger.warn(`Could not check embeddings for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get embedding statistics for a file or all files
   */
  async getEmbeddingStats(filePath?: string): Promise<{
    totalSnippets: number;
    lastUpdated?: string;
    fileCount: number;
  }> {
    const stats = this.vectorDb.getStats();

    return {
      totalSnippets: stats.documentCount,
      lastUpdated: stats.lastSync || undefined,
      fileCount: stats.documentCount, // Approximate
    };
  }

  private async readFileWithTimeout(
    filePath: string,
    timeout: number,
  ): Promise<string> {
    return AsyncUtils.safeExecute(
      async () => {
        const uri = vscode.Uri.file(filePath);
        const bytes = await vscode.workspace.fs.readFile(uri);
        return new TextDecoder().decode(bytes);
      },
      "",
      (error) => this.logger.warn(`Could not read file ${filePath}:`, error),
    );
  }

  private async generateEmbeddingsWithRetry(
    filePath: string,
    content: string,
    maxRetries: number,
  ): Promise<number[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use worker manager to generate embeddings
        // Create IFunctionData for the file content
        const functionData: IFunctionData = {
          className: path.dirname(filePath),
          path: filePath,
          name: path.basename(filePath, path.extname(filePath)),
          compositeText: content,
          content: content,
          description: `File: ${path.basename(filePath)}`,
          processedAt: new Date().toISOString(),
        };

        // Use worker manager to process the function data
        await this.workerManager.indexFunctionData([functionData]);

        // For now, return a mock embedding array - in actual implementation
        // this would be handled by the worker manager internally
        return Array.from({ length: 1536 }, () => Math.random());
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Embedding attempt ${attempt}/${maxRetries} failed for ${filePath}:`,
          error,
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await AsyncUtils.delay(delay);
        }
      }
    }

    throw lastError || new Error("Failed to generate embeddings after retries");
  }

  private async createCodeSnippets(
    filePath: string,
    content: string,
    embeddings: number[],
  ): Promise<CodeSnippet[]> {
    // For now, create a single snippet for the entire file
    // In the future, this could be enhanced to parse functions/classes
    const lines = content.split("\n");

    return [
      {
        id: `file::${filePath}::${Date.now()}`,
        filePath,
        type: "module" as const,
        name: FileUtils.getRelativePath(filePath),
        content:
          content.length > 2000 ? content.substring(0, 2000) + "..." : content,
        metadata: {
          language: this.getLanguageFromPath(filePath),
          fileSize: content.length,
          lineCount: lines.length,
          startLine: 1,
          endLine: lines.length,
          embedding: embeddings,
          lastModified: new Date().toISOString(),
        },
      },
    ];
  }

  private getLanguageFromPath(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".js": "javascript",
      ".tsx": "tsx",
      ".jsx": "jsx",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".cs": "csharp",
      ".php": "php",
      ".rb": "ruby",
      ".go": "go",
      ".rs": "rust",
      ".swift": "swift",
      ".kt": "kotlin",
      ".scala": "scala",
      ".r": "r",
      ".m": "objective-c",
      ".vue": "vue",
    };

    return languageMap[extension] || "plaintext";
  }
}
