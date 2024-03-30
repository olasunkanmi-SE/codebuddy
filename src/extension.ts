import * as vscode from "vscode";
import { generateReview } from "./review";
import { generateRefactoredCode } from "./refactor";
import { fixCodeError } from "./fix";
import { Comments } from "./comment";
import { OptimizeCode } from "./optimize";

export function activate(context: vscode.ExtensionContext) {
  const getComment = new Comments("Hold on while Ola generates the code comments...");
  const generateOptimizeCode = new OptimizeCode("Hold on while Ola optimizes the code comments...");
  const commentCode = vscode.commands.registerCommand("ola.commentCode", () => getComment.execute());
  const reviewCode = vscode.commands.registerCommand("ola.reviewCode", generateReview);
  const refactorCode = vscode.commands.registerCommand("ola.codeRefactor", generateRefactoredCode);
  const optimizeCode = vscode.commands.registerCommand("ola.codeOptimize", () => generateOptimizeCode.execute());
  const fixCode = vscode.commands.registerCommand("ola.codeFix", (errorMessage: string) => {
    fixCodeError(errorMessage);
  });

  const askExtensionProvider = new AskExtensionProvider();
  const askExtensionDisposable = vscode.languages.registerCodeActionsProvider(
    { scheme: "file", language: "*" },
    askExtensionProvider
  );

  context.subscriptions.push(commentCode, reviewCode, refactorCode, fixCode, optimizeCode, askExtensionDisposable);
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
      const action = new vscode.CodeAction("Ask Ola to Fix", vscode.CodeActionKind.QuickFix);
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
