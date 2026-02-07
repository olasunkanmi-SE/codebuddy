import { OutputManager } from "../../services/output-manager";
import { CacheManager } from "../cache/cache.manager";
import { TreeSitterParser } from "../parser/tree-sitter.parser";
import { AnalyzeCodeCommand } from "./analyze-code-command";
import { EditorHostService } from "../../services/editor-host.service";

export class AnalyzeCodeProvider {
  private readonly outputManager: OutputManager;
  private readonly parser: TreeSitterParser;
  private readonly cacheManager: CacheManager;
  private static instance: AnalyzeCodeProvider;

  constructor(context: any) {
    this.outputManager = OutputManager.getInstance();
    if (
      context &&
      context.subscriptions &&
      typeof context.subscriptions.push === "function"
    ) {
      context.subscriptions.push(this.outputManager.getChannel());
    }
    this.parser = TreeSitterParser.getInstance(
      context.extensionPath,
      this.outputManager.getChannel(),
    );
    this.cacheManager = CacheManager.getInstance(
      this.outputManager.getChannel(),
    );
  }

  static getInstance(context: any) {
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
      EditorHostService.getInstance()
        .getHost()
        .window.showErrorMessage(
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
