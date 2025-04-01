import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import { COMMON } from "../application/constant";
import { Memory } from "../memory/base";
import { IMessageInput, Message } from "../llms/message";
import { DeepseekLLM } from "../llms/deepseek/deepseek";
import { Logger } from "../infrastructure/logger/logger";

export class DeepseekWebViewProvider extends BaseWebViewProvider {
  public static readonly viewId = "chatView";
  chatHistory: IMessageInput[] = [];
  readonly client: any;
  readonly metaData?: Record<string, any>;
  private readonly deepseekLLM: DeepseekLLM;
  private readonly logger: Logger;

  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
    protected baseUrl?: string,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.logger = new Logger("DeepseekWebViewProvider");
    this.deepseekLLM = DeepseekLLM.getInstance({
      apiKey: this.apiKey,
      model: this.generativeAiModel,
      baseUrl: this.baseUrl || "https://api.deepseek.com/v1"
    });
    this.client = this.deepseekLLM.getModel();
    this.logger.info(`Initialized Deepseek provider with model: ${generativeAiModel}`);
  }

  public async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      this.logger.info(`Sending ${currentChat} response: ${response.substring(0, 50)}...`);
      
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
      this.logger.info(`Generating response for message: ${message.substring(0, 50)}...`);
      
      if (metaData) {
        this.logger.info("Using agent mode with metadata");
        this.orchestrator.publish("onThinking", "...thinking");
        
        await this.deepseekLLM.run(JSON.stringify(message));
        // Agent mode is handled through event emitter in BaseWebViewProvider
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

      // Use DeepseekLLM to generate a response
      this.logger.info("Calling generateText on DeepseekLLM");
      const result = await this.deepseekLLM.generateText(message);
      this.logger.info(`Received response: ${result.substring(0, 50)}...`);
      
      return result;
    } catch (error) {
      this.logger.error("Error generating response", error);
      Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question"
      );
      return;
    }
  }

  // Used to format content for the webview
  generateContent(userInput: string) {
    return userInput;
  }
}