import { WebviewMessageHandler, HandlerContext } from "./types";

export class ComposerHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-composer-sessions",
    "get-session-changes",
    "apply-composer-session",
    "reject-composer-session",
  ];

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    const { ComposerService } = await import("../../services/composer.service");
    const composerService = ComposerService.getInstance();

    switch (message.command) {
      case "get-composer-sessions": {
        const sessions = composerService.getActiveSessions();
        await ctx.webview.webview.postMessage({
          type: "composer-sessions",
          sessions: sessions.map((s) => ({
            id: s.id,
            label: s.label,
            changeCount: s.changeIds.length,
            status: s.status,
            timestamp: s.timestamp,
          })),
        });
        break;
      }

      case "get-session-changes": {
        const changes = composerService.getSessionChanges(message.sessionId);
        await ctx.webview.webview.postMessage({
          type: "session-changes",
          sessionId: message.sessionId,
          changes: changes.map((c) => ({
            id: c.id,
            filePath: c.filePath,
            timestamp: c.timestamp,
            status: c.status,
            isNewFile: c.isNewFile,
          })),
        });
        break;
      }

      case "apply-composer-session": {
        try {
          const result = await composerService.applySession(message.sessionId);
          await ctx.webview.webview.postMessage({
            type: "composer-session-applied",
            sessionId: message.sessionId,
            ...result,
          });
        } catch (error: any) {
          await ctx.webview.webview.postMessage({
            type: "composer-session-applied",
            sessionId: message.sessionId,
            applied: 0,
            failed: 0,
            error: error.message,
          });
        }
        break;
      }

      case "reject-composer-session": {
        try {
          composerService.rejectSession(message.sessionId);
          await ctx.webview.webview.postMessage({
            type: "composer-session-rejected",
            sessionId: message.sessionId,
          });
        } catch (error: any) {
          await ctx.webview.webview.postMessage({
            type: "composer-session-rejected",
            sessionId: message.sessionId,
            error: error.message,
          });
        }
        break;
      }
    }
  }
}
