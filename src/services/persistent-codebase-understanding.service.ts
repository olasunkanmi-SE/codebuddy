import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";
import { WorkspaceService } from "./workspace-service";
import { SqliteDatabaseService } from "./sqlite-database.service";
import {
  CodebaseAnalysisWorker,
  CodebaseAnalysisWorkerData,
  AnalysisResult,
} from "./codebase-analysis-worker";

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
  async initialize(): Promise<void> {
    try {
      await this.databaseService.initialize();
      this.logger.info("Persistent codebase understanding service initialized");
    } catch (error) {
      this.logger.error("Failed to initialize service", error);
      throw error;
    }
  }

  /**
   * Get comprehensive codebase analysis with intelligent caching
   */
  async getComprehensiveAnalysis(
    cancellationToken?: vscode.CancellationToken,
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
    cancellationToken?: vscode.CancellationToken,
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
    } catch (error) {
      this.logger.error("Failed to perform codebase analysis", error);
      throw error;
    }
  }

  /**
   * Perform fresh codebase analysis using web worker
   */
  private async performFreshAnalysis(
    gitState: any,
    cancellationToken?: vscode.CancellationToken,
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
          "**/coverage/**",
          "**/.next/**",
          "**/.nuxt/**",
        ],
        maxFiles: 1000,
      };

      // Show progress to user
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "CodeBuddy: Analyzing codebase...",
          cancellable: true,
        },
        async (progress, token) => {
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
    } catch (error) {
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
    token1?: vscode.CancellationToken,
    token2?: vscode.CancellationToken,
  ): vscode.CancellationToken {
    const source = new vscode.CancellationTokenSource();

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
    cancellationToken?: vscode.CancellationToken,
  ): Promise<PersistentCodebaseAnalysis | null> {
    try {
      const gitState = await this.databaseService.getCurrentGitState();
      if (!gitState) {
        throw new Error("Could not determine git state");
      }

      return await this.performFreshAnalysis(gitState, cancellationToken);
    } catch (error) {
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
      const gitState = await this.databaseService.getCurrentGitState();
      const stats = await this.databaseService.getStats();

      let hasCache = false;
      let lastAnalysis: string | undefined;

      if (gitState) {
        const cached =
          await this.databaseService.getCachedCodebaseAnalysis(gitState);
        if (cached?.analysisMetadata) {
          hasCache = true;
          lastAnalysis = cached.analysisMetadata.createdAt;
        }
      }

      return {
        hasCache,
        lastAnalysis,
        gitState,
        stats,
      };
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      this.logger.error("Error during service shutdown", error);
    }
  }
}
