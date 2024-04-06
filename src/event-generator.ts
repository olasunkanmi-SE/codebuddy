/* eslint-disable @typescript-eslint/no-unused-vars */
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import { ChatViewProvider } from "./providers/chat-web-view-provider";

interface IEventGenerator {
  getModelConfig(configSuffix: string): IModelConfig;
  getApplicationConfig(configKey: string): string | undefined;
  showInformationMessage(): Thenable<string | undefined>;
  getSelectedWindowArea(): string | undefined;
}

type TModelName = "gemini" | "openai" | "groq";

type IModelConfig = {
  [key in TModelName]?: string;
};

interface IActiveConfig<T> {
  activeConfig: string[];
  config: T;
}

export abstract class EventGenerator implements IEventGenerator {
  private apiKeys: IModelConfig;
  private currentModelIndex: number;
  private models: IModelConfig;
  constructor(private readonly action: string) {
    this.apiKeys = this.getModelConfig("apiKey");
    this.models = this.getModelConfig("model");
    this.currentModelIndex = 0;
  }

  getModelConfig(configSuffix: string): IModelConfig {
    return {
      groq: this.getApplicationConfig(`groq.${configSuffix}`),
      gemini: this.getApplicationConfig(`google.gemini.${configSuffix}`),
      openai: this.getApplicationConfig(`openai.${configSuffix}`),
    };
  }

  getApplicationConfig(configKey: string): string | undefined {
    return vscode.workspace.getConfiguration().get<string>(configKey);
  }

  private getActiveConfig<T extends IModelConfig>(config: T): IActiveConfig<T> | undefined {
    const activeConfigs = Object.entries(config).filter(([_, value]) => value);
    if (activeConfigs.length === 0) {
      vscode.window.showInformationMessage(
        "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
        { modal: true }
      );
      return undefined;
    }
    const activeConfigsObj = Object.fromEntries(activeConfigs) as T;
    const [key, value] = activeConfigs[this.currentModelIndex];
    return {
      activeConfig: [key, value],
      config: activeConfigsObj,
    };
  }

  protected createModel(): { name?: string; model?: GenerativeModel } | undefined {
    try {
      let model;
      let modelName;
      const activeApiKeyConfig = this.getActiveConfig(this.apiKeys);
      if (!activeApiKeyConfig) {
        vscode.window.showErrorMessage("ApiKey not found. Check your settings.");
        return;
      }
      const activeModelConfig = this.getActiveConfig(this.models);

      if (!activeModelConfig) {
        vscode.window.showErrorMessage("ApiKey not found. Check your settings.");
        return;
      }
      const [apiKeyName, apiKey] = activeApiKeyConfig.activeConfig;
      const modelConfig: IModelConfig = activeModelConfig.config;
      if (Object.hasOwnProperty.call(modelConfig, apiKeyName)) {
        const generativeAiModel: string | undefined = modelConfig[apiKeyName as keyof IModelConfig];
        modelName = apiKeyName;
        if (apiKeyName === "gemini" && generativeAiModel) {
          model = this.createGeminiModel(apiKey, generativeAiModel);
        }
      }
      return { name: modelName, model };
    } catch (error) {
      console.error("Error creating model:", error);
      vscode.window.showErrorMessage("An error occurred while creating the model. Please try again.");
    }
  }

  showInformationMessage(): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(this.action);
  }

  getSelectedWindowArea(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.debug("Abandon: no open text editor.");
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

  protected async generateModelResponse(text: string): Promise<string | undefined> {
    const activeModel = this.createModel();
    if (!activeModel) {
      vscode.window.showErrorMessage("model not found. Check your settings.");
      return;
    }
    const { name, model } = activeModel;
    if (!name) {
      vscode.window.showErrorMessage("model not found. Check your settings.");
      return;
    }
    if (!model) {
      vscode.window.showErrorMessage("model not found. Check your settings.");
      return;
    }
    const result = await model.generateContent(text);
    const response = await result.response;
    return response.text();
  }

  abstract formatResponse(comment: string): string;

  abstract createPrompt(text?: string): string;

  async generateResponse(): Promise<string | undefined> {
    this.showInformationMessage();
    let prompt;
    const selectedCode = this.getSelectedWindowArea();
    if (!selectedCode) {
      vscode.window.showErrorMessage("select a piece of code.");
      return;
    }
    prompt = this.createPrompt(selectedCode);

    if (!prompt) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }

    const response = await this.generateModelResponse(prompt);
    return response;
  }

  async execute(): Promise<void> {
    const comment = await this.generateResponse();
    if (!comment) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.debug("Abandon: no open text editor.");
      return;
    }

    const formattedComment = this.formatResponse(comment);
    if (!formattedComment) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }

    await ChatViewProvider.v?.webview.postMessage({
      type: "user-input",
      message: formattedComment,
    });
  }
}
