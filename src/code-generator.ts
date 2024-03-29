import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";

interface IBaseGenerator {
  generateGeminiModel(apiKey: string, name: string): GenerativeModel;
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

export class CodeGenerator implements IBaseGenerator {
  private apiKeys: IModelConfig;
  private currentModelIndex: number;
  private models: IModelConfig;
  constructor(private readonly presentAction: string, private readonly editor?: vscode.TextEditor) {
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
    const activeConfigs = Object.entries(config).filter(([_, value]) => value !== undefined);
    if (activeConfigs.length === 0) {
      vscode.window.showErrorMessage("Configuration not found. Check your settings.");
      return undefined;
    }
    const activeConfigsObj = Object.fromEntries(activeConfigs) as T;
    const [key, value] = activeConfigs[this.currentModelIndex];
    return {
      activeConfig: [key, value],
      config: activeConfigsObj,
    };
  }

  private async createModel(): Promise<GenerativeModel | undefined> {
    try {
      let model;
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
        if (apiKeyName === "gemini" && generativeAiModel) {
          model = this.generateGeminiModel(apiKey, generativeAiModel);
        }
      }
      return model;
    } catch (error) {
      console.error("Error creating model:", error);
      vscode.window.showErrorMessage("An error occurred while creating the model. Please try again.");
    }
  }

  showInformationMessage() {
    return vscode.window.showInformationMessage(this.presentAction);
  }

  getSelectedWindowArea(): string | undefined {
    const selection: vscode.Selection | undefined = this.editor?.selection;
    const selectedArea: string | undefined = this.editor?.document.getText(selection);
    return selectedArea;
  }

  generateGeminiModel(apiKey: string, name: string): GenerativeModel {
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: name });
    return model;
  }
}
