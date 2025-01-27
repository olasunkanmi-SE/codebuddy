import {
  EmbedContentResponse,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { BaseLLM } from "../base";
import { GeminiModelResponseType, ILlmConfig } from "../interface";

export class GeminiLLM extends BaseLLM<GeminiModelResponseType> {
  private readonly generativeAi: GoogleGenerativeAI;
  private response: EmbedContentResponse | GenerateContentResult | undefined;

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.generativeAi = new GoogleGenerativeAI(this.config.apiKey);
    this.response = undefined;
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

  private getModel(): GenerativeModel {
    try {
      const model: GenerativeModel | undefined = this.generativeAi.getGenerativeModel({
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

  public createSnapShot(data?: any): GeminiModelResponseType {
    return { ...this.response, ...data };
  }

  public loadSnapShot(snapshot: ReturnType<typeof this.createSnapShot>): void {
    Object.assign(this, snapshot);
  }
}
