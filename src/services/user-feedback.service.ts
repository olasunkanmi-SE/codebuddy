import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface UserFeedbackOptions {
  enableStatusBar?: boolean;
  enableProgressNotifications?: boolean;
  enableToastNotifications?: boolean;
  progressLocation?: vscode.ProgressLocation;
}

export interface ProgressInfo {
  operation: string;
  progress: number;
  message?: string;
  increment?: number;
}

export interface StatusInfo {
  text: string;
  tooltip?: string;
  backgroundColor?: vscode.ThemeColor;
  command?: string;
}

/**
 * UserFeedbackService manages all user feedback for the vector database system
 * including status bar indicators, progress notifications, and settings integration
 */
export class UserFeedbackService implements vscode.Disposable {
  private logger: Logger;
  private statusBarItem: vscode.StatusBarItem;
  private progressTokens: Map<string, vscode.CancellationTokenSource> = new Map();
  private disposables: vscode.Disposable[] = [];
  private readonly options: Required<UserFeedbackOptions>;

  constructor(options: UserFeedbackOptions = {}) {
    this.logger = Logger.initialize("UserFeedbackService", {
      minLevel: LogLevel.INFO,
    });

    this.options = {
      enableStatusBar: options.enableStatusBar ?? true,
      enableProgressNotifications: options.enableProgressNotifications ?? true,
      enableToastNotifications: options.enableToastNotifications ?? true,
      progressLocation: options.progressLocation ?? vscode.ProgressLocation.Notification,
    };

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = "codebuddy.vectorDb.showStats";
    this.disposables.push(this.statusBarItem);

    this.initializeStatusBar();
  }

  /**
   * Initialize the status bar with default state
   */
  private initializeStatusBar(): void {
    if (!this.options.enableStatusBar) {
      return;
    }

    this.updateStatus({
      text: "$(database) CodeBuddy Vector DB",
      tooltip: "CodeBuddy Vector Database - Click for statistics",
    });
  }

  /**
   * Update status bar with current information
   */
  updateStatus(status: StatusInfo): void {
    if (!this.options.enableStatusBar) {
      return;
    }

    this.statusBarItem.text = status.text;
    this.statusBarItem.tooltip = status.tooltip || "CodeBuddy Vector Database";
    this.statusBarItem.backgroundColor = status.backgroundColor;

    if (status.command) {
      this.statusBarItem.command = status.command;
    }

    this.statusBarItem.show();
  }

  /**
   * Show initialization progress
   */
  async showInitializationProgress(phases: Array<{ name: string; action: () => Promise<void> }>): Promise<void> {
    if (!this.options.enableProgressNotifications) {
      // Still update status bar
      this.updateStatus({
        text: "$(loading~spin) CodeBuddy: Initializing...",
        tooltip: "Vector database is initializing",
        backgroundColor: new vscode.ThemeColor("statusBarItem.warningBackground"),
      });

      // Execute phases without progress UI
      for (const phase of phases) {
        await phase.action();
      }
      return;
    }

    await vscode.window.withProgress(
      {
        location: this.options.progressLocation,
        title: "CodeBuddy Vector Database",
        cancellable: false,
      },
      async (progress) => {
        const totalPhases = phases.length;
        const increment = 100 / totalPhases;

        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i];

          progress.report({
            increment: i === 0 ? 0 : increment,
            message: `${phase.name}...`,
          });

          this.updateStatus({
            text: `$(loading~spin) CodeBuddy: ${phase.name}`,
            tooltip: `Initializing: ${phase.name}`,
            backgroundColor: new vscode.ThemeColor("statusBarItem.warningBackground"),
          });

          try {
            await phase.action();
          } catch (error) {
            this.logger.error(`Phase ${phase.name} failed:`, error);
            throw error;
          }
        }

        progress.report({
          increment: increment,
          message: "Complete!",
        });
      }
    );
  }

  /**
   * Show embedding progress for batch operations
   */
  async showEmbeddingProgress(
    operationId: string,
    totalFiles: number,
    onProgress: (progress: ProgressInfo) => Promise<void>
  ): Promise<void> {
    if (!this.options.enableProgressNotifications) {
      return;
    }

    const tokenSource = new vscode.CancellationTokenSource();
    this.progressTokens.set(operationId, tokenSource);

    try {
      await vscode.window.withProgress(
        {
          location: this.options.progressLocation,
          title: "CodeBuddy Embedding",
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            tokenSource.cancel();
          });

          let processedFiles = 0;

          // Set up progress callback
          const progressCallback = async (info: ProgressInfo) => {
            if (token.isCancellationRequested) {
              return;
            }

            processedFiles++;
            const percentage = Math.round((processedFiles / totalFiles) * 100);

            progress.report({
              increment: info.increment || 100 / totalFiles,
              message: `${info.message || info.operation} (${processedFiles}/${totalFiles})`,
            });

            this.updateStatus({
              text: `$(sync~spin) CodeBuddy: ${percentage}%`,
              tooltip: `Embedding progress: ${processedFiles}/${totalFiles} files`,
              backgroundColor: new vscode.ThemeColor("statusBarItem.warningBackground"),
            });
          };

          await onProgress({ operation: "embedding", progress: 0 });
        }
      );
    } finally {
      this.progressTokens.delete(operationId);
      tokenSource.dispose();
    }
  }

  /**
   * Show quick status message in status bar
   */
  showStatusMessage(message: string, timeout: number = 3000): void {
    if (!this.options.enableStatusBar) {
      return;
    }

    const originalText = this.statusBarItem.text;
    const originalTooltip = this.statusBarItem.tooltip;
    const originalBackground = this.statusBarItem.backgroundColor;

    this.statusBarItem.text = message;
    this.statusBarItem.tooltip = message;

    setTimeout(() => {
      this.statusBarItem.text = originalText;
      this.statusBarItem.tooltip = originalTooltip;
      this.statusBarItem.backgroundColor = originalBackground;
    }, timeout);
  }

  /**
   * Show success notification
   */
  showSuccess(message: string, actions?: string[]): Thenable<string | undefined> {
    if (!this.options.enableToastNotifications) {
      this.logger.info(`Success: ${message}`);
      return Promise.resolve(undefined);
    }

    this.updateStatus({
      text: "$(check) CodeBuddy: Ready",
      tooltip: message,
      backgroundColor: undefined,
    });

    return vscode.window.showInformationMessage(message, ...(actions || []));
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, actions?: string[]): Thenable<string | undefined> {
    if (!this.options.enableToastNotifications) {
      this.logger.warn(message);
      return Promise.resolve(undefined);
    }

    this.updateStatus({
      text: "$(warning) CodeBuddy: Warning",
      tooltip: message,
      backgroundColor: new vscode.ThemeColor("statusBarItem.warningBackground"),
    });

    return vscode.window.showWarningMessage(message, ...(actions || []));
  }

  /**
   * Show error notification
   */
  showError(message: string, actions?: string[]): Thenable<string | undefined> {
    if (!this.options.enableToastNotifications) {
      this.logger.error(message);
      return Promise.resolve(undefined);
    }

    this.updateStatus({
      text: "$(error) CodeBuddy: Error",
      tooltip: message,
      backgroundColor: new vscode.ThemeColor("statusBarItem.errorBackground"),
    });

    return vscode.window.showErrorMessage(message, ...(actions || []));
  }

  /**
   * Show sync status for file operations
   */
  showSyncStatus(filesQueued: number, processing: boolean = false): void {
    if (!this.options.enableStatusBar) {
      return;
    }

    if (processing) {
      this.updateStatus({
        text: `$(sync~spin) CodeBuddy: Processing ${filesQueued} files`,
        tooltip: `Vector database sync in progress: ${filesQueued} files queued`,
        backgroundColor: new vscode.ThemeColor("statusBarItem.warningBackground"),
      });
    } else if (filesQueued > 0) {
      this.updateStatus({
        text: `$(sync) CodeBuddy: ${filesQueued} queued`,
        tooltip: `${filesQueued} files queued for vector database sync`,
        backgroundColor: new vscode.ThemeColor("statusBarItem.warningBackground"),
      });
    } else {
      this.updateStatus({
        text: "$(check) CodeBuddy: Synced",
        tooltip: "Vector database is up to date",
        backgroundColor: undefined,
      });
    }
  }

  /**
   * Show search performance metrics
   */
  showSearchMetrics(resultsCount: number, searchTime: number): void {
    const message = `Found ${resultsCount} results in ${searchTime}ms`;

    this.showStatusMessage(`$(search) ${message}`, 2000);

    if (this.options.enableToastNotifications && searchTime > 2000) {
      // Show warning if search is slow
      this.showWarning(`Search took ${searchTime}ms - consider reindexing for better performance`);
    }
  }

  /**
   * Cancel a specific progress operation
   */
  cancelProgress(operationId: string): void {
    const tokenSource = this.progressTokens.get(operationId);
    if (tokenSource) {
      tokenSource.cancel();
      this.progressTokens.delete(operationId);
    }
  }

  /**
   * Cancel all progress operations
   */
  cancelAllProgress(): void {
    for (const [operationId, tokenSource] of this.progressTokens) {
      tokenSource.cancel();
    }
    this.progressTokens.clear();
  }

  /**
   * Check if user has enabled vector database features in settings
   */
  isVectorDbEnabled(): boolean {
    return vscode.workspace.getConfiguration("codebuddy").get("vectorDb.enabled", true);
  }

  /**
   * Get user preference for progress notifications
   */
  getProgressNotificationPreference(): vscode.ProgressLocation {
    const preference = vscode.workspace
      .getConfiguration("codebuddy")
      .get("vectorDb.progressLocation", "notification") as string;

    if (preference === "statusBar") {
      return vscode.ProgressLocation.Window;
    } else if (preference === "notification") {
      return vscode.ProgressLocation.Notification;
    } else {
      return vscode.ProgressLocation.Notification;
    }
  }

  /**
   * Get user preference for embedding batch size
   */
  getEmbeddingBatchSize(): number {
    return vscode.workspace.getConfiguration("codebuddy").get("vectorDb.batchSize", 10);
  }

  /**
   * Check if background processing is enabled
   */
  isBackgroundProcessingEnabled(): boolean {
    return vscode.workspace.getConfiguration("codebuddy").get("vectorDb.backgroundProcessing", true);
  }

  /**
   * Register configuration change listeners
   */
  registerConfigurationListeners(): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("codebuddy.vectorDb")) {
        this.logger.info("Vector database configuration changed");

        // Update options based on new configuration
        this.options.enableProgressNotifications = vscode.workspace
          .getConfiguration("codebuddy")
          .get("vectorDb.showProgress", true);

        this.options.progressLocation = this.getProgressNotificationPreference();

        // Show notification about configuration change
        if (this.options.enableToastNotifications) {
          this.showSuccess("Vector database settings updated");
        }
      }
    });
  }

  /**
   * Show vector database settings panel
   */
  async showSettingsPanel(): Promise<void> {
    const options = [
      "Enable Vector Database",
      "Configure Progress Notifications",
      "Set Batch Size",
      "Toggle Background Processing",
      "View Statistics",
      "Force Reindex",
    ];

    const choice = await vscode.window.showQuickPick(options, {
      placeHolder: "Select a vector database setting to configure",
    });

    switch (choice) {
      case "Enable Vector Database":
        await vscode.commands.executeCommand("workbench.action.openSettings", "codebuddy.vectorDb.enabled");
        break;
      case "Configure Progress Notifications":
        await vscode.commands.executeCommand("workbench.action.openSettings", "codebuddy.vectorDb.progressLocation");
        break;
      case "Set Batch Size":
        await vscode.commands.executeCommand("workbench.action.openSettings", "codebuddy.vectorDb.batchSize");
        break;
      case "Toggle Background Processing":
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "codebuddy.vectorDb.backgroundProcessing"
        );
        break;
      case "View Statistics":
        await vscode.commands.executeCommand("codebuddy.vectorDb.showStats");
        break;
      case "Force Reindex":
        await vscode.commands.executeCommand("codebuddy.vectorDb.forceReindex");
        break;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.logger.info("Disposing User Feedback Service");

    this.cancelAllProgress();
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }
}
