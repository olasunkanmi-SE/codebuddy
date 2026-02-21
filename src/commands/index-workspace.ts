import * as vscode from "vscode";
import { AstIndexingService } from "../services/ast-indexing.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

const logger = Logger.initialize("IndexWorkspace", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

export async function indexWorkspaceCommand(): Promise<void> {
  const astIndexer = AstIndexingService.getInstance();

  const files = await vscode.workspace.findFiles(
    "**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,h,c}",
    "**/{node_modules,.git,dist,out,build,coverage,.codebuddy}/**",
  );

  if (files.length === 0) {
    vscode.window.showInformationMessage("No files found to index.");
    return;
  }

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Indexing Workspace",
      cancellable: true,
    },
    async (progress, token) => {
      progress.report({ message: `Found ${files.length} files...` });

      const result = await astIndexer.indexFiles(files, progress, token);

      const searchMode = result.embeddingsAvailable
        ? "semantic search enabled"
        : "text-only mode (configure API key for semantic search)";

      const summary = [
        `Indexing complete:`,
        `${result.indexed} indexed`,
        `${result.skipped} unchanged (skipped)`,
        result.errors > 0 ? `${result.errors} errors` : null,
        searchMode,
      ]
        .filter(Boolean)
        .join(", ");

      if (!result.embeddingsAvailable) {
        vscode.window.showWarningMessage(summary);
      } else {
        vscode.window.showInformationMessage(summary);
      }
      logger.info(summary);
    },
  );
}
