import * as vscode from "vscode";

export class CodeActionsProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    return this.quickFix(context, document);
  }

  quickFix(context: vscode.CodeActionContext, document: vscode.TextDocument) {
    const actions: vscode.CodeAction[] = [];
    if (context.diagnostics.length > 0) {
      const diagnostic = context.diagnostics[0];
      const errorMessage = diagnostic.message;
      // This returns the whole line where the error occured
      const erroredLineOfCode = this.getErroredFunction(
        document,
        diagnostic.range
      );
      const action = new vscode.CodeAction(
        "CodeBuddy fix this error",
        vscode.CodeActionKind.QuickFix
      );
      const windowContent = document.getText();
      // Seems the text is too much `${errorMessage} \n ${windowContent}`
      // Write a javascript function that retrieve the errored code instead of passing the whole code
      action.command = {
        command: "CodeBuddy.codeFix",
        title: "CodeBuddy fix this error",
        arguments: [`${errorMessage} \n ${windowContent}`],
      };
      actions.push(action);
    }
    return actions;
  }

  private getErroredFunction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): string {
    const startLine = range.start.line;
    const endLine = range.end.line;
    const erroredFunctionRange: vscode.Range = new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine + 1, 0)
    );
    return document.getText(erroredFunctionRange);
  }
}
