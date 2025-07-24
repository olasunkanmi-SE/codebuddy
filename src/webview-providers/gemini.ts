import { GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import { COMMON } from "../application/constant";
import { GeminiLLM } from "../llms/gemini/gemini";
import { IMessageInput } from "../llms/message";
import { Memory } from "../memory/base";
import { BaseWebViewProvider } from "./base";

export class GeminiWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: GenerativeModel;
  readonly metaData?: Record<string, any>;
  private readonly gemini: GeminiLLM;

  constructor(extensionUri: vscode.Uri, apiKey: string, generativeAiModel: string, context: vscode.ExtensionContext) {
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

      this.logger.debug(`Updated Gemini chatHistory array with ${this.chatHistory.length} messages`);
    } catch (error) {
      this.logger.warn("Failed to update Gemini chat history array:", error);
      this.chatHistory = []; // Reset to empty on error
    }
  }

  async sendResponse(response: string, currentChat: string): Promise<boolean | undefined> {
    try {
      // Log response information for debugging
      console.log(`[DEBUG] Response length: ${response?.length || 0} characters`);
      console.log(`[DEBUG] Response ends with: "${response?.slice(-50) || "empty"}"`);
      console.log(`[DEBUG] Response contains ** count: ${(response?.match(/\*\*/g) || []).length}`);

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
    } catch (error) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      console.error(error);
    }
  }

  async generateResponse(message: string, metaData?: any): Promise<string | undefined> {
    try {
      console.log(`[DEBUG] Generating response for message length: ${message?.length || 0}`);

      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      if (metaData?.mode === "Agent") {
        this.orchestrator.publish("onThinking", "...thinking");
        await this.gemini.run(context ? JSON.stringify(`${message} \n context: ${context}`) : JSON.stringify(message));
        return;
      }

      let chatHistory = await this.modelChatHistory("user", `${message} \n context: ${context}`, "gemini", "agentId");

      const chat = this.model.startChat({
        history: [...chatHistory],
      });

      console.log(`[DEBUG] Sending message to Gemini...`);
      const result = await chat.sendMessage(message);
      const response = result.response;
      const responseText = response.text();

      console.log(`[DEBUG] Received response length: ${responseText?.length || 0} characters`);
      console.log(`[DEBUG] Response ends with: "${responseText?.slice(-50) || "empty"}"`);

      // Check if response seems incomplete (ends with incomplete markdown or abruptly)
      const unclosedBoldRegex = /\*\*[^*]*$/;
      const incompletePatterns = [
        /\*\*\s*$/, // ends with ** and optional whitespace
        /\*\*[A-Z]+\s*$/, // ends with **WORD (like **API )
        /\*\*[a-zA-Z0-9]+\s*$/, // ends with **word followed by space
        /\*[^*]\s*$/, // ends with single * and text
        /#\s*$/, // ends with # and whitespace
        /\n\s*\d+\.\s*[A-Z][a-z]*\s*$/, // ends with numbered list item
      ];

      const seemsIncomplete =
        responseText &&
        (responseText.endsWith("**") ||
          responseText.endsWith("*") ||
          responseText.endsWith("**API") ||
          responseText.endsWith("**API ") ||
          unclosedBoldRegex.exec(responseText) !== null ||
          incompletePatterns.some((pattern) => pattern.exec(responseText)) ||
          responseText.length < 50 || // suspiciously short response
          (responseText.length < 200 && responseText.includes("**"))); // short response with bold formatting

      if (seemsIncomplete) {
        console.warn(`[DEBUG] Response seems incomplete, attempting retry...`);
        console.warn(`[DEBUG] Problematic ending: "${responseText?.slice(-100)}"`);

        try {
          // Try a fresh chat session for retry to avoid context issues
          const retryChat = this.model.startChat({
            history: [...chatHistory],
          });

          const retryPrompt = `Please provide a complete and detailed response to: ${message}

IMPORTANT: Make sure your response is complete and doesn't cut off mid-sentence or mid-word. Provide the full answer without truncation.`;

          const retryResult = await retryChat.sendMessage(retryPrompt);
          const retryResponse = retryResult.response.text();

          console.log(`[DEBUG] Retry response length: ${retryResponse?.length || 0} characters`);
          console.log(`[DEBUG] Retry response ends with: "${retryResponse?.slice(-50) || "empty"}"`);

          // If retry is also incomplete, return the longer of the two
          const retryIncomplete = retryResponse && incompletePatterns.some((pattern) => pattern.exec(retryResponse));
          if (retryIncomplete && responseText.length > retryResponse.length) {
            console.warn(`[DEBUG] Retry also incomplete, returning original response`);
            return responseText;
          }

          return retryResponse;
        } catch (retryError) {
          console.error(`[DEBUG] Retry failed:`, retryError);
          return responseText; // Return original if retry fails
        }
      }

      return responseText;
    } catch (error) {
      console.error(`[DEBUG] Error in generateResponse:`, error);
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      vscode.window.showErrorMessage("Model not responding, please resend your question");
      console.error(error);
      return;
    }
  }
}
