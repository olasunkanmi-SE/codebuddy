/**
 * Enhanced Vector Database Revalidation Strategies
 * Additional patterns for robust vector database invalidation and refresh
 */

import * as vscode from "vscode";
import * as crypto from "crypto";
import { VectorDatabaseService } from "./vector-database.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface RevalidationStrategy {
  name: string;
  description: string;
  trigger: "automatic" | "manual" | "scheduled" | "conditional";
  frequency?: string;
  cost: "low" | "medium" | "high";
}

export interface FileChecksum {
  filePath: string;
  checksum: string;
  lastModified: number;
  size: number;
}

export interface RevalidationConfig {
  enableContentHashing: boolean;
  enableScheduledRevalidation: boolean;
  enableGitHookRevalidation: boolean;
  enableDependencyTracking: boolean;
  scheduledInterval: number; // hours
  batchSize: number;
  maxConcurrency: number;
}

/**
 * Advanced revalidation strategies for the vector database
 */
export class AdvancedRevalidationManager {
  private logger: Logger;
  private checksumCache = new Map<string, FileChecksum>();
  private dependencyGraph = new Map<string, Set<string>>();
  private scheduledTimer?: NodeJS.Timeout;

  constructor(
    private vectorDb: VectorDatabaseService,
    private config: RevalidationConfig
  ) {
    this.logger = Logger.initialize("AdvancedRevalidationManager", {
      minLevel: LogLevel.INFO,
    });
  }

  /**
   * STRATEGY 1: Content-Based Invalidation
   * Uses file content hashing instead of just modification times
   */
  async contentBasedRevalidation(filePaths: string[]): Promise<void> {
    if (!this.config.enableContentHashing) return;

    this.logger.info(`Content-based revalidation for ${filePaths.length} files`);
    const changedFiles: string[] = [];

    for (const filePath of filePaths) {
      try {
        const currentChecksum = await this.calculateFileChecksum(filePath);
        const cachedChecksum = this.checksumCache.get(filePath);

        if (!cachedChecksum || cachedChecksum.checksum !== currentChecksum.checksum) {
          changedFiles.push(filePath);
          this.checksumCache.set(filePath, currentChecksum);
          this.logger.debug(`Content changed: ${filePath}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to check content for ${filePath}:`, error);
      }
    }

    if (changedFiles.length > 0) {
      await this.reindexFiles(changedFiles, "content-based");
    }
  }

  /**
   * STRATEGY 2: Dependency-Aware Invalidation
   * Tracks imports/exports and invalidates dependent files
   */
  async dependencyAwareRevalidation(changedFile: string): Promise<void> {
    if (!this.config.enableDependencyTracking) return;

    this.logger.info(`Dependency-aware revalidation for: ${changedFile}`);

    // Find all files that depend on the changed file
    const dependentFiles = this.findDependentFiles(changedFile);

    if (dependentFiles.size > 0) {
      this.logger.info(`Found ${dependentFiles.size} dependent files to revalidate`);
      await this.reindexFiles(Array.from(dependentFiles), "dependency-aware");
    }

    // Update dependency graph
    await this.updateDependencyGraph(changedFile);
  }

  /**
   * STRATEGY 3: Scheduled Background Revalidation
   * Periodically checks and updates stale embeddings
   */
  startScheduledRevalidation(): void {
    if (!this.config.enableScheduledRevalidation) return;

    const intervalMs = this.config.scheduledInterval * 60 * 60 * 1000; // hours to ms

    this.scheduledTimer = setInterval(async () => {
      try {
        await this.performScheduledRevalidation();
      } catch (error) {
        this.logger.error("Scheduled revalidation failed:", error);
      }
    }, intervalMs);

    this.logger.info(`Scheduled revalidation every ${this.config.scheduledInterval} hours`);
  }

  /**
   * STRATEGY 4: Git Hook-Based Revalidation
   * Triggers revalidation on git events (commit, merge, branch switch)
   */
  async gitHookRevalidation(gitEvent: "commit" | "merge" | "branch-switch", affectedFiles?: string[]): Promise<void> {
    if (!this.config.enableGitHookRevalidation) return;

    this.logger.info(`Git-based revalidation triggered by: ${gitEvent}`);

    switch (gitEvent) {
      case "commit":
        // Revalidate files in the commit
        if (affectedFiles) {
          await this.reindexFiles(affectedFiles, "git-commit");
        }
        break;

      case "merge":
        // More aggressive revalidation after merge
        await this.performFullRevalidation("git-merge");
        break;

      case "branch-switch":
        // Check if embeddings are still valid for new branch
        await this.validateEmbeddingsForBranch();
        break;
    }
  }

  /**
   * STRATEGY 5: Semantic Similarity Validation
   * Periodically checks if embeddings still make sense
   */
  async semanticValidation(sampleSize: number = 100): Promise<void> {
    this.logger.info(`Semantic validation with sample size: ${sampleSize}`);

    try {
      // Get random sample of embeddings
      const stats = this.vectorDb.getStats();
      if (stats.documentCount < sampleSize) {
        this.logger.info("Not enough documents for semantic validation");
        return;
      }

      // For each sample, re-generate embedding and compare
      const invalidEmbeddings: string[] = [];

      // This would need to be implemented with actual sampling from LanceDB
      // For now, this is a conceptual framework

      if (invalidEmbeddings.length > 0) {
        this.logger.warn(`Found ${invalidEmbeddings.length} potentially invalid embeddings`);
        // Trigger revalidation of these specific documents
      }
    } catch (error) {
      this.logger.error("Semantic validation failed:", error);
    }
  }

  /**
   * STRATEGY 6: Performance-Based Revalidation
   * Triggers revalidation when search quality degrades
   */
  async performanceBasedRevalidation(searchMetrics: {
    avgLatency: number;
    relevanceScore: number;
    errorRate: number;
  }): Promise<void> {
    // Trigger revalidation if performance is poor
    const shouldRevalidate =
      searchMetrics.avgLatency > 5000 || // > 5 seconds
      searchMetrics.relevanceScore < 0.3 || // Poor relevance
      searchMetrics.errorRate > 0.1; // > 10% errors

    if (shouldRevalidate) {
      this.logger.warn("Performance degradation detected, triggering revalidation", searchMetrics);
      await this.performFullRevalidation("performance-degradation");
    }
  }

  // Helper methods

  private async calculateFileChecksum(filePath: string): Promise<FileChecksum> {
    const uri = vscode.Uri.file(filePath);
    const content = await vscode.workspace.fs.readFile(uri);
    const stat = await vscode.workspace.fs.stat(uri);

    const checksum = crypto.createHash("sha256").update(content).digest("hex");

    return {
      filePath,
      checksum,
      lastModified: stat.mtime,
      size: stat.size,
    };
  }

  private findDependentFiles(filePath: string): Set<string> {
    // This would analyze import/export relationships
    // Implementation would need to parse TypeScript/JavaScript files
    return this.dependencyGraph.get(filePath) || new Set();
  }

  private async updateDependencyGraph(filePath: string): Promise<void> {
    // Parse file and update dependency relationships
    // This would need actual AST parsing
  }

  private async performScheduledRevalidation(): Promise<void> {
    this.logger.info("Performing scheduled revalidation");

    // Strategy: Check subset of files each time
    const allFiles = await this.getAllWorkspaceFiles();
    const batchSize = Math.min(this.config.batchSize, allFiles.length);
    const randomFiles = this.selectRandomFiles(allFiles, batchSize);

    await this.contentBasedRevalidation(randomFiles);
  }

  private async performFullRevalidation(reason: string): Promise<void> {
    this.logger.info(`Performing full revalidation due to: ${reason}`);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Revalidating embeddings (${reason})`,
        cancellable: false,
      },
      async (progress) => {
        // Clear all embeddings and rebuild
        await this.vectorDb.clearAll();

        // This would need integration with the sync service
        progress.report({ increment: 100, message: "Revalidation complete" });
      }
    );
  }

  private async validateEmbeddingsForBranch(): Promise<void> {
    // Check if current embeddings are valid for current git branch
    // This might involve comparing file hashes with what's in the embeddings
  }

  private async reindexFiles(filePaths: string[], reason: string): Promise<void> {
    this.logger.info(`Reindexing ${filePaths.length} files (${reason})`);

    // Process in batches
    for (let i = 0; i < filePaths.length; i += this.config.batchSize) {
      const batch = filePaths.slice(i, i + this.config.batchSize);

      await Promise.all(
        batch.map(async (filePath) => {
          try {
            await this.vectorDb.deleteByFile(filePath);
            // Would need to extract and reindex snippets
          } catch (error) {
            this.logger.error(`Failed to reindex ${filePath}:`, error);
          }
        })
      );
    }
  }

  private async getAllWorkspaceFiles(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const files: string[] = [];
    for (const folder of workspaceFolders) {
      const pattern = "**/*.{ts,js,tsx,jsx,py,java,cpp,c,cs}";
      const foundFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, pattern),
        "**/node_modules/**"
      );
      files.push(...foundFiles.map((uri) => uri.fsPath));
    }

    return files;
  }

  private selectRandomFiles(files: string[], count: number): string[] {
    const shuffled = [...files].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  dispose(): void {
    if (this.scheduledTimer) {
      clearInterval(this.scheduledTimer);
    }
    this.checksumCache.clear();
    this.dependencyGraph.clear();
  }
}

/**
 * Revalidation strategy registry
 */
export const REVALIDATION_STRATEGIES: RevalidationStrategy[] = [
  {
    name: "Real-time File Monitoring",
    description: "Watches file system changes and updates embeddings immediately",
    trigger: "automatic",
    cost: "low",
  },
  {
    name: "Content-Based Invalidation",
    description: "Uses file content hashing to detect actual changes",
    trigger: "automatic",
    cost: "medium",
  },
  {
    name: "Dependency-Aware Revalidation",
    description: "Updates dependent files when imports/exports change",
    trigger: "automatic",
    cost: "medium",
  },
  {
    name: "Scheduled Background Revalidation",
    description: "Periodic validation of embedding freshness",
    trigger: "scheduled",
    frequency: "hourly",
    cost: "low",
  },
  {
    name: "Git Hook-Based Revalidation",
    description: "Triggers revalidation on git events",
    trigger: "automatic",
    cost: "medium",
  },
  {
    name: "Semantic Similarity Validation",
    description: "Validates embedding quality over time",
    trigger: "scheduled",
    frequency: "daily",
    cost: "high",
  },
  {
    name: "Performance-Based Revalidation",
    description: "Triggers when search performance degrades",
    trigger: "conditional",
    cost: "high",
  },
  {
    name: "Manual Revalidation",
    description: "User-triggered full or partial reindexing",
    trigger: "manual",
    cost: "high",
  },
];
