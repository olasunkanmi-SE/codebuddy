import {
  Content,
  EmbedContentResponse,
  FunctionCall,
  GenerateContentResult,
} from "@google/generative-ai";

/**
 * Interface for memory management
 */
export interface IMemoryManager {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  clear(): void;
  removeItems(key: string, count?: number): void;
}

/**
 * Interface for event orchestration
 */
export interface IOrchestrator {
  publish(event: string, data: any): void;
}

/**
 * Interface for fallback LLM
 */
export interface IFallbackLLM {
  generateText(prompt: string): Promise<string>;
}

/**
 * Configuration for circuit breaker pattern
 */
export interface ICircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

/**
 * Enhanced snapshot interface with validation
 */
export interface IGeminiSnapshot {
  lastQuery?: string;
  lastCall?: string;
  lastResult?: any;
  chatHistory?: Content[];
  planSteps?: string[];
  currentStepIndex?: number;
  response?: any;
  embedding?: any;
  timestamp: number;
  version: string;
}

/**
 * Tool execution result interface
 */
export interface IToolExecutionResult {
  name: string;
  content: any;
  success: boolean;
  executionTime: number;
  error?: Error;
}

/**
 * Configuration for GeminiLLM
 */
export interface IGeminiLLMConfig {
  maxRetries: number;
  timeoutMs: number;
  circuitBreaker: ICircuitBreakerConfig;
  cacheTTL: number;
  enableCaching: boolean;
}

/**
 * Query processing result interface
 */
export interface IQueryProcessingResult {
  result: any;
  shouldBreak: boolean;
}
