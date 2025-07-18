/**
 * Example usage of the refactored GeminiLLM class
 * This demonstrates how to use the new dependency injection pattern
 */

import { GeminiLLMFactory } from "./factory";
import { ILlmConfig } from "../interface";

// Example 1: Basic usage with factory
export function createBasicGeminiInstance(): void {
  const config: ILlmConfig = {
    model: "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY || "your-api-key",
    systemInstruction: "You are a helpful coding assistant.",
  };

  const geminiLLM = GeminiLLMFactory.createInstance(config);

  // Use the instance
  geminiLLM
    .run("Write a simple TypeScript function")
    .then((result) => {
      console.log("Result:", result);
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      geminiLLM.dispose();
    });
}

// Example 2: Custom configuration
export function createCustomGeminiInstance(): void {
  const config: ILlmConfig = {
    model: "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY || "your-api-key",
    systemInstruction: "You are a helpful coding assistant.",
  };

  const customConfig = {
    maxRetries: 5,
    timeoutMs: 45000,
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
    },
    cacheTTL: 600000, // 10 minutes
    enableCaching: true,
  };

  const geminiLLM = GeminiLLMFactory.createInstance(config, customConfig);

  // Use the instance with custom configuration
  geminiLLM
    .generateText("Explain dependency injection in TypeScript")
    .then((result) => {
      console.log("Generated text:", result);
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      geminiLLM.dispose();
    });
}

// Example 3: Backwards compatibility (singleton pattern)
export function useBackwardsCompatibility(): void {
  const config: ILlmConfig = {
    model: "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY || "your-api-key",
    systemInstruction: "You are a helpful coding assistant.",
  };

  // This works similar to the old getInstance method
  const geminiLLM = GeminiLLMFactory.getInstance(config);

  geminiLLM
    .generateEmbeddings("Hello world")
    .then((embeddings) => {
      console.log("Embeddings length:", embeddings.length);
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      geminiLLM.dispose();
    });
}

// Example 4: Usage in a class-based service
export class CodeAssistantService {
  private geminiLLM: any;

  constructor() {
    const config: ILlmConfig = {
      model: "gemini-1.5-pro",
      apiKey: process.env.GEMINI_API_KEY || "your-api-key",
      systemInstruction:
        "You are a helpful coding assistant specialized in TypeScript and Node.js.",
    };

    this.geminiLLM = GeminiLLMFactory.createInstance(config, {
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      maxRetries: 3,
    });
  }

  async explainCode(code: string): Promise<string> {
    const prompt = `Explain this code:\n\n${code}`;
    return await this.geminiLLM.generateText(prompt);
  }

  async generateTests(code: string): Promise<string> {
    const prompt = `Generate unit tests for this code:\n\n${code}`;
    return await this.geminiLLM.run(prompt);
  }

  async refactorCode(code: string): Promise<string> {
    const prompt = `Refactor this code to follow best practices:\n\n${code}`;
    return await this.geminiLLM.run(prompt);
  }

  dispose(): void {
    this.geminiLLM.dispose();
  }
}

// Example 5: Error handling and fallback
export async function demonstrateErrorHandling(): Promise<void> {
  const config: ILlmConfig = {
    model: "gemini-1.5-pro",
    apiKey: "invalid-api-key", // Intentionally invalid
    systemInstruction: "You are a helpful coding assistant.",
  };

  const geminiLLM = GeminiLLMFactory.createInstance(config);

  try {
    const result = await geminiLLM.run("Generate a TypeScript interface");
    console.log("Unexpected success:", result);
  } catch (error) {
    console.log("Expected error caught:", error);
    // The circuit breaker and fallback mechanisms will handle this
  } finally {
    geminiLLM.dispose();
  }
}

// Example 6: Performance monitoring
export async function demonstratePerformanceMonitoring(): Promise<void> {
  const config: ILlmConfig = {
    model: "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY || "your-api-key",
    systemInstruction: "You are a helpful coding assistant.",
  };

  const geminiLLM = GeminiLLMFactory.createInstance(config);

  const startTime = Date.now();

  try {
    const queries = [
      "Generate a TypeScript class",
      "Explain async/await in JavaScript",
      "Create a REST API endpoint",
    ];

    // Process queries concurrently
    const results = await Promise.all(
      queries.map((query) => geminiLLM.run(query)),
    );

    const endTime = Date.now();
    console.log(
      `Processed ${queries.length} queries in ${endTime - startTime}ms`,
    );
    console.log(
      "Results:",
      results.map((r) =>
        typeof r === "string" ? r.slice(0, 100) + "..." : "Non-string result",
      ),
    );
  } catch (error) {
    console.error("Performance test failed:", error);
  } finally {
    geminiLLM.dispose();
  }
}

// Export all examples for use
export const examples = {
  createBasicGeminiInstance,
  createCustomGeminiInstance,
  useBackwardsCompatibility,
  CodeAssistantService,
  demonstrateErrorHandling,
  demonstratePerformanceMonitoring,
};
