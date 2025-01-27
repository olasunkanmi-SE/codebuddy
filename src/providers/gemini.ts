import { GoogleGenerativeAI } from "@google/generative-ai";
import * as vscode from "vscode";
import { COMMON } from "../application/constant";
import { BaseWebViewProvider } from "./base";
import { Memory } from "../memory/base";

type Role = "function" | "user" | "model";
export interface IHistory {
  role: Role;
  parts: { text: string }[];
}

export class GeminiWebViewProvider extends BaseWebViewProvider {
  chatHistory: IHistory[] = [];
  constructor(extensionUri: vscode.Uri, apiKey: string, generativeAiModel: string, context: vscode.ExtensionContext) {
    super(extensionUri, apiKey, generativeAiModel, context);
  }

  async sendResponse(response: string, currentChat: string): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push({
          role: "model",
          parts: [{ text: response }],
        });
      } else {
        this.chatHistory.push({
          role: "user",
          parts: [{ text: response }],
        });
      }
      if (this.chatHistory.length === 2) {
        const chatHistory = Memory.has(COMMON.GEMINI_CHAT_HISTORY) ? Memory.get(COMMON.GEMINI_CHAT_HISTORY) : [];
        Memory.set(COMMON.GEMINI_CHAT_HISTORY, [...chatHistory, ...this.chatHistory]);
      }
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      console.error(error);
    }
  }

  async generateResponse(apiKey: string, name: string, message: string): Promise<string | undefined> {
    try {
      const genAi = new GoogleGenerativeAI(apiKey);
      const model = genAi.getGenerativeModel({ model: name });
      let chatHistory = Memory.has(COMMON.GEMINI_CHAT_HISTORY) ? Memory.get(COMMON.GEMINI_CHAT_HISTORY) : [];

      if (chatHistory?.length) {
        chatHistory = [
          ...chatHistory,
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ];
      }

      if (!chatHistory?.length) {
        chatHistory = [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ];
      }

      if (chatHistory?.length > 3) {
        chatHistory = chatHistory.slice(-3);
      }

      const chat = model.startChat({
        history: [...chatHistory],
      });
      const result = await chat.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      vscode.window.showErrorMessage("Model not responding, please resend your question");
      console.error(error);
      return;
    }
  }
}
