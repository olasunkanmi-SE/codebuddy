import { GeminiLLM } from "./gemini-refactored";
import { Memory } from "../../memory/base";
import { Orchestrator } from "../../agents/orchestrator";
import { GroqLLM } from "../groq/groq";
import { ILlmConfig } from "../interface";
import { getAPIKeyAndModel } from "../../utils/utils";
import {
  IMemoryManager,
  IOrchestrator,
  IFallbackLLM,
  IGeminiLLMConfig,
} from "./interfaces";

/**
 * Memory manager wrapper for dependency injection
 */
class MemoryManagerWrapper implements IMemoryManager {
  get<T>(key: string): T | undefined {
    return Memory.get(key);
  }

  set<T>(key: string, value: T): void {
    Memory.set(key, value);
  }

  delete(key: string): boolean {
    return Memory.delete(key) ?? false;
  }

  has(key: string): boolean {
    return Memory.has(key);
  }

  clear(): void {
    Memory.clear();
  }

  removeItems(key: string, count?: number): void {
    Memory.removeItems(key, count);
  }
}

/**
 * Orchestrator wrapper for dependency injection
 */
class OrchestratorWrapper implements IOrchestrator {
  publish(event: string, data: any): void {
    Orchestrator.getInstance().publish(event as any, data);
  }
}

/**
 * Fallback LLM wrapper for dependency injection
 */
class FallbackLLMWrapper implements IFallbackLLM {
  private groqInstance: GroqLLM | null = null;

  private getGroqInstance(): GroqLLM {
    if (!this.groqInstance) {
      const groqConfig = getAPIKeyAndModel("groq");
      this.groqInstance = GroqLLM.getInstance({
        apiKey: groqConfig.apiKey,
        model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      });
    }
    return this.groqInstance;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      return await this.getGroqInstance().generateText(prompt);
    } catch (error) {
      throw new Error(`Fallback LLM failed: ${error}`);
    }
  }
}

/**
 * Factory for creating production-ready GeminiLLM instances
 */
export class GeminiLLMFactory {
  /**
   * Creates a GeminiLLM instance with proper dependency injection
   */
  static createInstance(
    config: ILlmConfig,
    geminiConfig?: Partial<IGeminiLLMConfig>,
  ): GeminiLLM {
    const memoryManager = new MemoryManagerWrapper();
    const orchestrator = new OrchestratorWrapper();
    const fallbackLLM = new FallbackLLMWrapper();

    // Default configuration
    const defaultGeminiConfig: IGeminiLLMConfig = {
      maxRetries: 3,
      timeoutMs: 30000,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 120000,
      },
      cacheTTL: 300000, // 5 minutes
      enableCaching: true,
      ...geminiConfig,
    };

    return GeminiLLM.create(
      config,
      memoryManager,
      orchestrator,
      fallbackLLM,
      defaultGeminiConfig,
    );
  }

  /**
   * Creates instance with custom dependencies (useful for testing)
   */
  static createWithDependencies(
    config: ILlmConfig,
    memory: IMemoryManager,
    orchestrator: IOrchestrator,
    fallbackLLM: IFallbackLLM,
    geminiConfig?: IGeminiLLMConfig,
  ): GeminiLLM {
    const defaultConfig: IGeminiLLMConfig = {
      maxRetries: 3,
      timeoutMs: 30000,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 120000,
      },
      cacheTTL: 300000,
      enableCaching: true,
      ...geminiConfig,
    };

    return GeminiLLM.create(
      config,
      memory,
      orchestrator,
      fallbackLLM,
      defaultConfig,
    );
  }

  /**
   * Creates singleton instance (backwards compatibility)
   */
  static getInstance(config: ILlmConfig): GeminiLLM {
    return this.createInstance(config);
  }
}
