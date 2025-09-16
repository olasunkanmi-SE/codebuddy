import { IDependencyContainer } from "../interfaces/services.interface";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * Simple dependency injection container for vector database services
 */
export class DependencyContainer implements IDependencyContainer {
  private services = new Map<string, { factory: () => any; singleton: boolean; instance?: any }>();
  private logger: Logger;

  constructor() {
    this.logger = Logger.initialize("DependencyContainer", {
      minLevel: LogLevel.INFO,
    });
  }

  /**
   * Register a transient service (new instance each time)
   */
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, { factory, singleton: false });
    this.logger.info(`Registered transient service: ${token}`);
  }

  /**
   * Register a singleton service (same instance always)
   */
  registerSingleton<T>(token: string, factory: () => T): void {
    this.services.set(token, { factory, singleton: true });
    this.logger.info(`Registered singleton service: ${token}`);
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: string): T {
    const serviceInfo = this.services.get(token);
    if (!serviceInfo) {
      throw new Error(`Service '${token}' is not registered in the container`);
    }

    if (serviceInfo.singleton) {
      if (!serviceInfo.instance) {
        serviceInfo.instance = serviceInfo.factory();
        this.logger.info(`Created singleton instance for: ${token}`);
      }
      return serviceInfo.instance;
    } else {
      this.logger.debug(`Creating new instance for: ${token}`);
      return serviceInfo.factory();
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Dispose of all singleton instances and clear the container
   */
  dispose(): void {
    this.logger.info("Disposing dependency container...");

    // Dispose of singleton instances that have a dispose method
    for (const [token, serviceInfo] of this.services) {
      if (serviceInfo.singleton && serviceInfo.instance) {
        const instance = serviceInfo.instance;
        if (typeof instance.dispose === "function") {
          try {
            instance.dispose();
            this.logger.info(`Disposed singleton service: ${token}`);
          } catch (error) {
            this.logger.error(`Error disposing service ${token}:`, error);
          }
        }
      }
    }

    this.services.clear();
    this.logger.info("Dependency container disposed");
  }
}

/**
 * Service tokens for dependency injection
 */
export const ServiceTokens = {
  // Core services
  VECTOR_DATABASE_SERVICE: "IVectorDatabaseService",
  VECTOR_DB_WORKER_MANAGER: "IVectorDbWorkerManager",
  VECTOR_DB_SYNC_SERVICE: "IVectorDbSync",

  // Context and search
  SMART_CONTEXT_EXTRACTOR: "ISmartContextExtractor",
  CODE_INDEXER: "ICodeIndexer",

  // User interaction
  USER_FEEDBACK_SERVICE: "IUserFeedbackService",
  CONFIGURATION_MANAGER: "IConfigurationManager",

  // Orchestration
  EMBEDDING_ORCHESTRATOR: "IEmbeddingOrchestrator",

  // External dependencies
  EXTENSION_CONTEXT: "vscode.ExtensionContext",
  API_KEY: "ApiKey",
  LOGGER: "Logger",
} as const;

/**
 * Global dependency container instance
 */
let globalContainer: DependencyContainer | null = null;

/**
 * Get or create the global dependency container
 */
export function getContainer(): DependencyContainer {
  if (!globalContainer) {
    globalContainer = new DependencyContainer();
  }
  return globalContainer;
}

/**
 * Dispose of the global container
 */
export function disposeContainer(): void {
  if (globalContainer) {
    globalContainer.dispose();
    globalContainer = null;
  }
}
