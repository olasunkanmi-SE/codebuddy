import * as vscode from "vscode";
import { OutputManager } from "../../services/output-manager";
import { CacheManager } from "../cache/cache.manager";
import { TreeSitterParser } from "../parser/tree-sitter.parser";
import { AnalyzeCodeCommand } from "./analyze-code-command";

export class AnalyzeCodeProvider {
  private readonly outputManager: OutputManager;
  private readonly parser: TreeSitterParser;
  private readonly cacheManager: CacheManager;
  private static instance: AnalyzeCodeProvider;

  constructor(context: vscode.ExtensionContext) {
    this.outputManager = OutputManager.getInstance();
    context.subscriptions.push(this.outputManager.getChannel());
    this.parser = TreeSitterParser.getInstance(
      context.extensionPath,
      this.outputManager.getChannel(),
    );
    this.cacheManager = CacheManager.getInstance(
      this.outputManager.getChannel(),
    );
  }

  static getInstance(context: vscode.ExtensionContext) {
    return (AnalyzeCodeProvider.instance ??= new AnalyzeCodeProvider(context));
  }

  async analyse(keywords: string[]): Promise<string | undefined> {
    if (!keywords?.length) {
      return;
    }
    const initPromise = this.parser.initialize().catch((error) => {
      this.outputManager.appendLine(
        `Fatal: Tree-sitter initialization failed: ${error}`,
      );
      vscode.window.showErrorMessage(
        `CodeBuddy: Failed to initialize Tree-sitter. Extension may not work properly.`,
      );
      throw error;
    });

    const codenalysis = new AnalyzeCodeCommand(
      this.outputManager,
      this.parser,
      this.cacheManager,
      initPromise,
    );

    const code = await codenalysis.execute(keywords);
    return code;
  }
}
