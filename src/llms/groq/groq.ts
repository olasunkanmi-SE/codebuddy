import { BaseLLM } from "../base";
import * as vscode from "vscode";
import Groq from "groq-sdk";
import { ILlmConfig } from "../interface";

export class GroqLLM extends BaseLLM<any> implements vscode.Disposable {
  private static instance: GroqLLM;
  private readonly groq: Groq;

  constructor(protected config: ILlmConfig) {
    super(config);
    this.groq = new Groq({ apiKey: this.config.apiKey });
  }

  static getInstance(config: ILlmConfig) {
    if (!GroqLLM.instance) {
      GroqLLM.instance = new GroqLLM(config);
    }
    return GroqLLM.instance;
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    return [1, 2];
  }

  async generateText(
    prompt: string,
    instruction?: string,
    query?: string,
  ): Promise<string> {
    const chatCompletion = await this.groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            instruction ??
            this.prompts({ title: prompt, query: query ?? "" })
              .urlRelevanceScore,
        },
      ],
      model: this.config.model,
    });
    return chatCompletion.choices[0]?.message?.content ?? "";
  }

  createSnapShot() {}

  loadSnapShot(snapshot: any) {}

  dispose() {}
}
