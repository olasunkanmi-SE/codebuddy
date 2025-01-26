import * as vscode from "vscode";
import { aIProviderConfig, APP_CONFIG, COMMON, generativeAiModels } from "../application/constant";
import { AnthropicWebViewProvider } from "../providers/anthropic";
import { GeminiWebViewProvider } from "../providers/gemini";
import { GroqWebViewProvider } from "../providers/groq";
import {
  formatText,
  getConfigValue,
  getGenerativeAiModel,
  getXGroKBaseURL,
  resetChatHistory,
  vscodeErrorMessage,
} from "../application/utils";

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
    return vscode.commands.registerCommand("CodeBuddy.sendChatMessage", async () => {
      try {
        vscode.window.showInformationMessage("☕️ Asking CodeBuddy for Help");
        const selectedText = this.getActiveEditorText();
        const response = await this.generateResponse(selectedText);
        this.sendResponse(selectedText, response);
      } catch (error) {
        console.error(error);
        vscodeErrorMessage("Failed to generate content. Please try again later.");
      }
    });
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

  private aiProviderConfig(): Record<generativeAiModels, aIProviderConfig> {
    return {
      [generativeAiModels.ANTHROPIC]: {
        apiKey: this.anthropicApiKey,
        model: this.anthropicModel,
        providerName: generativeAiModels.ANTHROPIC,
      },
      [generativeAiModels.GEMINI]: {
        apiKey: this.geminiApiKey,
        model: this.geminiModel,
        providerName: generativeAiModels.GEMINI,
      },
      [generativeAiModels.GROK]: {
        apiKey: this.grokApiKey,
        model: this.grokModel,
        providerName: generativeAiModels.GROK,
      },
      [generativeAiModels.GROQ]: {
        apiKey: this.groqApiKey,
        model: this.groqModel,
        providerName: generativeAiModels.GROQ,
      },
    };
  }

  private handleAiProvider(generativeAi: generativeAiModels): aIProviderConfig {
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
      const generativeAi: string | undefined = getGenerativeAiModel();
      if (generativeAi === generativeAiModels.GROQ) {
        const groqAiConfigurations = this.handleAiProvider(generativeAiModels.GROQ);
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          groqAiConfigurations.apiKey,
          groqAiConfigurations.model,
          this._context
        );
        return await chatViewProvider.generateResponse(undefined, undefined, message);
      }
      if (generativeAi === generativeAiModels.GEMINI) {
        const geminiConfigurations = this.handleAiProvider(generativeAiModels.GEMINI);
        const geminiWebViewProvider = new GeminiWebViewProvider(
          this._context.extensionUri,
          geminiConfigurations.apiKey,
          geminiConfigurations.model,
          this._context
        );
        return await geminiWebViewProvider.generateResponse(
          geminiConfigurations.apiKey,
          geminiConfigurations.model,
          message
        );
      }
      if (generativeAi === "Anthropic") {
        const anthropicConfigurations: aIProviderConfig = this.handleAiProvider(generativeAiModels.ANTHROPIC);
        const anthropicWebViewProvider = this.getAnthropicWebViewProvider(anthropicConfigurations);
        return await anthropicWebViewProvider.generateResponse(undefined, undefined, message);
      }

      if (generativeAi === generativeAiModels.GROK) {
        const grokConfigurations: aIProviderConfig = this.handleAiProvider(generativeAiModels.GROK);
        const anthropicWebViewProvider = this.getAnthropicWebViewProvider(grokConfigurations);
        return await anthropicWebViewProvider.generateResponse(undefined, undefined, message);
      }
    } catch (error) {
      const model = getConfigValue("generativeAi.option");
      if (model) resetChatHistory(model);
      console.log(error);
    }
  }

  private sendResponse(userInput: string, response: string | undefined) {
    try {
      if (this.generativeAi === generativeAiModels.GROQ) {
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          this.groqApiKey,
          this.groqModel,
          this._context
        );
        chatViewProvider.sendResponse(formatText(userInput), COMMON.USER_INPUT);
        chatViewProvider.sendResponse(formatText(response), COMMON.BOT);
      }
      if (this.generativeAi === generativeAiModels.GEMINI) {
        const geminiWebViewProvider = new GeminiWebViewProvider(
          this._context.extensionUri,
          this.geminiApiKey,
          this.geminiModel,
          this._context
        );
        geminiWebViewProvider.sendResponse(formatText(userInput), COMMON.USER_INPUT);
        geminiWebViewProvider.sendResponse(formatText(response), COMMON.BOT);
      }
      if (this.generativeAi === generativeAiModels.ANTHROPIC || this.generativeAi === generativeAiModels.GROK) {
        let anthropicConfigurations: aIProviderConfig | undefined;
        if (this.generativeAi === generativeAiModels.ANTHROPIC) {
          anthropicConfigurations = this.handleAiProvider(generativeAiModels.ANTHROPIC);
        }
        if (this.generativeAi === generativeAiModels.GROK) {
          anthropicConfigurations = this.handleAiProvider(generativeAiModels.GROK);
        }
        if (!anthropicConfigurations) {
          throw new Error(`Configuration not found for ${this.generativeAi}`);
        }

        const anthropicWebViewProvider = this.getAnthropicWebViewProvider(anthropicConfigurations);
        anthropicWebViewProvider.sendResponse(formatText(userInput), COMMON.USER_INPUT);
        anthropicWebViewProvider.sendResponse(formatText(response), COMMON.BOT);
      }
    } catch (error) {
      const model = getConfigValue("generativeAi.option");
      if (model) resetChatHistory(model);
      console.error(error);
    }
  }

  private getAnthropicWebViewProvider(config: aIProviderConfig): AnthropicWebViewProvider {
    let xGrokBaseURL;
    if (getConfigValue(APP_CONFIG.generativeAi) === generativeAiModels.GROK) {
      xGrokBaseURL = getXGroKBaseURL();
    }
    return new AnthropicWebViewProvider(
      this._context.extensionUri,
      config.apiKey,
      config.model,
      this._context,
      xGrokBaseURL
    );
  }
}
