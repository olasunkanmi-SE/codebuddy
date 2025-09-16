import * as vscode from "vscode";
import { VectorDatabaseService } from "./vector-database.service";
import { VectorDbWorkerManager } from "./vector-db-worker-manager";
import { EmbeddingService } from "./embedding-service";
import { FileService } from "./file-service";
import { EmbeddingConfigurationManager } from "./embedding-configuration";
import {
  ImmediateEmbeddingPhase,
  OnDemandEmbeddingPhase,
  BackgroundEmbeddingPhase,
  BulkEmbeddingPhase,
} from "./smart-embedding-phases";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface EmbeddingPhaseFactoryOptions {
  vectorDb: VectorDatabaseService;
  workerManager: VectorDbWorkerManager;
  context: vscode.ExtensionContext;
  enableBackgroundProcessing?: boolean;
  enableProgressReporting?: boolean;
}

export interface EmbeddingPhaseServices {
  embeddingService: EmbeddingService;
  fileService: FileService;
  configManager: EmbeddingConfigurationManager;
  logger: Logger;
}

export interface CreatedPhases {
  immediate: ImmediateEmbeddingPhase;
  onDemand: OnDemandEmbeddingPhase;
  background: BackgroundEmbeddingPhase;
  bulk: BulkEmbeddingPhase;
  services: EmbeddingPhaseServices;
}

/**
 * Factory for creating embedding phase instances with proper dependency injection.
 * Implements the Factory pattern to simplify object creation and configuration.
 */
export class EmbeddingPhaseFactory {
  private static instance: EmbeddingPhaseFactory;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("EmbeddingPhaseFactory", {
      minLevel: LogLevel.INFO,
    });
  }

  static getInstance(): EmbeddingPhaseFactory {
    if (!EmbeddingPhaseFactory.instance) {
      EmbeddingPhaseFactory.instance = new EmbeddingPhaseFactory();
    }
    return EmbeddingPhaseFactory.instance;
  }

  /**
   * Create all embedding phases with shared services
   */
  async createAllPhases(
    options: EmbeddingPhaseFactoryOptions,
  ): Promise<CreatedPhases> {
    this.logger.info("Creating embedding phases with factory");

    // Validate required dependencies
    this.validateDependencies(options);

    // Create shared services
    const services = await this.createSharedServices(options);

    // Create individual phases
    const phases = await this.createIndividualPhases(services, options);

    this.logger.info("All embedding phases created successfully");

    return {
      ...phases,
      services,
    };
  }

  /**
   * Create a specific embedding phase
   */
  async createPhase<T extends keyof CreatedPhases>(
    phaseType: T,
    options: EmbeddingPhaseFactoryOptions,
  ): Promise<CreatedPhases[T]> {
    const services = await this.createSharedServices(options);

    switch (phaseType) {
      case "immediate":
        return this.createImmediatePhase(services, options) as CreatedPhases[T];
      case "onDemand":
        return this.createOnDemandPhase(services, options) as CreatedPhases[T];
      case "background":
        return this.createBackgroundPhase(
          services,
          options,
        ) as CreatedPhases[T];
      case "bulk":
        return this.createBulkPhase(services, options) as CreatedPhases[T];
      default:
        throw new Error(`Unknown phase type: ${phaseType}`);
    }
  }

  /**
   * Create phases with custom configuration
   */
  async createPhasesWithConfig(
    options: EmbeddingPhaseFactoryOptions,
    customConfig?: Partial<
      import("./embedding-configuration").SmartEmbeddingConfig
    >,
  ): Promise<CreatedPhases> {
    const services = await this.createSharedServices(options);

    // Apply custom configuration if provided
    if (customConfig) {
      await services.configManager.updateConfig(customConfig);
    }

    const phases = await this.createIndividualPhases(services, options);

    return {
      ...phases,
      services,
    };
  }

  /**
   * Create minimal phase setup for testing
   */
  async createTestPhases(
    options: EmbeddingPhaseFactoryOptions,
  ): Promise<CreatedPhases> {
    // Override configuration for testing
    const testConfig: Partial<
      import("./embedding-configuration").SmartEmbeddingConfig
    > = {
      immediate: {
        enabled: true,
        batchSize: 2,
        maxFiles: 5,
        delayBetweenBatches: 0,
        timeoutMs: 5000,
        retryAttempts: 1,
        lowPriority: false,
      },
      onDemand: {
        enabled: true,
        batchSize: 2,
        maxFiles: 5,
        delayBetweenBatches: 0,
        timeoutMs: 5000,
        retryAttempts: 1,
        lowPriority: false,
      },
      background: {
        enabled: false,
        batchSize: 2,
        maxFiles: 5,
        delayBetweenBatches: 0,
        timeoutMs: 5000,
        retryAttempts: 1,
        lowPriority: true,
      },
      bulk: {
        enabled: true,
        batchSize: 5,
        maxFiles: 10,
        delayBetweenBatches: 0,
        timeoutMs: 10000,
        retryAttempts: 1,
        lowPriority: true,
      },
      general: {
        maxConcurrentOperations: 1,
        enableProgressReporting: false,
        enableDetailedLogging: true,
        workspaceAnalysisDepth: "shallow" as const,
        embeddingModel: "gemini-2.0-flash",
        embeddingProvider: "gemini" as const,
      },
    };

    return this.createPhasesWithConfig(options, testConfig);
  }

  private async createSharedServices(
    options: EmbeddingPhaseFactoryOptions,
  ): Promise<EmbeddingPhaseServices> {
    const embeddingService = new EmbeddingService(
      options.vectorDb,
      options.workerManager,
    );
    const fileService = new FileService();
    const configManager = EmbeddingConfigurationManager.getInstance();
    const logger = Logger.initialize("EmbeddingPhases", {
      minLevel: LogLevel.INFO,
    });

    this.logger.debug("Shared services created");

    return {
      embeddingService,
      fileService,
      configManager,
      logger,
    };
  }

  private async createIndividualPhases(
    services: EmbeddingPhaseServices,
    options: EmbeddingPhaseFactoryOptions,
  ): Promise<Omit<CreatedPhases, "services">> {
    const immediate = this.createImmediatePhase(services, options);
    const onDemand = this.createOnDemandPhase(services, options);
    const background = this.createBackgroundPhase(services, options);
    const bulk = this.createBulkPhase(services, options);

    return {
      immediate,
      onDemand,
      background,
      bulk,
    };
  }

  private createImmediatePhase(
    services: EmbeddingPhaseServices,
    options: EmbeddingPhaseFactoryOptions,
  ): ImmediateEmbeddingPhase {
    return new ImmediateEmbeddingPhase(options.workerManager);
  }

  private createOnDemandPhase(
    services: EmbeddingPhaseServices,
    options: EmbeddingPhaseFactoryOptions,
  ): OnDemandEmbeddingPhase {
    return new OnDemandEmbeddingPhase(options.workerManager);
  }

  private createBackgroundPhase(
    services: EmbeddingPhaseServices,
    options: EmbeddingPhaseFactoryOptions,
  ): BackgroundEmbeddingPhase {
    return new BackgroundEmbeddingPhase(options.workerManager);
  }

  private createBulkPhase(
    services: EmbeddingPhaseServices,
    options: EmbeddingPhaseFactoryOptions,
  ): BulkEmbeddingPhase {
    return new BulkEmbeddingPhase(options.workerManager);
  }

  private validateDependencies(options: EmbeddingPhaseFactoryOptions): void {
    if (!options.vectorDb) {
      throw new Error("VectorDatabaseService is required");
    }

    if (!options.workerManager) {
      throw new Error("VectorDbWorkerManager is required");
    }

    if (!options.context) {
      throw new Error("VS Code ExtensionContext is required");
    }

    if (!options.vectorDb.isReady()) {
      throw new Error(
        "VectorDatabaseService must be initialized before creating phases",
      );
    }

    if (!options.workerManager.isReady()) {
      throw new Error(
        "VectorDbWorkerManager must be initialized before creating phases",
      );
    }

    this.logger.debug("Dependencies validated successfully");
  }

  /**
   * Create a lightweight phase configuration for specific use cases
   */
  createPhaseConfiguration(
    phaseType: "immediate" | "onDemand" | "background" | "bulk",
  ): {
    enabled: boolean;
    batchSize: number;
    maxFiles: number;
    priority: "high" | "normal" | "low";
  } {
    const configManager = EmbeddingConfigurationManager.getInstance();
    const config = configManager.getPhaseConfig(phaseType);

    return {
      enabled: config.enabled,
      batchSize: configManager.getOptimalBatchSize(phaseType),
      maxFiles: config.maxFiles,
      priority: config.lowPriority
        ? "low"
        : phaseType === "immediate"
          ? "high"
          : "normal",
    };
  }

  /**
   * Dispose all created phases
   */
  static disposePhases(phases: CreatedPhases): void {
    try {
      phases.immediate.dispose();
      phases.onDemand.dispose();
      phases.background.dispose();
      phases.bulk.dispose();
    } catch (error) {
      console.warn("Error disposing embedding phases:", error);
    }
  }
}
