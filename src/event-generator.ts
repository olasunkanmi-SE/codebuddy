/* eslint-disable @typescript-eslint/no-unused-vars */
import Anthropic from "@anthropic-ai/sdk";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import * as vscode from "vscode";
import { GroqWebViewProvider } from "./providers/groq-web-view-provider";

interface IEventGenerator {
  getModelConfig(configSuffix: string): IModelConfig;
  getApplicationConfig(configKey: string): string | undefined;
  showInformationMessage(): Thenable<string | undefined>;
  getSelectedWindowArea(): string | undefined;
}

type TModelName = "gemini" | "openai" | "groq" | "claude";

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
  private context: vscode.ExtensionContext;
  constructor(
    private readonly action: string,
    _context: vscode.ExtensionContext
  ) {
    this.apiKeys = this.getModelConfig("apiKey");
    this.models = this.getModelConfig("model");
    this.currentModelIndex = 0;
    this.context = _context;
  }

  getModelConfig(configSuffix: string): IModelConfig {
    return {
      groq: this.getApplicationConfig(`groq.${configSuffix}`),
      gemini: this.getApplicationConfig(`google.gemini.${configSuffix}`),
      openai: this.getApplicationConfig(`openai.${configSuffix}`),
      claude: this.getApplicationConfig(`claude.opus.${configSuffix}`),
    };
  }

  getApplicationConfig(configKey: string): string | undefined {
    return vscode.workspace.getConfiguration().get<string>(configKey);
  }

  private getActiveConfig<T extends IModelConfig>(
    config: T
  ): IActiveConfig<T> | undefined {
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

  protected createModel():
    | { name: string; model: any; generativeAiModel?: string }
    | undefined {
    try {
      const activeApiKeyConfig = this.getActiveConfig(this.apiKeys);
      if (!activeApiKeyConfig) {
        vscode.window.showErrorMessage(
          "ApiKey not found. Check your settings."
        );
        return;
      }

      const activeModelConfig = this.getActiveConfig(this.models);
      if (!activeModelConfig) {
        vscode.window.showErrorMessage(
          "ApiKey not found. Check your settings."
        );
        return;
      }

      const {
        activeConfig: [apiKeyName, apiKey],
      } = activeApiKeyConfig;
      const { config: modelConfig } = activeModelConfig;

      if (modelConfig.hasOwnProperty(apiKeyName)) {
        const generativeAiModel = modelConfig[apiKeyName as keyof IModelConfig];
        const modelName = apiKeyName;
        let model: any;
        switch (apiKeyName) {
          case "gemini":
            if (generativeAiModel) {
              model = this.createGeminiModel(apiKey, generativeAiModel);
            }
            break;
          case "claude":
            model = this.createAnthropicModel(apiKey);
            break;
          case "groq":
            model = this.createGroqModel(apiKey);
            break;
          default:
            console.error(`Unsupported api key name: ${apiKeyName}`);
            return;
        }
        return { name: modelName, model, generativeAiModel };
      }
    } catch (error) {
      console.error("Error creating model:", error);
      vscode.window.showErrorMessage(
        "An error occurred while creating the model. Please try again."
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
    text: string
  ): Promise<string | Anthropic.Messages.Message | undefined> {
    try {
      const activeModel = this.createModel();
      if (!activeModel) {
        throw new Error("Model not found. Check your settings.");
      }

      const { name, model, generativeAiModel } = activeModel;
      if (!name || !model) {
        throw new Error("Model not found. Check your settings.");
      }

      let response;
      switch (name) {
        case "gemini":
          response = await this.generateGeminiResponse(model, text);
          break;
        case "claude":
          if (generativeAiModel) {
            response = await this.anthropicResponse(
              model,
              generativeAiModel,
              text
            );
          }
          break;
        case "groq":
          if (generativeAiModel) {
            response = await this.groqResponse(model, text, generativeAiModel);
          }
          break;
        default:
          throw new Error("Unsupported model name.");
      }

      if (!response) {
        throw new Error(
          "Could not generate response. Check your settings, ensure the API keys and Model Name is added properly."
        );
      }

      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      vscode.window.showErrorMessage(
        "An error occurred while generating the response. Please try again."
      );
    }
  }

  async generateGeminiResponse(
    model: any,
    text: string
  ): Promise<string | undefined> {
    const result = await model.generateContent(text);
    return result ? await result.response.text() : undefined;
  }

  private async anthropicResponse(
    model: Anthropic,
    generativeAiModel: string,
    userPrompt: string
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
        "An error occurred while generating the response. Please try again."
      );
      return;
    }
  }

  private async groqResponse(
    model: Groq,
    prompt: string,
    generativeAiModel: string
  ): Promise<string | undefined> {
    try {
      const params = {
        messages: [
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
        "An error occurred while generating the response. Please try again."
      );
      return;
    }
  }

  abstract formatResponse(comment: string): string;

  abstract createPrompt(text?: string): string;

  async generateResponse(): Promise<
    string | Anthropic.Messages.Message | undefined
  > {
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
    if (prompt && response) {
      this.context.workspaceState.update("chatHistory", [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "system",
          content: response,
        },
      ]);
    }
    return response;
  }

  async execute(): Promise<void> {
    const comment = (await this.generateResponse()) as string;
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

    await GroqWebViewProvider.webView?.webview.postMessage({
      type: "user-input",
      message: formattedComment,
    });
  }
}
