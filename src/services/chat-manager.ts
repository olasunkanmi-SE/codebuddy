import * as vscode from "vscode";
import { formatText, getConfigValue, vscodeErrorMessage } from "../utils";
import { GroqWebViewProvider } from "../providers/groq-web-view-provider";

/**
 * Manages chat functionality, including registering chat commands,
 * validating configurations, and generating responses.
 * This class is responsible for handling chat-related operations,
 * such as sending and receiving messages, and interacting with the Groq web view provider.
 */
export class ChatManager {
  private readonly _context: vscode.ExtensionContext;
  private readonly _apiKey: string;
  private readonly _generativeAiModel: string;

  constructor(apiKey: string, generativeAiModel: string, context: vscode.ExtensionContext) {
    this._apiKey = apiKey;
    this._generativeAiModel = generativeAiModel;
    this._context = context;
  }

  registerChatCommand() {
    return vscode.commands.registerCommand("ola.sendChatMessage", async () => {
      try {
        await this.validateConfiguration();
        const selectedText = this.getActiveEditorText();
        const response = await this.generateResponse(selectedText);
        console.log(response);
        this.sendResponse(selectedText, response);
      } catch (error) {
        console.error(error);
        vscodeErrorMessage("Failed to generate content. Please try again later.");
      }
    });
  }

  private validateConfiguration(): void {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      vscodeErrorMessage("API key not configured. Check your settings.");
      throw new Error("API key not configured");
    }

    const generativeAiModel = this.getGenerativeAiModel();
    if (!generativeAiModel) {
      vscodeErrorMessage("Select Generative model in your configuration file. Check your settings.");
      throw new Error("Generative model not selected");
    }
  }

  private getApiKey(): string | undefined {
    return getConfigValue(this._apiKey);
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

  private async generateResponse(message: string): Promise<string | undefined> {
    try {
      const generativeAi: string | undefined = this.getGenerativeAiModel();
      if (generativeAi === "Grok") {
        this.validateConfiguration();
        const apiKey = await this.getApiKey();
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          apiKey as string,
          this._generativeAiModel,
          this._context
        );
        return await chatViewProvider.generateResponse(message);
      }
    } catch (error) {
      console.log(error);
    }
  }

  private sendResponse(userInput: string, response: string | undefined) {
    const chatViewProvider = new GroqWebViewProvider(
      this._context.extensionUri,
      this._apiKey,
      this._generativeAiModel,
      this._context
    );
    chatViewProvider.sendResponse(formatText(userInput), "user-input");
    chatViewProvider.sendResponse(formatText(response ?? ""), "bot");
  }
}
