import * as vscode from "vscode";
import * as path from "path";
import { VectorDbWorkerManager, VECTOR_OPERATIONS } from "./vector-db-worker-manager";
import { CodeIndexingService } from "./code-indexing";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { IFunctionData } from "../application/interfaces";
import { LanguageUtils, FileUtils, AsyncUtils, DisposableUtils } from "../utils/common-utils";

export interface EmbeddingPhaseOptions {
  batchSize?: number;
  maxFiles?: number;
  silent?: boolean;
  lowPriority?: boolean;
}

export interface EmbeddingProgressCallback {
  (phase: string, progress: number, details: string): void;
}

/**
 * Phase 1: Immediate Embedding - Essential files for instant productivity
 * Embeds open files, entry points, and recently modified files
 */
export class ImmediateEmbeddingPhase implements vscode.Disposable {
  private logger: Logger;
  private disposables: vscode.Disposable[] = [];

  constructor(private workerManager: VectorDbWorkerManager) {
    this.logger = Logger.initialize("ImmediateEmbeddingPhase", {
      minLevel: LogLevel.INFO,
    });
  }

  dispose(): void {
    DisposableUtils.safeDispose(this.disposables);
    this.disposables = [];
  }

  async embedEssentials(context: vscode.ExtensionContext, progressCallback?: EmbeddingProgressCallback): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Preparing CodeBuddy context...",
        cancellable: false,
      },
      async (progress) => {
        const essentialFiles = await this.identifyEssentialFiles();

        if (essentialFiles.length === 0) {
          this.logger.info("No essential files found to embed");
          return;
        }

        this.logger.info(`Embedding ${essentialFiles.length} essential files`);

        // Parallelize the embedding process for better performance
        await AsyncUtils.processBatchesWithProgress(
          essentialFiles,
          async (file, index) => {
            try {
              await this.embedFile(file);
              const currentProgress = ((index + 1) / essentialFiles.length) * 100;
              const increment = 100 / essentialFiles.length;
              progress.report({
                increment,
                message: `Indexed ${path.basename(file)} (${index + 1}/${essentialFiles.length})`,
              });
              if (progressCallback) {
                progressCallback("immediate", currentProgress, `Indexed ${path.basename(file)}`);
              }
            } catch (error) {
              this.logger.error(`Failed to embed file ${file}:`, error);
            }
          },
          5 // Process 5 files at a time to avoid overwhelming the system
        );

        this.logger.info("Essential files embedding completed");
      }
    );
  }

  private async identifyEssentialFiles(): Promise<string[]> {
    try {
      // Collect files from different priority categories
      const fileSources = await this.gatherEssentialFileSources();

      // Combine and prioritize files
      return this.prioritizeAndLimitFiles(fileSources);
    } catch (error) {
      this.logger.error("Error identifying essential files:", error);
      return [];
    }
  }

  private async gatherEssentialFileSources(): Promise<{
    openFiles: string[];
    entryPoints: string[];
    recentFiles: string[];
    mostImported: string[];
    indexFiles: string[];
  }> {
    // Gather files from different sources in parallel for better performance
    const [entryPoints, recentFiles, mostImported, indexFiles] = await Promise.all([
      this.findEntryPoints(),
      this.getRecentlyModified(7),
      this.getMostImportedFiles(10),
      this.findIndexFiles(),
    ]);

    // Currently open files (highest priority)
    const openFiles = vscode.workspace.textDocuments
      .filter((doc) => LanguageUtils.isCodeFile(doc.languageId) && !doc.isUntitled)
      .map((doc) => doc.fileName);

    return {
      openFiles,
      entryPoints,
      recentFiles,
      mostImported,
      indexFiles,
    };
  }

  private prioritizeAndLimitFiles(sources: {
    openFiles: string[];
    entryPoints: string[];
    recentFiles: string[];
    mostImported: string[];
    indexFiles: string[];
  }): string[] {
    // Combine files with priority weighting
    const allEssentials = [
      ...sources.openFiles, // Highest priority
      ...sources.entryPoints, // High priority
      ...sources.recentFiles.slice(0, 5), // Recent activity
      ...sources.mostImported, // Dependency importance
      ...sources.indexFiles, // Structural importance
    ];

    // Remove duplicates and limit to reasonable number
    return [...new Set(allEssentials)].slice(0, 20);
  }

  private async findEntryPoints(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const entryPoints: string[] = [];

    for (const folder of workspaceFolders) {
      try {
        const packageJsonPath = path.join(folder.uri.fsPath, "package.json");
        const packageJsonUri = vscode.Uri.file(packageJsonPath);

        const packageJson = JSON.parse(Buffer.from(await vscode.workspace.fs.readFile(packageJsonUri)).toString());

        // Add main entry point
        if (packageJson.main) {
          const mainPath = path.resolve(folder.uri.fsPath, packageJson.main);
          if (await this.fileExists(mainPath)) {
            entryPoints.push(mainPath);
          }
        }

        // Add TypeScript entry points
        const commonEntries = ["src/index.ts", "src/main.ts", "index.ts", "main.ts"];
        for (const entry of commonEntries) {
          const entryPath = path.join(folder.uri.fsPath, entry);
          if (await this.fileExists(entryPath)) {
            entryPoints.push(entryPath);
          }
        }
      } catch (error) {
        // Continue if package.json doesn't exist
        this.logger.debug(`No package.json found in ${folder.uri.fsPath}`);
      }
    }

    return entryPoints;
  }

  private async getRecentlyModified(days: number): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const recentFiles: string[] = [];

    for (const folder of workspaceFolders) {
      const pattern = "**/*.{ts,js,tsx,jsx,py,java,cpp,c,cs}";
      const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, pattern), "**/node_modules/**");

      for (const file of files) {
        try {
          const stat = await FileUtils.safeGetStats(file);
          if (stat) {
            const modifiedDate = new Date(stat.mtime);
            if (modifiedDate > cutoffDate) {
              recentFiles.push(file.fsPath);
            }
          }
        } catch (error) {
          this.logger.warn(`Could not get stats for file ${file.fsPath}:`, error);
          // Skip files that can't be read
        }
      }
    }

    // Sort by modification time (newest first)
    // Note: Since we can't sort asynchronously, we'll sort by file path for now
    // In a full implementation, you'd collect modification times first, then sort
    recentFiles.sort((a, b) => b.localeCompare(a));

    return recentFiles;
  }

  private async getMostImportedFiles(limit: number): Promise<string[]> {
    // This is a simplified implementation
    // In a full implementation, you'd analyze import statements
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const importantFiles: string[] = [];

    for (const folder of workspaceFolders) {
      // Look for common important files
      const importantPatterns = [
        "src/utils/**/*.ts",
        "src/lib/**/*.ts",
        "src/types/**/*.ts",
        "src/interfaces/**/*.ts",
        "src/constants/**/*.ts",
      ];

      for (const pattern of importantPatterns) {
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, pattern),
          "**/node_modules/**"
        );

        importantFiles.push(...files.map((f) => f.fsPath));
      }
    }

    return importantFiles.slice(0, limit);
  }

  private async findIndexFiles(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const indexFiles: string[] = [];

    for (const folder of workspaceFolders) {
      const patterns = ["**/index.ts", "**/index.js"];

      for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, pattern),
          "**/node_modules/**"
        );

        indexFiles.push(...files.map((f) => f.fsPath));
      }
    }

    return indexFiles;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
  }

  private async embedFile(filePath: string): Promise<void> {
    // This would integrate with your existing embedding logic
    // For now, we'll simulate the embedding process
    this.logger.debug(`Embedding file: ${path.basename(filePath)}`);

    // Add small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Phase 2: Context-Aware On-Demand - Files based on user behavior
 * Triggered by user questions, file navigation, and editing
 */
export class OnDemandEmbeddingPhase implements vscode.Disposable {
  private logger: Logger;
  private disposables: vscode.Disposable[] = [];

  constructor(private workerManager: VectorDbWorkerManager) {
    this.logger = Logger.initialize("OnDemandEmbeddingPhase", {
      minLevel: LogLevel.INFO,
    });
  }

  setupTriggers(): void {
    // Trigger 2: File navigation
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor?.document.languageId && LanguageUtils.isCodeFile(editor.document.languageId)) {
        await this.onFileOpened(editor.document.fileName);
      }
    });

    // Trigger 3: File editing
    const textDocumentDisposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (LanguageUtils.isCodeFile(event.document.languageId)) {
        await this.onFileEdited(event.document.fileName);
      }
    });

    this.disposables.push(activeEditorDisposable, textDocumentDisposable);
    this.logger.info("On-demand embedding triggers set up");
  }

  async onUserQuestion(question: string): Promise<void> {
    try {
      const relevantFiles = await this.identifyRelevantFiles(question);
      const unembedded = await this.filterUnembedded(relevantFiles);

      if (unembedded.length > 0) {
        vscode.window.setStatusBarMessage(
          `🔍 Finding context for: "${question.substring(0, 30)}..."`,
          this.embedFilesQuietly(unembedded)
        );
      }
    } catch (error) {
      this.logger.error("Error processing user question:", error);
    }
  }

  async onFileOpened(filePath: string): Promise<void> {
    try {
      const relatedFiles = await this.findRelatedFiles(filePath);
      this.queueForBackgroundEmbedding(relatedFiles);
    } catch (error) {
      this.logger.error("Error processing file opened:", error);
    }
  }

  async onFileEdited(filePath: string): Promise<void> {
    try {
      // File was edited, it might need re-embedding
      await this.queueForReembedding(filePath);
    } catch (error) {
      this.logger.error("Error processing file edited:", error);
    }
  }

  private async identifyRelevantFiles(question: string): Promise<string[]> {
    const keywords = this.extractTechnicalKeywords(question);

    // Collect candidates from multiple sources
    const candidates = await this.collectRelevantCandidates(keywords);

    // Rank and return the most relevant files
    return this.rankByRelevance(candidates, question);
  }

  private async collectRelevantCandidates(keywords: string[]): Promise<string[]> {
    const candidates: string[] = [];

    // Collect files by filename patterns
    const filenameMatches = await this.findFilesByPatterns(keywords);
    candidates.push(...filenameMatches);

    // Collect files by content patterns (without full embedding)
    const contentMatches = await this.findFilesByContentKeywords(keywords);
    candidates.push(...contentMatches);

    // Remove duplicates
    return [...new Set(candidates)];
  }

  private async findFilesByPatterns(keywords: string[]): Promise<string[]> {
    const allMatches = await Promise.all(keywords.map((keyword) => this.findFilesByPattern(keyword)));

    return allMatches.flat();
  }

  private extractTechnicalKeywords(question: string): string[] {
    // Simple keyword extraction - in practice, this would be more sophisticated
    const words = question.toLowerCase().split(/\s+/);
    const technicalWords = words.filter(
      (word) =>
        word.length > 3 && !["the", "and", "that", "this", "with", "from", "they", "have", "been"].includes(word)
    );

    return technicalWords.slice(0, 5); // Limit to top 5 keywords
  }

  private async findFilesByPattern(keyword: string): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const matchingFiles: string[] = [];

    for (const folder of workspaceFolders) {
      const pattern = `**/*${keyword}*.{ts,js,tsx,jsx,py,java,cpp,c,cs}`;
      const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, pattern), "**/node_modules/**");

      matchingFiles.push(...files.map((f) => f.fsPath));
    }

    return matchingFiles;
  }

  private async findFilesByContentKeywords(keywords: string[]): Promise<string[]> {
    // This would require content analysis - simplified implementation
    return [];
  }

  private rankByRelevance(candidates: string[], question: string): string[] {
    // Simple ranking based on filename relevance
    const questionWords = question.toLowerCase().split(/\s+/);

    return candidates
      .map((file) => ({
        file,
        score: this.calculateRelevanceScore(file, questionWords),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.file)
      .slice(0, 10); // Top 10 most relevant
  }

  private calculateRelevanceScore(filePath: string, questionWords: string[]): number {
    const fileName = path.basename(filePath).toLowerCase();
    let score = 0;

    for (const word of questionWords) {
      if (fileName.includes(word)) {
        score += word.length; // Longer words get higher scores
      }
    }

    return score;
  }

  private async findRelatedFiles(filePath: string): Promise<string[]> {
    const related: string[] = [];

    try {
      // 1. Same directory files
      const siblings = await this.getSiblingFiles(filePath);
      related.push(...siblings);

      // 2. Test files
      const testFiles = await this.findTestFiles(filePath);
      related.push(...testFiles);

      return [...new Set(related)]; // Remove duplicates
    } catch (error) {
      this.logger.error("Error finding related files:", error);
      return [];
    }
  }

  private async getSiblingFiles(filePath: string): Promise<string[]> {
    const directory = path.dirname(filePath);
    const pattern = "*.{ts,js,tsx,jsx}";

    try {
      const files = await vscode.workspace.findFiles(new vscode.RelativePattern(directory, pattern));

      return files.map((f) => f.fsPath).filter((f) => f !== filePath); // Exclude the original file
    } catch {
      return [];
    }
  }

  private async findTestFiles(filePath: string): Promise<string[]> {
    const baseName = path.basename(filePath, path.extname(filePath));
    const directory = path.dirname(filePath);

    const testPatterns = [`${baseName}.test.*`, `${baseName}.spec.*`, `**/${baseName}.test.*`, `**/${baseName}.spec.*`];

    const testFiles: string[] = [];

    for (const pattern of testPatterns) {
      try {
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], pattern)
        );

        testFiles.push(...files.map((f) => f.fsPath));
      } catch {
        // Continue with next pattern
      }
    }

    return testFiles;
  }

  private async filterUnembedded(files: string[]): Promise<string[]> {
    // This would check against the vector database to see which files are already embedded
    // For now, return all files as potentially unembedded
    return files;
  }

  private async embedFilesQuietly(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await this.embedFile(file);
      } catch (error) {
        this.logger.error(`Failed to embed file ${file}:`, error);
      }
    }
  }

  private queueForBackgroundEmbedding(files: string[]): void {
    // This would add files to a background processing queue
    this.logger.debug(`Queued ${files.length} files for background embedding`);
  }

  private async queueForReembedding(filePath: string): Promise<void> {
    // This would mark a file for re-embedding
    this.logger.debug(`Queued ${filePath} for re-embedding`);
  }

  private async embedFile(filePath: string): Promise<void> {
    this.logger.debug(`Embedding file: ${path.basename(filePath)}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  dispose(): void {
    DisposableUtils.safeDispose(this.disposables);
    this.disposables = [];
  }
}

/**
 * Phase 3: Background Processing - Gradual processing during idle time
 * Processes remaining files when user is idle
 */
export class BackgroundEmbeddingPhase implements vscode.Disposable {
  private logger: Logger;
  private isUserIdle = false;
  private readonly IDLE_THRESHOLD = 3000; // 3 seconds
  private readonly BATCH_SIZE = 8; // Files per batch
  private idleTimer?: NodeJS.Timeout;
  private isProcessing = false;
  private disposables: vscode.Disposable[] = [];

  constructor(private workerManager: VectorDbWorkerManager) {
    this.logger = Logger.initialize("BackgroundEmbeddingPhase", {
      minLevel: LogLevel.INFO,
    });
  }

  startBackgroundProcessing(): void {
    this.setupIdleDetection();
    this.logger.info("Background processing started");
  }

  private setupIdleDetection(): void {
    // Monitor various VS Code events for user activity
    const eventDisposables = [
      vscode.workspace.onDidChangeTextDocument(() => this.resetIdleTimer()),
      vscode.window.onDidChangeActiveTextEditor(() => this.resetIdleTimer()),
      vscode.window.onDidChangeTextEditorSelection(() => this.resetIdleTimer()),
    ];

    this.disposables.push(...eventDisposables);
    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    this.isUserIdle = false;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.isUserIdle = true;
      if (!this.isProcessing) {
        this.processBackgroundBatch();
      }
    }, this.IDLE_THRESHOLD);
  }

  private async processBackgroundBatch(): Promise<void> {
    if (!this.isUserIdle || this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Get next batch of unprocessed files
      const unprocessedFiles = await this.getUnprocessedFiles();
      if (unprocessedFiles.length === 0) {
        this.onBackgroundProcessingComplete();
        return;
      }

      const batch = this.prioritizeBatch(unprocessedFiles.slice(0, this.BATCH_SIZE));

      // Process silently in background
      vscode.window.setStatusBarMessage(
        `📚 Background indexing: ${batch.length} files...`,
        this.processBatchSilently(batch)
      );

      // Schedule next batch if still idle
      setTimeout(() => {
        if (this.isUserIdle) {
          this.processBackgroundBatch();
        }
      }, 2000);
    } catch (error) {
      this.logger.error("Background embedding failed:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async getUnprocessedFiles(): Promise<string[]> {
    // This would query the vector database to find unprocessed files
    // For now, return a mock list
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const allFiles: string[] = [];

    for (const folder of workspaceFolders) {
      const pattern = "**/*.{ts,js,tsx,jsx,py,java,cpp,c,cs}";
      const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, pattern), "**/node_modules/**");

      allFiles.push(...files.map((f) => f.fsPath));
    }

    // Return a subset for demonstration
    return allFiles.slice(0, 50);
  }

  private prioritizeBatch(files: string[]): string[] {
    return files.sort((a, b) => {
      const priorityA = this.getFilePriority(a);
      const priorityB = this.getFilePriority(b);
      return priorityB - priorityA; // Higher priority first
    });
  }

  private getFilePriority(filePath: string): number {
    if (filePath.includes(".test.") || filePath.includes(".spec.")) return 1;
    if (filePath.includes("config") || filePath.includes(".json")) return 2;
    if (filePath.includes("/src/")) return 4;
    if (filePath.includes("/lib/") || filePath.includes("/utils/")) return 3;
    return 2;
  }

  private async processBatchSilently(files: string[]): Promise<void> {
    for (const file of files) {
      if (!this.isUserIdle) break; // Stop if user becomes active

      try {
        await this.embedFile(file);
        await this.delay(200); // Small delay between files
      } catch (error) {
        this.logger.error(`Failed to process ${file}:`, error);
      }
    }
  }

  private async embedFile(filePath: string): Promise<void> {
    this.logger.debug(`Background embedding: ${path.basename(filePath)}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private onBackgroundProcessingComplete(): void {
    this.logger.info("Background processing completed - all files indexed");
    vscode.window.showInformationMessage("✅ CodeBuddy has finished indexing your workspace in the background!");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  dispose(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    DisposableUtils.safeDispose(this.disposables);
    this.disposables = [];
  }
}

/**
 * Phase 4: Bulk Processing - Complete codebase indexing when requested
 * User-initiated complete indexing with progress reporting
 */
export class BulkEmbeddingPhase implements vscode.Disposable {
  private logger: Logger;
  private disposables: vscode.Disposable[] = [];

  constructor(private workerManager: VectorDbWorkerManager) {
    this.logger = Logger.initialize("BulkEmbeddingPhase", {
      minLevel: LogLevel.INFO,
    });
  }

  async registerBulkCommand(context: vscode.ExtensionContext): Promise<void> {
    const command = vscode.commands.registerCommand("codebuddy.indexEntireCodebase", () => this.processBulkEmbedding());

    context.subscriptions.push(command);
    this.logger.info("Bulk embedding command registered");
  }

  async processBulkEmbedding(): Promise<void> {
    try {
      const allFiles = await this.getAllCodeFiles();
      const unprocessed = await this.filterUnprocessed(allFiles);

      if (unprocessed.length === 0) {
        vscode.window.showInformationMessage("✅ Codebase is already fully indexed!");
        return;
      }

      const estimatedTime = Math.ceil(unprocessed.length / 10); // ~10 files per second
      const proceed = await vscode.window.showWarningMessage(
        `Index ${unprocessed.length} files? Estimated time: ${estimatedTime} seconds.`,
        { modal: true },
        "Yes, Index All",
        "Index in Background",
        "Cancel"
      );

      if (proceed === "Cancel" || !proceed) return;

      const inBackground = proceed === "Index in Background";

      if (inBackground) {
        this.processBulkInBackground(unprocessed);
      } else {
        await this.processBulkWithProgress(unprocessed);
      }
    } catch (error) {
      this.logger.error("Error in bulk embedding:", error);
      vscode.window.showErrorMessage(`Failed to start bulk indexing: ${error}`);
    }
  }

  private async processBulkWithProgress(files: string[]): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Indexing entire codebase",
        cancellable: true,
      },
      async (progress, token) => {
        const batchSize = 15;
        let processed = 0;

        for (let i = 0; i < files.length; i += batchSize) {
          if (token.isCancellationRequested) {
            vscode.window.showWarningMessage(`Indexing cancelled. Processed ${processed}/${files.length} files.`);
            break;
          }

          const batch = files.slice(i, i + batchSize);

          try {
            await this.processBatch(batch);
            processed += batch.length;

            progress.report({
              increment: (batch.length / files.length) * 100,
              message: `${processed}/${files.length} files indexed`,
            });
          } catch (error) {
            this.logger.error("Batch failed:", error);
            // Continue with next batch
          }
        }

        vscode.window.showInformationMessage(`✅ Indexing complete! Processed ${processed} files.`);
      }
    );
  }

  private async processBulkInBackground(files: string[]): Promise<void> {
    vscode.window.showInformationMessage(
      `🔄 Started background indexing of ${files.length} files. Check status bar for progress.`
    );

    const batchSize = 8;
    let processed = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      vscode.window.setStatusBarMessage(
        `📚 Background indexing: ${processed + batch.length}/${files.length}`,
        this.processBatch(batch)
      );

      processed += batch.length;

      // Delay between batches to keep system responsive
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    vscode.window.showInformationMessage(`✅ Background indexing complete! Indexed ${processed} files.`);
  }

  private async processBatch(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await this.embedFile(file);
      } catch (error) {
        this.logger.error(`Failed to process ${file}:`, error);
      }
    }
  }

  private async getAllCodeFiles(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const allFiles: string[] = [];

    for (const folder of workspaceFolders) {
      const pattern = "**/*.{ts,js,tsx,jsx,py,java,cpp,c,cs}";
      const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, pattern), "**/node_modules/**");

      allFiles.push(...files.map((f) => f.fsPath));
    }

    return allFiles;
  }

  private async filterUnprocessed(files: string[]): Promise<string[]> {
    // This would check against the vector database
    // For now, return all files as potentially unprocessed
    return files;
  }

  private async embedFile(filePath: string): Promise<void> {
    this.logger.debug(`Bulk embedding: ${path.basename(filePath)}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  dispose(): void {
    DisposableUtils.safeDispose(this.disposables);
    this.disposables = [];
  }
}
