/* eslint-disable @typescript-eslint/no-unused-vars */
import Anthropic from "@anthropic-ai/sdk";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import * as vscode from "vscode";
import {
  GroqWebViewProvider,
  IHistory,
} from "../providers/groq-web-view-provider";
import { getConfigValue, vscodeErrorMessage } from "../utils";
import { GeminiWebViewProvider } from "../providers/gemini-web-view-provider";
import {
  APP_CONFIG,
  COMMON,
  generativeAiModel,
  GROQ_CONFIG,
} from "../constant";

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
  private readonly grokApiKey: string;
  private readonly grokModel: string;
  private readonly anthropicModel: string;
  private readonly anthropicApiKey: string;
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
      groqKey,
      groqModel,
      anthropicModel,
      anthropicApiKey,
    } = APP_CONFIG;
    this.generativeAi = getConfigValue(generativeAi);
    this.geminiApiKey = getConfigValue(geminiKey);
    this.geminiModel = getConfigValue(geminiModel);
    this.grokApiKey = getConfigValue(groqKey);
    this.grokModel = getConfigValue(groqModel);
    this.anthropicModel = getConfigValue(anthropicModel);
    this.anthropicApiKey = getConfigValue(anthropicApiKey);
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
      if (this.generativeAi === generativeAiModel.GROQ) {
        const apiKey = this.grokApiKey;
        modelName = this.grokModel;
        if (!apiKey || !modelName) {
          vscodeErrorMessage(
            "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
          );
        }
        model = this.createGroqModel(apiKey);
      }

      if (this.generativeAi === generativeAiModel.GEMINI) {
        const apiKey = this.geminiApiKey;
        modelName = this.geminiModel;
        model = this.createGeminiModel(apiKey, modelName);
      }

      if (this.geminiApiKey === generativeAiModel.ANTHROPIC) {
        const apiKey: string = this.anthropicApiKey;
        modelName = this.anthropicModel;
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
    return new Anthropic({
      apiKey,
    });
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
      if (!generativeAi || !generativeAiModel) {
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
        max_tokens: 1024,
        messages: [{ role: "user", content: userPrompt }],
      });
      return response;
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
      const chatHistory = this.context.workspaceState.get<IHistory[]>(
        COMMON.CHAT_HISTORY,
        [],
      );
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
    errorMessage?: string,
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    this.showInformationMessage();
    let prompt;
    const selectedCode = this.getSelectedWindowArea();
    if (!errorMessage && !selectedCode) {
      vscode.window.showErrorMessage("select a piece of code.");
      return;
    }

    errorMessage
      ? (prompt = await this.createPrompt(errorMessage))
      : (prompt = await this.createPrompt(selectedCode));

    if (!prompt) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }

    const response = await this.generateModelResponse(prompt);
    const model = this.geminiModel;
    //TODO check the format of the history and ensure it conforms with the current model, else delete the history
    if (prompt && response) {
      switch (model) {
        case generativeAiModel.GEMINI:
          this.context.workspaceState.update(COMMON.CHAT_HISTORY, [
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
        case generativeAiModel.GROQ:
          this.context.workspaceState.update(COMMON.CHAT_HISTORY, [
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
        case generativeAiModel.ANTHROPIC:
          this.context.workspaceState.update(COMMON.CHAT_HISTORY, [
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
          break;
      }
    }
    return response;
  }

  async execute(errorMessage?: string): Promise<void> {
    const response = (await this.generateResponse(errorMessage)) as string;
    if (!response) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }
    const formattedResponse = this.formatResponse(response);
    if (!formattedResponse) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }
    if (this.generativeAi === "Groq") {
      await GroqWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedResponse,
      });
    }

    if (this.generativeAi === "Gemini") {
      await GeminiWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedResponse,
      });
    }
  }
}
