import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";

export class DiffReviewHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-pending-changes",
    "get-recent-changes",
    "apply-change",
    "reject-change",
    "view-change-diff",
    "get-change-hunks",
    "accept-hunk",
    "reject-hunk",
    "finalize-hunk-review",
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

      case "get-change-hunks": {
        const hunks = diffService.getHunks(message.id);
        await ctx.webview.webview.postMessage({
          type: "change-hunks",
          id: message.id,
          hunks: hunks
            ? hunks.map((h) => ({
                index: h.index,
                header: h.header,
                oldStart: h.oldStart,
                oldLines: h.oldLines,
                newStart: h.newStart,
                newLines: h.newLines,
                status: h.status,
                lines: h.lines,
              }))
            : null,
        });
        break;
      }

      case "accept-hunk": {
        const accepted = diffService.acceptHunk(message.id, message.hunkIndex);
        await ctx.webview.webview.postMessage({
          type: "hunk-status-changed",
          id: message.id,
          hunkIndex: message.hunkIndex,
          status: accepted ? "accepted" : "error",
        });
        break;
      }

      case "reject-hunk": {
        const rejected = diffService.rejectHunk(message.id, message.hunkIndex);
        await ctx.webview.webview.postMessage({
          type: "hunk-status-changed",
          id: message.id,
          hunkIndex: message.hunkIndex,
          status: rejected ? "rejected" : "error",
        });
        break;
      }

      case "finalize-hunk-review": {
        try {
          const finalized = await diffService.finalizeHunkReview(message.id);
          await ctx.webview.webview.postMessage({
            type: "hunk-review-finalized",
            id: message.id,
            success: finalized,
          });
        } catch (error: any) {
          await ctx.webview.webview.postMessage({
            type: "hunk-review-finalized",
            id: message.id,
            success: false,
            error: error.message,
          });
        }
        break;
      }
    }
  }
}
