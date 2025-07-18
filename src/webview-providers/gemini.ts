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
    this.gemini = new GeminiLLM({
      apiKey: this.apiKey,
      model: this.generativeAiModel,
    });
    this.model = this.gemini.getModel();
  }

  async sendResponse(response: string, currentChat: string): Promise<boolean | undefined> {
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
    } catch (error) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      console.error(error);
    }
  }

  async generateResponse(message: string, metaData?: any): Promise<string | undefined> {
    try {
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      if (metaData?.mode === "Agent") {
        console.log("Agent mode activated, calling gemini.run with:", message);
        this.orchestrator.publish("onThinking", "...thinking");
        const queryText = context ? `${message} \n context: ${context}` : message;
        const result = await this.gemini.run(queryText);
        console.log("Agent mode completed, result:", result);

        // Return the result as a string if it's available
        if (result) {
          if (typeof result === "string") {
            return result;
          } else if (result && typeof result === "object" && "response" in result) {
            return result.response?.text?.() || "Agent completed successfully";
          }
        }

        return "Agent completed successfully";
      }

      let chatHistory = await this.modelChatHistory("user", `${message} \n context: ${context}`, "gemini", "agentId");

      const chat = this.model.startChat({
        history: [...chatHistory],
      });
      const result = await chat.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      vscode.window.showErrorMessage("Model not responding, please resend your question");
      console.error(error);
      return;
    }
  }
}
