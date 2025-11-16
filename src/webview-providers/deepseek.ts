import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import { COMMON } from "../application/constant";
import { Memory } from "../memory/base";
import { IMessageInput, Message } from "../llms/message";
import { DeepseekLLM } from "../llms/deepseek/deepseek";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class DeepseekWebViewProvider extends BaseWebViewProvider {
  public static readonly viewId = "chatView";
  chatHistory: IMessageInput[] = [];
  readonly client: any;
  readonly metaData?: Record<string, any>;
  private readonly deepseekLLM: DeepseekLLM;

  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
    protected baseUrl?: string,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.logger = Logger.initialize("DeepseekWebViewProvider", {
      minLevel: LogLevel.DEBUG,
    });
    this.deepseekLLM = DeepseekLLM.getInstance({
      apiKey: this.apiKey,
      model: this.generativeAiModel,
      baseUrl: this.baseUrl ?? "https://api.deepseek.com/v1",
    });
    this.client = this.deepseekLLM.getModel();
  }

  /**
   * Override to update Deepseek-specific chatHistory array
   */
  protected async updateProviderChatHistory(history: any[]): Promise<void> {
    try {
      // Convert to Deepseek's IMessageInput format
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }),
      );

      this.logger.debug(
        `Updated Deepseek chatHistory array with ${this.chatHistory.length} messages`,
      );
    } catch (error: any) {
      this.logger.warn("Failed to update Deepseek chat history array:", error);
      this.chatHistory = []; // Reset to empty on error
    }
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
        const chatHistory = Memory.has(COMMON.DEEPSEEK_CHAT_HISTORY)
          ? Memory.get(COMMON.DEEPSEEK_CHAT_HISTORY)
          : [];
        Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, [
          ...chatHistory,
          ...this.chatHistory,
        ]);
      }
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error: any) {
      this.logger.error("Error sending response", error);
      Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, []);
      this.logger.error(error);
    }
  }

  async generateResponse(
    message: string,
    metaData?: any,
  ): Promise<string | undefined> {
    try {
      if (metaData) {
        this.orchestrator.publish("onThinking", "...thinking");
        await this.deepseekLLM.run(JSON.stringify(message));
        return;
      }

      const userMessage = Message.of({
        role: "user",
        content: message,
      });

      let chatHistory = Memory.has(COMMON.DEEPSEEK_CHAT_HISTORY)
        ? Memory.get(COMMON.DEEPSEEK_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.DEEPSEEK_CHAT_HISTORY);
      const result = await this.deepseekLLM.generateText(message);
      return result;
    } catch (error: any) {
      this.logger.error("Error generating response", error);
      Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
      return;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }

  async getTokenCounts(input: string): Promise<number> {
    return 0;
  }
}
