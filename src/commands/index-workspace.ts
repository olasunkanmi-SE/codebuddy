import { AstIndexingService } from "../services/ast-indexing.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EditorHostService } from "../services/editor-host.service";

const logger = Logger.initialize("IndexWorkspace", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

export async function indexWorkspaceCommand(): Promise<void> {
  const astIndexer = AstIndexingService.getInstance(); // Singleton already initialized
  const editorHost = EditorHostService.getInstance().getHost();

  // Find all files, excluding common ignored folders
  // Note: findFiles returns string[] in EditorHostService, but we need to check if it returns Uris or paths.
  // The interface says: findFiles(include: string, exclude?: string): Promise<string[]>;
  const filePaths = await editorHost.workspace.findFiles(
    "**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,h,c}", // Limit to code files for AST analysis
    "**/{node_modules,.git,dist,out,build,coverage,.codebuddy}/**",
  );

  if (filePaths.length === 0) {
    editorHost.window.showInformationMessage("No files found to index.");
    return;
  }

  editorHost.window.withProgress(
    {
      location: "Notification",
      title: "Indexing Workspace (Background Worker)",
      cancellable: true,
    },
    async (progress, token) => {
      let processed = 0;
      const total = filePaths.length;

      for (const filePath of filePaths) {
        // Token cancellation check might need to be abstracted if not available in generic token
        // Assuming token has isCancellationRequested
        if (token.isCancellationRequested) break;

        try {
          progress.report({
            message: `Queueing ${processed}/${total}: ${editorHost.workspace.asRelativePath(filePath)}`,
            increment: (1 / total) * 100,
          });

          // Read file content using IEditorHost.workspace.fs (raw bytes)
          // This avoids the line numbers added by BackendProtocol.read()
          const contentBytes = await editorHost.workspace.fs.readFile(filePath);
          const content = new TextDecoder().decode(contentBytes);

          // Offload to worker
          astIndexer.indexFile(filePath, content);
        } catch (error) {
          logger.error(`Failed to queue file: ${filePath}`, error);
        }

        processed++;
      }

      editorHost.window.showInformationMessage(
        `Workspace indexing queued for ${processed} files. Check logs for completion.`,
      );
    },
  );
}
