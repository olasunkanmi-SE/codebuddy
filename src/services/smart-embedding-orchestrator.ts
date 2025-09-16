import * as vscode from "vscode";
import * as path from "path";
import { VectorDatabaseService } from "./vector-database.service";
import { VectorDbWorkerManager } from "./vector-db-worker-manager";
import { VectorDbSyncService } from "./vector-db-sync.service";
import { EmbeddingPhaseFactory, CreatedPhases } from "./embedding-phase-factory";
import { EmbeddingConfigurationManager } from "./embedding-configuration";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { FileUtils, AsyncUtils } from "../utils/common-utils";

export interface OrchestrationStats {
  isInitialized: boolean;
  phasesActive: {
    immediate: boolean;
    onDemand: boolean;
    background: boolean;
    bulk: boolean;
  };
  embeddingProgress: {
    totalFiles: number;
    processedFiles: number;
    queuedFiles: number;
    failedFiles: number;
  };
  performance: {
    averageEmbeddingTime: number;
    searchLatency: number;
    memoryUsage: number;
  };
  lastActivity: string | null;
}

export interface UserActivity {
  type: "file_opened" | "file_edited" | "question_asked" | "search_performed";
  filePath?: string;
  content?: string;
  timestamp: number;
}

/**
 * SmartEmbeddingOrchestrator coordinates all embedding phases and manages
 * the overall vector database experience in CodeBuddy.
 */
export class SmartEmbeddingOrchestrator {
  private logger: Logger;
  private configManager: EmbeddingConfigurationManager;
  private phaseFactory: EmbeddingPhaseFactory;
  private phases: CreatedPhases | null = null;
  private syncService: VectorDbSyncService | null = null;
  private batchProcessingEnabled = true;
  private readonly BATCH_SIZE = 10;

  private isInitialized = false;
  private userActivityQueue: UserActivity[] = [];
  private progressStatusBar: vscode.StatusBarItem;

  private stats: OrchestrationStats = {
    isInitialized: false,
    phasesActive: {
      immediate: false,
      onDemand: false,
      background: false,
      bulk: false,
    },
    embeddingProgress: {
      totalFiles: 0,
      processedFiles: 0,
      queuedFiles: 0,
      failedFiles: 0,
    },
    performance: {
      averageEmbeddingTime: 0,
      searchLatency: 0,
      memoryUsage: 0,
    },
    lastActivity: null,
  };

  constructor(
    private context: vscode.ExtensionContext,
    private vectorDb: VectorDatabaseService,
    private workerManager: VectorDbWorkerManager
  ) {
    this.logger = Logger.initialize("SmartEmbeddingOrchestrator", {
      minLevel: LogLevel.INFO,
    });

    this.configManager = EmbeddingConfigurationManager.getInstance();
    this.phaseFactory = EmbeddingPhaseFactory.getInstance();

    // Create status bar item
    this.progressStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.progressStatusBar.command = "codebuddy.showEmbeddingStatus";

    // Register commands
    this.registerCommands();
  }

  /**
   * Initialize the orchestrator and all embedding phases
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn("Orchestrator already initialized");
      return;
    }

    try {
      this.logger.info("Initializing Smart Embedding Orchestrator");
      this.updateStatusBar("Initializing CodeBuddy AI...", true);

      // Step 1: Validate dependencies
      await this.validateDependencies();

      // Step 2: Create embedding phases
      this.phases = await this.phaseFactory.createAllPhases({
        vectorDb: this.vectorDb,
        workerManager: this.workerManager,
        context: this.context,
        enableBackgroundProcessing: true,
        enableProgressReporting: true,
      });

      // Step 3: Create sync service (will be created when needed)
      // Note: VectorDbSyncService integration will be handled separately

      // Step 4: Execute Phase 1 - Immediate Embedding
      await this.executeImmediatePhase();

      // Step 5: Setup Phase 2 - On-Demand Triggers
      this.setupOnDemandPhase();

      // Step 6: Start Phase 3 - Background Processing
      this.startBackgroundPhase();

      // Step 7: Register Phase 4 - Bulk Processing Command
      this.registerBulkProcessingCommand();

      // Step 8: Initialize sync service (when available)
      if (this.syncService) {
        await this.syncService.initialize();
      }

      // Step 9: Setup activity monitoring
      this.setupActivityMonitoring();

      this.isInitialized = true;
      this.stats.isInitialized = true;
      this.stats.lastActivity = new Date().toISOString();

      this.updateStatusBar("CodeBuddy AI Ready", false);
      this.logger.info("Smart Embedding Orchestrator initialized successfully");

      // Show completion notification
      vscode.window.showInformationMessage("🚀 CodeBuddy AI is ready with enhanced context understanding!");
    } catch (error) {
      this.logger.error("Failed to initialize orchestrator:", error);
      this.updateStatusBar("CodeBuddy AI Error", false);

      vscode.window.showErrorMessage(
        `Failed to initialize CodeBuddy AI: ${error instanceof Error ? error.message : String(error)}`
      );

      throw error;
    }
  }

  /**
   * Execute Phase 1: Immediate Embedding
   */
  private async executeImmediatePhase(): Promise<void> {
    if (!this.phases) throw new Error("Phases not initialized");

    try {
      this.stats.phasesActive.immediate = true;
      this.updateStatusBar("Indexing essential files...", true);

      await this.phases.immediate.embedEssentials(this.context, (phase, progress, details) => {
        this.updateStatusBar(`${details} (${Math.round(progress)}%)`, true);
        this.updateEmbeddingProgress(1, 0);
      });

      this.stats.phasesActive.immediate = false;
      this.logger.info("Phase 1 (Immediate) completed successfully");
    } catch (error) {
      this.stats.phasesActive.immediate = false;
      this.logger.error("Phase 1 (Immediate) failed:", error);
      throw error;
    }
  }

  /**
   * Setup Phase 2: On-Demand Embedding
   */
  private setupOnDemandPhase(): void {
    if (!this.phases) throw new Error("Phases not initialized");

    try {
      this.phases.onDemand.setupTriggers();
      this.stats.phasesActive.onDemand = true;
      this.logger.info("Phase 2 (On-Demand) setup completed");
    } catch (error) {
      this.logger.error("Phase 2 (On-Demand) setup failed:", error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Start Phase 3: Background Processing
   */
  private startBackgroundPhase(): void {
    if (!this.phases) throw new Error("Phases not initialized");

    const config = this.configManager.getPhaseConfig("background");
    if (!config.enabled) {
      this.logger.info("Background processing disabled in configuration");
      return;
    }

    try {
      this.phases.background.startBackgroundProcessing();
      this.stats.phasesActive.background = true;
      this.logger.info("Phase 3 (Background) started successfully");
    } catch (error) {
      this.logger.error("Phase 3 (Background) failed to start:", error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Register Phase 4: Bulk Processing Command
   */
  private registerBulkProcessingCommand(): void {
    if (!this.phases) throw new Error("Phases not initialized");

    try {
      this.phases.bulk.registerBulkCommand(this.context);
      this.stats.phasesActive.bulk = true;
      this.logger.info("Phase 4 (Bulk) command registered");
    } catch (error) {
      this.logger.error("Phase 4 (Bulk) registration failed:", error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Setup activity monitoring to optimize embedding priorities
   */
  private setupActivityMonitoring(): void {
    // Monitor file operations
    const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");

    fileWatcher.onDidCreate((uri) => {
      this.recordActivity({
        type: "file_opened",
        filePath: uri.fsPath,
        timestamp: Date.now(),
      });
    });

    fileWatcher.onDidChange((uri) => {
      this.recordActivity({
        type: "file_edited",
        filePath: uri.fsPath,
        timestamp: Date.now(),
      });
    });

    // Monitor editor changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document) {
        this.recordActivity({
          type: "file_opened",
          filePath: editor.document.fileName,
          timestamp: Date.now(),
        });
      }
    });

    this.context.subscriptions.push(fileWatcher);
  }

  /**
   * Record user activity for optimization
   */
  private recordActivity(activity: UserActivity): void {
    this.userActivityQueue.push(activity);
    this.stats.lastActivity = new Date(activity.timestamp).toISOString();

    // Keep only recent activities (last 100)
    if (this.userActivityQueue.length > 100) {
      this.userActivityQueue = this.userActivityQueue.slice(-100);
    }

    // Trigger on-demand embedding if needed
    this.handleActivityTrigger(activity);
  }

  /**
   * Handle activity-triggered embedding
   */
  private async handleActivityTrigger(activity: UserActivity): Promise<void> {
    if (!this.phases || !activity.filePath) return;

    try {
      switch (activity.type) {
        case "file_opened":
          await this.phases.onDemand.onFileOpened(activity.filePath);
          break;
        case "file_edited":
          await this.phases.onDemand.onFileEdited(activity.filePath);
          break;
        case "question_asked":
          if (activity.content) {
            await this.phases.onDemand.onUserQuestion(activity.content);
          }
          break;
      }
    } catch (error) {
      this.logger.error("Activity trigger failed:", error);
      // Don't throw - this should not break the user experience
    }
  }

  /**
   * Handle user questions with activity recording
   */
  async handleUserQuestion(question: string): Promise<void> {
    this.recordActivity({
      type: "question_asked",
      content: question,
      timestamp: Date.now(),
    });

    // Update performance stats
    const startTime = Date.now();

    try {
      if (this.phases) {
        await this.phases.onDemand.onUserQuestion(question);
      }

      this.stats.performance.searchLatency = Date.now() - startTime;
    } catch (error) {
      this.logger.error("Question handling failed:", error);
    }
  }

  /**
   * Get user activity patterns for optimization
   */
  getActivityPatterns(): {
    recentFiles: string[];
    activeDirectories: string[];
    questionFrequency: number;
  } {
    const recentActivities = this.userActivityQueue.slice(-20);

    const recentFiles = [...new Set(recentActivities.filter((a) => a.filePath).map((a) => a.filePath!))];

    const activeDirectories = [...new Set(recentFiles.map((f) => path.dirname(f)))];

    const questionFrequency = recentActivities.filter((a) => a.type === "question_asked").length;

    return {
      recentFiles,
      activeDirectories,
      questionFrequency,
    };
  }

  /**
   * Update embedding progress statistics
   */
  private updateEmbeddingProgress(processed: number, failed: number): void {
    this.stats.embeddingProgress.processedFiles += processed;
    this.stats.embeddingProgress.failedFiles += failed;
  }

  /**
   * Update status bar with current activity
   */
  private updateStatusBar(message: string, isProgress: boolean): void {
    if (isProgress) {
      this.progressStatusBar.text = `$(sync~spin) ${message}`;
    } else {
      this.progressStatusBar.text = `$(check) ${message}`;
    }

    this.progressStatusBar.show();

    // Hide non-progress messages after delay
    if (!isProgress) {
      setTimeout(() => {
        this.progressStatusBar.hide();
      }, 3000);
    }
  }

  /**
   * Validate that all dependencies are ready
   */
  private async validateDependencies(): Promise<void> {
    if (!this.vectorDb.isReady()) {
      throw new Error("VectorDatabaseService is not ready");
    }

    if (!this.workerManager.isReady()) {
      throw new Error("VectorDbWorkerManager is not ready");
    }

    // Test vector database with a simple operation
    try {
      await this.vectorDb.semanticSearch("test", 1);
    } catch (error) {
      throw new Error(`Vector database test failed: ${error}`);
    }

    this.logger.debug("All dependencies validated successfully");
  }

  /**
   * Register extension commands
   */
  private registerCommands(): void {
    // Show embedding status command
    const statusCommand = vscode.commands.registerCommand("codebuddy.showEmbeddingStatus", () =>
      this.showEmbeddingStatus()
    );

    // Force reindex command
    const reindexCommand = vscode.commands.registerCommand("codebuddy.forceReindex", () => this.forceReindex());

    // Toggle background processing
    const toggleBackgroundCommand = vscode.commands.registerCommand("codebuddy.toggleBackgroundProcessing", () =>
      this.toggleBackgroundProcessing()
    );

    this.context.subscriptions.push(statusCommand, reindexCommand, toggleBackgroundCommand, this.progressStatusBar);
  }

  /**
   * Show detailed embedding status
   */
  private async showEmbeddingStatus(): Promise<void> {
    const stats = this.getStats();
    const activityPatterns = this.getActivityPatterns();

    const statusMessage = `
**CodeBuddy AI Status**

**Initialization**: ${stats.isInitialized ? "✅ Ready" : "❌ Not Ready"}

**Active Phases**:
- Immediate: ${stats.phasesActive.immediate ? "🔄 Active" : "✅ Complete"}
- On-Demand: ${stats.phasesActive.onDemand ? "✅ Active" : "❌ Inactive"}
- Background: ${stats.phasesActive.background ? "🔄 Active" : "❌ Inactive"}
- Bulk: ${stats.phasesActive.bulk ? "✅ Available" : "❌ Unavailable"}

**Progress**:
- Files Processed: ${stats.embeddingProgress.processedFiles}
- Files Queued: ${stats.embeddingProgress.queuedFiles}
- Files Failed: ${stats.embeddingProgress.failedFiles}

**Performance**:
- Search Latency: ${stats.performance.searchLatency}ms
- Memory Usage: ${Math.round(stats.performance.memoryUsage / 1024 / 1024)}MB

**Activity**:
- Recent Files: ${activityPatterns.recentFiles.length}
- Active Directories: ${activityPatterns.activeDirectories.length}
- Recent Questions: ${activityPatterns.questionFrequency}

**Last Activity**: ${stats.lastActivity || "None"}
    `.trim();

    vscode.window
      .showInformationMessage(statusMessage, "View Logs", "Force Reindex", "Settings")
      .then(async (selection) => {
        switch (selection) {
          case "View Logs":
            vscode.commands.executeCommand("workbench.action.showOutputChannels");
            break;
          case "Force Reindex":
            await this.forceReindex();
            break;
          case "Settings":
            vscode.commands.executeCommand("workbench.action.openSettings", "codebuddy.smartEmbedding");
            break;
        }
      });
  }

  /**
   * Force complete reindex
   */
  private async forceReindex(): Promise<void> {
    if (!this.phases) {
      vscode.window.showErrorMessage("Embedding phases not initialized");
      return;
    }

    const confirmation = await vscode.window.showWarningMessage(
      "This will reindex your entire codebase. Continue?",
      { modal: true },
      "Yes, Reindex All"
    );

    if (confirmation) {
      try {
        await this.phases.bulk.processBulkEmbedding();
      } catch (error) {
        vscode.window.showErrorMessage(`Reindex failed: ${error}`);
      }
    }
  }

  /**
   * Toggle background processing
   */
  private async toggleBackgroundProcessing(): Promise<void> {
    const config = this.configManager.getPhaseConfig("background");
    const newState = !config.enabled;

    await this.configManager.updatePhaseConfig("background", {
      enabled: newState,
    });

    if (newState && this.phases) {
      this.startBackgroundPhase();
      vscode.window.showInformationMessage("Background processing enabled");
    } else {
      this.stats.phasesActive.background = false;
      vscode.window.showInformationMessage("Background processing disabled");
    }
  }

  /**
   * Get comprehensive orchestration statistics
   */
  getStats(): OrchestrationStats {
    // Update memory usage
    this.stats.performance.memoryUsage = process.memoryUsage().heapUsed;

    return { ...this.stats };
  }

  /**
   * Execute on-demand embedding phase
   */
  private async executeOnDemandPhase(): Promise<void> {
    if (!this.phases?.onDemand) return;

    try {
      this.stats.phasesActive.onDemand = true;
      this.logger.info("Starting on-demand embedding phase");

      // On-demand phase is triggered by file events, so we just ensure it's set up
      this.phases.onDemand.setupTriggers();

      this.logger.info("On-demand embedding phase setup completed");
    } catch (error) {
      this.logger.error("On-demand phase execution failed:", error);
    } finally {
      this.stats.phasesActive.onDemand = false;
    }
  }

  /**
   * Execute background embedding phase
   */
  private async executeBackgroundPhase(): Promise<void> {
    if (!this.phases?.background) return;

    try {
      this.stats.phasesActive.background = true;
      this.logger.info("Starting background embedding phase");

      // Background phase has startBackgroundProcessing method
      this.phases.background.startBackgroundProcessing();

      this.logger.info("Background embedding phase setup completed");
    } catch (error) {
      this.logger.error("Background phase execution failed:", error);
    } finally {
      this.stats.phasesActive.background = false;
    }
  }

  /**
   * Execute bulk embedding phase
   */
  private async executeBulkPhase(): Promise<void> {
    if (!this.phases?.bulk) return;

    try {
      this.stats.phasesActive.bulk = true;
      this.logger.info("Starting bulk embedding phase");

      // Bulk phase has processBulkEmbedding method
      await this.phases.bulk.processBulkEmbedding();

      this.logger.info("Bulk embedding phase completed");
    } catch (error) {
      this.logger.error("Bulk phase execution failed:", error);
    } finally {
      this.stats.phasesActive.bulk = false;
    }
  }

  /**
   * Process files in batches for optimized performance
   */
  private async processBatchEmbedding(files: string[]): Promise<void> {
    if (!this.batchProcessingEnabled) {
      // Process sequentially if batch processing is disabled
      for (const file of files) {
        await this.processEmbeddingForFile(file);
      }
      return;
    }

    // Process in batches
    for (let i = 0; i < files.length; i += this.BATCH_SIZE) {
      const batch = files.slice(i, i + this.BATCH_SIZE);
      const batchPromises = batch.map((file) => this.processEmbeddingForFile(file));

      try {
        await Promise.all(batchPromises);
        this.logger.info(
          `Processed batch ${Math.floor(i / this.BATCH_SIZE) + 1} of ${Math.ceil(files.length / this.BATCH_SIZE)}`
        );
      } catch (error) {
        this.logger.error(`Batch processing failed for files ${i}-${i + batch.length}:`, error);
      }
    }
  }

  /**
   * Process embedding for a single file
   */
  private async processEmbeddingForFile(filePath: string): Promise<void> {
    try {
      // Use vector database service to embed the file
      await this.vectorDb.initialize();
      // Processing logic would go here
      this.logger.debug(`Embedded file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to embed file ${filePath}:`, error);
    }
  }

  /**
   * Gracefully shutdown the orchestrator
   */
  async dispose(): Promise<void> {
    this.logger.info("Disposing Smart Embedding Orchestrator");

    try {
      // Dispose phases
      if (this.phases) {
        EmbeddingPhaseFactory.disposePhases(this.phases);
      }

      // Dispose sync service
      if (this.syncService) {
        this.syncService.dispose();
      }

      // Hide status bar
      this.progressStatusBar.dispose();

      this.isInitialized = false;
      this.stats.isInitialized = false;

      this.logger.info("Smart Embedding Orchestrator disposed successfully");
    } catch (error) {
      this.logger.error("Error during orchestrator disposal:", error);
    }
  }
}
