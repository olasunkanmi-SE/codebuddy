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
  const astIndexer = AstIndexingService.getInstance(); // Singleton already initialized

  // Find all files, excluding common ignored folders
  const files = await vscode.workspace.findFiles(
    "**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,h,c}", // Limit to code files for AST analysis
    "**/{node_modules,.git,dist,out,build,coverage,.codebuddy}/**",
  );

  if (files.length === 0) {
    vscode.window.showInformationMessage("No files found to index.");
    return;
  }

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Indexing Workspace (Background Worker)",
      cancellable: true,
    },
    async (progress, token) => {
      let processed = 0;
      const total = files.length;

      for (const file of files) {
        if (token.isCancellationRequested) break;

        try {
          progress.report({
            message: `Queueing ${processed}/${total}: ${vscode.workspace.asRelativePath(file)}`,
            increment: (1 / total) * 100,
          });

          const document = await vscode.workspace.openTextDocument(file);
          // Offload to worker
          astIndexer.indexFile(file.fsPath, document.getText());
        } catch (error) {
          logger.error(`Failed to queue file: ${file.fsPath}`, error);
        }

        processed++;
      }

      vscode.window.showInformationMessage(
        `Workspace indexing queued for ${processed} files. Check logs for completion.`,
      );
    },
  );
}
