import OpenAI from "openai";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { BaseWebViewProvider, LLMMessage } from "./base";
import { QwenLLM } from "../llms/qwen/qwen";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class QwenWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: OpenAI;
  private readonly qwenLLM: QwenLLM;

  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.logger = Logger.initialize("QwenWebViewProvider", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.qwenLLM = QwenLLM.getInstance({
      apiKey: this.apiKey,
      model: this.generativeAiModel,
    });
    this.model = this.qwenLLM.getModel();
  }

  /**
   * Override to update Qwen-specific chatHistory array
   */
  updateProviderChatHistory(history: any[]): void {
    try {
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }),
      );
    } catch (error: any) {
      this.logger.warn("Failed to update Qwen chat history array:", error);
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
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  async generateResponse(
    message: LLMMessage,
    metaData?: any,
  ): Promise<string | undefined> {
    try {
      // If metaData is provided, use the agentic run method
      if (metaData && typeof message === "string") {
        this.orchestrator.publish("onThinking", "...thinking");
        await this.qwenLLM.run(JSON.stringify(message));
        return;
      }

      let systemInstruction = "";
      let userMessage = "";

      if (typeof message === "object") {
        systemInstruction = message.systemInstruction;
        userMessage = message.userMessage;
      } else {
        userMessage = message;
      }

      this.chatHistory = Memory.has(COMMON.QWEN_CHAT_HISTORY)
        ? Memory.get(COMMON.QWEN_CHAT_HISTORY)
        : [];

      if (this.chatHistory?.length > 0) {
        this.updateProviderChatHistory(this.chatHistory);
      }
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      const { max_tokens } = GROQ_CONFIG;

      const msg = userMessage?.length ? userMessage : message;

      const messageWithContext = `${msg} \n context: ${context ?? ""}`;

      const currentMessage = Message.of({
        role: "user",
        content: messageWithContext,
      });

      this.chatHistory = [...this.chatHistory, currentMessage];

      Memory.set(COMMON.QWEN_CHAT_HISTORY, this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
      );

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemInstruction?.length
            ? systemInstruction
            : "You are an helpful assistant",
        },
        ...history.map((h) => ({
          role: h.role as "user" | "assistant" | "system",
          content: h.content,
        })),
      ];

      const chatCompletion = await this.model.chat.completions.create({
        messages: messages,
        model: this.generativeAiModel,
        max_tokens,
        stream: false,
      });

      const response = chatCompletion.choices[0]?.message?.content || "";
      return response;
    } catch (error: any) {
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }

      Memory.set(COMMON.QWEN_CHAT_HISTORY, this.chatHistory);
      if (error.status === 401) {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
      }
      this.logger.error("Error generating Qwen response", error.stack);
      throw error;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }

  async getTokenCounts(input: string): Promise<number> {
    return Math.ceil(input.length / 4);
  }
}
