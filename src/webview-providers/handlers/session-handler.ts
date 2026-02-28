import { WebviewMessageHandler, HandlerContext } from "./types";
import { AgentService } from "../../services/agent-state";
import { ChatHistoryManager } from "../../services/chat-history-manager";
import { ChatHistoryCache } from "../../memory/chat-history-cache";
import {
  DbChatMessage,
  LlmChatMessage,
  WebviewChatMessage,
} from "../../interfaces/chat-history.interface";

export class SessionHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-sessions",
    "create-session",
    "switch-session",
    "delete-session",
    "update-session-title",
    "get-current-session",
    "clear-history",
    "request-chat-history",
  ];

  private chatHistorySyncPromise: Promise<void> | null = null;

  constructor(
    private readonly agentService: AgentService,
    private readonly chatHistoryManager: ChatHistoryManager,
    private readonly getCurrentSessionId: () => string | null,
    private readonly setCurrentSessionId: (id: string | null) => void,
    private readonly orchestrator: {
      publish: (event: string, ...args: any[]) => void;
    },
  ) {}

  private formatHistoryForLlm(history: DbChatMessage[]): LlmChatMessage[] {
    return history.map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
      originalTimestamp: msg.timestamp,
    }));
  }

  private formatHistoryForWebview(
    history: DbChatMessage[],
  ): WebviewChatMessage[] {
    return history.map((msg) => ({
      type: msg.type === "user" ? "user" : "bot",
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
      alias: msg.metadata?.alias || "O",
      language: msg.metadata?.language || "text",
      metadata: msg.metadata,
    }));
  }

  private formatLlmHistoryForWebview(
    llmHistory: LlmChatMessage[],
  ): WebviewChatMessage[] {
    return llmHistory.map((msg) => ({
      type: msg.role === "user" ? "user" : "bot",
      content: msg.content,
      timestamp: msg.originalTimestamp || Date.now(),
      alias: "O",
      language: "text",
    }));
  }

  private async loadSessionHistory(
    targetSessionId: string,
  ): Promise<{ formattedHistory: WebviewChatMessage[] }> {
    ChatHistoryCache.swap(targetSessionId, []);

    const cached = ChatHistoryCache.get(targetSessionId);
    if (cached) {
      ChatHistoryCache.setActive(targetSessionId, cached);
      return { formattedHistory: this.formatLlmHistoryForWebview(cached) };
    }

    try {
      const history = await this.agentService.getSessionHistory(
        "agentId",
        targetSessionId,
      );
      if (history.length > 0) {
        const llmHistory = this.formatHistoryForLlm(history);
        ChatHistoryCache.setActive(targetSessionId, llmHistory);
        ChatHistoryCache.set(targetSessionId, llmHistory);
        return { formattedHistory: this.formatHistoryForWebview(history) };
      }
    } catch (error: any) {
      // Swallow; caller will get empty history
    }

    ChatHistoryCache.setActive(targetSessionId, []);
    return { formattedHistory: [] };
  }

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "get-sessions": {
        try {
          const sessions = await this.agentService.getSessions("agentId");
          await ctx.webview.webview.postMessage({
            type: "sessions-list",
            sessions,
          });
        } catch (error: any) {
          ctx.logger.error("Failed to get sessions:", error);
          await ctx.webview.webview.postMessage({
            type: "sessions-list",
            sessions: [],
            error: error.message,
          });
        }
        break;
      }

      case "create-session": {
        try {
          const rawTitle = message.message?.title || "New Chat";
          const title =
            rawTitle
              .replace(/<[^>]*>/g, "")
              .trim()
              .substring(0, 255) || "New Chat";
          const sessionId = await this.agentService.createSession(
            "agentId",
            title,
          );
          ChatHistoryCache.swap(sessionId, []);
          this.setCurrentSessionId(sessionId);
          const sessions = await this.agentService.getSessions("agentId");
          await ctx.webview.webview.postMessage({
            type: "session-created",
            sessionId,
            sessions,
          });
          await ctx.webview.webview.postMessage({
            type: "session-switched",
            sessionId,
            history: [],
          });
          ctx.logger.info(`Created new session: ${sessionId}`);
        } catch (error: any) {
          ctx.logger.error("Failed to create session:", error);
        }
        break;
      }

      case "switch-session": {
        try {
          const sessionId = message.message?.sessionId;
          if (!sessionId) throw new Error("Session ID is required");
          await this.agentService.switchSession("agentId", sessionId);
          const { formattedHistory } = await this.loadSessionHistory(sessionId);
          this.setCurrentSessionId(sessionId);
          await ctx.webview.webview.postMessage({
            type: "session-switched",
            sessionId,
            history: formattedHistory,
          });
          ctx.logger.info(`Switched to session: ${sessionId}`);
        } catch (error: any) {
          ctx.logger.error("Failed to switch session:", error);
        }
        break;
      }

      case "delete-session": {
        try {
          const sessionId = message.message?.sessionId;
          ctx.logger.info(`Attempting to delete session: ${sessionId}`);
          if (!sessionId) throw new Error("Session ID is required");
          await this.agentService.deleteSession("agentId", sessionId);
          ctx.logger.info(`Deleted session from database: ${sessionId}`);
          ChatHistoryCache.delete(sessionId);
          if (this.getCurrentSessionId() === sessionId) {
            this.setCurrentSessionId(null);
            ChatHistoryCache.deactivate();
          }
          const sessions = await this.agentService.getSessions("agentId");
          ctx.logger.info(
            `Remaining sessions after delete: ${sessions.length}`,
          );
          await ctx.webview.webview.postMessage({
            type: "session-deleted",
            sessionId,
            sessions,
          });
          ctx.logger.info(`Deleted session: ${sessionId}`);
        } catch (error: any) {
          ctx.logger.error("Failed to delete session:", error);
        }
        break;
      }

      case "update-session-title": {
        try {
          const { sessionId, title } = message.message || {};
          if (!sessionId || !title)
            throw new Error("Session ID and title are required");
          await this.agentService.updateSessionTitle(
            "agentId",
            sessionId,
            title,
          );
          const sessions = await this.agentService.getSessions("agentId");
          await ctx.webview.webview.postMessage({
            type: "session-title-updated",
            sessionId,
            sessions,
          });
          ctx.logger.info(`Updated session title: ${sessionId} -> ${title}`);
        } catch (error: any) {
          ctx.logger.error("Failed to update session title:", error);
        }
        break;
      }

      case "get-current-session": {
        try {
          const sessionId =
            await this.agentService.getCurrentSession("agentId");
          await ctx.webview.webview.postMessage({
            type: "current-session",
            sessionId,
          });
        } catch (error: any) {
          ctx.logger.error("Failed to get current session:", error);
        }
        break;
      }

      case "clear-history":
        await this.chatHistoryManager.clearHistory("agentId");
        this.orchestrator.publish("onClearHistory", message);
        ctx.webview.webview.postMessage({ command: "history-cleared" });
        ctx.logger.info("Chat history cleared");
        break;

      case "request-chat-history":
        await this.synchronizeChatHistoryFromDatabase(ctx);
        break;
    }
  }

  /**
   * Synchronize a specific session's history to the webview.
   * Exposed as a public method so that the `webview-ready` inline case can call it.
   */
  async synchronizeSessionHistory(
    sessionId: string,
    ctx: HandlerContext,
  ): Promise<void> {
    try {
      const { formattedHistory } = await this.loadSessionHistory(sessionId);

      ctx.logger.debug(
        `Synchronized ${formattedHistory.length} messages for session ${sessionId}`,
      );

      await ctx.webview.webview.postMessage({
        type: "chat-history",
        message: JSON.stringify(formattedHistory),
      });
    } catch (error: any) {
      ctx.logger.warn(
        `Failed to synchronize session history for ${sessionId}:`,
        error,
      );
    }
  }

  /**
   * Synchronize provider's chatHistory array with database on startup.
   * Includes deduplication guard to prevent concurrent syncs.
   */
  async synchronizeChatHistoryFromDatabase(ctx: HandlerContext): Promise<void> {
    if (this.chatHistorySyncPromise) {
      return this.chatHistorySyncPromise;
    }

    this.chatHistorySyncPromise = (async () => {
      const agentId = "agentId";
      const maxAttempts = 2;
      const retryDelayMs = 150;

      ctx.logger.info("Starting chat history sync for webview");

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const persistentHistory =
            (await this.agentService.getChatHistory(agentId)) || [];
          const persistentSummary =
            await this.agentService.getChatSummary(agentId);

          ctx.logger.info(
            `Chat history fetch attempt ${attempt}: ${persistentHistory.length} messages${persistentSummary ? " + summary" : ""}`,
          );

          if (persistentHistory.length > 0 || persistentSummary) {
            const providerHistory = persistentHistory.map((msg: any) => ({
              type: msg.type === "user" ? "user" : "bot",
              content: msg.content,
              timestamp: msg.timestamp || Date.now(),
              alias: msg.metadata?.alias || "O",
              language: msg.metadata?.language || "text",
              metadata: msg.metadata,
            }));

            if (persistentSummary) {
              providerHistory.unshift({
                type: "user",
                content: `[System Note: This is a summary of our earlier conversation to preserve context]:\n${persistentSummary}`,
                timestamp: Date.now(),
                alias: "O",
                language: "text",
                metadata: { isSummary: true },
              });
            }

            ctx.logger.debug(
              `Synchronized ${persistentHistory.length} chat messages from database${persistentSummary ? " + summary" : ""}`,
            );

            await ctx.webview.webview.postMessage({
              type: "chat-history",
              message: JSON.stringify(providerHistory),
            });
          } else {
            ctx.logger.debug(
              "No chat history found in database to synchronize",
            );
          }

          return;
        } catch (error: any) {
          const isBusy =
            typeof error?.message === "string" &&
            error.message.includes("Worker is busy");

          if (isBusy && attempt < maxAttempts) {
            ctx.logger.debug(
              "Chat history worker busy, retrying synchronization",
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            continue;
          }

          ctx.logger.warn(
            "Failed to synchronize chat history from database:",
            error,
          );
          return;
        }
      }
    })();

    try {
      await this.chatHistorySyncPromise;
    } finally {
      this.chatHistorySyncPromise = null;
    }
  }
}
