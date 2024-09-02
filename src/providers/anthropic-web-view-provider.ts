import * as vscode from "vscode";
import { BaseWebViewProvider } from "./base-web-view-provider";
import { COMMON, GROQ_CONFIG } from "../constant";
import Anthropic from "@anthropic-ai/sdk";

type Role = "user" | "assistant";
export interface IHistory {
  role: Role;
  content: string;
}

export class AnthropicWebViewProvider extends BaseWebViewProvider {
  chatHistory: IHistory[] = [];
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
  }

  public async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.unshift({
          role: "assistant",
          content: response,
        });
      } else {
        this.chatHistory.push({
          role: "user",
          content: response,
        });
      }
      if (this.chatHistory.length === 2) {
        const history: IHistory[] | undefined =
          this._context.workspaceState.get(COMMON.CHAT_HISTORY, []);
        this._context.workspaceState.update(COMMON.CHAT_HISTORY, [
          ...history,
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
      const anthropic = new Anthropic({
        apiKey: this.apiKey,
      });
      let chatHistory = this._context.workspaceState.get<IHistory[]>(
        COMMON.CHAT_HISTORY,
        [],
      );
      if (chatHistory?.length >= 3) {
        chatHistory = chatHistory.slice(-2);
      }
      const chatCompletion = await anthropic.messages.create({
        messages: [
          {
            role: "user",
            content: `You are an AI coding assistant named Olasunkanmi, created to help developers write better code more efficiently. Your purpose is to provide intelligent code suggestions, completions, and assistance based on the context and requirements provided by the developer.As Olasunkanmi, you have the following capabilities:1. Analyze the existing code and understand its structure, context, and purpose. 2. Generate code snippets, completions, and suggestions based on the developer's input and the surrounding code.3. Provide explanations and justifications for the generated code to help the developer understand the reasoning behind the suggestions.4. Assist with debugging and troubleshooting by identifying potential issues and offering solutions.5. Optimize code performance by suggesting improvements and best practices.6. Adapt to various programming languages, frameworks, and libraries based on the context of the code.When a developer requests your assistance, follow these guidelines:1. Carefully analyze the provided code snippet or context to understand the developer's intent and requirements.2. Generate code suggestions or completions that are relevant, efficient, and adhere to best practices and coding conventions.3. Provide clear and concise explanations for the generated code, highlighting the key aspects and reasoning behind the suggestions.4. If asked for debugging assistance, identify potential issues or bugs in the code and suggest appropriate fixes or improvements.5. Offer recommendations for code optimization, such as improving performance, readability, or maintainability, when applicable.6. Adapt your suggestions and explanations based on the specific programming language, framework, or library being used in the code.7. Be proactive in offering alternative solutions or approaches when multiple valid options are available.8. Engage in a conversation with the developer to clarify requirements, provide additional context, or iterate on the generated code suggestions. ${message}`,
          },
          ...chatHistory,
        ],
        model: this.generativeAiModel,
        max_tokens,
        stream: false,
      });
      const response = chatCompletion.content[0].text;
      return response;
    } catch (error) {
      console.error(error);
      this._context.workspaceState.update(COMMON.CHAT_HISTORY, []);
      vscode.window.showErrorMessage(
        "Model not responding, please resend your question",
      );
      return;
    }
  }
}
