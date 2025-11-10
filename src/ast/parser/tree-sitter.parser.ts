import * as vscode from "vscode";
import { Parser, Tree } from "web-tree-sitter";
import { GrammarLoader } from "./grammar-loader";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";

export class TreeSitterParser {
  private static instance: TreeSitterParser | null = null;
  private parser: Parser | null = null;
  private initializationPromise: Promise<void> | null = null;
  private grammarLoader: GrammarLoader;
  private logger: Logger;

  constructor(
    private readonly extensionPath: string,
    private readonly outputChannel: vscode.OutputChannel,
  ) {
    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
    });
    this.grammarLoader = GrammarLoader.getInstance(
      this.extensionPath,
      this.outputChannel,
    );
  }

  static getInstance(
    extensionPath: string,
    outputChannel: vscode.OutputChannel,
  ): TreeSitterParser {
    return (TreeSitterParser.instance ??= new TreeSitterParser(
      extensionPath,
      outputChannel,
    ));
  }

  async initialize(): Promise<void> {
    if (this.parser) return;

    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      this.outputChannel.appendLine("Initializing Tree-sitter...");
      this.logger.info("Initializing Tree-sitter...");
      try {
        await Parser.init();
        this.parser = new Parser();
        this.outputChannel.appendLine("Tree-sitter initialized successfully.");
        this.logger.info("Tree-sitter initialized successfully.");

        await this.grammarLoader.prelodGrammars();
        this.outputChannel.appendLine(
          `Pre-loaded ${this.grammarLoader.getCacheSize()} grammars.`,
        );
        this.logger.info(
          `Pre-loaded ${this.grammarLoader.getCacheSize()} grammars.`,
        );
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.outputChannel.appendLine(
          `Failed to initialize Tree-sitter: ${errorMsg}`,
        );
        vscode.window.showErrorMessage(`Failed to initialize Tree-sitter`);
        this.logger.info(
          `Failed to initialize Tree-sitter: ${errorMsg}`,
          error.stack,
        );
        this.parser = null;
        throw error;
      }
    })();
    return this.initializationPromise;
  }

  async parse(content: string, languageId: string): Promise<Tree | null> {
    if (!this.parser) {
      await this.initialize();
      if (!this.parser) return null;
    }

    const language = await this.grammarLoader.loaderGrammar(languageId);
    if (!language) return null;

    this.parser.setLanguage(language);
    return this.parser.parse(content);
  }

  getParseTreeNode(): Parser | null {
    return this.parser;
  }

  initialized(): boolean {
    return this.parser !== null;
  }

  dispose() {
    this.parser = null;
    this.initializationPromise = null;
    TreeSitterParser.instance = null;
  }
}
