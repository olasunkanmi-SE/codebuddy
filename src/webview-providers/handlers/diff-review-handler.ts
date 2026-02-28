import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";

export class DiffReviewHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-pending-changes",
    "get-recent-changes",
    "apply-change",
    "reject-change",
    "view-change-diff",
  ];

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    const { DiffReviewService } =
      await import("../../services/diff-review.service");
    const diffService = DiffReviewService.getInstance();

    switch (message.command) {
      case "get-pending-changes": {
        const pendingChanges = diffService.getAllPendingChanges();
        await ctx.webview.webview.postMessage({
          type: "pending-changes",
          changes: pendingChanges.map((c) => ({
            id: c.id,
            filePath: c.filePath,
            timestamp: c.timestamp,
            status: c.status,
            isNewFile: c.isNewFile,
          })),
        });
        break;
      }

      case "get-recent-changes": {
        const recentChanges = diffService.getRecentChanges();
        await ctx.webview.webview.postMessage({
          type: "recent-changes",
          changes: recentChanges.map((c) => ({
            id: c.id,
            filePath: c.filePath,
            timestamp: c.timestamp,
            status: c.status,
            isNewFile: c.isNewFile,
          })),
        });
        break;
      }

      case "apply-change": {
        try {
          const success = await diffService.applyChange(message.id);
          await ctx.webview.webview.postMessage({
            type: "change-applied",
            id: message.id,
            success,
          });
        } catch (error: any) {
          await ctx.webview.webview.postMessage({
            type: "change-applied",
            id: message.id,
            success: false,
            error: error.message,
          });
        }
        break;
      }

      case "reject-change": {
        diffService.removePendingChange(message.id);
        await ctx.webview.webview.postMessage({
          type: "change-rejected",
          id: message.id,
        });
        break;
      }

      case "view-change-diff":
        vscode.commands.executeCommand(
          "codebuddy.reviewChange",
          message.id,
          message.filePath,
        );
        break;
    }
  }
}
