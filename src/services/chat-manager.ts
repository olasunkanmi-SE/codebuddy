import * as vscode from "vscode";
import {
  aIProviderConfig,
  APP_CONFIG,
  COMMON,
  generativeAiModel,
} from "../constant";
import { AnthropicWebViewProvider } from "../providers/anthropic-web-view-provider";
import { GeminiWebViewProvider } from "../providers/gemini-web-view-provider";
import { GroqWebViewProvider } from "../providers/groq-web-view-provider";
import {
  formatText,
  getConfigValue,
  getXGroKBaseURL,
  resetChatHistory,
  vscodeErrorMessage,
} from "../utils";

/**
 * Manages chat functionality, including registering chat commands,
 * validating configurations, and generating responses.
 * This class is responsible for handling chat-related operations,
 * such as sending and receiving messages, and interacting with the Groq web view provider.
 */

// The chatManager only caters for send to code buddy event. This should be deprecated.
export class ChatManager {
  private readonly _context: vscode.ExtensionContext;
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;
  private readonly grokApiKey: string;
  private readonly grokModel: string;
  private readonly generativeAi: string;
  private readonly anthropicApiKey: string;
  private readonly anthropicModel: string;
  private readonly groqApiKey: string;
  private readonly groqModel: string;

  constructor(context: vscode.ExtensionContext) {
    const {
      geminiKey,
      geminiModel,
      groqApiKey,
      groqModel,
      generativeAi,
      anthropicApiKey,
      anthropicModel,
      grokApiKey,
      grokModel,
    } = APP_CONFIG;
    this._context = context;
    this.geminiApiKey = getConfigValue(geminiKey);
    this.geminiModel = getConfigValue(geminiModel);
    this.groqApiKey = getConfigValue(groqApiKey);
    this.groqModel = getConfigValue(groqModel);
    this.anthropicApiKey = getConfigValue(anthropicApiKey);
    this.anthropicModel = getConfigValue(anthropicModel);
    this.generativeAi = getConfigValue(generativeAi);
    this.grokApiKey = getConfigValue(grokApiKey);
    this.grokModel = getConfigValue(grokModel);
  }

  registerChatCommand() {
    return vscode.commands.registerCommand("ola.sendChatMessage", async () => {
      try {
        vscode.window.showInformationMessage("☕️ Asking CodeBuddy for Help");
        const selectedText = this.getActiveEditorText();
        const response = await this.generateResponse(selectedText);
        this.sendResponse(selectedText, response);
      } catch (error) {
        console.error(error);
        vscodeErrorMessage(
          "Failed to generate content. Please try again later.",
        );
      }
    });
  }

  private getGenerativeAiModel(): string | undefined {
    return getConfigValue("generativeAi.option");
  }

  private getActiveEditorText(): string {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscodeErrorMessage("Select a text in your editor");
      console.debug("Abandon: no open text editor.");
      throw new Error("No active editor");
    }
    return activeEditor.document.getText(activeEditor.selection);
  }

  private aiProviderConfig(): Record<generativeAiModel, aIProviderConfig> {
    return {
      [generativeAiModel.ANTHROPIC]: {
        apiKey: this.anthropicApiKey,
        model: this.anthropicModel,
        providerName: generativeAiModel.ANTHROPIC,
      },
      [generativeAiModel.GEMINI]: {
        apiKey: this.geminiApiKey,
        model: this.geminiModel,
        providerName: generativeAiModel.GEMINI,
      },
      [generativeAiModel.GROK]: {
        apiKey: this.grokApiKey,
        model: this.grokModel,
        providerName: generativeAiModel.GROK,
      },
      [generativeAiModel.GROQ]: {
        apiKey: this.groqApiKey,
        model: this.groqModel,
        providerName: generativeAiModel.GROQ,
      },
    };
  }

  private handleAiProvider(generativeAi: generativeAiModel): aIProviderConfig {
    const aiConfig = this.aiProviderConfig();
    const config = aiConfig[generativeAi];
    if (!config) {
      throw new Error(`Configuration not found for ${generativeAi}`);
    }
    if (!config.apiKey || !config.model) {
      ("Configuration not found. Go to settings, search for codingBuddy. Fill up the model and model name");
    }
    return config;
  }

  private async generateResponse(message: string): Promise<string | undefined> {
    try {
      const generativeAi: string | undefined = this.getGenerativeAiModel();
      if (generativeAi === generativeAiModel.GROQ) {
        const groqAiConfigurations = this.handleAiProvider(
          generativeAiModel.GROQ,
        );
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          groqAiConfigurations.apiKey,
          groqAiConfigurations.model,
          this._context,
        );
        return await chatViewProvider.generateResponse(message);
      }
      if (generativeAi === generativeAiModel.GEMINI) {
        const geminiConfigurations = this.handleAiProvider(
          generativeAiModel.GEMINI,
        );
        const geminiWebViewProvider = new GeminiWebViewProvider(
          this._context.extensionUri,
          geminiConfigurations.apiKey,
          geminiConfigurations.model,
          this._context,
        );
        return await geminiWebViewProvider.generateResponse(
          geminiConfigurations.apiKey,
          geminiConfigurations.model,
          message,
        );
      }
      if (generativeAi === "Anthropic") {
        const anthropicConfigurations: aIProviderConfig = this.handleAiProvider(
          generativeAiModel.ANTHROPIC,
        );
        const anthropicWebViewProvider = this.getAnthropicWebViewProvider(
          anthropicConfigurations,
        );
        return await anthropicWebViewProvider.generateResponse(message);
      }

      if (generativeAi === generativeAiModel.GROK) {
        const grokConfigurations: aIProviderConfig = this.handleAiProvider(
          generativeAiModel.GROK,
        );
        const anthropicWebViewProvider =
          this.getAnthropicWebViewProvider(grokConfigurations);
        return await anthropicWebViewProvider.generateResponse(message);
      }
    } catch (error) {
      const model = getConfigValue("generativeAi.option");
      if (model) resetChatHistory(model);
      console.log(error);
    }
  }

  private sendResponse(userInput: string, response: string | undefined) {
    try {
      if (this.generativeAi === generativeAiModel.GROQ) {
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          this.groqApiKey,
          this.groqModel,
          this._context,
        );
        chatViewProvider.sendResponse(formatText(userInput), COMMON.USER_INPUT);
        chatViewProvider.sendResponse(formatText(response), COMMON.BOT);
      }
      if (this.generativeAi === generativeAiModel.GEMINI) {
        const geminiWebViewProvider = new GeminiWebViewProvider(
          this._context.extensionUri,
          this.geminiApiKey,
          this.geminiModel,
          this._context,
        );
        geminiWebViewProvider.sendResponse(
          formatText(userInput),
          COMMON.USER_INPUT,
        );
        geminiWebViewProvider.sendResponse(formatText(response), COMMON.BOT);
      }
      if (
        this.generativeAi === generativeAiModel.ANTHROPIC ||
        this.generativeAi === generativeAiModel.GROK
      ) {
        let anthropicConfigurations: aIProviderConfig | undefined;
        if (this.generativeAi === generativeAiModel.ANTHROPIC) {
          anthropicConfigurations = this.handleAiProvider(
            generativeAiModel.ANTHROPIC,
          );
        }
        if (this.generativeAi === generativeAiModel.GROK) {
          anthropicConfigurations = this.handleAiProvider(
            generativeAiModel.GROK,
          );
        }
        if (!anthropicConfigurations) {
          throw new Error(`Configuration not found for ${this.generativeAi}`);
        }

        const anthropicWebViewProvider = this.getAnthropicWebViewProvider(
          anthropicConfigurations,
        );
        anthropicWebViewProvider.sendResponse(
          formatText(userInput),
          COMMON.USER_INPUT,
        );
        anthropicWebViewProvider.sendResponse(formatText(response), COMMON.BOT);
      }
    } catch (error) {
      const model = getConfigValue("generativeAi.option");
      if (model) resetChatHistory(model);
      console.error(error);
    }
  }

  private getAnthropicWebViewProvider(
    config: aIProviderConfig,
  ): AnthropicWebViewProvider {
    let xGrokBaseURL;
    if (getConfigValue(APP_CONFIG.generativeAi) === generativeAiModel.GROK) {
      xGrokBaseURL = getXGroKBaseURL();
    }
    return new AnthropicWebViewProvider(
      this._context.extensionUri,
      config.apiKey,
      config.model,
      this._context,
      xGrokBaseURL,
    );
  }
}
