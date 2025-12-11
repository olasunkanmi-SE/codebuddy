import * as vscode from "vscode";
import { OutputManager } from "../../services/output-manager";
import { CodeAnalyzer } from "../analysis/code.analyser";
import { CodeSearch } from "../analysis/code.search";
import { FileParser } from "../analysis/file.parser";
import { SummaryGenerator } from "../analysis/summry.generator";
import { CacheManager } from "../cache/cache.manager";
import { TreeSitterParser } from "../parser/tree-sitter.parser";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";

export class AnalyzeCodeCommand {
  private readonly codeSearcher: CodeSearch;
  private readonly fileParser: FileParser;
  private readonly codeAnalyser: CodeAnalyzer;
  private readonly summaryGenerator: SummaryGenerator;
  private readonly logger: Logger;

  constructor(
    private readonly outputManager: OutputManager,
    private readonly parser: TreeSitterParser,
    private readonly cacheManager: CacheManager,
    private readonly initPromise: Promise<void>,
  ) {
    const outputChannel = outputManager.getChannel();
    this.codeSearcher = CodeSearch.getInstance(outputChannel);
    this.fileParser = FileParser.getInstance(
      parser,
      cacheManager,
      outputChannel,
    );
    this.codeAnalyser = CodeAnalyzer.getInstance(
      this.codeSearcher,
      this.fileParser,
      outputChannel,
    );
    this.summaryGenerator = new SummaryGenerator();

    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  async execute(keywords: string[]): Promise<string | undefined> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage("No workspace open.");
      return;
    }

    let codeSummary: string | undefined;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Analyzing authentication...",
        cancellable: true,
      },
      async (progress, cancellationToken) => {
        this.outputManager.clear();
        this.outputManager.show(true);

        progress.report({
          message: "Initializing Tree-sitter...",
          increment: 5,
        });
        try {
          3;
          await this.initPromise;
        } catch (error: any) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          const message = `Tree-sitter initialization failed: ${errorMsg}`;
          this.outputManager.appendLine(message);
          vscode.window.showErrorMessage("Tree-sitter failed to initialize.");
          this.logger.error(message, error.stack);
          return;
        }

        if (!this.parser.initialized()) {
          vscode.window.showErrorMessage("Tree-sitter failed to initialize.");
          this.logger.info(`Tree-sitter failed to initialize.`);
          return;
        }

        const result = await this.codeAnalyser.analyze(
          workspaceRoot,
          progress,
          cancellationToken,
          keywords,
        );

        if (cancellationToken.isCancellationRequested || !result) {
          const message = "Authentication analysis cancelled.";
          this.outputManager.appendLine(message);
          this.logger.info(message);
          vscode.window.showInformationMessage(message);
          return;
        }

        if (result.summary.totalElements === 0) {
          const message = "No Related code elements found.";
          this.outputManager.appendLine(message);
          this.logger.info(message);
          vscode.window.showInformationMessage(
            "No code data retrieved at the moment",
          );
          return;
        }

        const summary = this.summaryGenerator.generate(result, workspaceRoot);
        this.outputManager.appendLine(summary);
        this.logger.info(summary);
        const compactMessage = this.summaryGenerator.generateCompact(result);
        vscode.window.showInformationMessage(compactMessage, { modal: false });
        codeSummary = summary;
        return;
      },
    );
    return codeSummary;
  }

  canExecute(): boolean {
    return (
      vscode.workspace.workspaceFolders !== undefined &&
      vscode.workspace.workspaceFolders.length > 0
    );
  }

  /**
   * Gets command metadata
   */
  getMetadata(): {
    id: string;
    title: string;
    description: string;
  } {
    return {
      id: "codebuddy.analyzeAuth",
      title: "CodeBuddy: Analyze Authentication",
      description: "Analyzes related code across the workspace",
    };
  }
}
