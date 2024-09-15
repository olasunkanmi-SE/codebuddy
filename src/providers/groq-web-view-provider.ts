import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base-web-view-provider";
import Groq from "groq-sdk";
import { COMMON, GROQ_CONFIG } from "../constant";

type Role = "user" | "system";
export interface IHistory {
  role: Role;
  content: string;
}

export class GroqWebViewProvider extends BaseWebViewProvider {
  chatHistory: IHistory[] = [];
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
  }

  public async sendResponse(
    response: string,
    currentChat: string
  ): Promise<boolean | undefined> {
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
        const history: IHistory[] | undefined =
          this._context.workspaceState.get(COMMON.CHAT_HISTORY, []);
        this._context.workspaceState.update(COMMON.CHAT_HISTORY, [
          ...history,
          ...this.chatHistory,
        ]);
      }

      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async generateResponse(message: string): Promise<string | undefined> {
    try {
      const { temperature, max_tokens, top_p, stop } = GROQ_CONFIG;
      const groq = new Groq({
        apiKey: this.apiKey,
      });
      let chatHistory = this._context.workspaceState.get<IHistory[]>(
        COMMON.CHAT_HISTORY,
        []
      );

      if (chatHistory?.length) {
        chatHistory = [...chatHistory, { role: "user", content: message }];
      }

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
      return response;
    } catch (error) {
      console.error(error);
      this._context.workspaceState.update(COMMON.CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question"
      );
      return;
    }
  }
}
