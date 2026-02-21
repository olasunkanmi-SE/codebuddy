import * as vscode from "vscode";
import { NewsReaderService } from "../services/news-reader.service";

export async function openInReaderCommand() {
  const url = await vscode.window.showInputBox({
    prompt: "Enter URL to open in Smart Reader",
    placeHolder: "https://example.com",
    validateInput: (text) => {
      try {
        new URL(text);
        return null;
      } catch {
        return "Please enter a valid URL";
      }
    },
  });

  if (url) {
    const reader = NewsReaderService.getInstance();
    await reader.openReader(url);
  }
}

export async function openSelectionInReaderCommand() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found");
    return;
  }

  const selection = editor.document.getText(editor.selection);
  if (!selection) {
    vscode.window.showErrorMessage("No text selected");
    return;
  }

  try {
    const url = new URL(selection.trim());
    const reader = NewsReaderService.getInstance();
    await reader.openReader(url.toString());
  } catch {
    vscode.window.showErrorMessage("Selection is not a valid URL");
  }
}
