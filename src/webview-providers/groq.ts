import Groq from "groq-sdk";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { Memory } from "../memory/base";
import { BaseWebViewProvider, LLMMessage } from "./base";
import { IMessageInput, Message } from "../llms/message";
import llama3Tokenizer from "llama3-tokenizer-js";

export class GroqWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: Groq;
  private static instance: GroqWebViewProvider;
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext
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
  updateProviderChatHistory(history: any[]): void {
    try {
      // Convert to Groq's IMessageInput format
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        })
      );

      this.logger.debug(
        `Updated Groq chatHistory array with ${this.chatHistory.length} messages`
      );
    } catch (error: any) {
      this.logger.warn("Failed to update Groq chat history array:", error);
      this.chatHistory = []; // Reset to empty on error
    }
  }

  static initialize(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext
  ) {
    if (!GroqWebViewProvider.instance) {
      GroqWebViewProvider.instance = new GroqWebViewProvider(
        extensionUri,
        apiKey,
        generativeAiModel,
        context
      );
    }
  }

  public async sendResponse(
    response: string,
    currentChat: string
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push(
          Message.of({
            role: "assistant",
            content: response,
          })
        );
      } else {
        this.chatHistory.push(
          Message.of({
            role: "user",
            content: response,
          })
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

  // Corrected generateResponse function
  async generateResponse(
    message: LLMMessage,
    metaData?: any
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
      const { temperature, max_tokens, top_p, stop } = GROQ_CONFIG;

      const msg = userMessage?.length ? userMessage : message;

      const messageWithContext = context
        ? `${msg} \n context: ${context}`
        : `${msg}`;

      const currentMessage = Message.of({
        role: "user",
        content: messageWithContext,
      });

      this.chatHistory = [...this.chatHistory, currentMessage];

      Memory.set("chatHistory", this.chatHistory);

      const history = await this.pruneChatHistoryWithSummary(
        this.chatHistory,
        6000,
        systemInstruction
      );

      const chatCompletionStream = await this.model.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction ?? "" },
          ...history,
        ],
        model: this.generativeAiModel,
        temperature,
        top_p,
        stream: true, // This requires stream handling
        stop,
        max_tokens: GROQ_CONFIG.max_tokens,
      });

      // --- FIX STARTS HERE ---
      // Handle the stream by iterating over chunks and concatenating the content.
      let fullResponse = "";
      for await (const chunk of chatCompletionStream) {
        // Each chunk contains a 'delta' with a piece of the content.
        // Use nullish coalescing operator to handle empty or undefined content.
        fullResponse += chunk.choices[0]?.delta?.content || "";
      }
      // --- FIX ENDS HERE ---

      // Return the assembled response, or undefined if it's empty.
      return fullResponse.length > 0 ? fullResponse : undefined;
    } catch (error: any) {
      // Revert the chat history addition on error
      if (
        this.chatHistory?.length &&
        this.chatHistory[this.chatHistory.length - 1].role === "user"
      ) {
        this.chatHistory.pop();
      }
      Memory.set("chatHistory", this.chatHistory);

      // Improved error handling and logging
      if (error.status === 401) {
        vscode.window.showErrorMessage(
          "Invalid Groq API key. Please check your settings."
        );
        this.logger.error("Invalid Groq API key.", error);
      } else if (error.status === 503 || error.status === 429) {
        vscode.window.showErrorMessage(
          "Groq API rate limit reached or service unavailable. Please try again later."
        );
        this.logger.error(
          "Groq API rate limiting or availability error.",
          error
        );
      } else {
        this.logger.error(
          "Error generating Groq response:",
          error.stack || error.message
        );
      }

      // Re-throw the error to be handled by the caller if necessary
      throw error;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }

  async getTokenCounts(input: string): Promise<number> {
    const count = llama3Tokenizer.encode(input).length;
    return count;
  }
}
