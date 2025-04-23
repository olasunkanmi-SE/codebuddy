import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import {
  COMMON,
  generativeAiModels,
  GROQ_CONFIG,
} from "../application/constant";
import Anthropic from "@anthropic-ai/sdk";
import {
  createAnthropicClient,
  getGenerativeAiModel,
  getXGroKBaseURL,
} from "../utils/utils";
import { Memory } from "../memory/base";
import { IMessageInput, Message } from "../llms/message";

export class AnthropicWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: Anthropic;
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
    protected baseUrl?: string,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.model = createAnthropicClient(this.apiKey, this.baseUrl);
  }

  public async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push(
          Message.of({
            role: "assistant",
            content: response,
          }),
        );
      } else {
        this.chatHistory.push(
          Message.of({
            role: "user",
            content: response,
          }),
        );
      }

      if (this.chatHistory.length === 2) {
        const chatHistory = Memory.has(COMMON.ANTHROPIC_CHAT_HISTORY)
          ? Memory.get(COMMON.ANTHROPIC_CHAT_HISTORY)
          : [];
        Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
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
    message: string,
    metaData?: any,
  ): Promise<string | undefined> {
    try {
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      const { max_tokens } = GROQ_CONFIG;
      if (getGenerativeAiModel() === generativeAiModels.GROK) {
        this.baseUrl = getXGroKBaseURL();
      }
      const userMessage = Message.of({
        role: "user",
        content: `${message} \n context: ${context}`,
      });
      let chatHistory = Memory.has(COMMON.ANTHROPIC_CHAT_HISTORY)
        ? Memory.get(COMMON.ANTHROPIC_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.ANTHROPIC_CHAT_HISTORY);

      const chatCompletion = await this.model.messages.create({
        messages: [...chatHistory],
        model: this.generativeAiModel,
        max_tokens,
        stream: false,
      });
      const response = chatCompletion.content[0].text;
      return response;
    } catch (error) {
      console.error(error);
      Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }
}
