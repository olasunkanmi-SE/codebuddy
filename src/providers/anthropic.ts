import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import {
  COMMON,
  generativeAiModels,
  GROQ_CONFIG,
} from "../application/constant";
import Anthropic from "@anthropic-ai/sdk";
import { Brain } from "../services/brain";
import {
  createAnthropicClient,
  getGenerativeAiModel,
  getXGroKBaseURL,
} from "../application/utils";

type Role = "user" | "assistant";
export interface IHistory {
  role: Role;
  content: string;
}

export class AnthropicWebViewProvider extends BaseWebViewProvider {
  chatHistory: IHistory[] = [];
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
    protected baseUrl?: string,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
  }

  public async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push({
          role: "assistant",
          content: response,
        });
      } else {
        this.chatHistory.push({
          role: "user",
          content: response,
        });
      }

      if (this.chatHistory.length === 2) {
        const chatHistory = Brain.has(COMMON.ANTHROPIC_CHAT_HISTORY)
          ? Brain.get(COMMON.ANTHROPIC_CHAT_HISTORY)
          : [];
        Brain.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
          ...chatHistory,
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

  async generateResponse(
    apiKey = undefined,
    name = undefined,
    message: string,
  ): Promise<string | undefined> {
    try {
      const { max_tokens } = GROQ_CONFIG;
      if (getGenerativeAiModel() === generativeAiModels.GROK) {
        this.baseUrl = getXGroKBaseURL();
      }
      const anthropic: Anthropic = createAnthropicClient(
        this.apiKey,
        this.baseUrl,
      );
      let chatHistory = Brain.has(COMMON.ANTHROPIC_CHAT_HISTORY)
        ? Brain.get(COMMON.ANTHROPIC_CHAT_HISTORY)
        : [];

      if (chatHistory?.length) {
        chatHistory = [...chatHistory, { role: "user", content: message }];
      }

      if (!chatHistory?.length) {
        chatHistory = [{ role: "user", content: message }];
      }

      if (chatHistory?.length > 3) {
        chatHistory = chatHistory.slice(-3);
      }

      const chatCompletion = await anthropic.messages.create({
        messages: [...chatHistory],
        model: this.generativeAiModel,
        max_tokens,
        stream: false,
      });
      const response = chatCompletion.content[0].text;
      return response;
    } catch (error) {
      console.error(error);
      Brain.set(COMMON.ANTHROPIC_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
    }
  }
}
