/* eslint-disable @typescript-eslint/no-unused-vars */
import Anthropic from "@anthropic-ai/sdk";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import * as vscode from "vscode";
import {
  APP_CONFIG,
  COMMON,
  generativeAiModels,
} from "../application/constant";
import { AnthropicWebViewProvider } from "../webview-providers/anthropic";
import { GeminiWebViewProvider } from "../webview-providers/gemini";
import { GroqWebViewProvider } from "../webview-providers/groq";
import {
  createAnthropicClient,
  getConfigValue,
  getLatestChatHistory,
  getXGroKBaseURL,
  vscodeErrorMessage,
} from "../utils/utils";
import { Memory } from "../memory/base";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../agents/orchestrator";

interface ICodeCommandHandler {
  getApplicationConfig(configKey: string): string | undefined;
  getSelectedWindowArea(): string | undefined;
}

export abstract class CodeCommandHandler implements ICodeCommandHandler {
  context: vscode.ExtensionContext;
  protected readonly orchestrator: Orchestrator;
  protected error?: string;
  private readonly generativeAi: string;
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;
  private readonly groqApiKey: string;
  private readonly groqModel: string;
  private readonly anthropicModel: string;
  private readonly anthropicApiKey: string;
  private readonly xGrokApiKey: string;
  private readonly xGrokModel: string;
  private readonly logger: Logger;
  constructor(
    private readonly action: string,
    _context: vscode.ExtensionContext,
    errorMessage?: string,
  ) {
    this.context = _context;
    this.error = errorMessage;
    const {
      generativeAi,
      geminiKey,
      geminiModel,
      groqApiKey,
      groqModel,
      anthropicModel,
      anthropicApiKey,
      grokApiKey,
      grokModel,
    } = APP_CONFIG;
    this.generativeAi = getConfigValue(generativeAi);
    this.geminiApiKey = getConfigValue(geminiKey);
    this.geminiModel = getConfigValue(geminiModel);
    this.groqApiKey = getConfigValue(groqApiKey);
    this.groqModel = getConfigValue(groqModel);
    this.anthropicModel = getConfigValue(anthropicModel);
    this.anthropicApiKey = getConfigValue(anthropicApiKey);
    this.xGrokApiKey = getConfigValue(grokApiKey);
    this.xGrokModel = getConfigValue(grokModel);
    this.logger = Logger.initialize("CodeCommandHandler", {
      minLevel: LogLevel.DEBUG,
    });
    this.orchestrator = Orchestrator.getInstance();
  }

  getApplicationConfig(configKey: string): string | undefined {
    return getConfigValue(configKey);
  }

  protected createModel():
    | { generativeAi: string; model: any; modelName: string }
    | undefined {
    try {
      let model;
      let modelName = "";
      if (!this.generativeAi) {
        vscodeErrorMessage(
          "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
        );
      }
      if (this.generativeAi === generativeAiModels.GROQ) {
        const apiKey = this.groqApiKey;
        modelName = this.groqModel;
        if (!apiKey || !modelName) {
          vscodeErrorMessage(
            "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
          );
        }
        model = this.createGroqModel(apiKey);
      }

      if (this.generativeAi === generativeAiModels.GEMINI) {
        const apiKey = this.geminiApiKey;
        modelName = this.geminiModel;
        model = this.createGeminiModel(apiKey, modelName);
      }

      if (this.generativeAi === generativeAiModels.ANTHROPIC) {
        const apiKey: string = this.anthropicApiKey;
        modelName = this.anthropicModel;
        model = this.createAnthropicModel(apiKey);
      }

      if (this.generativeAi === generativeAiModels.GROK) {
        const apiKey: string = this.xGrokApiKey;
        modelName = this.xGrokModel;
        model = this.createAnthropicModel(apiKey);
      }
      return { generativeAi: this.generativeAi, model, modelName };
    } catch (error) {
      console.error("Error creating model:", error);
      vscode.window.showErrorMessage(
        "An error occurred while creating the model. Please try again.",
      );
    }
  }

  getSelectedWindowArea(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.logger.info("No active text editor.");
      return;
    }
    const selection: vscode.Selection | undefined = editor.selection;
    const selectedArea: string | undefined = editor.document.getText(selection);
    return selectedArea;
  }

  private createGeminiModel(apiKey: string, name: string): GenerativeModel {
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: name });
    return model;
  }

  private createAnthropicModel(apiKey: string): Anthropic {
    let xGrokBaseURL;
    if (getConfigValue(APP_CONFIG.generativeAi) === generativeAiModels.GROK) {
      xGrokBaseURL = getXGroKBaseURL();
    }
    return createAnthropicClient(apiKey, xGrokBaseURL);
  }

  private createGroqModel(apiKey: string): Groq {
    return new Groq({ apiKey });
  }

  protected async generateModelResponse(
    text: string,
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    try {
      if (text?.length > 0) {
        this.orchestrator.publish("onUserPrompt", text);
      }
      const activeModel = this.createModel();
      if (!activeModel) {
        throw new Error("Model not found. Check your settings.");
      }

      const { generativeAi, model, modelName } = activeModel;
      if (!generativeAi || !generativeAiModels) {
        throw new Error("Model not found. Check your settings.");
      }
      let response;
      switch (generativeAi) {
        case generativeAiModels.GEMINI:
          response = await this.generateGeminiResponse(model, text);
          break;
        case generativeAiModels.ANTHROPIC:
          if (modelName) {
            response = await this.anthropicResponse(model, modelName, text);
          }
          break;
        case generativeAiModels.GROQ:
          if (modelName) {
            response = await this.groqResponse(model, text, modelName);
          }
          break;
        case generativeAiModels.GROK:
          if (modelName) {
            response = await this.anthropicResponse(model, modelName, text);
          }
          break;
        default:
          throw new Error("Unsupported model name.");
      }

      if (!response) {
        throw new Error(
          "Could not generate response. Check your settings, ensure the API keys and Model Name is added properly.",
        );
      }
      if (this.action.includes("chart")) {
        if (typeof response === "string") {
          response = this.cleanGraphString(response);
        }
      }
      return response;
    } catch (error) {
      this.logger.error("Error generating response:", error);
      vscode.window.showErrorMessage(
        "An error occurred while generating the response. Please try again.",
      );
    }
  }

  cleanGraphString(inputString: string) {
    if (inputString.includes("|>")) {
      return inputString.replace(/\|>/g, "|");
    }
    return inputString;
  }

  async generateGeminiResponse(
    model: any,
    text: string,
  ): Promise<string | undefined> {
    const result = await model.generateContent(text);
    return result ? await result.response.text() : undefined;
  }

  private async anthropicResponse(
    model: Anthropic,
    generativeAiModel: string,
    userPrompt: string,
  ): Promise<string | undefined> {
    try {
      const response = await model.messages.create({
        model: generativeAiModel,
        system: "",
        max_tokens: 3024,
        messages: [{ role: "user", content: userPrompt }],
      });
      const firstContent = response.content[0];
      if (
        firstContent &&
        typeof firstContent === "object" &&
        "text" in firstContent &&
        typeof firstContent.text === "string"
      ) {
        return firstContent.text;
      }
      return undefined;
    } catch (error) {
      this.logger.error("Error generating response:", error);
    }
  }

  private async groqResponse(
    model: Groq,
    prompt: string,
    generativeAiModel: string,
  ): Promise<string | undefined> {
    try {
      const chatHistory = Memory.has(COMMON.ANTHROPIC_CHAT_HISTORY)
        ? Memory.get(COMMON.GROQ_CHAT_HISTORY)
        : [];
      const params = {
        messages: [
          ...chatHistory,
          {
            role: "user",
            content: prompt,
          },
        ],
        model: generativeAiModel,
      };

      const completion: Groq.Chat.ChatCompletion =
        await model.chat.completions.create(params);
      return completion.choices[0]?.message?.content ?? undefined;
    } catch (error) {
      this.logger.error("Error generating response:", error);
    }
  }

  abstract formatResponse(comment: string): string;

  abstract createPrompt(text?: string): any;

  async generateResponse(
    message?: string,
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    this.logger.info(this.action);
    let prompt;
    const selectedCode = this.getSelectedWindowArea();
    if (!message && !selectedCode) {
      vscode.window.showErrorMessage("select a piece of code.");
      return;
    }

    if (message && selectedCode) {
      prompt = await this.createPrompt(`${message} \n ${selectedCode}`);
    } else {
      message
        ? (prompt = await this.createPrompt(message))
        : (prompt = await this.createPrompt(selectedCode));
    }

    if (!prompt) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }

    const response = await this.generateModelResponse(prompt);
    const model = getConfigValue("generativeAi.option");

    if (prompt && response) {
      let chatHistory;
      switch (model) {
        case generativeAiModels.GEMINI:
          chatHistory = getLatestChatHistory(COMMON.GEMINI_CHAT_HISTORY);
          Memory.set(COMMON.GEMINI_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              parts: [{ text: prompt }],
            },
            {
              role: "model",
              parts: [{ text: response }],
            },
          ]);
          break;
        case generativeAiModels.GROQ:
          chatHistory = getLatestChatHistory(COMMON.GROQ_CHAT_HISTORY);
          Memory.set(COMMON.GROQ_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "system",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.ANTHROPIC:
          chatHistory = getLatestChatHistory(COMMON.ANTHROPIC_CHAT_HISTORY);
          Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        case generativeAiModels.GROK:
          chatHistory = getLatestChatHistory(COMMON.ANTHROPIC_CHAT_HISTORY);
          Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
            ...chatHistory,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ]);
          break;
        default:
          throw new Error(`Generative model ${model} not available`);
      }
    }
    return response;
  }

  async getUserInLineChat(): Promise<string | undefined> {
    try {
      const userPrompt = await vscode.window.showInputBox({
        placeHolder: "Enter instructions for CodeBuddy",
        ignoreFocusOut: true,
        validateInput: (text) => {
          return text === ""
            ? "Enter instructions for CodeBuddy or press Escape to close chat box"
            : null;
        },
      });
      return userPrompt;
    } catch (error) {
      this.logger.error("Error generating inline chat", error);
    }
  }

  async execute(message?: string, action?: string): Promise<void> {
    try {
      let prompt: string | undefined;
      const response = (await this.generateResponse(
        prompt ?? message,
      )) as string;
      if (!response) {
        vscode.window.showErrorMessage("model not reponding, try again later");
        return;
      }
      const formattedResponse = this.formatResponse(response);
      if (!formattedResponse) {
        vscode.window.showErrorMessage("model not reponding, try again later");
        return;
      }
      switch (this.generativeAi) {
        case generativeAiModels.GROQ:
          await GroqWebViewProvider.webView?.webview.postMessage({
            type: "codebuddy-commands",
            message: action,
          });
          await GroqWebViewProvider.webView?.webview.postMessage({
            type: "bot-response",
            message: formattedResponse,
          });
          break;
        case generativeAiModels.GEMINI:
          await GeminiWebViewProvider.webView?.webview.postMessage({
            type: "codebuddy-commands",
            message: action,
          });
          await GeminiWebViewProvider.webView?.webview.postMessage({
            type: "bot-response",
            message: formattedResponse,
          });
          break;
        case generativeAiModels.ANTHROPIC:
        case generativeAiModels.GROK:
          await AnthropicWebViewProvider.webView?.webview.postMessage({
            type: "codebuddy-commands",
            message: action,
          });
          await AnthropicWebViewProvider.webView?.webview.postMessage({
            type: "bot-response",
            message: formattedResponse,
          });
          break;
        default:
          this.logger.error("Unknown generative AI", "");
          break;
      }
    } catch (error) {
      this.logger.error(
        "Error while passing model response to the webview",
        error,
      );
    }
  }
}
