import * as vscode from "vscode";
import { VectorDatabaseService } from "../services/vector-database.service";
import { VectorDbWorkerManager } from "../services/vector-db-worker-manager";
import { EmbeddingService } from "../services/embedding";
import { getConfigManager, getEmbeddingConfig } from "./configuration-manager";

/**
 * Factory for creating vector database related services
 * Provides dependency injection and consistent configuration
 */
export class VectorServiceFactory {
  private static instance: VectorServiceFactory;
  private configManager = getConfigManager();

  private constructor() {}

  public static getInstance(): VectorServiceFactory {
    if (!VectorServiceFactory.instance) {
      VectorServiceFactory.instance = new VectorServiceFactory();
    }
    return VectorServiceFactory.instance;
  }

  /**
   * Create VectorDatabaseService with proper configuration
   */
  createVectorDatabaseService(
    context: vscode.ExtensionContext,
  ): VectorDatabaseService {
    const { apiKey } = this.configManager.getEmbeddingApiKey();

    if (!apiKey) {
      throw new Error("Gemini API key is required for VectorDatabaseService");
    }

    return new VectorDatabaseService(context, apiKey);
  }

  /**
   * Create EmbeddingService with proper configuration
   */
  createEmbeddingService(): EmbeddingService {
    const { apiKey } = getEmbeddingConfig();

    if (!apiKey) {
      throw new Error("Gemini API key is required for EmbeddingService");
    }

    return new EmbeddingService(apiKey);
  }

  /**
   * Create VectorDbWorkerManager with proper configuration
   */
  createVectorDbWorkerManager(
    context: vscode.ExtensionContext,
  ): VectorDbWorkerManager {
    const vectorDbConfig = this.configManager.getVectorDbConfig();
    const workerConfig = this.configManager.getWorkerConfig();

    return new VectorDbWorkerManager(context, {
      batchSize: vectorDbConfig.batchSize,
      maxEmbeddingWorkers: workerConfig.maxWorkers,
    });
  }

  /**
   * Create all vector services with proper dependency injection
   */
  createVectorServices(context: vscode.ExtensionContext): {
    vectorDatabaseService: VectorDatabaseService;
    embeddingService: EmbeddingService;
    workerManager: VectorDbWorkerManager;
  } {
    // Validate configuration before creating services
    this.validateConfiguration();

    return {
      vectorDatabaseService: this.createVectorDatabaseService(context),
      embeddingService: this.createEmbeddingService(),
      workerManager: this.createVectorDbWorkerManager(context),
    };
  }

  /**
   * Validate that all required configuration is available
   */
  private validateConfiguration(): void {
    const { apiKey } = this.configManager.getEmbeddingApiKey();

    if (!apiKey) {
      throw new Error(
        "Gemini API key is required for vector database functionality. " +
          "Please configure 'google.gemini.apiKeys' in VS Code settings.",
      );
    }

    const vectorDbConfig = this.configManager.getVectorDbConfig();
    if (!vectorDbConfig.enabled) {
      throw new Error("Vector database is disabled in configuration");
    }
  }

  /**
   * Check if vector services can be created
   */
  canCreateServices(): { canCreate: boolean; reason?: string } {
    try {
      this.validateConfiguration();
      return { canCreate: true };
    } catch (error) {
      return {
        canCreate: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get service configuration for diagnostics
   */
  getServiceConfiguration(): {
    embeddingConfig: ReturnType<typeof getEmbeddingConfig>;
    vectorDbConfig: ReturnType<
      typeof VectorServiceFactory.prototype.configManager.getVectorDbConfig
    >;
    workerConfig: ReturnType<
      typeof VectorServiceFactory.prototype.configManager.getWorkerConfig
    >;
  } {
    return {
      embeddingConfig: getEmbeddingConfig(),
      vectorDbConfig: this.configManager.getVectorDbConfig(),
      workerConfig: this.configManager.getWorkerConfig(),
    };
  }
}

/**
 * Convenience function to get service factory instance
 */
export function getVectorServiceFactory(): VectorServiceFactory {
  return VectorServiceFactory.getInstance();
}

/**
 * Convenience function to create all vector services
 */
export function createVectorServices(context: vscode.ExtensionContext) {
  return getVectorServiceFactory().createVectorServices(context);
}
