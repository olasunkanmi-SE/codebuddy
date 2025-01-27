import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import Groq from "groq-sdk";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { Memory } from "../memory/base";

type Role = "user" | "system";
export interface IHistory {
  role: Role;
  content: string;
}

export class GroqWebViewProvider extends BaseWebViewProvider {
  chatHistory: IHistory[] = [];
  constructor(extensionUri: vscode.Uri, apiKey: string, generativeAiModel: string, context: vscode.ExtensionContext) {
    super(extensionUri, apiKey, generativeAiModel, context);
  }

  public async sendResponse(response: string, currentChat: string): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push({
          role: "system",
          content: response,
        });
      } else {
        this.chatHistory.push({
          role: "user",
          content: response,
        });
      }
      if (this.chatHistory.length === 2) {
        const chatHistory = Memory.has(COMMON.GROQ_CHAT_HISTORY) ? Memory.get(COMMON.GROQ_CHAT_HISTORY) : [];
        Memory.set(COMMON.GROQ_CHAT_HISTORY, [...chatHistory, ...this.chatHistory]);
      }
      // Once the agent task is done, map the memory into the llm brain.
      // Send the final answer to the webview here.
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async generateResponse(message: string, apiKey?: string, name?: string): Promise<string | undefined> {
    try {
      const { temperature, max_tokens, top_p, stop } = GROQ_CONFIG;
      const groq = new Groq({
        apiKey: this.apiKey,
      });

      let chatHistory = Memory.has(COMMON.GROQ_CHAT_HISTORY) ? Memory.get(COMMON.GROQ_CHAT_HISTORY) : [];

      if (chatHistory?.length) {
        chatHistory = [...chatHistory, { role: "user", content: message }];
      }
      // TODO This line isnt necessary you can spread an empty array;
      if (!chatHistory?.length) {
        chatHistory = [{ role: "user", content: message }];
      }

      if (chatHistory?.length > 3) {
        chatHistory = chatHistory.slice(-3);
      }

      const chatCompletion = groq.chat.completions.create({
        messages: [...chatHistory],
        model: this.generativeAiModel,
        temperature,
        max_tokens,
        top_p,
        stream: false,
        stop,
      });
      const response = (await chatCompletion).choices[0]?.message?.content;
      return response ?? undefined;
    } catch (error) {
      console.error(error);
      Memory.set(COMMON.GROQ_CHAT_HISTORY, []);
      vscode.window.showErrorMessage("Model not responding, please resend your question");
      return;
    }
  }
}
