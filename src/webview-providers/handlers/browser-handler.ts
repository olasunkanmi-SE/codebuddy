import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { AgentService } from "../../services/agent-state";

export class BrowserHandler implements WebviewMessageHandler {
  readonly commands = [
    "openExternal",
    "openInReader",
    "promptOpenBrowser",
    "openBrowser",
    "store-reader-context",
    "get-browsing-history",
    "add-history-to-chat",
    "add-bookmark",
    "remove-bookmark",
    "get-bookmarks",
  ];

  constructor(
    private readonly agentService: AgentService,
    private readonly getCurrentSessionId: () => string | null,
  ) {}

  private async handleBrowserOpen(
    url: string,
    browserType: string | undefined,
    ctx: HandlerContext,
  ): Promise<void> {
    const browserPref =
      browserType ||
      vscode.workspace
        .getConfiguration("codebuddy")
        .get<string>("browserType", "simple");

    const { NewsReaderService: BrowserReaderService } =
      await import("../../services/news-reader.service");

    BrowserReaderService.getInstance().lastBrowsedUrl = url;

    const reader = BrowserReaderService.getInstance();
    reader.browsingHistory = [
      { url, title: url, timestamp: Date.now() },
      ...reader.browsingHistory.filter((h) => h.url !== url),
    ].slice(0, 50);

    if (browserPref === "reader") {
      BrowserReaderService.getInstance().openReader(url);
    } else if (browserPref === "system") {
      vscode.env.openExternal(vscode.Uri.parse(url));
    } else {
      vscode.commands.executeCommand("simpleBrowser.show", url);
    }
  }

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "openExternal":
        if (message.text) {
          const browserType = vscode.workspace
            .getConfiguration("codebuddy")
            .get<string>("browserType", "system");

          const { NewsReaderService } =
            await import("../../services/news-reader.service");
          const extReader = NewsReaderService.getInstance();
          extReader.lastBrowsedUrl = message.text;
          extReader.browsingHistory = [
            { url: message.text, title: message.text, timestamp: Date.now() },
            ...extReader.browsingHistory.filter((h) => h.url !== message.text),
          ].slice(0, 50);

          if (browserType === "reader") {
            NewsReaderService.getInstance().openReader(message.text);
          } else {
            NewsReaderService.getInstance()
              .analyzeContent(message.text)
              .catch((err) =>
                ctx.logger.warn("Failed to analyze background content", err),
              );

            if (browserType === "simple") {
              vscode.commands.executeCommand(
                "simpleBrowser.show",
                message.text,
              );
            } else {
              vscode.env.openExternal(vscode.Uri.parse(message.text));
            }
          }
        }
        break;

      case "openInReader":
        if (message.text) {
          const { NewsReaderService } =
            await import("../../services/news-reader.service");
          NewsReaderService.getInstance().openReader(message.text);
        }
        break;

      case "promptOpenBrowser": {
        const url = await vscode.window.showInputBox({
          prompt: "Enter URL to open",
          placeHolder: "https://example.com",
          value: "https://",
          validateInput: (text) => {
            if (!text.trim()) return "URL is required";
            try {
              new URL(text);
              return null;
            } catch {
              return "Please enter a valid URL";
            }
          },
        });
        if (url) {
          await this.handleBrowserOpen(url, message.browserType, ctx);
        }
        break;
      }

      case "openBrowser":
        if (message.text) {
          await this.handleBrowserOpen(message.text, message.browserType, ctx);
        }
        break;

      case "store-reader-context":
        if (message.text) {
          const { NewsReaderService } =
            await import("../../services/news-reader.service");
          const reader = NewsReaderService.getInstance();
          reader.currentArticle = {
            title: reader.currentArticle?.title || "Reader Selection",
            content: message.text,
            url: reader.currentArticle?.url || "reader-selection",
          };
          const readerContent = `📎 **Context added from Reader:**\n\n${message.text}\n\n*This content will be included as context in your next message to the AI.*`;
          await this.agentService.addChatMessage("agentId", {
            content: readerContent,
            type: "model",
            sessionId: this.getCurrentSessionId() ?? undefined,
          });
        }
        break;

      case "get-browsing-history": {
        const { NewsReaderService: HistoryReaderService } =
          await import("../../services/news-reader.service");
        const history = HistoryReaderService.getInstance().browsingHistory;
        await ctx.webview.webview.postMessage({
          type: "browsing-history",
          history,
        });
        break;
      }

      case "add-history-to-chat": {
        if (message.text) {
          const { NewsReaderService: AddToReader } =
            await import("../../services/news-reader.service");
          const reader = AddToReader.getInstance();
          try {
            await reader.analyzeContent(message.text);
            const article = reader.currentArticle;
            const title = article?.title || message.title || message.text;
            const content = article?.content
              ? article.content.substring(0, 5000)
              : "Page content could not be extracted.";
            const snippet = `**[From Web: ${title}]**\n\n${content}`;
            await vscode.commands.executeCommand(
              "codebuddy.appendToChat",
              snippet,
            );
          } catch {
            // Fallback: add URL as context reference
            const snippet = `**[From Web: ${message.title || message.text}]**\n\nURL: ${message.text}`;
            await vscode.commands.executeCommand(
              "codebuddy.appendToChat",
              snippet,
            );
          }
        }
        break;
      }

      case "add-bookmark": {
        if (message.url) {
          try {
            const { SqliteDatabaseService } =
              await import("../../services/sqlite-database.service");
            const db = SqliteDatabaseService.getInstance();
            await db.ensureInitialized();
            db.executeSqlCommand(
              `INSERT OR IGNORE INTO bookmarks (url, title) VALUES (?, ?)`,
              [message.url, message.title || message.url],
            );
            const bookmarks = db.executeSql(
              `SELECT url, title, created_at FROM bookmarks ORDER BY created_at DESC`,
            );
            await ctx.webview.webview.postMessage({
              type: "bookmarks-list",
              bookmarks,
            });
          } catch (err) {
            ctx.logger.warn("Failed to add bookmark", err);
          }
        }
        break;
      }

      case "remove-bookmark": {
        if (message.url) {
          try {
            const { SqliteDatabaseService } =
              await import("../../services/sqlite-database.service");
            const db = SqliteDatabaseService.getInstance();
            await db.ensureInitialized();
            db.executeSqlCommand(`DELETE FROM bookmarks WHERE url = ?`, [
              message.url,
            ]);
            const bookmarks = db.executeSql(
              `SELECT url, title, created_at FROM bookmarks ORDER BY created_at DESC`,
            );
            await ctx.webview.webview.postMessage({
              type: "bookmarks-list",
              bookmarks,
            });
          } catch (err) {
            ctx.logger.warn("Failed to remove bookmark", err);
          }
        }
        break;
      }

      case "get-bookmarks": {
        try {
          const { SqliteDatabaseService } =
            await import("../../services/sqlite-database.service");
          const db = SqliteDatabaseService.getInstance();
          await db.ensureInitialized();
          const bookmarks = db.executeSql(
            `SELECT url, title, created_at FROM bookmarks ORDER BY created_at DESC`,
          );
          await ctx.webview.webview.postMessage({
            type: "bookmarks-list",
            bookmarks,
          });
        } catch (err) {
          ctx.logger.warn("Failed to get bookmarks", err);
        }
        break;
      }
    }
  }
}
