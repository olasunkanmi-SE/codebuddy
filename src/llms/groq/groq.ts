import { BaseLLM } from "../base";
import * as vscode from "vscode";
import Groq from "groq-sdk";
import { ILlmConfig } from "../interface";
import { COMMON, GROQ_CONFIG } from "../../application/constant";
import { Message } from "../message";
import { Memory } from "../../memory/base";

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
      const userMessage = Message.of({ role: "user", content: message });
      let chatHistory = Memory.has(COMMON.GROQ_CHAT_HISTORY)
        ? Memory.get(COMMON.GROQ_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.GROQ_CHAT_HISTORY);

      const chatCompletion = this.groq.chat.completions.create({
        messages: [...chatHistory],
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
