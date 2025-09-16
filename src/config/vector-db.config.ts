import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface VectorDbConfig {
  enabled: boolean;
  embeddingModel: "gemini" | "openai" | "local";
  maxTokens: number;
  batchSize: number;
  searchResultLimit: number;
  enableBackgroundProcessing: boolean;
  enableProgressNotifications: boolean;
  progressLocation: "notification" | "statusBar";
  debounceDelay: number;
  performanceMode: "balanced" | "performance" | "memory";
  fallbackToKeywordSearch: boolean;
  cacheEnabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface PerformanceThresholds {
  maxEmbeddingTime: number; // milliseconds
  maxSearchTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  maxFileSize: number; // bytes
  maxConcurrentOperations: number;
}

export interface FeatureFlags {
  enableVectorSearch: boolean;
  enableSemanticSimilarity: boolean;
  enableSmartRanking: boolean;
  enableRealtimeSync: boolean;
  enableBulkOperations: boolean;
  enableAnalytics: boolean;
}

/**
 * VectorDbConfigurationManager handles all configuration for the vector database system
 * with intelligent defaults, validation, and performance optimization
 */
export class VectorDbConfigurationManager implements vscode.Disposable {
  private logger: Logger;
  private disposables: vscode.Disposable[] = [];
  private cachedConfig: VectorDbConfig | null = null;
  private configChangeListeners: ((config: VectorDbConfig) => void)[] = [];

  private readonly DEFAULT_CONFIG: VectorDbConfig = {
    enabled: true,
    embeddingModel: "gemini",
    maxTokens: 6000,
    batchSize: 10,
    searchResultLimit: 8,
    enableBackgroundProcessing: true,
    enableProgressNotifications: true,
    progressLocation: "notification",
    debounceDelay: 1000,
    performanceMode: "balanced",
    fallbackToKeywordSearch: true,
    cacheEnabled: true,
    logLevel: "info",
  };

  private readonly PERFORMANCE_THRESHOLDS: Record<
    string,
    PerformanceThresholds
  > = {
    balanced: {
      maxEmbeddingTime: 5000,
      maxSearchTime: 2000,
      maxMemoryUsage: 512,
      maxFileSize: 1024 * 1024, // 1MB
      maxConcurrentOperations: 3,
    },
    performance: {
      maxEmbeddingTime: 3000,
      maxSearchTime: 1000,
      maxMemoryUsage: 1024,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      maxConcurrentOperations: 5,
    },
    memory: {
      maxEmbeddingTime: 10000,
      maxSearchTime: 5000,
      maxMemoryUsage: 256,
      maxFileSize: 512 * 1024, // 512KB
      maxConcurrentOperations: 2,
    },
  };

  constructor() {
    this.logger = Logger.initialize("VectorDbConfigurationManager", {
      minLevel: LogLevel.INFO,
    });

    this.setupConfigurationWatcher();
    this.validateConfiguration();
  }

  /**
   * Get the current vector database configuration
   */
  getConfig(): VectorDbConfig {
    if (this.cachedConfig) {
      return { ...this.cachedConfig };
    }

    const workspaceConfig =
      vscode.workspace.getConfiguration("codebuddy.vectorDb");

    this.cachedConfig = {
      enabled: workspaceConfig.get("enabled", this.DEFAULT_CONFIG.enabled),
      embeddingModel: workspaceConfig.get(
        "embeddingModel",
        this.DEFAULT_CONFIG.embeddingModel,
      ),
      maxTokens: workspaceConfig.get(
        "maxTokens",
        this.DEFAULT_CONFIG.maxTokens,
      ),
      batchSize: workspaceConfig.get(
        "batchSize",
        this.DEFAULT_CONFIG.batchSize,
      ),
      searchResultLimit: workspaceConfig.get(
        "searchResultLimit",
        this.DEFAULT_CONFIG.searchResultLimit,
      ),
      enableBackgroundProcessing: workspaceConfig.get(
        "enableBackgroundProcessing",
        this.DEFAULT_CONFIG.enableBackgroundProcessing,
      ),
      enableProgressNotifications: workspaceConfig.get(
        "enableProgressNotifications",
        this.DEFAULT_CONFIG.enableProgressNotifications,
      ),
      progressLocation: workspaceConfig.get(
        "progressLocation",
        this.DEFAULT_CONFIG.progressLocation,
      ),
      debounceDelay: workspaceConfig.get(
        "debounceDelay",
        this.DEFAULT_CONFIG.debounceDelay,
      ),
      performanceMode: workspaceConfig.get(
        "performanceMode",
        this.DEFAULT_CONFIG.performanceMode,
      ),
      fallbackToKeywordSearch: workspaceConfig.get(
        "fallbackToKeywordSearch",
        this.DEFAULT_CONFIG.fallbackToKeywordSearch,
      ),
      cacheEnabled: workspaceConfig.get(
        "cacheEnabled",
        this.DEFAULT_CONFIG.cacheEnabled,
      ),
      logLevel: workspaceConfig.get("logLevel", this.DEFAULT_CONFIG.logLevel),
    };

    return { ...this.cachedConfig };
  }

  /**
   * Get performance thresholds based on current performance mode
   */
  getPerformanceThresholds(): PerformanceThresholds {
    const config = this.getConfig();
    return { ...this.PERFORMANCE_THRESHOLDS[config.performanceMode] };
  }

  /**
   * Get feature flags based on current configuration
   */
  getFeatureFlags(): FeatureFlags {
    const config = this.getConfig();
    const workspaceConfig = vscode.workspace.getConfiguration(
      "codebuddy.vectorDb.features",
    );

    return {
      enableVectorSearch:
        config.enabled && workspaceConfig.get("enableVectorSearch", true),
      enableSemanticSimilarity:
        config.enabled && workspaceConfig.get("enableSemanticSimilarity", true),
      enableSmartRanking:
        config.enabled && workspaceConfig.get("enableSmartRanking", true),
      enableRealtimeSync:
        config.enabled && workspaceConfig.get("enableRealtimeSync", true),
      enableBulkOperations:
        config.enabled && workspaceConfig.get("enableBulkOperations", true),
      enableAnalytics: workspaceConfig.get("enableAnalytics", false),
    };
  }

  /**
   * Update a specific configuration value
   */
  async updateConfig<K extends keyof VectorDbConfig>(
    key: K,
    value: VectorDbConfig[K],
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace,
  ): Promise<void> {
    try {
      const workspaceConfig =
        vscode.workspace.getConfiguration("codebuddy.vectorDb");
      await workspaceConfig.update(key, value, target);

      this.logger.info(`Configuration updated: ${key} = ${value}`);

      // Clear cache to force refresh
      this.cachedConfig = null;

      // Notify listeners
      const newConfig = this.getConfig();
      this.notifyConfigChange(newConfig);
    } catch (error) {
      this.logger.error(`Failed to update configuration ${key}:`, error);
      throw error;
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace,
  ): Promise<void> {
    try {
      const workspaceConfig =
        vscode.workspace.getConfiguration("codebuddy.vectorDb");

      for (const [key, value] of Object.entries(this.DEFAULT_CONFIG)) {
        await workspaceConfig.update(key, value, target);
      }

      this.logger.info("Configuration reset to defaults");

      // Clear cache and notify
      this.cachedConfig = null;
      const newConfig = this.getConfig();
      this.notifyConfigChange(newConfig);

      vscode.window.showInformationMessage(
        "Vector database configuration reset to defaults",
      );
    } catch (error) {
      this.logger.error("Failed to reset configuration:", error);
      vscode.window.showErrorMessage("Failed to reset configuration");
      throw error;
    }
  }

  /**
   * Validate current configuration and show warnings if needed
   */
  validateConfiguration(): boolean {
    const config = this.getConfig();
    const issues: string[] = [];

    // Validate batch size
    if (config.batchSize < 1 || config.batchSize > 50) {
      issues.push(
        `Batch size ${config.batchSize} is outside recommended range (1-50)`,
      );
    }

    // Validate max tokens
    if (config.maxTokens < 1000 || config.maxTokens > 32000) {
      issues.push(
        `Max tokens ${config.maxTokens} is outside recommended range (1000-32000)`,
      );
    }

    // Validate debounce delay
    if (config.debounceDelay < 100 || config.debounceDelay > 10000) {
      issues.push(
        `Debounce delay ${config.debounceDelay}ms is outside recommended range (100-10000ms)`,
      );
    }

    // Validate search result limit
    if (config.searchResultLimit < 1 || config.searchResultLimit > 20) {
      issues.push(
        `Search result limit ${config.searchResultLimit} is outside recommended range (1-20)`,
      );
    }

    if (issues.length > 0) {
      this.logger.warn("Configuration validation issues found:", issues);

      const message = `Vector database configuration issues detected:\\n${issues.join("\\n")}`;
      vscode.window
        .showWarningMessage(message, "Fix Configuration", "Ignore")
        .then((action) => {
          if (action === "Fix Configuration") {
            this.showConfigurationWizard();
          }
        });

      return false;
    }

    return true;
  }

  /**
   * Show configuration wizard for guided setup
   */
  async showConfigurationWizard(): Promise<void> {
    const config = this.getConfig();

    // Step 1: Performance Mode
    const performanceMode = await vscode.window.showQuickPick(
      [
        {
          label: "Balanced",
          description: "Good balance of performance and memory usage",
          detail: "Recommended for most users",
        },
        {
          label: "Performance",
          description: "Optimized for speed, uses more memory",
          detail: "Best for powerful machines",
        },
        {
          label: "Memory",
          description: "Optimized for low memory usage, slower operations",
          detail: "Best for resource-constrained environments",
        },
      ],
      {
        placeHolder: "Select performance mode",
        title: "Vector Database Configuration (1/4)",
      },
    );

    if (!performanceMode) return;

    // Step 2: Background Processing
    const backgroundProcessing = await vscode.window.showQuickPick(
      [
        {
          label: "Enable",
          description: "Process embeddings in background during idle time",
          picked: config.enableBackgroundProcessing,
        },
        {
          label: "Disable",
          description: "Only process embeddings when explicitly requested",
          picked: !config.enableBackgroundProcessing,
        },
      ],
      {
        placeHolder: "Enable background processing?",
        title: "Vector Database Configuration (2/4)",
      },
    );

    if (!backgroundProcessing) return;

    // Step 3: Progress Notifications
    const progressNotifications = await vscode.window.showQuickPick(
      [
        {
          label: "Notification Panel",
          description: "Show progress in notification panel",
          picked: config.progressLocation === "notification",
        },
        {
          label: "Status Bar",
          description: "Show progress in status bar only",
          picked: config.progressLocation === "statusBar",
        },
        {
          label: "Disabled",
          description: "No progress notifications",
          picked: !config.enableProgressNotifications,
        },
      ],
      {
        placeHolder: "How should progress be displayed?",
        title: "Vector Database Configuration (3/4)",
      },
    );

    if (!progressNotifications) return;

    // Step 4: Batch Size
    const batchSizeInput = await vscode.window.showInputBox({
      prompt: "Enter batch size for embedding operations (1-50)",
      value: config.batchSize.toString(),
      validateInput: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 50) {
          return "Please enter a number between 1 and 50";
        }
        return null;
      },
      title: "Vector Database Configuration (4/4)",
    });

    if (!batchSizeInput) return;

    // Apply configuration
    try {
      await this.updateConfig(
        "performanceMode",
        performanceMode.label.toLowerCase() as any,
      );
      await this.updateConfig(
        "enableBackgroundProcessing",
        backgroundProcessing.label === "Enable",
      );

      if (progressNotifications.label === "Disabled") {
        await this.updateConfig("enableProgressNotifications", false);
      } else {
        await this.updateConfig("enableProgressNotifications", true);
        await this.updateConfig(
          "progressLocation",
          progressNotifications.label === "Notification Panel"
            ? "notification"
            : "statusBar",
        );
      }

      await this.updateConfig("batchSize", parseInt(batchSizeInput));

      vscode.window.showInformationMessage(
        "Vector database configuration updated successfully!",
      );
    } catch (error) {
      vscode.window.showErrorMessage("Failed to update configuration");
    }
  }

  /**
   * Auto-tune configuration based on system capabilities and workspace size
   */
  async autoTuneConfiguration(): Promise<void> {
    try {
      this.logger.info("Starting auto-tune configuration...");

      // Analyze workspace
      const workspaceStats = await this.analyzeWorkspace();

      // Determine optimal configuration
      const optimalConfig = this.calculateOptimalConfig(workspaceStats);

      // Apply configuration
      for (const [key, value] of Object.entries(optimalConfig)) {
        await this.updateConfig(key as keyof VectorDbConfig, value);
      }

      this.logger.info("Auto-tune configuration completed");
      vscode.window.showInformationMessage(
        `Configuration auto-tuned for ${workspaceStats.totalFiles} files`,
      );
    } catch (error) {
      this.logger.error("Auto-tune failed:", error);
      vscode.window.showErrorMessage("Failed to auto-tune configuration");
    }
  }

  /**
   * Analyze workspace to determine optimal settings
   */
  private async analyzeWorkspace(): Promise<{
    totalFiles: number;
    averageFileSize: number;
    codeFileTypes: string[];
    estimatedMemoryUsage: number;
  }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return {
        totalFiles: 0,
        averageFileSize: 0,
        codeFileTypes: [],
        estimatedMemoryUsage: 0,
      };
    }

    let totalFiles = 0;
    let totalSize = 0;
    const fileTypes = new Set<string>();

    for (const folder of workspaceFolders) {
      const pattern = new vscode.RelativePattern(
        folder,
        "**/*.{ts,tsx,js,jsx,py,java,cpp,c,cs,go,rs,php,rb}",
      );
      const files = await vscode.workspace.findFiles(
        pattern,
        "**/node_modules/**",
      );

      totalFiles += files.length;

      for (const file of files.slice(0, 100)) {
        // Sample first 100 files
        try {
          const stat = await vscode.workspace.fs.stat(file);
          totalSize += stat.size;

          const ext = file.fsPath.split(".").pop();
          if (ext) fileTypes.add(ext);
        } catch (error) {
          // Ignore files that can't be read
        }
      }
    }

    const averageFileSize =
      totalFiles > 0 ? totalSize / Math.min(totalFiles, 100) : 0;
    const estimatedMemoryUsage =
      (totalFiles * averageFileSize * 2) / (1024 * 1024); // Rough estimate in MB

    return {
      totalFiles,
      averageFileSize,
      codeFileTypes: Array.from(fileTypes),
      estimatedMemoryUsage,
    };
  }

  /**
   * Calculate optimal configuration based on workspace analysis
   */
  private calculateOptimalConfig(stats: {
    totalFiles: number;
    averageFileSize: number;
    estimatedMemoryUsage: number;
  }): Partial<VectorDbConfig> {
    const config: Partial<VectorDbConfig> = {};

    // Determine performance mode
    if (stats.estimatedMemoryUsage > 1000) {
      config.performanceMode = "memory";
      config.batchSize = 5;
    } else if (stats.estimatedMemoryUsage < 200) {
      config.performanceMode = "performance";
      config.batchSize = 15;
    } else {
      config.performanceMode = "balanced";
      config.batchSize = 10;
    }

    // Adjust batch size based on file count
    if (stats.totalFiles > 5000) {
      config.batchSize = Math.min(config.batchSize || 10, 8);
    } else if (stats.totalFiles < 100) {
      config.batchSize = Math.max(config.batchSize || 10, 5);
    }

    // Adjust debounce delay based on project size
    if (stats.totalFiles > 1000) {
      config.debounceDelay = 2000; // Longer delay for large projects
    } else {
      config.debounceDelay = 1000; // Standard delay
    }

    return config;
  }

  /**
   * Setup configuration watcher
   */
  private setupConfigurationWatcher(): void {
    const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("codebuddy.vectorDb")) {
        this.logger.info("Vector database configuration changed");

        // Clear cache
        this.cachedConfig = null;

        // Validate new configuration
        this.validateConfiguration();

        // Notify listeners
        const newConfig = this.getConfig();
        this.notifyConfigChange(newConfig);
      }
    });

    this.disposables.push(configWatcher);
  }

  /**
   * Add configuration change listener
   */
  onConfigChange(
    listener: (config: VectorDbConfig) => void,
  ): vscode.Disposable {
    this.configChangeListeners.push(listener);

    return {
      dispose: () => {
        const index = this.configChangeListeners.indexOf(listener);
        if (index >= 0) {
          this.configChangeListeners.splice(index, 1);
        }
      },
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyConfigChange(config: VectorDbConfig): void {
    for (const listener of this.configChangeListeners) {
      try {
        listener(config);
      } catch (error) {
        this.logger.error("Error in config change listener:", error);
      }
    }
  }

  /**
   * Export current configuration
   */
  exportConfiguration(): string {
    const config = this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(
    configJson: string,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace,
  ): Promise<void> {
    try {
      const config = JSON.parse(configJson) as Partial<VectorDbConfig>;

      // Validate imported config
      for (const [key, value] of Object.entries(config)) {
        if (key in this.DEFAULT_CONFIG) {
          await this.updateConfig(key as keyof VectorDbConfig, value, target);
        }
      }

      vscode.window.showInformationMessage(
        "Configuration imported successfully",
      );
    } catch (error) {
      this.logger.error("Failed to import configuration:", error);
      vscode.window.showErrorMessage(
        "Failed to import configuration: Invalid JSON",
      );
      throw error;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.logger.info("Disposing Vector Database Configuration Manager");

    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    this.configChangeListeners.length = 0;
    this.cachedConfig = null;
  }
}
