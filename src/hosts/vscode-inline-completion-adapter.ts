import * as vscode from "vscode";
import {
  IInlineCompletionItemProvider,
  IInlineCompletionContext,
  IInlineCompletionItem,
  ICancellationToken,
  InlineCompletionTriggerKind,
  ITextDocument,
  IPosition,
  ISelection,
} from "../interfaces/editor-host";

export class VSCodeInlineCompletionAdapter
  implements vscode.InlineCompletionItemProvider
{
  constructor(private provider: IInlineCompletionItemProvider) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<
    | vscode.InlineCompletionItem[]
    | vscode.InlineCompletionList
    | null
    | undefined
  > {
    // Adapt inputs
    const adaptedDocument: ITextDocument = {
      uri: { fsPath: document.uri.fsPath },
      fileName: document.fileName,
      isDirty: document.isDirty,
      getText: (range?: ISelection) => {
        if (range) {
          return document.getText(
            new vscode.Range(
              range.start.line,
              range.start.character,
              range.end.line,
              range.end.character,
            ),
          );
        }
        return document.getText();
      },
      offsetAt: (pos) =>
        document.offsetAt(new vscode.Position(pos.line, pos.character)),
      languageId: document.languageId,
    };

    const adaptedPosition: IPosition = {
      line: position.line,
      character: position.character,
    };

    const adaptedContext: IInlineCompletionContext = {
      triggerKind:
        context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
          ? InlineCompletionTriggerKind.Automatic
          : InlineCompletionTriggerKind.Invoke,
      selectedCompletionInfo: context.selectedCompletionInfo
        ? {
            range: {
              start: {
                line: context.selectedCompletionInfo.range.start.line,
                character: context.selectedCompletionInfo.range.start.character,
              },
              end: {
                line: context.selectedCompletionInfo.range.end.line,
                character: context.selectedCompletionInfo.range.end.character,
              },
            },
            text: context.selectedCompletionInfo.text,
          }
        : undefined,
    };

    const adaptedToken: ICancellationToken = {
      isCancellationRequested: token.isCancellationRequested,
      onCancellationRequested: (listener, thisArgs, disposables) => {
        const d = token.onCancellationRequested(
          listener,
          thisArgs,
          disposables,
        );
        return { dispose: () => d.dispose() };
      },
    };

    // Call provider
    const result = await this.provider.provideInlineCompletionItems(
      adaptedDocument,
      adaptedPosition,
      adaptedContext,
      adaptedToken,
    );

    if (!result) return undefined;

    // Adapt output
    if (Array.isArray(result)) {
      return result.map((item) => this.adaptItem(item));
    } else {
      return {
        items: result.items.map((item) => this.adaptItem(item)),
      };
    }
  }

  private adaptItem(item: IInlineCompletionItem): vscode.InlineCompletionItem {
    const vsItem = new vscode.InlineCompletionItem(item.insertText);
    if (item.range) {
      vsItem.range = new vscode.Range(
        item.range.start.line,
        item.range.start.character,
        item.range.end.line,
        item.range.end.character,
      );
    }
    if (item.filterText) vsItem.filterText = item.filterText;
    if (item.command) {
      vsItem.command = {
        title: item.command.title,
        command: item.command.command,
        arguments: item.command.arguments,
      };
    }
    return vsItem;
  }
}
