import {
  EmbedContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import * as vscode from "vscode";
import { Orchestrator } from "../../agents/orchestrator";
import { ProcessInputResult } from "../../application/interfaces/agent.interface";
import { createPrompt } from "../../utils/prompt";
import { BaseLLM } from "../base";
import { GeminiModelResponseType, ILlmConfig } from "../interface";

export class GeminiLLM
  extends BaseLLM<GeminiModelResponseType>
  implements vscode.Disposable
{
  private readonly generativeAi: GoogleGenerativeAI;
  private response: EmbedContentResponse | GenerateContentResult | undefined;
  protected readonly orchestrator: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.generativeAi = new GoogleGenerativeAI(this.config.apiKey);
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const model: GenerativeModel = this.getModel();
      const result: EmbedContentResponse = await model.embedContent(text);
      this.response = result;
      return result.embedding.values;
    } catch (error) {
      this.logger.error("Error generating embeddings", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  public async generateText(prompt: string): Promise<string> {
    try {
      const model = this.getModel();
      const result: GenerateContentResult = await model.generateContent(prompt);
      this.response = result;
      return result.response.text();
    } catch (error) {
      this.logger.error("Error generating text", error);
      throw new Error("Failed to generate text");
    }
  }

  getModel(): GenerativeModel {
    try {
      const model: GenerativeModel | undefined =
        this.generativeAi.getGenerativeModel({
          model: this.config.model,
          tools: this.config.tools,
        });
      if (!model) {
        throw new Error(`Error retrieving model ${this.config.model}`);
      }
      return model;
    } catch (error) {
      this.logger.error("An error occurred while retrieving the model", error);
      throw new Error("Failed to retrieve model");
    }
  }

  async generateContent(
    userInput: string,
  ): Promise<Partial<ProcessInputResult>> {
    try {
      const prompt = createPrompt(userInput);
      const model = this.getModel();
      const generateContentResponse: GenerateContentResult =
        await model.generateContent(prompt);
      const { text, usageMetadata } = generateContentResponse.response;
      const parsedResponse = this.orchestrator.parseResponse(text());
      const extractedQueries = parsedResponse.queries;
      const extractedThought = parsedResponse.thought;
      const tokenCount = usageMetadata?.totalTokenCount ?? 0;
      const result = {
        queries: extractedQueries,
        tokens: tokenCount,
        prompt: userInput,
        thought: extractedThought,
      };
      this.orchestrator.publish("onQuery", JSON.stringify(result));
      return result;
    } catch (error: any) {
      this.orchestrator.publish("onError", error);
      vscode.window.showErrorMessage("Error processing user query");
      this.logger.error(
        "Error generating, queries, thoughts from user query",
        error,
      );
      throw error;
    }
  }

  public createSnapShot(data?: any): GeminiModelResponseType {
    return { ...this.response, ...data };
  }

  public loadSnapShot(snapshot: ReturnType<typeof this.createSnapShot>): void {
    Object.assign(this, snapshot);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
