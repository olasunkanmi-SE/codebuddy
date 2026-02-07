import * as path from "path";
import { Parser, Tree } from "web-tree-sitter";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { GrammarLoader } from "./grammar-loader";
import { IOutputChannel } from "../../interfaces/output-channel";
import { FileUtils } from "../../utils/common-utils";

export class TreeSitterParser {
  private static instance: TreeSitterParser | null = null;
  private parser: Parser | null = null;
  private initializationPromise: Promise<void> | null = null;
  private grammarLoader: GrammarLoader;
  private logger: Logger;

  constructor(
    private readonly extensionPath: string,
    private readonly outputChannel: IOutputChannel,
  ) {
    this.logger = Logger.initialize("TreeSitterParser", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.grammarLoader = GrammarLoader.getInstance(
      this.extensionPath,
      this.outputChannel,
    );
  }

  static getInstance(
    extensionPath: string,
    outputChannel: IOutputChannel,
  ): TreeSitterParser {
    return (TreeSitterParser.instance ??= new TreeSitterParser(
      extensionPath,
      outputChannel,
    ));
  }

  /**
   * Find WASM file in multiple possible locations
   */
  private async findWasmPath(): Promise<string> {
    const possiblePaths = [
      path.join(this.extensionPath, "dist", "grammars", "tree-sitter.wasm"),
      path.join(this.extensionPath, "grammars", "tree-sitter.wasm"),
      path.join(this.extensionPath, "out", "grammars", "tree-sitter.wasm"),
      path.join(
        this.extensionPath,
        "node_modules",
        "web-tree-sitter",
        "tree-sitter.wasm",
      ),
    ];

    this.logger.info("Searching for tree-sitter.wasm...");
    this.logger.info(`Extension path: ${this.extensionPath}`);

    for (const wasmPath of possiblePaths) {
      this.logger.info(`Checking: ${wasmPath}`);
      if (await FileUtils.fileExists(wasmPath)) {
        this.logger.info(`✅ Found WASM at: ${wasmPath}`);
        return wasmPath;
      }
    }

    const errorMsg = `tree-sitter.wasm not found. Checked:\n${possiblePaths.join("\n")}`;
    throw new Error(errorMsg);
  }

  async initialize(): Promise<void> {
    if (this.parser) return;

    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      this.outputChannel.appendLine("Initializing Tree-sitter...");
      this.logger.info("Initializing Tree-sitter...");

      try {
        // Find WASM file
        const wasmPath = await this.findWasmPath();

        this.outputChannel.appendLine(`Using WASM: ${wasmPath}`);
        this.logger.info(`Using WASM: ${wasmPath}`);

        // Get the directory containing the WASM file
        const wasmDir = path.dirname(wasmPath);

        // Initialize Parser with correct locateFile function
        await Parser.init({
          locateFile: (scriptName: string, scriptDirectory: string) => {
            this.logger.debug(
              `locateFile called: scriptName="${scriptName}", scriptDir="${scriptDirectory}"`,
            );

            // Always use our WASM directory
            const fullPath = path.join(wasmDir, scriptName);
            this.logger.debug(`Returning: ${fullPath}`);
            return fullPath;
          },
        } as any);

        this.parser = new Parser();
        this.outputChannel.appendLine(
          "✅ Tree-sitter initialized successfully",
        );
        this.logger.info("✅ Tree-sitter initialized successfully");

        // Pre-load grammars
        await this.grammarLoader.prelodGrammars();
        this.outputChannel.appendLine(
          `Pre-loaded ${this.grammarLoader.getCacheSize()} grammars`,
        );
        this.logger.info(
          `Pre-loaded ${this.grammarLoader.getCacheSize()} grammars`,
        );
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : "";

        this.outputChannel.appendLine(
          `❌ Failed to initialize Tree-sitter: ${errorMsg}`,
        );
        this.logger.error(`Failed to initialize Tree-sitter: ${errorMsg}`, {
          error: errorMsg,
          stack: errorStack,
        });

        this.parser = null;
        this.initializationPromise = null;
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
