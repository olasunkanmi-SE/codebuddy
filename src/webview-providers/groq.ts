import Groq from "groq-sdk";
import * as vscode from "vscode";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { Memory } from "../memory/base";
import { BaseWebViewProvider } from "./base";
import { IMessageInput, Message } from "../llms/message";

export class GroqWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: Groq;
  private static instance: GroqWebViewProvider;
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.model = new Groq({
      apiKey: this.apiKey,
      maxRetries: 3,
    });
  }

  static initialize(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    if (!GroqWebViewProvider.instance) {
      GroqWebViewProvider.instance = new GroqWebViewProvider(
        extensionUri,
        apiKey,
        generativeAiModel,
        context,
      );
    }
  }

  public async sendResponse(
    response: string,
    participant: string,
  ): Promise<boolean | undefined> {
    try {
      const type = participant === "bot" ? "bot-response" : "user-input";
      if (participant === "bot") {
        this.chatHistory.push(
          Message.of({
            role: "system",
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
      if (this.chatHistory.length === 2) {
        const chatHistory = Memory.has(COMMON.GROQ_CHAT_HISTORY)
          ? Memory.get(COMMON.GROQ_CHAT_HISTORY)
          : [];
        Memory.set(COMMON.GROQ_CHAT_HISTORY, [
          ...chatHistory,
          ...this.chatHistory,
        ]);
      }
      // Once the agent task is done, map the memory into the llm brain.
      // Send the final answer to the webview here.
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async generateResponse(
    message: string,
    metaData?: any,
  ): Promise<string | undefined> {
    try {
      let context: string | undefined;
      if (metaData?.context.length > 0) {
        context = await this.getContext(metaData.context);
      }
      const { temperature, max_tokens, top_p, stop } = GROQ_CONFIG;
      const userMessage = Message.of({
        role: "user",
        content: `${message} \n context: ${context}`,
      });
      let chatHistory = Memory.has(COMMON.GROQ_CHAT_HISTORY)
        ? Memory.get(COMMON.GROQ_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.GROQ_CHAT_HISTORY);

      const chatCompletion = this.model.chat.completions.create({
        messages: [...chatHistory],
        model: this.generativeAiModel,
        temperature,
        top_p,
        stream: false,
        stop,
      });
      const response = (await chatCompletion).choices[0]?.message?.content;
      return response ?? undefined;
    } catch (error) {
      console.error(error);
      Memory.set(COMMON.GROQ_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
      return;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }
}
