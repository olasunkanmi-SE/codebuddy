import * as vscode from "vscode";
import * as ts from "typescript";

export class CustomCompletionProvider implements vscode.CompletionItemProvider {
  private tsServer: ts.LanguageService;

  constructor() {
    const tsConfig = vscode.workspace.getConfiguration("typescript");
    const compilerOptions: ts.CompilerOptions = {
      target: tsConfig.get("compilerOptions.target", ts.ScriptTarget.ES2022),
      module: tsConfig.get("compilerOptions.method", ts.ModuleKind.CommonJS),
    };
    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => compilerOptions,
      getScriptFileNames: () => [],
      getScriptVersion: () => "1",
      getScriptSnapshot: () => undefined,
      getCurrentDirectory: () => "",
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
    };

    this.tsServer = ts.createLanguageService(host);
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.CompletionItem[]> {
    const file = ts.createSourceFile(
      document.fileName,
      document.getText(),
      ts.ScriptTarget.ES2020,
      true,
    );
    const completions: vscode.CompletionItem[] = [];

    const offset = document.offsetAt(position);
    const info = this.tsServer.getCompletionsAtPosition(
      file.fileName,
      offset,
      {},
    );

    if (info) {
      const symbols = info.entries;

      for (const symbol of symbols) {
        const completionItem = new vscode.CompletionItem(symbol.name);

        switch (symbol.kind) {
          case ts.ScriptElementKind.memberFunctionElement:
          case ts.ScriptElementKind.memberVariableElement:
          case ts.ScriptElementKind.memberGetAccessorElement:
          case ts.ScriptElementKind.memberSetAccessorElement:
            completionItem.kind = vscode.CompletionItemKind.Method;
            break;
          case ts.ScriptElementKind.variableElement:
          case ts.ScriptElementKind.localVariableElement:
            completionItem.kind = vscode.CompletionItemKind.Variable;
            break;
          case ts.ScriptElementKind.classElement:
            completionItem.kind = vscode.CompletionItemKind.Class;
            break;
          case ts.ScriptElementKind.interfaceElement:
            completionItem.kind = vscode.CompletionItemKind.Interface;
            break;
          default:
            completionItem.kind = vscode.CompletionItemKind.Property;
        }

        completionItem.detail = this.tsServer
          .getQuickInfoAtPosition(file.fileName, offset)
          ?.displayParts?.map((p) => p.text)
          .join("");
        const details = this.tsServer.getCompletionEntryDetails(
          file.fileName,
          offset,
          symbol.name,
          undefined,
          undefined,
          undefined,
          undefined,
        );
        if (details) {
          const documentation = ts.displayPartsToString(details.documentation);
          const tags = details.tags
            ? details.tags.map((tag) => `@${tag.name} ${tag.text}`).join(` \n`)
            : "";
          completionItem.documentation = new vscode.MarkdownString(
            `${documentation}\n\n${tags}`,
          );
        }
        completionItem.sortText = symbol.sortText;
        completionItem.filterText = symbol.name;

        completions.push(completionItem);
      }
    }

    return completions;
  }
}
