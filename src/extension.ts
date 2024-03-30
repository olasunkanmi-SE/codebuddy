import * as vscode from "vscode";
import { Comments } from "./comment";
import { OptimizeCode } from "./optimize";
import { RefactorCode } from "./refactor";
import { ReviewCode } from "./review";
import { fixCodeError } from "./fix";
import { OLA_ACTIONS, USER_MESSAGE } from "./constant";

export function activate(context: vscode.ExtensionContext) {
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
