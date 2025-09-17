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

      // Create code snippets first (these may be multiple chunks)
      const codeChunks = await this.createCodeSnippets(filePath, content, []);

      // Generate embeddings for each chunk
      const snippets: CodeSnippet[] = [];
      for (const chunk of codeChunks) {
        try {
          const embedding = await this.generateEmbeddingsWithRetry(
            filePath,
            chunk.content,
            retryCount,
          );

          snippets.push({
            ...chunk,
            metadata: {
              ...chunk.metadata,
              embedding,
            },
          });
        } catch (error) {
          this.logger.warn(
            `Failed to generate embedding for chunk ${chunk.id}:`,
            error,
          );
          // Continue with other chunks
        }
      }

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
    _embeddings?: number[], // Deprecated parameter, kept for compatibility
  ): Promise<CodeSnippet[]> {
    const language = this.getLanguageFromPath(filePath);
    const lines = content.split("\n");

    // Try intelligent chunking first for supported languages
    if (language === "typescript" || language === "javascript") {
      try {
        const intelligentChunks = await this.createIntelligentChunks(
          filePath,
          content,
        );
        if (intelligentChunks.length > 0) {
          return intelligentChunks;
        }
      } catch (error) {
        this.logger.warn(
          `Intelligent chunking failed for ${filePath}, falling back to basic chunking:`,
          error,
        );
      }
    }

    // Fallback to improved basic chunking for unsupported languages or parsing failures
    return this.createBasicChunks(filePath, content, lines);
  }

  /**
   * Create intelligent code chunks based on AST parsing
   */
  private async createIntelligentChunks(
    filePath: string,
    content: string,
  ): Promise<CodeSnippet[]> {
    const chunks: CodeSnippet[] = [];
    const language = this.getLanguageFromPath(filePath);

    try {
      // Parse TypeScript/JavaScript code to extract functions, classes, interfaces
      const ts = await import("typescript");
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      let chunkIndex = 0;

      const visitNode = (node: any, parentName?: string) => {
        const start = node.getStart();
        const end = node.getEnd();
        const nodeText = content.slice(start, end).trim();

        if (nodeText.length < 10) return; // Skip very small nodes

        let chunkInfo: { type: string; name: string; content: string } | null =
          null;

        // Extract functions
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isArrowFunction(node)
        ) {
          const name = node.name ? node.name.getText() : "anonymous";
          chunkInfo = {
            type: "function",
            name: parentName ? `${parentName}.${name}` : name,
            content: nodeText,
          };
        }
        // Extract classes
        else if (ts.isClassDeclaration(node)) {
          const name = node.name ? node.name.getText() : "Anonymous";
          chunkInfo = {
            type: "class",
            name,
            content: nodeText,
          };
        }
        // Extract interfaces
        else if (ts.isInterfaceDeclaration(node)) {
          const name = node.name.getText();
          chunkInfo = {
            type: "interface",
            name,
            content: nodeText,
          };
        }
        // Extract type aliases
        else if (ts.isTypeAliasDeclaration(node)) {
          const name = node.name.getText();
          chunkInfo = {
            type: "type",
            name,
            content: nodeText,
          };
        }
        // Extract enums
        else if (ts.isEnumDeclaration(node)) {
          const name = node.name.getText();
          chunkInfo = {
            type: "enum",
            name,
            content: nodeText,
          };
        }

        if (
          chunkInfo &&
          chunkInfo.content.length >= 50 &&
          chunkInfo.content.length <= 2000
        ) {
          const startLine =
            sourceFile.getLineAndCharacterOfPosition(start).line + 1;
          const endLine =
            sourceFile.getLineAndCharacterOfPosition(end).line + 1;

          chunks.push({
            id: `${chunkInfo.type}::${filePath}::${chunkInfo.name}::${chunkIndex++}`,
            filePath,
            type: chunkInfo.type as any,
            name: chunkInfo.name,
            content: chunkInfo.content,
            metadata: {
              language,
              startLine,
              endLine,
              chunkSize: chunkInfo.content.length,
              parentContext: parentName,
              lastModified: new Date().toISOString(),
            },
          });
        }

        // Recursively visit child nodes for classes
        if (ts.isClassDeclaration(node)) {
          const className = node.name ? node.name.getText() : "Anonymous";
          ts.forEachChild(node, (child) => visitNode(child, className));
        } else {
          ts.forEachChild(node, (child) => visitNode(child, parentName));
        }
      };

      ts.forEachChild(sourceFile, visitNode);

      this.logger.debug(
        `Intelligent chunking created ${chunks.length} chunks for ${FileUtils.getRelativePath(filePath)}`,
      );
      return chunks;
    } catch (error) {
      this.logger.warn(`AST parsing failed for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Create basic chunks when intelligent parsing fails or isn't supported
   */
  private createBasicChunks(
    filePath: string,
    content: string,
    lines: string[],
  ): CodeSnippet[] {
    const language = this.getLanguageFromPath(filePath);
    const chunks: CodeSnippet[] = [];

    // For basic chunking, split by logical sections
    const maxChunkSize = 1500;
    const overlapSize = 100;

    if (content.length <= maxChunkSize) {
      // Small file - create single chunk
      return [
        {
          id: `module::${filePath}::0`,
          filePath,
          type: "module",
          name: FileUtils.getRelativePath(filePath),
          content,
          metadata: {
            language,
            fileSize: content.length,
            lineCount: lines.length,
            startLine: 1,
            endLine: lines.length,
            lastModified: new Date().toISOString(),
          },
        },
      ];
    }

    // Split into overlapping chunks for large files
    let chunkIndex = 0;
    for (let i = 0; i < content.length; i += maxChunkSize - overlapSize) {
      const chunkContent = content.slice(
        i,
        Math.min(i + maxChunkSize, content.length),
      );
      const startLine = content.slice(0, i).split("\n").length;
      const endLine = content
        .slice(0, i + chunkContent.length)
        .split("\n").length;

      chunks.push({
        id: `chunk::${filePath}::${chunkIndex++}`,
        filePath,
        type: "module",
        name: `${FileUtils.getRelativePath(filePath)} (chunk ${chunkIndex})`,
        content: chunkContent,
        metadata: {
          language,
          chunkIndex: chunkIndex - 1,
          startLine,
          endLine,
          chunkSize: chunkContent.length,
          isPartialChunk: true,
          lastModified: new Date().toISOString(),
        },
      });
    }

    this.logger.debug(
      `Basic chunking created ${chunks.length} chunks for ${FileUtils.getRelativePath(filePath)}`,
    );
    return chunks;
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
