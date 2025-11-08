import { GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import { COMMON } from "../application/constant";
import { GeminiLLM } from "../llms/gemini/gemini";
import { IMessageInput } from "../llms/message";
import { Memory } from "../memory/base";
import {
  BaseWebViewProvider,
  ImessageAndSystemInstruction,
  LLMMessage,
} from "./base";

export class GeminiWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: GenerativeModel;
  readonly metaData?: Record<string, any>;
  private readonly gemini: GeminiLLM;

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
  }

  /**
   * Override to update Gemini-specific chatHistory array
   */
  protected async updateProviderChatHistory(history: any[]): Promise<void> {
    try {
      // Convert to Gemini's IMessageInput format
      this.chatHistory = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }));

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
        await this.modelChatHistory("model", response, "gemini", "agentId");
      } else {
        await this.modelChatHistory("user", response, "gemini", "agentId");
      }
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error: any) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
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

    try {
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      if (metaData?.mode === "Agent") {
        this.orchestrator.publish("onThinking", "...thinking");
        await this.gemini.run(
          context
            ? JSON.stringify(`${message} \n context: ${context}`)
            : JSON.stringify(message),
        );
        return;
      }

      let chatHistory = await this.modelChatHistory(
        "user",
        `${userMessage ?? message} \n context: ${context}`,
        "gemini",
        "agentId",
      );

      const chat = this.model.startChat({
        history: [...chatHistory],
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
        `[DEBUG] Response ends with: "${responseText?.slice(-50) || "empty"}"`,
      );

      return responseText;
    } catch (error: any) {
      this.logger.error(`[DEBUG] Error in generateResponse:`, error.stack);
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
      if (error.status === "401") {
        vscode.window.showErrorMessage(
          "Invalid API key. Please update your API key",
        );
      }
      throw error;
    }
  }
}
