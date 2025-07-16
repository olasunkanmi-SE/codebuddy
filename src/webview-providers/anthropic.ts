import Anthropic from "@anthropic-ai/sdk";
import * as vscode from "vscode";
import {
  COMMON,
  generativeAiModels,
  GROQ_CONFIG,
} from "../application/constant";
import { IMessageInput } from "../llms/message";
import { Memory } from "../memory/base";
import {
  createAnthropicClient,
  getGenerativeAiModel,
  getXGroKBaseURL,
} from "../utils/utils";
import { BaseWebViewProvider } from "./base";

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
        await this.modelChatHistory(
          "assistant",
          response,
          "anthropic",
          "agentId",
        );
      } else {
        await this.modelChatHistory("user", response, "anthropic", "agentId");
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

      let chatHistory = await this.modelChatHistory(
        "user",
        `${message} \n context: ${context}`,
        "anthropic",
        "agentId",
      );

      const chatCompletion = await this.model.messages.create({
        messages: [...chatHistory],
        model: this.generativeAiModel,
        max_tokens,
        stream: false,
      });
      const firstContent = chatCompletion.content[0];
      let response = "";
      if ("text" in firstContent && typeof firstContent.text === "string") {
        response = firstContent.text;
      } else if (
        "content" in firstContent &&
        typeof (firstContent as any).content === "string"
      ) {
        response = (firstContent as any).content;
      }
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
