import {
  EmbedContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import * as vscode from "vscode";
import { BaseLLM } from "../base";
import {
  ILlmConfig,
  GeminiLLMSnapShot,
  GeminiModelResponseType,
} from "../interface";
import { Logger } from "../../infrastructure/logger/logger";
import { LogLevel } from "../../services/telemetry";
import { GeminiLLM as RefactoredGeminiLLM } from "./gemini-refactored";
import { GeminiLLMFactory } from "./factory";
import { IGeminiSnapshot } from "./interfaces";

/**
 * GeminiLLM class provides integration with Google's Gemini AI model
 * This implementation uses the refactored GeminiLLM internally while maintaining
 * backwards compatibility with the existing interface.
 *
 * @deprecated Consider using GeminiLLMFactory.createInstance() for new code
 */
export class GeminiLLM
  extends BaseLLM<IGeminiSnapshot>
  implements vscode.Disposable
{
  private static instance: GeminiLLM | undefined;
  private refactoredInstance: RefactoredGeminiLLM;
  private model: GenerativeModel;
  private readonly timeOutMs = 30000;
  private readonly disposables: vscode.Disposable[] = [];
  private lastQuery?: string;
  private lastResult?: any;
  private lastCall?: any;

  constructor(config: ILlmConfig) {
    super(config);
    this.logger = Logger.initialize("GeminiLLM", { minLevel: LogLevel.DEBUG });

    // Create the refactored instance internally for actual functionality
    this.refactoredInstance = GeminiLLMFactory.createInstance(config);

    // Initialize model for backwards compatibility
    const genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = genAI.getGenerativeModel({ model: config.model });

    this.initializeDisposables();
    this.setupCacheCleanup();
  }

  /**
   * @deprecated Use GeminiLLMFactory.createInstance() instead
   */
  static getInstance(config: ILlmConfig): GeminiLLM {
    GeminiLLM.instance ??= new GeminiLLM(config);
    return GeminiLLM.instance;
  }

  private initializeDisposables(): void {
    // Add cleanup logic here if needed
    this.logger.debug("Initializing disposables");
  }

  private setupCacheCleanup(): void {
    // Add cache cleanup logic here if needed
    this.logger.debug("Setting up cache cleanup");
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
    this.lastQuery = userQuery;
    const result = await this.refactoredInstance.run(userQuery);
    this.lastResult = result;
    return result;
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

  public createSnapShot(data?: any): IGeminiSnapshot {
    const refactoredSnapshot = this.refactoredInstance.createSnapShot(data);
    return refactoredSnapshot;
  }

  public loadSnapShot(snapshot: IGeminiSnapshot): void {
    this.refactoredInstance.loadSnapShot(snapshot);
  }

  public dispose(): void {
    this.refactoredInstance.dispose();

    // Dispose of local resources
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables.length = 0;

    // Clear singleton instance
    if (GeminiLLM.instance === this) {
      GeminiLLM.instance = undefined;
    }

    this.logger.info("GeminiLLM disposed");
  }

  // Legacy property getters for backwards compatibility
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
    return this.lastQuery || "";
  }

  public get lastFunctionCalls(): Set<string> {
    this.logger.warn(
      "lastFunctionCalls access is deprecated - now handled internally",
    );
    return new Set<string>();
  }

  // Legacy orchestrator access (deprecated)
  private get orchestrator() {
    this.logger.warn("Direct orchestrator access is deprecated");
    return {
      publish: (event: string, data: any) => {
        this.logger.debug("Legacy orchestrator publish", { event, data });
      },
    };
  }

  // Legacy groqLLM access (deprecated)
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

  // Legacy methods that may be called by existing code
  public prompts(props: { title: string; query: string }): {
    urlRelevanceScore: string;
  } {
    return {
      urlRelevanceScore: `
      You are an expert in natural language processing. Your task is to first generate a list of 10 keywords or phrases that are synonyms or semantically related to a given user query. Then, evaluate how relevant a webpage title is to these generated keywords based on semantic similarity, synonyms, and overall meaning—not just exact matches. Consider the following:

      - Query: "${props.query}"
      - Title: "${props.title}"

      Return your response in this format:

      - Score: [number]
    `,
    };
  }
}

// Export for backwards compatibility
export default GeminiLLM;
