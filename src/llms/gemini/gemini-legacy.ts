import {
  EmbedContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import * as vscode from "vscode";
import { BaseLLM } from "../base";
import { ILlmConfig, GeminiLLMSnapShot } from "../interface";
import { Logger } from "../../infrastructure/logger/logger";
import { LogLevel } from "../../services/telemetry";
import { GeminiLLMFactory } from "./factory";
import { GeminiLLM as RefactoredGeminiLLM } from "./gemini-refactored";
import { IGeminiSnapshot } from "./interfaces";

/**
 * Legacy GeminiLLM class for backwards compatibility
 * @deprecated Use GeminiLLMFactory.createInstance() instead
 *
 * This class wraps the refactored implementation to maintain backwards compatibility
 * while providing all the new production-ready features.
 */
export class GeminiLLM
  extends BaseLLM<GeminiLLMSnapShot>
  implements vscode.Disposable
{
  private static instance: GeminiLLM | undefined;
  private refactoredInstance: RefactoredGeminiLLM;

  constructor(config: ILlmConfig) {
    super(config);
    this.logger = Logger.initialize("GeminiLLM", { minLevel: LogLevel.DEBUG });

    // Create the refactored instance internally
    this.refactoredInstance = GeminiLLMFactory.createInstance(config);

    this.logger.warn(
      "Using legacy GeminiLLM class. Consider migrating to GeminiLLMFactory.createInstance()",
    );
  }

  /**
   * @deprecated Use GeminiLLMFactory.createInstance() instead
   */
  static getInstance(config: ILlmConfig): GeminiLLM {
    GeminiLLM.instance ??= new GeminiLLM(config);
    return GeminiLLM.instance;
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    return this.refactoredInstance.generateEmbeddings(text);
  }

  public async generateText(
    prompt: string,
    instruction?: string,
  ): Promise<string> {
    return this.refactoredInstance.generateText(prompt, instruction);
  }

  public getModel(modelParams?: Partial<ILlmConfig>): GenerativeModel {
    return this.refactoredInstance.getModel(modelParams);
  }

  public async run(
    userQuery: string,
  ): Promise<string | GenerateContentResult | undefined> {
    return this.refactoredInstance.run(userQuery);
  }

  // Legacy methods for backwards compatibility
  public async generateContentWithTools(
    userInput: string,
  ): Promise<GenerateContentResult> {
    const result = await this.refactoredInstance.run(userInput);
    if (typeof result === "object" && result !== null && "response" in result) {
      return result as GenerateContentResult;
    }
    throw new Error("Unable to generate content with tools");
  }

  public calculateDynamicCallLimit(userQuery: string): number {
    // Legacy method - now handled internally by the refactored implementation
    const baseLimit = 5;
    const queryLength = userQuery.length;
    const complexityFactor = Math.min(1 + Math.floor(queryLength / 100), 3);
    return baseLimit * complexityFactor;
  }

  public createSnapShot(data?: any): GeminiLLMSnapShot {
    const refactoredSnapshot = this.refactoredInstance.createSnapShot(data);

    // Convert to legacy format
    return {
      ...refactoredSnapshot,
      response: refactoredSnapshot.response || ({} as any),
      embedding: refactoredSnapshot.embedding || ({} as any),
    } as GeminiLLMSnapShot;
  }

  public loadSnapShot(snapshot: GeminiLLMSnapShot): void {
    // Convert from legacy format to new format
    const newSnapshot: IGeminiSnapshot = {
      lastQuery: snapshot.lastQuery,
      lastCall: snapshot.lastCall,
      lastResult: snapshot.lastResult,
      chatHistory: snapshot.chatHistory,
      planSteps: snapshot.planSteps,
      currentStepIndex: snapshot.currentStepIndex,
      response: (snapshot as any).response,
      embedding: (snapshot as any).embedding,
      timestamp: Date.now(),
      version: "1.0.0",
    };

    this.refactoredInstance.loadSnapShot(newSnapshot);
  }

  public dispose(): void {
    this.refactoredInstance.dispose();

    // Clear singleton instance
    if (GeminiLLM.instance === this) {
      GeminiLLM.instance = undefined;
    }

    this.logger.info("Legacy GeminiLLM disposed");
  }

  // Additional legacy compatibility methods
  private get orchestrator() {
    this.logger.warn("Direct orchestrator access is deprecated");
    return {
      publish: (event: string, data: any) => {
        this.logger.debug("Legacy orchestrator publish", { event, data });
      },
    };
  }

  private get groqLLM() {
    this.logger.warn(
      "Direct groqLLM access is deprecated - fallback is now handled internally",
    );
    return {
      generateText: async (prompt: string) => {
        this.logger.warn(
          "Using internal fallback mechanism instead of direct groqLLM access",
        );
        return "Fallback response";
      },
    };
  }

  // Legacy getters for backwards compatibility
  public get timeOutMs(): number {
    return 30000; // Default timeout
  }

  public get lastFunctionCalls(): Set<string> {
    this.logger.warn(
      "lastFunctionCalls access is deprecated - now handled internally",
    );
    return new Set<string>();
  }

  public get planSteps(): string[] {
    this.logger.warn("planSteps access is deprecated - now handled internally");
    return [];
  }

  public get currentStepIndex(): number {
    this.logger.warn(
      "currentStepIndex access is deprecated - now handled internally",
    );
    return 0;
  }

  public get initialThought(): string {
    this.logger.warn(
      "initialThought access is deprecated - now handled internally",
    );
    return "";
  }

  public get userQuery(): string {
    this.logger.warn("userQuery access is deprecated - now handled internally");
    return "";
  }
}
