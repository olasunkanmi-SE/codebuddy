import Groq from "groq-sdk";
import * as vscode from "vscode";
import { GROQ_CONFIG } from "../../application/constant";
import { BaseLLM } from "../base";
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

  // TODO Implement function call, especially think for this model.
  async generateText(message: string): Promise<string> {
    try {
      const { temperature, top_p, stop } = GROQ_CONFIG;

      const chatCompletion = this.groq.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: this.config.model,
        temperature,
        top_p,
        stream: false,
        stop,
      });
      const response = (await chatCompletion).choices[0]?.message?.content;
      return response ?? "";
    } catch (error: any) {
      this.logger.error(
        "Model not responding, please resend your question",
        error.stack,
      );
      if (error.status === "401") {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
      }
      throw error;
    }
  }

  createSnapShot() {}

  loadSnapShot(snapshot: any) {}

  dispose() {}
}
