import * as vscode from "vscode";
import { formatText } from "../utils";
import { GroqWebViewProvider } from "../providers/groq-web-view-provider";

export class ChatManager {
  _context: vscode.ExtensionContext;
  constructor(
    private readonly apiKey: string,
    private readonly generativeAiModel: string,
    context: vscode.ExtensionContext
  ) {
    this._context = context;
  }
  chatWithOla() {
    return vscode.commands.registerCommand("ola.sendChatMessage", async () => {
      try {
        const apiKey = vscode.workspace
          .getConfiguration()
          .get<string>(this.apiKey);
        if (!apiKey) {
          vscode.window.showErrorMessage(
            "API key not configured. Check your settings."
          );
          return;
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          console.debug("Abandon: no open text editor.");
          return;
        }
        vscode.window.showInformationMessage("Asking Ola for help");
        const selectedText = activeEditor.document.getText(
          activeEditor.selection
        );
        const message = selectedText;
        const chatViewProvider = new GroqWebViewProvider(
          this._context.extensionUri,
          apiKey,
          this.generativeAiModel,
          this._context
        );
        const response = await chatViewProvider.generateResponse();
        if (!response) {
          this._context.workspaceState.update("chatHistory", []);
          throw new Error("Failed to generate content, try again");
        }
        chatViewProvider.sendResponse(formatText(message), "user-input");
        chatViewProvider.sendResponse(formatText(response), "bot");
      } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(
          "Failed to generate content. Please try again later."
        );
      }
    });
  }
}
