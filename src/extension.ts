import * as vscode from "vscode";
import { Comments } from "./comment";
import { OptimizeCode } from "./optimize";
import { RefactorCode } from "./refactor";
import { ReviewCode } from "./review";
import { fixCodeError } from "./fix";
import { OLA_ACTIONS, USER_MESSAGE } from "./constant";
import { generateResponse, getWebviewContent } from "./chat";

export function activate(context: vscode.ExtensionContext) {
  const apiKey = vscode.workspace.getConfiguration().get<string>("google.gemini.apiKey");
  const { comment, review, refactor, optimize, fix } = OLA_ACTIONS;
  const getComment = new Comments(`${USER_MESSAGE} generates the code comments...`);
  const generateOptimizeCode = new OptimizeCode(`${USER_MESSAGE} optimizes the code...`);
  const generateRefactoredCode = new RefactorCode(`${USER_MESSAGE} refactors the code...`);
  const generateReview = new ReviewCode(`${USER_MESSAGE} reviews the code...`);
  const commentCode = vscode.commands.registerCommand(comment, () => getComment.execute());
  const reviewCode = vscode.commands.registerCommand(review, () => generateReview.execute());
  const refactorCode = vscode.commands.registerCommand(refactor, () => generateRefactoredCode.execute());
  const optimizeCode = vscode.commands.registerCommand(optimize, () => generateOptimizeCode.execute());
  const fixCode = vscode.commands.registerCommand(fix, (errorMessage: string) => {
    fixCodeError(errorMessage);
  });

  let disposable = vscode.commands.registerCommand("ola.openChatBox", () => {
    const panel = vscode.window.createWebviewPanel("chatBox", "Chat Box", vscode.ViewColumn.One, {});
    if (!apiKey) {
      vscode.window.showErrorMessage("API key not configured. Check your settings.");
      return;
    }
    panel.webview.html = getWebviewContent(apiKey);

    panel.webview.onDidReceiveMessage((message) => {
      if (message.type === "user-input") {
        const response = generateResponse(message.text);
        panel.webview.postMessage({ type: "bot-response", text: response });
      }
    });
  });

  const askExtensionProvider = new AskExtensionProvider();
  const askExtensionDisposable = vscode.languages.registerCodeActionsProvider(
    { scheme: "file", language: "*" },
    askExtensionProvider
  );

  context.subscriptions.push(
    commentCode,
    reviewCode,
    refactorCode,
    fixCode,
    optimizeCode,
    askExtensionDisposable,
    disposable
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("catChatView.focus", () => {
      vscode.commands.executeCommand("catChatView.focus");
    })
  );
}

class AskExtensionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const actions: vscode.CodeAction[] = [];
    if (context.diagnostics.length > 0) {
      const diagnostic = context.diagnostics[0];
      const errorMessage = diagnostic.message;
      const action = new vscode.CodeAction("Ola fix this error", vscode.CodeActionKind.QuickFix);
      action.command = {
        command: "ola.codeFix",
        title: "Ola fix this error",
        arguments: [errorMessage],
      };
      actions.push(action);
    }
    return actions;
  }
}

export function deactivate() {}
