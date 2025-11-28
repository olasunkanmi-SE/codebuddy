import { GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import { GeminiLLM } from "../llms/gemini/gemini";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { BaseWebViewProvider, LLMMessage } from "./base";
import { CodebuddyAgentService } from "../agents/agentService";

export class GeminiWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: GenerativeModel;
  readonly metaData?: Record<string, any>;
  private readonly gemini: GeminiLLM;
  private readonly codeBuddyAgentService: CodebuddyAgentService;

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
    this.codeBuddyAgentService = CodebuddyAgentService.getInstance();
  }

  /**
   * Override to update Gemini-specific chatHistory array
   */
  updateProviderChatHistory(history: any[]) {
    try {
      // Convert to Gemini's IMessageInput format
      this.chatHistory = history.map((msg: any) =>
        Message.of({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }),
      );

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
      if (this.chatHistory.length) {
        this.updateProviderChatHistory(this.chatHistory);
      }

      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      if (metaData?.mode === "Agent") {
        this.orchestrator.publish("onThinking", "...thinking");
        await this.codeBuddyAgentService.processUserQuery(
          context
            ? JSON.stringify(`${message} \n context: ${context}`)
            : JSON.stringify(message),
        );
        return;
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
    const geminiResult = await this.model.countTokens(input);
    return geminiResult.totalTokens;
  }
}
