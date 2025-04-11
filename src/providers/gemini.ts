import { GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import { COMMON } from "../application/constant";
import { IMessageInput, Message } from "../llms/message";
import { Memory } from "../memory/base";
import { GeminiLLM } from "./../llms/gemini/gemini";
import { BaseWebViewProvider } from "./base";

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
      if (this.chatHistory.length === 2) {
        const chatHistory = Memory.has(COMMON.GEMINI_CHAT_HISTORY)
          ? Memory.get(COMMON.GEMINI_CHAT_HISTORY)
          : [];
        Memory.set(COMMON.GEMINI_CHAT_HISTORY, [
          ...chatHistory,
          ...this.chatHistory,
        ]);
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

  async generateResponse(
    message: string,
    metaData?: any,
  ): Promise<string | undefined> {
    try {
      let context: string | undefined;
      if (metaData.context as string[]) {
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
      const userMessage = Message.of({
        role: "user",
        parts: [
          {
            text: `${message} \n context: ${context}`,
          },
        ],
      });
      let chatHistory = Memory.has(COMMON.GEMINI_CHAT_HISTORY)
        ? Memory.get(COMMON.GEMINI_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.GEMINI_CHAT_HISTORY);

      const chat = this.model.startChat({
        history: [...chatHistory],
      });
      const result = await chat.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error) {
      Memory.set(COMMON.GEMINI_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
      console.error(error);
      return;
    }
  }
}
