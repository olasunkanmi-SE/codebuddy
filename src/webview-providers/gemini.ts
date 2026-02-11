import { GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import { GeminiLLM } from "../llms/gemini/gemini";
import { ChatHistoryRepository } from "../infrastructure/repository/db-chat-history";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { BaseWebViewProvider, LLMMessage } from "./base";
import { CodebuddyAgentService } from "../agents/agentService";
import { MessageHandler } from "../agents/handlers/message-handler";

export class GeminiWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: GenerativeModel;
  readonly metaData?: Record<string, any>;
  private readonly gemini: GeminiLLM;
  private readonly chatRepository: ChatHistoryRepository;

  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.gemini = GeminiLLM.getInstance({
      apiKey: this.apiKey,
      model: this.generativeAiModel,
      tools: [{ googleSearch: {} }],
    });
    this.model = this.gemini.getModel();
    this.chatRepository = ChatHistoryRepository.getInstance();
  }

  /**
   * Override to update Gemini-specific chatHistory array
   */
  updateProviderChatHistory(history: any[]) {
    try {
      this.chatHistory = history.map((msg: any) => {
        return Message.of({
          role: msg.role === "user" ? "user" : "model",
          content: msg.content,
          parts: msg.parts,
        });
      });

      this.logger.debug(
        `Updated Gemini chatHistory array with ${this.chatHistory.length} messages`,
      );
    } catch (error: any) {
      this.logger.warn("Failed to update Gemini chat history array:", error);
      this.chatHistory = []; // Reset to empty on error
    }
  }

  async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push(
          Message.of({
            role: "model",
            parts: [{ text: response }],
          }),
        );
      } else {
        this.chatHistory.push(
          Message.of({
            role: "user",
            parts: [{ text: response }],
          }),
        );
      }
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error: any) {
      this.logger.error(
        "Error sending sending Gemini response to webview ",
        error,
      );
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

    if (Memory.has("chatHistory")) {
      this.chatHistory = Memory.get("chatHistory");
    } else {
      const dbHistory = await this.chatRepository.get("agentId");
      if (dbHistory && dbHistory.length > 0) {
        this.chatHistory = dbHistory.map((h: any) => ({
          role: h.type === "user" ? "user" : "model",
          content: h.content,
        }));
        Memory.set("chatHistory", this.chatHistory);
      } else {
        this.chatHistory = [];
      }
    }

    try {
      if (this.chatHistory.length) {
        this.updateProviderChatHistory(this.chatHistory);
      }

      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }

      const msg = userMessage?.length ? userMessage : message;
      const messageWithContext = `${msg} \n context: ${context ?? ""}`;

      const currentMessage = Message.of({
        role: "user",
        parts: [{ text: messageWithContext }],
      });

      this.chatHistory = [...this.chatHistory, currentMessage];
      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
        "agentId",
      );

      const chat = this.model.startChat({
        history: history.map((msg: any) => ({
          role: msg.role,
          parts: msg.parts || [{ text: msg.content || "" }],
        })),
        systemInstruction: {
          role: "System",
          parts: [{ text: systemInstruction }],
        },
      });

      const result = await chat.sendMessageStream(userMessage ?? message);
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
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
      this.logger.error(`[DEBUG] Error in streamResponse:`, error.stack);

      if (error.status === "401") {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
        this.logger.error("Invalid API key. Please update your API key", error);
      }
      if (error.status === "503") {
        vscode.window.showErrorMessage("Rate limiting error, try again later");
      }
      this.logger.error("Error generating gemini response", error.stack);
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

    if (Memory.has("chatHistory")) {
      this.chatHistory = Memory.get("chatHistory");
    } else {
      const dbHistory = await this.chatRepository.get("agentId");
      if (dbHistory && dbHistory.length > 0) {
        this.chatHistory = dbHistory.map((h: any) => ({
          role: h.type === "user" ? "user" : "model",
          content: h.content,
        }));
        Memory.set("chatHistory", this.chatHistory);
      } else {
        this.chatHistory = [];
      }
    }

    try {
      if (this.chatHistory.length) {
        this.updateProviderChatHistory(this.chatHistory);
      }

      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }

      const msg = userMessage?.length ? userMessage : message;

      const messageWithContext = `${msg} \n context: ${context}`;

      const currentMessage = Message.of({
        role: "user",
        parts: [
          {
            text: messageWithContext,
          },
        ],
      });

      this.chatHistory = [...this.chatHistory, currentMessage];

      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction,
        "agentId",
      );

      const chat = this.model.startChat({
        history,
        systemInstruction: {
          role: "System",
          parts: [
            {
              text: systemInstruction,
            },
          ],
        },
      });

      this.logger.info(`[DEBUG] Sending message to Gemini...`);
      const result = await chat.sendMessage(userMessage ?? message);
      const response = result.response;
      const responseText = response.text();

      this.logger.info(
        `[DEBUG] Received response length: ${responseText?.length || 0} characters`,
      );
      this.logger.info(
        `[DEBUG] Response ends with: "${responseText || "empty"}"`,
      );

      return responseText;
    } catch (error: any) {
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }

      Memory.set("chatHistory", this.chatHistory);
      this.logger.error(`[DEBUG] Error in generateResponse:`, error.stack);

      if (error.status === "401") {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
        this.logger.error("Invalid API key. Please update your API key", error);
      }
      if (error.status === "503") {
        vscode.window.showErrorMessage("Rate limiting error, try again later");
      }
      this.logger.error("Error generating anthropic response", error.stack);
      throw error;
    }
  }

  async getTokenCounts(input: string): Promise<number> {
    if (!input) {
      return 0;
    }
    try {
      const geminiResult = await this.model.countTokens(input);
      return geminiResult.totalTokens;
    } catch (error) {
      this.logger.warn("Failed to count tokens", error);
      return 0;
    }
  }
}
