import {
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import * as vscode from "vscode";
import { COMMON } from "../application/constant";
import { Memory } from "../memory/base";
import { BaseWebViewProvider } from "./base";
import { createPrompt } from "../utils/prompt";
import { ProcessInputResult } from "../application/interfaces/agent.interface";

type Role = "function" | "user" | "model";
export interface IHistory {
  role: Role;
  parts: { text: string }[];
}

export class GeminiWebViewProvider extends BaseWebViewProvider {
  chatHistory: IHistory[] = [];
  readonly genAI: GoogleGenerativeAI;
  readonly model: GenerativeModel;
  readonly metaData?: Record<string, any>;
  constructor(
    extensionUri: vscode.Uri,
    apiKey: string,
    generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    super(extensionUri, apiKey, generativeAiModel, context);
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.generativeAiModel,
    });
  }

  async sendResponse(
    response: string,
    currentChat: string,
  ): Promise<boolean | undefined> {
    try {
      const type = currentChat === "bot" ? "bot-response" : "user-input";
      if (currentChat === "bot") {
        this.chatHistory.push({
          role: "model",
          parts: [{ text: response }],
        });
      } else {
        this.chatHistory.push({
          role: "user",
          parts: [{ text: response }],
        });
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
    apiKey: string,
    name: string,
    message: string,
  ): Promise<string | undefined> {
    try {
      let chatHistory = Memory.has(COMMON.GEMINI_CHAT_HISTORY)
        ? Memory.get(COMMON.GEMINI_CHAT_HISTORY)
        : [];

      if (chatHistory?.length) {
        chatHistory = [
          ...chatHistory,
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ];
      }

      if (!chatHistory?.length) {
        chatHistory = [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ];
      }

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

  async generateContent(
    userInput: string,
  ): Promise<Partial<ProcessInputResult>> {
    try {
      const prompt = createPrompt(userInput);
      const generateContentResponse: GenerateContentResult =
        await this.model.generateContent(prompt);
      const { text, usageMetadata } = generateContentResponse.response;
      const parsedResponse = this.orchestrator.parseResponse(text());
      const extractedQueries = parsedResponse.queries;
      const extractedThought = parsedResponse.thought;
      const tokenCount = usageMetadata?.totalTokenCount ?? 0;
      const result = {
        queries: extractedQueries,
        tokens: tokenCount,
        prompt: userInput,
        thought: extractedThought,
      };
      this.orchestrator.publish("onStatus", JSON.stringify(result));
      return result;
    } catch (error: any) {
      this.orchestrator.publish("onError", error);
      vscode.window.showErrorMessage("Error processing user query");
      this.logger.error(
        "Error generating, queries, thoughts from user query",
        error,
      );
      throw error;
    }
  }
}
