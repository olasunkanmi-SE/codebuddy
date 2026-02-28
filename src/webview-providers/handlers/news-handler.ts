import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { NewsService } from "../../services/news.service";

export class NewsHandler implements WebviewMessageHandler {
  readonly commands = [
    "news-mark-read",
    "news-refresh",
    "news-toggle-saved",
    "news-delete",
    "toggle-saved-news",
    "delete-news",
  ];

  constructor(private readonly synchronizeNews: () => Promise<void>) {}

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "news-mark-read": {
        const { ids } = message;
        if (ids && Array.isArray(ids)) {
          await NewsService.getInstance().markAsRead(ids);
          await this.synchronizeNews();
        }
        break;
      }

      case "news-refresh":
        await NewsService.getInstance().fetchAndStoreNews();
        await this.synchronizeNews();
        break;

      case "news-toggle-saved":
      case "toggle-saved-news": {
        const { id } = message;
        if (id) {
          await NewsService.getInstance().toggleSaved(id);
          await this.synchronizeNews();
        }
        break;
      }

      case "news-delete":
      case "delete-news": {
        const { id } = message;
        if (id) {
          await NewsService.getInstance().deleteNewsItem(id);
          await this.synchronizeNews();
        }
        break;
      }
    }
  }
}
