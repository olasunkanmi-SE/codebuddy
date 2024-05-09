import * as vscode from "vscode";
import { formatText, getConfigValue, vscodeErrorMessage } from "../utils";
import { GroqWebViewProvider } from "../providers/groq-web-view-provider";
import { GeminiWebViewProvider } from "../providers/gemini-web-view-provider";
import { appConfig } from "../constant";

/**
 * Manages chat functionality, including registering chat commands,
 * validating configurations, and generating responses.
 * This class is responsible for handling chat-related operations,
 * such as sending and receiving messages, and interacting with the Groq web view provider.
 */
export class ChatManager {
  private readonly _context: vscode.ExtensionContext;
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;
  private readonly grokApiKey: string;
  private readonly grokModel: string;
  private readonly generativeAi: string;

  constructor(context: vscode.ExtensionContext) {
    const { geminiKey, geminiModel, groqKey, groqModel, generativeAi } =
      appConfig;
    this._context = context;
    this.geminiApiKey = getConfigValue(geminiKey);
    this.geminiModel = getConfigValue(geminiModel);
    this.grokApiKey = getConfigValue(groqKey);
    this.grokModel = getConfigValue(groqModel);
    this.generativeAi = getConfigValue(generativeAi);
  }

  registerChatCommand() {
    return vscode.commands.registerCommand("ola.sendChatMessage", async () => {
      try {
        vscode.window.showInformationMessage("☕️ Asking Ola for Help");
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

  private async generateResponse(message: string): Promise<string | undefined> {
    try {
      const generativeAi: string | undefined = this.getGenerativeAiModel();
      if (generativeAi === "Groq") {
        if (!this.grokApiKey || !this.grokModel) {
          vscodeErrorMessage(
            "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
          );
        }
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          this.grokApiKey,
          this.grokModel,
          this._context,
        );
        return await chatViewProvider.generateResponse(message);
      }
      if (generativeAi === "Gemini") {
        if (!this.geminiApiKey || !this.geminiModel) {
          vscodeErrorMessage(
            "Configuration not found. Go to settings, search for Your coding buddy. Fill up the model and model name",
          );
        }
        const geminiWebViewProvider = new GeminiWebViewProvider(
          this._context.extensionUri,
          this.geminiApiKey,
          this.geminiModel,
          this._context,
        );
        return await geminiWebViewProvider.generateResponse(
          this.geminiApiKey,
          this.geminiModel,
          message,
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  private sendResponse(userInput: string, response: string | undefined) {
    try {
      if (this.generativeAi === "Groq") {
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          this.grokApiKey,
          this.grokModel,
          this._context,
        );
        chatViewProvider.sendResponse(formatText(userInput), "user-input");
        chatViewProvider.sendResponse(formatText(response), "bot");
      }
      if (this.generativeAi === "Gemini") {
        const geminiWebViewProvider = new GeminiWebViewProvider(
          this._context.extensionUri,
          this.geminiApiKey,
          this.geminiModel,
          this._context,
        );
        geminiWebViewProvider.sendResponse(formatText(userInput), "user-input");
        geminiWebViewProvider.sendResponse(formatText(response), "bot");
      }
    } catch (error) {
      console.error(error);
    }
  }
}
