import { EditorHostService } from "../services/editor-host.service";
import { getAPIKeyAndModel } from "./utils";

/**
 * Centralized configuration access for CodeBuddy
 * Provides consistent API key and model retrieval across the application
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get configuration value with type safety
   */
  private getConfig<T>(key: string, defaultValue: T): T {
    try {
      const config = EditorHostService.getInstance()
        .getHost()
        .workspace.getConfiguration();
      return config.get<T>(key, defaultValue);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get embedding API key and provider - always uses Gemini for consistency
   */
  getEmbeddingApiKey(): { apiKey: string; provider: string } {
    const embeddingProvider = "Gemini"; // Always use Gemini for consistency
    const { apiKey } = getAPIKeyAndModel(embeddingProvider);
    return { apiKey, provider: embeddingProvider };
  }

  /**
   * Get current chat model API key and provider
   */
  getChatApiKey(): { apiKey: string; provider: string } {
    const currentModel = this.getConfig<string>(
      "generativeAi.option",
      "Gemini",
    );
    const { apiKey } = getAPIKeyAndModel(currentModel);
    return { apiKey, provider: currentModel };
  }

  /**
   * Get embedding model configuration
   */
  getEmbeddingModel(): string {
    return this.getConfig<string>(
      "codebuddy.embeddingModel",
      "gemini-2.0-flash",
    );
  }

  /**
   * Get vector database configuration
   */
  getVectorDbConfig(): {
    enabled: boolean;
    chromaUrl: string;
    maxResults: number;
    batchSize: number;
  } {
    return {
      enabled: this.getConfig<boolean>("codebuddy.vectorDb.enabled", true),
      chromaUrl: this.getConfig<string>(
        "codebuddy.vectorDb.chromaUrl",
        "http://localhost:8000",
      ),
      maxResults: this.getConfig<number>("codebuddy.vectorDb.maxResults", 10),
      batchSize: this.getConfig<number>("codebuddy.vectorDb.batchSize", 50),
    };
  }

  /**
   * Get worker configuration
   */
  getWorkerConfig(): {
    maxWorkers: number;
    timeout: number;
    retries: number;
  } {
    return {
      maxWorkers: this.getConfig<number>("codebuddy.workers.maxWorkers", 4),
      timeout: this.getConfig<number>("codebuddy.workers.timeout", 30000),
      retries: this.getConfig<number>("codebuddy.workers.retries", 3),
    };
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return this.getConfig<boolean>(`codebuddy.features.${feature}`, true);
  }

  /**
   * Get all Gemini API keys (for consistency checks)
   */
  getGeminiApiKey(): string {
    return this.getConfig<string>("google.gemini.apiKeys", "");
  }

  /**
   * Get embedding configuration for services
   */
  getEmbeddingServiceConfig(): {
    apiKey: string;
    model: string;
    batchSize: number;
    maxRetries: number;
    rateLimit: number;
  } {
    const { apiKey } = this.getEmbeddingApiKey();
    return {
      apiKey,
      model: this.getEmbeddingModel(),
      batchSize: this.getConfig<number>("codebuddy.embedding.batchSize", 10),
      maxRetries: this.getConfig<number>("codebuddy.embedding.maxRetries", 3),
      rateLimit: this.getConfig<number>("codebuddy.embedding.rateLimit", 60),
    };
  }
}

/**
 * Convenience function to get configuration manager instance
 */
export function getConfigManager(): ConfigurationManager {
  return ConfigurationManager.getInstance();
}

/**
 * Convenience function to get embedding configuration
 */
export function getEmbeddingConfig(): {
  apiKey: string;
  model: string;
  provider: string;
} {
  const config = getConfigManager();
  const { apiKey, provider } = config.getEmbeddingApiKey();
  const model = config.getEmbeddingModel();
  return { apiKey, model, provider };
}
