/**
 * Code Indexing Status Provider
 * Provides a centralized way to check the status of code indexing operations
 */

import * as vscode from "vscode";
import {
  VectorDbSyncService,
  VectorDbSyncStats,
} from "./vector-db-sync.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface IndexingStatus {
  isActive: boolean;
  phase: "idle" | "initial" | "incremental" | "full-reindex";
  progress: {
    totalFiles: number;
    processedFiles: number;
    percentComplete: number;
    estimatedTimeRemaining: number;
    currentFile: string | null;
  };
  lastUpdate: Date;
  canPerformOperations: boolean; // Whether other operations should wait
}

/**
 * Manages and provides information about code indexing status
 */
export class CodeIndexingStatusProvider implements vscode.Disposable {
  private logger: Logger;
  private syncService: VectorDbSyncService | null = null;
  private statusListeners: Array<(status: IndexingStatus) => void> = [];
  private disposables: vscode.Disposable[] = [];
  private currentStatus: IndexingStatus;

  constructor() {
    this.logger = Logger.initialize("CodeIndexingStatusProvider", {
      minLevel: LogLevel.INFO,
    });

    this.currentStatus = {
      isActive: false,
      phase: "idle",
      progress: {
        totalFiles: 0,
        processedFiles: 0,
        percentComplete: 0,
        estimatedTimeRemaining: 0,
        currentFile: null,
      },
      lastUpdate: new Date(),
      canPerformOperations: true,
    };
  }

  /**
   * Initialize with the sync service
   */
  initialize(syncService: VectorDbSyncService): void {
    this.syncService = syncService;

    // Subscribe to sync service progress updates
    const progressDisposable = syncService.onProgressUpdate((stats) => {
      this.updateStatus(stats);
    });

    this.disposables.push(progressDisposable);
    this.logger.info("Code indexing status provider initialized");
  }

  /**
   * Get current indexing status
   */
  getStatus(): IndexingStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if indexing is currently active
   */
  isIndexingActive(): boolean {
    return this.currentStatus.isActive;
  }

  /**
   * Check if it's safe to perform vector database operations
   * (not recommended during heavy indexing operations)
   */
  canPerformVectorOperations(): boolean {
    return this.currentStatus.canPerformOperations;
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(): string {
    if (!this.currentStatus.isActive) {
      return "Code indexing: Ready";
    }

    const { phase, progress } = this.currentStatus;
    const percent = Math.round(progress.percentComplete);
    const timeRemaining =
      progress.estimatedTimeRemaining > 0
        ? ` (~${Math.round(progress.estimatedTimeRemaining)}s remaining)`
        : "";

    switch (phase) {
      case "initial":
        return `Code indexing: Initial scan ${percent}% (${progress.processedFiles}/${progress.totalFiles})${timeRemaining}`;
      case "incremental":
        return `Code indexing: Updating ${percent}% (${progress.processedFiles}/${progress.totalFiles})${timeRemaining}`;
      case "full-reindex":
        return `Code indexing: Full reindex ${percent}% (${progress.processedFiles}/${progress.totalFiles})${timeRemaining}`;
      default:
        return `Code indexing: ${percent}%`;
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(
    listener: (status: IndexingStatus) => void,
  ): vscode.Disposable {
    this.statusListeners.push(listener);

    // Immediately notify with current status
    listener(this.getStatus());

    return {
      dispose: () => {
        const index = this.statusListeners.indexOf(listener);
        if (index >= 0) {
          this.statusListeners.splice(index, 1);
        }
      },
    };
  }

  /**
   * Wait for indexing to complete (useful for operations that need complete index)
   */
  async waitForIndexingCompletion(
    timeoutMs: number = 300000,
  ): Promise<boolean> {
    if (!this.currentStatus.isActive) {
      return true; // Already complete
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        disposable.dispose();
        resolve(false); // Timeout
      }, timeoutMs);

      const disposable = this.onStatusChange((status) => {
        if (!status.isActive) {
          clearTimeout(timeout);
          disposable.dispose();
          resolve(true); // Completed
        }
      });
    });
  }

  /**
   * Get detailed progress information for UI display
   */
  getDetailedProgress(): {
    phase: string;
    phaseDescription: string;
    progressPercent: number;
    filesProcessed: number;
    totalFiles: number;
    currentFile: string | null;
    timeRemaining: string;
    isBlocking: boolean;
  } {
    const { phase, progress, isActive } = this.currentStatus;

    const phaseDescriptions = {
      idle: { description: "Ready", isBlocking: false },
      initial: { description: "Initial code analysis", isBlocking: true },
      incremental: { description: "Updating changes", isBlocking: false },
      "full-reindex": { description: "Full reindexing", isBlocking: true },
    };

    const phaseInfo = phaseDescriptions[phase] || phaseDescriptions["idle"];

    return {
      phase,
      phaseDescription: phaseInfo.description,
      progressPercent: Math.round(progress.percentComplete),
      filesProcessed: progress.processedFiles,
      totalFiles: progress.totalFiles,
      currentFile: progress.currentFile,
      timeRemaining:
        progress.estimatedTimeRemaining > 0
          ? `${Math.round(progress.estimatedTimeRemaining)}s`
          : "",
      isBlocking: isActive && phaseInfo.isBlocking,
    };
  }

  /**
   * Update status from sync service stats
   */
  private updateStatus(stats: VectorDbSyncStats): void {
    const wasActive = this.currentStatus.isActive;

    this.currentStatus = {
      isActive: stats.isIndexing,
      phase: stats.indexingPhase,
      progress: {
        totalFiles: stats.indexingProgress.totalFiles,
        processedFiles: stats.indexingProgress.processedFiles,
        percentComplete: stats.indexingProgress.percentComplete,
        estimatedTimeRemaining: stats.indexingProgress.estimatedTimeRemaining,
        currentFile: stats.indexingProgress.currentFile,
      },
      lastUpdate: new Date(),
      canPerformOperations:
        !stats.isIndexing || stats.indexingPhase === "incremental",
    };

    // Log status changes
    if (wasActive !== this.currentStatus.isActive) {
      if (this.currentStatus.isActive) {
        this.logger.info(
          `Code indexing started: ${this.currentStatus.phase} phase`,
        );
      } else {
        this.logger.info("Code indexing completed");
      }
    }

    // Notify all listeners
    this.notifyStatusListeners();
  }

  /**
   * Notify all status listeners
   */
  private notifyStatusListeners(): void {
    const status = this.getStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (error) {
        this.logger.error("Error in status listener:", error);
      }
    }
  }

  /**
   * Create a status bar item that shows current indexing status
   */
  createStatusBarItem(): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );

    // Update status bar based on current status
    const updateStatusBar = (status: IndexingStatus) => {
      if (status.isActive) {
        const percent = Math.round(status.progress.percentComplete);
        statusBarItem.text = `$(sync~spin) CodeBuddy: ${percent}%`;
        statusBarItem.tooltip = this.getStatusMessage();
        statusBarItem.show();
      } else {
        statusBarItem.text = `$(check) CodeBuddy`;
        statusBarItem.tooltip = "CodeBuddy: Ready";
        statusBarItem.show();
      }
    };

    // Initial update
    updateStatusBar(this.currentStatus);

    // Subscribe to status changes
    const statusDisposable = this.onStatusChange(updateStatusBar);
    this.disposables.push(statusDisposable);

    // Add command to show detailed status
    statusBarItem.command = "codebuddy.showIndexingStatus";

    return statusBarItem;
  }

  /**
   * Show detailed indexing status to user
   */
  async showDetailedStatus(): Promise<void> {
    const details = this.getDetailedProgress();

    if (!details.isBlocking && details.phase === "idle") {
      const stats = this.syncService?.getStats();
      const message = `**CodeBuddy Indexing Status**

Status: Ready
Last sync: ${stats?.lastSync ? new Date(stats.lastSync).toLocaleString() : "Never"}
Files monitored: ${stats?.filesMonitored || 0}
Total operations: ${stats?.syncOperations || 0}
Failed operations: ${stats?.failedOperations || 0}`;

      vscode.window.showInformationMessage(message);
    } else {
      const message = `**CodeBuddy Indexing Status**

Phase: ${details.phaseDescription}
Progress: ${details.progressPercent}% (${details.filesProcessed}/${details.totalFiles} files)
${details.currentFile ? `Current: ${details.currentFile}` : ""}
${details.timeRemaining ? `Time remaining: ${details.timeRemaining}` : ""}

${details.isBlocking ? "⚠️ Heavy indexing in progress. Some operations may be slower." : ""}`;

      vscode.window.showInformationMessage(message);
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    this.statusListeners.length = 0;
    this.logger.info("Code indexing status provider disposed");
  }
}

// Global instance for easy access
let globalStatusProvider: CodeIndexingStatusProvider | undefined;

/**
 * Get the global status provider instance
 */
export function getCodeIndexingStatusProvider(): CodeIndexingStatusProvider {
  if (!globalStatusProvider) {
    globalStatusProvider = new CodeIndexingStatusProvider();
  }
  return globalStatusProvider;
}
