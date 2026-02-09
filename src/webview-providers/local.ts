import OpenAI from "openai";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { LocalLLM } from "../llms/local/local";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { getAPIKeyAndModel } from "../utils/utils";
import { BaseWebViewProvider, LLMMessage } from "./base";

export class LocalWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly llm: LocalLLM;
  private localDisposables: vscode.Disposable[] = [];

  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    // Retrieve full config including baseURL
    const { baseUrl } = getAPIKeyAndModel("Local");
    this.llm = LocalLLM.getInstance({
      apiKey: this.apiKey,
      baseUrl: baseUrl,
      model: this.generativeAiModel,
    });
    this.registerConfigListener();
  }

  private registerConfigListener() {
    this.localDisposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("local")) {
          const { apiKey, model, baseUrl } = getAPIKeyAndModel("Local");
          this.llm.updateConfig({
            apiKey: apiKey || "not-needed",
            baseUrl: baseUrl,
            model: model || "llama3.2",
          });
          this.logger.debug(`LocalLLM config updated: ${model}`);
        }
      }),
    );
  }

  public dispose() {
    this.localDisposables.forEach((d) => d.dispose());
    super.dispose();
  }

  /**
   * Override to update Local-specific chatHistory array
   */
  updateProviderChatHistory(history: any[]): void {
    try {
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
          parts: msg.parts,
        }),
      );

      this.logger.debug(
        `Updated Local chatHistory array with ${this.chatHistory.length} messages`,
      );
    } catch (error: any) {
      this.logger.warn("Failed to update Local chat history array:", error);
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
      if (metaData?.context?.length > 0) {
        context = await this.getContext(metaData.context);
      }

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
        "agentId",
      );

      const messages: Message[] = history.map((h) =>
        Message.of({
          role: h.role,
          content: h.content,
        }),
      );

      const stream = this.llm.stream(messages, systemInstruction);
      for await (const chunk of stream) {
        yield chunk;
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
      this.logger.error("Error generating Local response", error.stack);
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
        "agentId",
      );

      // Use the LLM instance to chat
      // We need to convert history to the format expected by LLM.chat (Message[])
      // Since history is already IMessageInput[], and Message implements it, it should be fine.
      // But let's ensure types match.
      const messages: Message[] = history.map((h) =>
        Message.of({
          role: h.role,
          content: h.content,
        }),
      );

      const response = await this.llm.chat(messages, systemInstruction);

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
      this.logger.error("Error generating Local response", error.stack);
      throw error;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }

  async getTokenCounts(input: string): Promise<number> {
    // Estimate
    return Math.ceil(input.length / 4);
  }
}
