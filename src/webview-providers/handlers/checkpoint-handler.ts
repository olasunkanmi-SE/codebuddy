import { WebviewMessageHandler, HandlerContext } from "./types";

export class CheckpointHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-checkpoints",
    "create-checkpoint",
    "revert-checkpoint",
    "delete-checkpoint",
  ];

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    const { CheckpointService } =
      await import("../../services/checkpoint.service");
    const svc = CheckpointService.getInstance();

    switch (message.command) {
      case "get-checkpoints": {
        const checkpoints = svc.getCheckpoints(message.conversationId);
        await ctx.webview.webview.postMessage({
          type: "checkpoints",
          checkpoints: checkpoints.map((c) => ({
            id: c.id,
            label: c.label,
            timestamp: c.timestamp,
            conversationId: c.conversationId,
            fileCount: c.files.length,
          })),
        });
        break;
      }

      case "create-checkpoint": {
        const checkpoint = await svc.createCheckpoint(
          message.conversationId ?? "manual",
          message.label ?? "Manual checkpoint",
          message.files ?? [],
        );
        await ctx.webview.webview.postMessage({
          type: "checkpoint-created",
          checkpoint: {
            id: checkpoint.id,
            label: checkpoint.label,
            timestamp: checkpoint.timestamp,
            conversationId: checkpoint.conversationId,
            fileCount: checkpoint.files.length,
          },
        });
        break;
      }

      case "revert-checkpoint": {
        const result = await svc.revertToCheckpoint(message.checkpointId);
        await ctx.webview.webview.postMessage({
          type: "checkpoint-reverted",
          checkpointId: message.checkpointId,
          reverted: result.reverted,
          deleted: result.deleted,
          errors: result.errors,
        });
        break;
      }

      case "delete-checkpoint": {
        const deleted = svc.deleteCheckpoint(message.checkpointId);
        await ctx.webview.webview.postMessage({
          type: "checkpoint-deleted",
          checkpointId: message.checkpointId,
          success: deleted,
        });
        break;
      }
    }
  }
}
