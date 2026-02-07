import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { WorkspaceService } from "./workspace-service";
import { SqliteDatabaseService } from "./sqlite-database.service";
import {
  CodebaseAnalysisWorker,
  CodebaseAnalysisWorkerData,
  AnalysisResult,
} from "./codebase-analysis-worker";
import { ErrorHandler } from "../utils/error-handling";
import { EditorHostService } from "./editor-host.service";
import { IExtensionContext } from "../interfaces/editor-host";
import { ICancellationToken } from "../interfaces/cancellation";
import { CancellationTokenSource } from "../utils/cancellation-token-source";
import { IProgress } from "../interfaces/progress";

export interface PersistentCodebaseAnalysis {
  frameworks: string[];
  dependencies: Record<string, string>;
  files: string[];
  apiEndpoints: any[];
  dataModels: any[];
  databaseSchema: any;
  domainRelationships: any[];
  summary: {
    totalFiles: number;
    totalLines: number;
    languageDistribution: Record<string, number>;
    complexity: "low" | "medium" | "high";
  };
  gitState: {
    branch: string;
    commitHash: string;
    diffHash: string;
  };
  analysisMetadata: {
    createdAt: string;
    analysisVersion: string;
    processingTimeMs: number;
  };
}

export class PersistentCodebaseUnderstandingService {
  private static instance: PersistentCodebaseUnderstandingService;
  private readonly logger: Logger;
  private readonly workspaceService: WorkspaceService;
  private readonly databaseService: SqliteDatabaseService;
  private readonly analysisWorker: CodebaseAnalysisWorker;
  private currentAnalysisPromise: Promise<PersistentCodebaseAnalysis | null> | null =
    null;

  private constructor() {
    this.logger = Logger.initialize("PersistentCodebaseUnderstandingService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.workspaceService = WorkspaceService.getInstance();
    this.databaseService = SqliteDatabaseService.getInstance();
    this.analysisWorker = new CodebaseAnalysisWorker();
  }

  public static getInstance(): PersistentCodebaseUnderstandingService {
    if (!PersistentCodebaseUnderstandingService.instance) {
      PersistentCodebaseUnderstandingService.instance =
        new PersistentCodebaseUnderstandingService();
    }
    return PersistentCodebaseUnderstandingService.instance;
  }

  /**
   * Initialize the service
   */
  // async initialize(): Promise<void> {
  //   SqliteDatabaseService.getInstance();
  // }

  /**
   * Initialize the service and set up watchers
   */
  public initializeWatcher(context: IExtensionContext): void {
    // Watch for .git/HEAD changes to detect branch switches
    const gitHeadWatcher = EditorHostService.getInstance()
      .getHost()
      .workspace.createFileSystemWatcher("**/.git/HEAD");

    gitHeadWatcher.onDidChange(() => {
      this.logger.info("Detected git branch change");
      this.handleGitBranchChange();
    });

    context.subscriptions.push(gitHeadWatcher);
  }

  /**
   * Handle git branch change
   */
  private async handleGitBranchChange(): Promise<void> {
    try {
      const gitState = await this.databaseService.getCurrentGitState();
      if (!gitState) return;

      // Check if we have a cache for this new state
      const cached =
        await this.databaseService.getCachedCodebaseAnalysis(gitState);

      if (!cached) {
        // Option 1: Silent auto-analysis
        // this.performFreshAnalysis(gitState);

        // Option 2: Notify user (less intrusive than auto-running heavy task)
        const choice = await EditorHostService.getInstance()
          .getHost()
          .window.showInformationMessage(
            `CodeBuddy: Detected branch switch to '${gitState.branch}'. No cached analysis found.`,
            "Analyze Now",
            "Later",
          );

        if (choice === "Analyze Now") {
          EditorHostService.getInstance()
            .getHost()
            .commands.executeCommand("CodeBuddy.codebaseAnalysis");
        }
      } else {
        this.logger.info(
          `Switched to branch '${gitState.branch}', found valid cache.`,
        );
      }
    } catch (error) {
      this.logger.error("Error handling git branch change", error);
    }
  }

  /**
   * Get comprehensive codebase analysis with intelligent caching
   */
  async getComprehensiveAnalysis(
    cancellationToken?: ICancellationToken,
  ): Promise<PersistentCodebaseAnalysis | null> {
    // If analysis is already in progress, wait for it
    if (this.currentAnalysisPromise) {
      this.logger.info("Analysis already in progress, waiting for completion");
      return this.currentAnalysisPromise;
    }

    // Start new analysis
    this.currentAnalysisPromise =
      this.performAnalysisWithCaching(cancellationToken);

    try {
      const result = await this.currentAnalysisPromise;
      return result;
    } finally {
      this.currentAnalysisPromise = null;
    }
  }

  /**
   * Perform analysis with intelligent caching
   */
  private async performAnalysisWithCaching(
    cancellationToken?: ICancellationToken,
  ): Promise<PersistentCodebaseAnalysis | null> {
    try {
      // Get current git state
      const gitState = await this.databaseService.getCurrentGitState();
      if (!gitState) {
        this.logger.warn(
          "Could not determine git state, analysis may be incomplete",
        );
        return null;
      }

      this.logger.info(
        `Analyzing codebase - Branch: ${gitState.branch}, Files: ${gitState.fileCount}`,
      );

      // Check if we have a valid cached analysis
      const cachedAnalysis =
        await this.databaseService.getCachedCodebaseAnalysis(gitState);
      if (cachedAnalysis) {
        this.logger.info("Using cached codebase analysis");
        return this.enrichCachedAnalysis(cachedAnalysis, gitState);
      }

      // Check if significant changes occurred
      const hasChanges =
        await this.databaseService.hasSignificantChanges(gitState);
      if (!hasChanges) {
        this.logger.info(
          "No significant changes detected, using existing analysis",
        );
        // Try to get the most recent analysis for this workspace
        const recentAnalysis =
          await this.databaseService.getCachedCodebaseAnalysis({
            ...gitState,
            diffHash: "", // Get any analysis for this workspace/branch
          });
        if (recentAnalysis) {
          return this.enrichCachedAnalysis(recentAnalysis, gitState);
        }
      }

      // Need to perform fresh analysis
      this.logger.info("Performing fresh codebase analysis");
      return await this.performFreshAnalysis(gitState, cancellationToken);
    } catch (error: any) {
      this.logger.error("Failed to perform codebase analysis", error);
      throw error;
    }
  }

  /**
   * Perform fresh codebase analysis using web worker
   */
  private async performFreshAnalysis(
    gitState: any,
    cancellationToken?: ICancellationToken,
  ): Promise<PersistentCodebaseAnalysis | null> {
    const startTime = Date.now();

    try {
      // Prepare worker data
      const workerData: CodebaseAnalysisWorkerData = {
        workspacePath: gitState.workspacePath,
        filePatterns: [
          "**/*.{ts,js,tsx,jsx}",
          "**/*.{py,java,cs,php}",
          "**/*.{json,yaml,yml}",
          "**/*.{md,txt}",
          "**/package.json",
          "**/requirements.txt",
          "**/composer.json",
          "**/pom.xml",
          "**/*.sql",
          "**/schema.prisma",
        ],
        excludePatterns: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/.git/**",
          "**/.codebuddy/**",
          "**/coverage/**",
          "**/.next/**",
          "**/.nuxt/**",
        ],
        maxFiles: 1000,
      };

      // Show progress to user
      return await EditorHostService.getInstance()
        .getHost()
        .window.withProgress(
          {
            location: 15, // vscode.ProgressLocation.Notification
            title: "CodeBuddy: Analyzing codebase...",
            cancellable: true,
          },
          async (
            progress: IProgress<{ message?: string; increment?: number }>,
            token: ICancellationToken,
          ) => {
            // Combine cancellation tokens
            const combinedToken = this.createCombinedCancellationToken(
              cancellationToken,
              token,
            );

            // Run analysis in worker
            const analysisResult = await this.analysisWorker.analyzeCodebase(
              workerData,
              (progressData) => {
                progress.report({
                  increment: progressData.current,
                  message: progressData.message,
                });
              },
              combinedToken,
            );

            if (combinedToken.isCancellationRequested) {
              throw new Error("Analysis cancelled by user");
            }

            // Convert to persistent format
            const persistentAnalysis = this.convertToPersistentFormat(
              analysisResult,
              gitState,
              Date.now() - startTime,
            );

            // Save to database
            await this.databaseService.saveCodebaseAnalysis(
              gitState,
              persistentAnalysis,
            );

            // Cleanup old snapshots
            await this.databaseService.cleanupOldSnapshots();

            this.logger.info(
              `Fresh codebase analysis completed in ${Date.now() - startTime}ms`,
            );
            return persistentAnalysis;
          },
        );
    } catch (error: any) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Codebase analysis cancelled by user");
        return null;
      }

      this.logger.error("Failed to perform fresh analysis", error);
      throw error;
    }
  }

  /**
   * Convert worker result to persistent format
   */
  private convertToPersistentFormat(
    result: AnalysisResult,
    gitState: any,
    processingTimeMs: number,
  ): PersistentCodebaseAnalysis {
    return {
      frameworks: result.frameworks,
      dependencies: result.dependencies,
      files: result.files,
      apiEndpoints: result.apiEndpoints,
      dataModels: result.dataModels,
      databaseSchema: result.databaseSchema,
      domainRelationships: result.domainRelationships,
      summary: result.summary,
      gitState: {
        branch: gitState.branch,
        commitHash: gitState.commitHash,
        diffHash: gitState.diffHash,
      },
      analysisMetadata: {
        createdAt: new Date().toISOString(),
        analysisVersion: "2.0.0",
        processingTimeMs,
      },
    };
  }

  /**
   * Enrich cached analysis with current git state
   */
  private enrichCachedAnalysis(
    cachedAnalysis: any,
    currentGitState: any,
  ): PersistentCodebaseAnalysis {
    return {
      ...cachedAnalysis,
      gitState: {
        branch: currentGitState.branch,
        commitHash: currentGitState.commitHash,
        diffHash: currentGitState.diffHash,
      },
    };
  }

  /**
   * Create combined cancellation token
   */
  private createCombinedCancellationToken(
    token1?: ICancellationToken,
    token2?: ICancellationToken,
  ): ICancellationToken {
    const source = new CancellationTokenSource();

    if (token1) {
      token1.onCancellationRequested(() => source.cancel());
    }
    if (token2) {
      token2.onCancellationRequested(() => source.cancel());
    }

    return source.token;
  }

  /**
   * Force refresh analysis (ignores cache)
   */
  async forceRefreshAnalysis(
    cancellationToken?: ICancellationToken,
  ): Promise<PersistentCodebaseAnalysis | null> {
    try {
      const gitState = await this.databaseService.getCurrentGitState();
      if (!gitState) {
        throw new Error("Could not determine git state");
      }

      return await this.performFreshAnalysis(gitState, cancellationToken);
    } catch (error: any) {
      this.logger.error("Failed to force refresh analysis", error);
      throw error;
    }
  }

  /**
   * Get analysis summary without full analysis
   */
  async getAnalysisSummary(): Promise<{
    hasCache: boolean;
    lastAnalysis?: string;
    gitState?: any;
    stats: any;
  }> {
    try {
      this.logger.info("Getting analysis summary...");

      const gitState = await this.databaseService.getCurrentGitState();
      this.logger.info(
        `Git state: ${gitState ? JSON.stringify(gitState) : "null"}`,
      );

      const stats = await this.databaseService.getStats();
      this.logger.info(`Database stats: ${JSON.stringify(stats)}`);

      let hasCache = false;
      let lastAnalysis: string | undefined;

      if (gitState) {
        this.logger.info("Checking for cached analysis...");
        const cached =
          await this.databaseService.getCachedCodebaseAnalysis(gitState);
        if (cached?.analysisMetadata) {
          hasCache = true;
          lastAnalysis = cached.analysisMetadata.createdAt;
          this.logger.info(`Found cached analysis from: ${lastAnalysis}`);
        } else {
          this.logger.info("No cached analysis found");
        }
      } else {
        this.logger.warn("No git state available");
      }

      return {
        hasCache,
        lastAnalysis,
        gitState,
        stats,
      };
    } catch (error: any) {
      this.logger.error("Failed to get analysis summary", error);
      return {
        hasCache: false,
        stats: {
          totalSnapshots: 0,
          totalSize: 0,
          oldestSnapshot: "",
          newestSnapshot: "",
        },
      };
    }
  }

  /**
   * Clear all cached analyses
   */
  async clearCache(): Promise<void> {
    try {
      await this.databaseService.cleanupOldSnapshots(0); // Remove all
      this.logger.info("All cached analyses cleared");
    } catch (error: any) {
      this.logger.error("Failed to clear cache", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    return await this.databaseService.getStats();
  }

  /**
   * Check if analysis is currently running
   */
  isAnalysisRunning(): boolean {
    return (
      this.currentAnalysisPromise !== null ||
      this.analysisWorker.isAnalysisRunning()
    );
  }

  /**
   * Cancel current analysis
   */
  cancelCurrentAnalysis(): void {
    this.analysisWorker.cancel();
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    try {
      this.analysisWorker.cancel();
      await this.databaseService.close();
      this.logger.info("Persistent codebase understanding service shutdown");
    } catch (error: any) {
      this.logger.error("Error during service shutdown", error);
    }
  }
}
