/* eslint-disable @typescript-eslint/no-unused-vars */
import Anthropic from "@anthropic-ai/sdk";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import * as vscode from "vscode";
import { APP_CONFIG, COMMON, generativeAiModels } from "../constant";
import { AnthropicWebViewProvider } from "../providers/anthropic-web-view-provider";
import { GeminiWebViewProvider } from "../providers/gemini-web-view-provider";
import { GroqWebViewProvider } from "../providers/groq-web-view-provider";
import { Brain } from "../services/memory";
import {
  createAnthropicClient,
  getConfigValue,
  getLatestChatHistory,
  getXGroKBaseURL,
  vscodeErrorMessage,
} from "../utils";

interface IEventGenerator {
  getApplicationConfig(configKey: string): string | undefined;
  showInformationMessage(): Thenable<string | undefined>;
  getSelectedWindowArea(): string | undefined;
}

export abstract class EventGenerator implements IEventGenerator {
  context: vscode.ExtensionContext;
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
  // Todo Need to refactor. Only one instance of a model can be created at a time. Therefore no need to retrieve all model information, only retrieve the required model within the application
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

  showInformationMessage(): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(this.action);
  }

  getSelectedWindowArea(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage("No active text editor.");
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
      const activeModel = this.createModel();
      if (!activeModel) {
        throw new Error("Model not found. Check your settings.");
      }

      const { generativeAi, model, modelName } = activeModel;
      //
      if (!generativeAi || !generativeAiModels) {
        throw new Error("Model not found. Check your settings.");
      }
      let response;
      switch (generativeAi) {
        case "Gemini":
          response = await this.generateGeminiResponse(model, text);
          break;
        case "Anthropic":
          if (modelName) {
            response = await this.anthropicResponse(model, modelName, text);
          }
          break;
        case "Groq":
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
        response = this.cleanGraphString(response as string);
      }
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
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
  ) {
    try {
      const response = await model.messages.create({
        model: generativeAiModel,
        system: "",
        max_tokens: 3024,
        messages: [{ role: "user", content: userPrompt }],
      });
      return response.content[0].text;
    } catch (error) {
      console.error("Error generating response:", error);
      vscode.window.showErrorMessage(
        "An error occurred while generating the response. Please try again.",
      );
      return;
    }
  }

  private async groqResponse(
    model: Groq,
    prompt: string,
    generativeAiModel: string,
  ): Promise<string | undefined> {
    try {
      const chatHistory = Brain.has(COMMON.ANTHROPIC_CHAT_HISTORY)
        ? Brain.get(COMMON.GROQ_CHAT_HISTORY)
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
      console.error("Error generating response:", error);
      vscode.window.showErrorMessage(
        "An error occurred while generating the response. Please try again.",
      );
      return;
    }
  }

  abstract formatResponse(comment: string): string;

  abstract createPrompt(text?: string): any;

  async generateResponse(
    message?: string,
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    this.showInformationMessage();
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
          Brain.set(COMMON.GEMINI_CHAT_HISTORY, [
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
          Brain.set(COMMON.GROQ_CHAT_HISTORY, [
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
          Brain.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
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
          Brain.set(COMMON.ANTHROPIC_CHAT_HISTORY, [
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
      if (userPrompt) {
        Brain.set("inLineChat", true);
      }
      return userPrompt;
    } catch (error) {
      vscode.window.showInformationMessage(
        `Error occured while getting user prompt`,
      );
      console.log(error);
    }
  }

  async execute(message?: string): Promise<void> {
    const prompt: string | undefined = await this.getUserInLineChat();
    if (prompt && Brain.has("inLineChat")) {
      Brain.delete("inLineChat");
    }
    const response = (await this.generateResponse(
      prompt ? prompt : message,
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
    if (this.generativeAi === generativeAiModels.GROQ) {
      await GroqWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedResponse,
      });
    }

    if (this.generativeAi === generativeAiModels.GEMINI) {
      await GeminiWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedResponse,
      });
    }

    if (this.generativeAi === generativeAiModels.ANTHROPIC) {
      await AnthropicWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedResponse,
      });
    }

    if (this.generativeAi === generativeAiModels.GROK) {
      await AnthropicWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedResponse,
      });
    }
  }
}
