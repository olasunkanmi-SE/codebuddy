import OpenAI from "openai";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { BaseWebViewProvider, LLMMessage } from "./base";
import { GLMLLM } from "../llms/glm/glm";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class GLMWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: OpenAI;
  private readonly glmLLM: GLMLLM;

  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.logger = Logger.initialize("GLMWebViewProvider", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.glmLLM = GLMLLM.getInstance({
      apiKey: this.apiKey,
      model: this.generativeAiModel,
    });
    this.model = this.glmLLM.getModel();
  }

  /**
   * Override to update GLM-specific chatHistory array
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
      this.logger.warn("Failed to update GLM chat history array:", error);
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
    if (metaData) {
      const msgStr =
        typeof message === "object" ? message.userMessage : message;
      const response = await this.generateResponse(msgStr, metaData);
      if (response) {
        yield response;
      }
      return;
    }

    try {
      let systemInstruction = "";
      let userMessage = "";

      if (typeof message === "object") {
        systemInstruction = message.systemInstruction;
        userMessage = message.userMessage;
      } else {
        userMessage = message;
      }

      this.chatHistory = Memory.has(COMMON.GLM_CHAT_HISTORY)
        ? Memory.get(COMMON.GLM_CHAT_HISTORY)
        : [];

      if (this.chatHistory?.length > 0) {
        this.updateProviderChatHistory(this.chatHistory);
      }

      const { max_tokens, temperature, top_p, stop } = GROQ_CONFIG;

      const currentMessage = Message.of({
        role: "user",
        content: userMessage,
      });

      this.chatHistory = [...this.chatHistory, currentMessage];

      Memory.set(COMMON.GLM_CHAT_HISTORY, this.chatHistory);

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

      const chatCompletionStream = await this.model.chat.completions.create({
        messages: messages,
        model: this.generativeAiModel,
        temperature,
        top_p,
        stream: true,
        stop,
        max_tokens,
      });

      for await (const chunk of chatCompletionStream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      this.logger.error("Error generating GLM stream response", error);
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }
      Memory.set(COMMON.GLM_CHAT_HISTORY, this.chatHistory);
      throw error;
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
        await this.glmLLM.run(JSON.stringify(message));
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

      this.chatHistory = Memory.has(COMMON.GLM_CHAT_HISTORY)
        ? Memory.get(COMMON.GLM_CHAT_HISTORY)
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

      Memory.set(COMMON.GLM_CHAT_HISTORY, this.chatHistory);

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

      Memory.set(COMMON.GLM_CHAT_HISTORY, this.chatHistory);
      if (error.status === 401) {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
      }
      this.logger.error("Error generating GLM response", error.stack);
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
