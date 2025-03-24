import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base";
import { COMMON, GROQ_CONFIG } from "../application/constant";
import { Memory } from "../memory/base";
import { IMessageInput, Message } from "../llms/message";
import OpenAI from "openai";

export class DeepseekWebViewProvider extends BaseWebViewProvider {
  chatHistory: IMessageInput[] = [];
  readonly model: OpenAI;
  
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
    protected baseUrl?: string,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.model = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl || "https://api.deepseek.com"
    });
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

      if (this.chatHistory.length === 2) {
        const chatHistory = Memory.has(COMMON.DEEPSEEK_CHAT_HISTORY)
          ? Memory.get(COMMON.DEEPSEEK_CHAT_HISTORY)
          : [];
        Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, [
          ...chatHistory,
          ...this.chatHistory,
        ]);
      }
      return await this.currentWebView?.webview.postMessage({
        type,
        message: response,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async generateResponse(message: string): Promise<string | undefined> {
    try {
      const { max_tokens } = GROQ_CONFIG;
      const userMessage = Message.of({ role: "user", content: message });
      let chatHistory = Memory.has(COMMON.DEEPSEEK_CHAT_HISTORY)
        ? Memory.get(COMMON.DEEPSEEK_CHAT_HISTORY)
        : [userMessage];

      chatHistory = [...chatHistory, userMessage];

      Memory.removeItems(COMMON.DEEPSEEK_CHAT_HISTORY);

      // Call Deepseek API to get a response
      const response = await this.callDeepseekAPI(chatHistory, max_tokens);
      
      return response;
    } catch (error) {
      console.error(error);
      Memory.set(COMMON.DEEPSEEK_CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question"
      );
    }
  }

  private async callDeepseekAPI(chatHistory: IMessageInput[], maxTokens: number): Promise<string> {
    try {
      const messages = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Using OpenAI SDK with Deepseek API endpoint as shown in their documentation
      const chatCompletion = await this.model.chat.completions.create({
        model: this.generativeAiModel,
        messages: messages,
        max_tokens: maxTokens,
        stream: false
      });
      
      // Extract the text from the response
      const response = chatCompletion.choices[0].message.content;
      return response;
    } catch (error) {
      console.error("Error calling Deepseek API:", error);
      throw error;
    }
  }

  generateContent(userInput: string) {
    return userInput;
  }
}