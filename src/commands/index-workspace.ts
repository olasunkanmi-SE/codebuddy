import * as vscode from "vscode";
import { ContextRetriever } from "../services/context-retriever";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

const logger = Logger.initialize("IndexWorkspace", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

export async function indexWorkspaceCommand(): Promise<void> {
  const contextRetriever = ContextRetriever.initialize();

  // Find all files, excluding common ignored folders
  const files = await vscode.workspace.findFiles(
    "**/*",
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
      let processed = 0;
      const total = files.length;

      for (const file of files) {
        if (token.isCancellationRequested) {
          break;
        }

        try {
          progress.report({
            message: `Indexing ${processed}/${total}: ${vscode.workspace.asRelativePath(file)}`,
            increment: (1 / total) * 100,
          });
          const document = await vscode.workspace.openTextDocument(file);
          // Skip very large files or binary files if possible (openTextDocument handles binary check implicitly by failing or returning weird stuff, but we can check languageId?)
          if (document.lineCount > 5000) {
            logger.warn(`Skipping large file: ${file.fsPath}`);
            continue;
          }
          await contextRetriever.indexFile(file.fsPath, document.getText());
        } catch (error) {
          logger.error(`Failed to index file: ${file.fsPath}`, error);
        }

        processed++;
      }

      vscode.window.showInformationMessage(
        `Workspace indexing complete. Indexed ${processed} files.`,
      );
    },
  );
}
