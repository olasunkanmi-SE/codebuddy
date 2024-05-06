/* eslint-disable @typescript-eslint/no-unused-vars */
import Anthropic from "@anthropic-ai/sdk";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import * as vscode from "vscode";
import { GroqWebViewProvider } from "../providers/groq-web-view-provider";
import { getConfigValue, vscodeErrorMessage } from "../utils";
import { GeminiWebViewProvider } from "../providers/gemini-web-view-provider";
import { appConfig, generativeModel } from "../constant";

interface IEventGenerator {
  getApplicationConfig(configKey: string): string | undefined;
  showInformationMessage(): Thenable<string | undefined>;
  getSelectedWindowArea(): string | undefined;
}

export abstract class EventGenerator implements IEventGenerator {
  private context: vscode.ExtensionContext;
  protected error?: string;
  private readonly generativeAi: string;
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;
  private readonly grokApiKey: string;
  private readonly grokModel: string;
  constructor(private readonly action: string, _context: vscode.ExtensionContext, errorMessage?: string) {
    this.context = _context;
    this.error = errorMessage;
    const { generativeAi, geminiKey, geminiModel, groqKey, groqModel } = appConfig;
    this.generativeAi = getConfigValue(generativeAi);
    this.geminiApiKey = getConfigValue(geminiKey);
    this.geminiModel = getConfigValue(geminiModel);
    this.grokApiKey = getConfigValue(groqKey);
    this.grokModel = getConfigValue(groqModel);
  }

  getApplicationConfig(configKey: string): string | undefined {
    return getConfigValue(configKey);
  }

  protected createModel(): { generativeAi: string; generativeAiModel: any; modelName: string } | undefined {
    try {
      let generativeAiModel;
      let modelName = "";
      if (!this.generativeAi) {
        vscodeErrorMessage(
          "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name"
        );
      }
      if (this.generativeAi === generativeModel.GROQ) {
        const apiKey = this.grokApiKey;
        modelName = this.grokModel;
        if (!apiKey || !modelName) {
          vscodeErrorMessage(
            "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name"
          );
        }
        generativeAiModel = this.createGroqModel(apiKey);
      }

      if (this.generativeAi === generativeModel.GEMINI) {
        const apiKey = this.geminiApiKey;
        modelName = this.geminiModel;
        generativeAiModel = this.createGeminiModel(apiKey, modelName);
      }
      return { generativeAi: this.generativeAi, generativeAiModel, modelName };
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

  protected async generateModelResponse(text: string): Promise<string | Anthropic.Messages.Message | undefined> {
    try {
      const activeModel = this.createModel();
      if (!activeModel) {
        throw new Error("Model not found. Check your settings.");
      }

      const { generativeAi, generativeAiModel, modelName } = activeModel;
      if (!generativeAi || !generativeAiModel) {
        throw new Error("Model not found. Check your settings.");
      }

      let response;
      switch (generativeAi) {
        case "Gemini":
          response = await this.generateGeminiResponse(generativeAiModel, text);
          break;
        case "Claude":
          if (modelName) {
            response = await this.anthropicResponse(generativeAiModel, modelName, text);
          }
          break;
        case "Groq":
          if (modelName) {
            response = await this.groqResponse(generativeAiModel, text, modelName);
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
      vscode.window.showErrorMessage("An error occurred while generating the response. Please try again.");
    }
  }

  async generateGeminiResponse(model: any, text: string): Promise<string | undefined> {
    const result = await model.generateContent(text);
    return result ? await result.response.text() : undefined;
  }

  private async anthropicResponse(model: Anthropic, generativeAiModel: string, userPrompt: string) {
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
      vscode.window.showErrorMessage("An error occurred while generating the response. Please try again.");
      return;
    }
  }

  private async groqResponse(model: Groq, prompt: string, generativeAiModel: string): Promise<string | undefined> {
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

      const completion: Groq.Chat.ChatCompletion = await model.chat.completions.create(params);
      return completion.choices[0]?.message?.content ?? undefined;
    } catch (error) {
      console.error("Error generating response:", error);
      vscode.window.showErrorMessage("An error occurred while generating the response. Please try again.");
      return;
    }
  }

  abstract formatResponse(comment: string): string;

  abstract createPrompt(text?: string): string;

  async generateResponse(errorMessage?: string): Promise<string | Anthropic.Messages.Message | undefined> {
    this.showInformationMessage();
    let prompt;
    const selectedCode = this.getSelectedWindowArea();
    if (!errorMessage && !selectedCode) {
      vscode.window.showErrorMessage("select a piece of code.");
      return;
    }

    errorMessage ? (prompt = this.createPrompt(errorMessage)) : (prompt = this.createPrompt(selectedCode));

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

  async execute(errorMessage?: string): Promise<void> {
    const comment = (await this.generateResponse(errorMessage)) as string;
    if (!comment) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }
    if (!errorMessage) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        console.debug("Abandon: no open text editor.");
        return;
      }
    }
    let formattedComment;
    errorMessage
      ? (formattedComment = this.formatResponse(errorMessage))
      : (formattedComment = this.formatResponse(comment));
    if (!formattedComment) {
      vscode.window.showErrorMessage("model not reponding, try again later");
      return;
    }
    if (this.generativeAi === "Groq") {
      await GroqWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedComment,
      });
    }

    if (this.generativeAi === "Gemini") {
      await GeminiWebViewProvider.webView?.webview.postMessage({
        type: "user-input",
        message: formattedComment,
      });
    }
  }
}
