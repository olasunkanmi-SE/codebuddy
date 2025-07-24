import Groq from "groq-sdk";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { Memory } from "../memory/base";
import { BaseWebViewProvider } from "./base";
import { IMessageInput, Message } from "../llms/message";

export class GroqWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: Groq;
  private static instance: GroqWebViewProvider;
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.model = new Groq({
      apiKey: this.apiKey,
      maxRetries: 3,
    });
  }

  /**
   * Override to update Groq-specific chatHistory array
   */
  protected async updateProviderChatHistory(history: any[]): Promise<void> {
    try {
      // Convert to Groq's IMessageInput format
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }),
      );

      this.logger.debug(
        `Updated Groq chatHistory array with ${this.chatHistory.length} messages`,
      );
    } catch (error) {
      this.logger.warn("Failed to update Groq chat history array:", error);
      this.chatHistory = []; // Reset to empty on error
    }
  }

  static initialize(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    if (!GroqWebViewProvider.instance) {
      GroqWebViewProvider.instance = new GroqWebViewProvider(
        extensionUri,
        apiKey,
        generativeAiModel,
        context,
      );
    }
  }

  public async sendResponse(
    response: string,
    participant: string,
  ): Promise<boolean | undefined> {
    try {
      const type = participant === "bot" ? "bot-response" : "user-input";
      if (participant === "bot") {
        await this.modelChatHistory("system", response, "groq", "agentId");
      } else {
        await this.modelChatHistory("user", response, "groq", "agentId");
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
      const { temperature, max_tokens, top_p, stop } = GROQ_CONFIG;

      let chatHistory = await this.modelChatHistory(
        "user",
        `${message} \n context: ${context}`,
        "groq",
        "agentId",
      );

      const chatCompletion = this.model.chat.completions.create({
        messages: [...chatHistory],
        model: this.generativeAiModel,
        temperature,
        top_p,
        stream: false,
        stop,
        max_tokens: GROQ_CONFIG.max_tokens,
      });
      const response = (await chatCompletion).choices[0]?.message?.content;
      return response ?? undefined;
    } catch (error) {
      console.error(error);
      Memory.set(COMMON.GROQ_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
      return;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }
}
