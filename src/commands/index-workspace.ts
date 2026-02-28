import * as vscode from "vscode";
import { AstIndexingService } from "../services/ast-indexing.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import {
  NotificationService,
  NotificationSource,
} from "../services/notification.service";

const logger = Logger.initialize("IndexWorkspace", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

export async function indexWorkspaceCommand(
  notificationService: NotificationService,
): Promise<void> {
  const ns = notificationService;
  const astIndexer = AstIndexingService.getInstance();

  const files = await vscode.workspace.findFiles(
    "**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,h,c}",
    "**/{node_modules,.git,dist,out,build,coverage,.codebuddy}/**",
  );

  if (files.length === 0) {
    ns.addNotification(
      "info",
      "Workspace Indexing",
      "No indexable files found in the workspace.",
      NotificationSource.Workspace,
    );
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
        ns.addNotification(
          "warning",
          "Indexing Complete (No Embeddings)",
          summary,
          NotificationSource.Workspace,
        );
      } else if (result.errors > 0) {
        ns.addNotification(
          "warning",
          "Indexing Complete With Errors",
          summary,
          NotificationSource.Workspace,
        );
      } else {
        ns.addNotification(
          "success",
          "Workspace Indexed",
          summary,
          NotificationSource.Workspace,
        );
      }
      logger.info(summary);
    },
  );
}
