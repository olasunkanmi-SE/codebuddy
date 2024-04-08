import * as vscode from "vscode";
import { ChatViewProvider } from "../providers/chat-web-view-provider";
import { formatText } from "../utils";

export class ChatManager {
  _context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }
  chatWithOla() {
    return vscode.commands.registerCommand("ola.sendChatMessage", async () => {
      try {
        const apiKey = vscode.workspace.getConfiguration().get<string>("google.gemini.apiKey");
        if (!apiKey) {
          vscode.window.showErrorMessage("API key not configured. Check your settings.");
          return;
        }
        const modelName = "gemini-1.0-pro-latest";
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          console.debug("Abandon: no open text editor.");
          return;
        }
        vscode.window.showInformationMessage("Asking Ola for help");
        const selectedText = activeEditor.document.getText(activeEditor.selection);
        const message = selectedText;
        const chatViewProvider = new ChatViewProvider(this._context.extensionUri, this._context);
        const response = await chatViewProvider.generateResponse(apiKey, modelName, message);
        if (!response) {
          this._context.workspaceState.update("chatHistory", []);
          throw new Error("Failed to generate content, try again");
        }
        chatViewProvider.sendResponse(formatText(message), "user-input");
        chatViewProvider.sendResponse(formatText(response), "bot");
      } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage("Failed to generate content. Please try again later.");
      }
    });
  }
}
