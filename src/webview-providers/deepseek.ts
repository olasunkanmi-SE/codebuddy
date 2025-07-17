import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import { COMMON } from "../application/constant";
import { Memory } from "../memory/base";
import { IMessageInput, Message } from "../llms/message";
import { DeepseekLLM } from "../llms/deepseek/deepseek";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { StandardizedPrompt } from "../utils/standardized-prompt";

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
    } catch (error) {
      this.logger.error("Error sending response", error);
      Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, []);
      console.error(error);
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

      // Create standardized prompt for user input
      const context =
        metaData?.context?.length > 0
          ? await this.getContext(metaData.context)
          : undefined;
      const standardizedPrompt = StandardizedPrompt.create(message, context);

      const userMessage = Message.of({
        role: "user",
        content: standardizedPrompt,
      });

      let chatHistory = Memory.has(COMMON.DEEPSEEK_CHAT_HISTORY)
        ? Memory.get(COMMON.DEEPSEEK_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.DEEPSEEK_CHAT_HISTORY);
      const result = await this.deepseekLLM.generateText(message);
      return result;
    } catch (error) {
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
}
