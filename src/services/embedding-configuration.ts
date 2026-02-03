import * as vscode from "vscode";
import { LanguageUtils } from "../utils/common-utils";

export interface EmbeddingPhaseConfig {
  enabled: boolean;
  batchSize: number;
  maxFiles: number;
  delayBetweenBatches: number;
  timeoutMs: number;
  retryAttempts: number;
  lowPriority: boolean;
}

export interface VectorDbSyncConfig {
  enabled: boolean;
  filePatterns: string[];
  excludePatterns: string[];
  syncDelayMs: number;
  batchSize: number;
  maxBatchSize: number;
  enableBackgroundSync: boolean;
  enableFileWatching: boolean;
}

export interface SmartEmbeddingConfig {
  immediate: EmbeddingPhaseConfig;
  onDemand: EmbeddingPhaseConfig;
  background: EmbeddingPhaseConfig;
  bulk: EmbeddingPhaseConfig;
  sync: VectorDbSyncConfig;
  general: {
    maxConcurrentOperations: number;
    enableProgressReporting: boolean;
    enableDetailedLogging: boolean;
    workspaceAnalysisDepth: "shallow" | "medium" | "deep";
    embeddingModel: string;
    embeddingProvider: "gemini" | "openai" | "local";
  };
}

/**
 * Configuration manager for smart embedding phases.
 * Provides centralized configuration with defaults and user overrides.
 */
export class EmbeddingConfigurationManager {
  private static instance: EmbeddingConfigurationManager;
  private config: SmartEmbeddingConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): EmbeddingConfigurationManager {
    if (!EmbeddingConfigurationManager.instance) {
      EmbeddingConfigurationManager.instance =
        new EmbeddingConfigurationManager();
    }
    return EmbeddingConfigurationManager.instance;
  }

  /**
   * Get complete configuration
   */
  getConfig(): SmartEmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Get configuration for specific embedding phase
   */
  getPhaseConfig(
    phase: "immediate" | "onDemand" | "background" | "bulk",
  ): EmbeddingPhaseConfig {
    return { ...this.config[phase] };
  }

  /**
   * Get sync configuration
   */
  getSyncConfig(): VectorDbSyncConfig {
    return { ...this.config.sync };
  }

  /**
   * Update configuration (persists to VS Code settings)
   */
  async updateConfig(updates: Partial<SmartEmbeddingConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfiguration();
  }

  /**
   * Update specific phase configuration
   */
  async updatePhaseConfig(
    phase: "immediate" | "onDemand" | "background" | "bulk",
    updates: Partial<EmbeddingPhaseConfig>,
  ): Promise<void> {
    this.config[phase] = { ...this.config[phase], ...updates };
    await this.saveConfiguration();
  }

  /**
   * Reset to default configuration
   */
  async resetToDefaults(): Promise<void> {
    this.config = this.getDefaultConfiguration();
    await this.saveConfiguration();
  }

  /**
   * Get file patterns for monitoring
   */
  getFilePatterns(): string[] {
    return this.config.sync.filePatterns;
  }

  /**
   * Get exclude patterns
   */
  getExcludePatterns(): string[] {
    return this.config.sync.excludePatterns;
  }

  /**
   * Check if background processing should be enabled based on workspace size
   */
  shouldEnableBackgroundProcessing(): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return false;
    }

    // Enable background processing based on configuration and workspace size
    return (
      this.config.background.enabled && this.config.sync.enableBackgroundSync
    );
  }

  /**
   * Get optimal batch size based on system resources and configuration
   */
  getOptimalBatchSize(
    phase: "immediate" | "onDemand" | "background" | "bulk",
  ): number {
    const baseSize = this.config[phase].batchSize;

    // Adjust based on system capabilities (simplified)
    const memoryGB =
      Math.round((process.memoryUsage().heapTotal / 1024 / 1024 / 1024) * 10) /
      10;

    if (memoryGB < 1) {
      return Math.max(1, Math.floor(baseSize * 0.5));
    } else if (memoryGB > 4) {
      return Math.floor(baseSize * 1.5);
    }

    return baseSize;
  }

  private loadConfiguration(): SmartEmbeddingConfig {
    const vsCodeConfig = vscode.workspace.getConfiguration(
      "codebuddy.smartEmbedding",
    );
    const defaults = this.getDefaultConfiguration();

    return {
      immediate: {
        enabled: vsCodeConfig.get(
          "immediate.enabled",
          defaults.immediate.enabled,
        ),
        batchSize: vsCodeConfig.get(
          "immediate.batchSize",
          defaults.immediate.batchSize,
        ),
        maxFiles: vsCodeConfig.get(
          "immediate.maxFiles",
          defaults.immediate.maxFiles,
        ),
        delayBetweenBatches: vsCodeConfig.get(
          "immediate.delayBetweenBatches",
          defaults.immediate.delayBetweenBatches,
        ),
        timeoutMs: vsCodeConfig.get(
          "immediate.timeoutMs",
          defaults.immediate.timeoutMs,
        ),
        retryAttempts: vsCodeConfig.get(
          "immediate.retryAttempts",
          defaults.immediate.retryAttempts,
        ),
        lowPriority: vsCodeConfig.get(
          "immediate.lowPriority",
          defaults.immediate.lowPriority,
        ),
      },
      onDemand: {
        enabled: vsCodeConfig.get(
          "onDemand.enabled",
          defaults.onDemand.enabled,
        ),
        batchSize: vsCodeConfig.get(
          "onDemand.batchSize",
          defaults.onDemand.batchSize,
        ),
        maxFiles: vsCodeConfig.get(
          "onDemand.maxFiles",
          defaults.onDemand.maxFiles,
        ),
        delayBetweenBatches: vsCodeConfig.get(
          "onDemand.delayBetweenBatches",
          defaults.onDemand.delayBetweenBatches,
        ),
        timeoutMs: vsCodeConfig.get(
          "onDemand.timeoutMs",
          defaults.onDemand.timeoutMs,
        ),
        retryAttempts: vsCodeConfig.get(
          "onDemand.retryAttempts",
          defaults.onDemand.retryAttempts,
        ),
        lowPriority: vsCodeConfig.get(
          "onDemand.lowPriority",
          defaults.onDemand.lowPriority,
        ),
      },
      background: {
        enabled: vsCodeConfig.get(
          "background.enabled",
          defaults.background.enabled,
        ),
        batchSize: vsCodeConfig.get(
          "background.batchSize",
          defaults.background.batchSize,
        ),
        maxFiles: vsCodeConfig.get(
          "background.maxFiles",
          defaults.background.maxFiles,
        ),
        delayBetweenBatches: vsCodeConfig.get(
          "background.delayBetweenBatches",
          defaults.background.delayBetweenBatches,
        ),
        timeoutMs: vsCodeConfig.get(
          "background.timeoutMs",
          defaults.background.timeoutMs,
        ),
        retryAttempts: vsCodeConfig.get(
          "background.retryAttempts",
          defaults.background.retryAttempts,
        ),
        lowPriority: vsCodeConfig.get(
          "background.lowPriority",
          defaults.background.lowPriority,
        ),
      },
      bulk: {
        enabled: vsCodeConfig.get("bulk.enabled", defaults.bulk.enabled),
        batchSize: vsCodeConfig.get("bulk.batchSize", defaults.bulk.batchSize),
        maxFiles: vsCodeConfig.get("bulk.maxFiles", defaults.bulk.maxFiles),
        delayBetweenBatches: vsCodeConfig.get(
          "bulk.delayBetweenBatches",
          defaults.bulk.delayBetweenBatches,
        ),
        timeoutMs: vsCodeConfig.get("bulk.timeoutMs", defaults.bulk.timeoutMs),
        retryAttempts: vsCodeConfig.get(
          "bulk.retryAttempts",
          defaults.bulk.retryAttempts,
        ),
        lowPriority: vsCodeConfig.get(
          "bulk.lowPriority",
          defaults.bulk.lowPriority,
        ),
      },
      sync: {
        enabled: vsCodeConfig.get("sync.enabled", defaults.sync.enabled),
        filePatterns: vsCodeConfig.get(
          "sync.filePatterns",
          defaults.sync.filePatterns,
        ),
        excludePatterns: vsCodeConfig.get(
          "sync.excludePatterns",
          defaults.sync.excludePatterns,
        ),
        syncDelayMs: vsCodeConfig.get(
          "sync.syncDelayMs",
          defaults.sync.syncDelayMs,
        ),
        batchSize: vsCodeConfig.get("sync.batchSize", defaults.sync.batchSize),
        maxBatchSize: vsCodeConfig.get(
          "sync.maxBatchSize",
          defaults.sync.maxBatchSize,
        ),
        enableBackgroundSync: vsCodeConfig.get(
          "sync.enableBackgroundSync",
          defaults.sync.enableBackgroundSync,
        ),
        enableFileWatching: vsCodeConfig.get(
          "sync.enableFileWatching",
          defaults.sync.enableFileWatching,
        ),
      },
      general: {
        maxConcurrentOperations: vsCodeConfig.get(
          "general.maxConcurrentOperations",
          defaults.general.maxConcurrentOperations,
        ),
        enableProgressReporting: vsCodeConfig.get(
          "general.enableProgressReporting",
          defaults.general.enableProgressReporting,
        ),
        enableDetailedLogging: vsCodeConfig.get(
          "general.enableDetailedLogging",
          defaults.general.enableDetailedLogging,
        ),
        workspaceAnalysisDepth: vsCodeConfig.get(
          "general.workspaceAnalysisDepth",
          defaults.general.workspaceAnalysisDepth,
        ),
        embeddingModel: vsCodeConfig.get(
          "general.embeddingModel",
          defaults.general.embeddingModel,
        ),
        embeddingProvider: vsCodeConfig.get(
          "general.embeddingProvider",
          defaults.general.embeddingProvider,
        ),
      },
    };
  }

  private async saveConfiguration(): Promise<void> {
    const vsCodeConfig = vscode.workspace.getConfiguration(
      "codebuddy.smartEmbedding",
    );

    // Save immediate phase config
    await vsCodeConfig.update(
      "immediate",
      this.config.immediate,
      vscode.ConfigurationTarget.Workspace,
    );
    await vsCodeConfig.update(
      "onDemand",
      this.config.onDemand,
      vscode.ConfigurationTarget.Workspace,
    );
    await vsCodeConfig.update(
      "background",
      this.config.background,
      vscode.ConfigurationTarget.Workspace,
    );
    await vsCodeConfig.update(
      "bulk",
      this.config.bulk,
      vscode.ConfigurationTarget.Workspace,
    );
    await vsCodeConfig.update(
      "sync",
      this.config.sync,
      vscode.ConfigurationTarget.Workspace,
    );
    await vsCodeConfig.update(
      "general",
      this.config.general,
      vscode.ConfigurationTarget.Workspace,
    );
  }

  private getDefaultConfiguration(): SmartEmbeddingConfig {
    const codeExtensions = LanguageUtils.getCodeFileExtensions();
    const filePatterns = codeExtensions.map((ext) => `**/*.${ext}`);

    return {
      immediate: {
        enabled: true,
        batchSize: 5,
        maxFiles: 20,
        delayBetweenBatches: 100,
        timeoutMs: 30000,
        retryAttempts: 3,
        lowPriority: false,
      },
      onDemand: {
        enabled: true,
        batchSize: 3,
        maxFiles: 15,
        delayBetweenBatches: 200,
        timeoutMs: 20000,
        retryAttempts: 2,
        lowPriority: false,
      },
      background: {
        enabled: true,
        batchSize: 10,
        maxFiles: 100,
        delayBetweenBatches: 1000,
        timeoutMs: 60000,
        retryAttempts: 1,
        lowPriority: true,
      },
      bulk: {
        enabled: true,
        batchSize: 20,
        maxFiles: -1, // No limit
        delayBetweenBatches: 500,
        timeoutMs: 120000,
        retryAttempts: 2,
        lowPriority: true,
      },
      sync: {
        enabled: true,
        filePatterns,
        excludePatterns: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/out/**",
          "**/.git/**",
          "**/.codebuddy/**",
          "**/coverage/**",
          "**/.vscode-test/**",
          "**/*.min.js",
          "**/*.bundle.js",
          "**/*.d.ts",
          "**/.DS_Store",
          "**/Thumbs.db",
        ],
        syncDelayMs: 1000,
        batchSize: 10,
        maxBatchSize: 50,
        enableBackgroundSync: true,
        enableFileWatching: true,
      },
      general: {
        maxConcurrentOperations: 3,
        enableProgressReporting: true,
        enableDetailedLogging: false,
        workspaceAnalysisDepth: "medium",
        embeddingModel: "gemini-2.0-flash",
        embeddingProvider: "gemini",
      },
    };
  }
}
