import OpenAI from "openai";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { createOpenAIClient, getAPIKeyAndModel } from "../utils/utils";
import { BaseWebViewProvider, LLMMessage } from "./base";

export class OpenAIWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: OpenAI;
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.model = createOpenAIClient(this.apiKey);
  }

  /**
   * Override to update OpenAI-specific chatHistory array
   */
  updateProviderChatHistory(history: any[]): void {
    try {
      // Convert to OpenAI's format (compatible with IMessageInput)
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }),
      );

      this.logger.debug(
        `Updated OpenAI chatHistory array with ${this.chatHistory.length} messages`,
      );
    } catch (error: any) {
      this.logger.warn("Failed to update OpenAI chat history array:", error);
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

  async *streamResponse(
    message: LLMMessage,
    metaData?: any,
  ): AsyncGenerator<string, void, unknown> {
    let systemInstruction = "";
    let userMessage = "";

    if (typeof message === "object") {
      systemInstruction = message.systemInstruction;
      userMessage = message.userMessage;
    }

    this.chatHistory = Memory.has("chatHistory")
      ? Memory.get("chatHistory")
      : [];

    try {
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

      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
      );

      // Convert history to OpenAI format
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

      const stream = await this.model.chat.completions.create({
        messages: messages,
        model: this.generativeAiModel,
        max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }

      Memory.set("chatHistory", this.chatHistory);
      if (error.status === 401) {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
        this.logger.error("Invalid API key. Please update your API key", error);
      }
      if (error.status === 429) {
        vscode.window.showErrorMessage("Rate limiting error, try again later");
      }
      this.logger.error("Error generating OpenAI response", error.stack);
      throw error;
    }
  }

  async generateResponse(
    message: LLMMessage,
    metaData?: any,
  ): Promise<string | undefined> {
    let systemInstruction = "";
    let userMessage = "";

    if (typeof message === "object") {
      systemInstruction = message.systemInstruction;
      userMessage = message.userMessage;
    }

    this.chatHistory = Memory.has("chatHistory")
      ? Memory.get("chatHistory")
      : [];

    try {
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

      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
      );

      // Convert history to OpenAI format
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

      Memory.set("chatHistory", this.chatHistory);
      if (error.status === 401) {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
        this.logger.error("Invalid API key. Please update your API key", error);
      }
      if (error.status === 429) {
        vscode.window.showErrorMessage("Rate limiting error, try again later");
      }
      this.logger.error("Error generating OpenAI response", error.stack);
      throw error;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }

  async getTokenCounts(input: string): Promise<number> {
    // OpenAI doesn't expose a simple token count endpoint like Gemini.
    // For now, we return 0 or an estimate (char count / 4).
    return Math.ceil(input.length / 4);
  }
}
