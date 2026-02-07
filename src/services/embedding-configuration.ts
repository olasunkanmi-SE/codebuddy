import { LanguageUtils } from "../utils/common-utils";
import { EditorHostService } from "./editor-host.service";
import { ConfigurationTarget } from "../interfaces/editor-host";

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
    const workspaceRoot =
      EditorHostService.getInstance().getHost().workspace.rootPath;
    if (!workspaceRoot) {
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
    const config = EditorHostService.getInstance()
      .getHost()
      .workspace.getConfiguration("codebuddy.smartEmbedding");
    const defaults = this.getDefaultConfiguration();

    return {
      immediate: {
        enabled: config.get("immediate.enabled", defaults.immediate.enabled),
        batchSize: config.get(
          "immediate.batchSize",
          defaults.immediate.batchSize,
        ),
        maxFiles: config.get("immediate.maxFiles", defaults.immediate.maxFiles),
        delayBetweenBatches: config.get(
          "immediate.delayBetweenBatches",
          defaults.immediate.delayBetweenBatches,
        ),
        timeoutMs: config.get(
          "immediate.timeoutMs",
          defaults.immediate.timeoutMs,
        ),
        retryAttempts: config.get(
          "immediate.retryAttempts",
          defaults.immediate.retryAttempts,
        ),
        lowPriority: config.get(
          "immediate.lowPriority",
          defaults.immediate.lowPriority,
        ),
      },
      onDemand: {
        enabled: config.get("onDemand.enabled", defaults.onDemand.enabled),
        batchSize: config.get(
          "onDemand.batchSize",
          defaults.onDemand.batchSize,
        ),
        maxFiles: config.get("onDemand.maxFiles", defaults.onDemand.maxFiles),
        delayBetweenBatches: config.get(
          "onDemand.delayBetweenBatches",
          defaults.onDemand.delayBetweenBatches,
        ),
        timeoutMs: config.get(
          "onDemand.timeoutMs",
          defaults.onDemand.timeoutMs,
        ),
        retryAttempts: config.get(
          "onDemand.retryAttempts",
          defaults.onDemand.retryAttempts,
        ),
        lowPriority: config.get(
          "onDemand.lowPriority",
          defaults.onDemand.lowPriority,
        ),
      },
      background: {
        enabled: config.get("background.enabled", defaults.background.enabled),
        batchSize: config.get(
          "background.batchSize",
          defaults.background.batchSize,
        ),
        maxFiles: config.get(
          "background.maxFiles",
          defaults.background.maxFiles,
        ),
        delayBetweenBatches: config.get(
          "background.delayBetweenBatches",
          defaults.background.delayBetweenBatches,
        ),
        timeoutMs: config.get(
          "background.timeoutMs",
          defaults.background.timeoutMs,
        ),
        retryAttempts: config.get(
          "background.retryAttempts",
          defaults.background.retryAttempts,
        ),
        lowPriority: config.get(
          "background.lowPriority",
          defaults.background.lowPriority,
        ),
      },
      bulk: {
        enabled: config.get("bulk.enabled", defaults.bulk.enabled),
        batchSize: config.get("bulk.batchSize", defaults.bulk.batchSize),
        maxFiles: config.get("bulk.maxFiles", defaults.bulk.maxFiles),
        delayBetweenBatches: config.get(
          "bulk.delayBetweenBatches",
          defaults.bulk.delayBetweenBatches,
        ),
        timeoutMs: config.get("bulk.timeoutMs", defaults.bulk.timeoutMs),
        retryAttempts: config.get(
          "bulk.retryAttempts",
          defaults.bulk.retryAttempts,
        ),
        lowPriority: config.get("bulk.lowPriority", defaults.bulk.lowPriority),
      },
      sync: {
        enabled: config.get("sync.enabled", defaults.sync.enabled),
        filePatterns: config.get(
          "sync.filePatterns",
          defaults.sync.filePatterns,
        ),
        excludePatterns: config.get(
          "sync.excludePatterns",
          defaults.sync.excludePatterns,
        ),
        syncDelayMs: config.get("sync.syncDelayMs", defaults.sync.syncDelayMs),
        batchSize: config.get("sync.batchSize", defaults.sync.batchSize),
        maxBatchSize: config.get(
          "sync.maxBatchSize",
          defaults.sync.maxBatchSize,
        ),
        enableBackgroundSync: config.get(
          "sync.enableBackgroundSync",
          defaults.sync.enableBackgroundSync,
        ),
        enableFileWatching: config.get(
          "sync.enableFileWatching",
          defaults.sync.enableFileWatching,
        ),
      },
      general: {
        maxConcurrentOperations: config.get(
          "general.maxConcurrentOperations",
          defaults.general.maxConcurrentOperations,
        ),
        enableProgressReporting: config.get(
          "general.enableProgressReporting",
          defaults.general.enableProgressReporting,
        ),
        enableDetailedLogging: config.get(
          "general.enableDetailedLogging",
          defaults.general.enableDetailedLogging,
        ),
        workspaceAnalysisDepth: config.get(
          "general.workspaceAnalysisDepth",
          defaults.general.workspaceAnalysisDepth,
        ),
        embeddingModel: config.get(
          "general.embeddingModel",
          defaults.general.embeddingModel,
        ),
        embeddingProvider: config.get(
          "general.embeddingProvider",
          defaults.general.embeddingProvider,
        ),
      },
    };
  }

  private async saveConfiguration(): Promise<void> {
    const config = EditorHostService.getInstance()
      .getHost()
      .workspace.getConfiguration("codebuddy.smartEmbedding");

    // Save immediate phase config
    await config.update(
      "immediate",
      this.config.immediate,
      ConfigurationTarget.Workspace,
    );
    await config.update(
      "onDemand",
      this.config.onDemand,
      ConfigurationTarget.Workspace,
    );
    await config.update(
      "background",
      this.config.background,
      ConfigurationTarget.Workspace,
    );
    await config.update(
      "bulk",
      this.config.bulk,
      ConfigurationTarget.Workspace,
    );
    await config.update(
      "sync",
      this.config.sync,
      ConfigurationTarget.Workspace,
    );
    await config.update(
      "general",
      this.config.general,
      ConfigurationTarget.Workspace,
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
