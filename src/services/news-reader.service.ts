import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import createDOMPurify from "dompurify";
import { EnhancedCacheManager } from "./enhanced-cache-manager.service";

export class NewsReaderService implements vscode.Disposable {
  private static instance: NewsReaderService;
  private logger: Logger;
  private currentPanel: vscode.WebviewPanel | undefined;
  private cacheManager: EnhancedCacheManager;

  private constructor() {
    this.logger = Logger.initialize("NewsReaderService", {});
    this.cacheManager = new EnhancedCacheManager({
      maxSize: 100, // Cache up to 100 articles
      defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  public static getInstance(): NewsReaderService {
    if (!NewsReaderService.instance) {
      NewsReaderService.instance = new NewsReaderService();
    }
    return NewsReaderService.instance;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.currentPanel) {
      this.currentPanel.dispose();
      this.currentPanel = undefined;
    }
    this.cacheManager.dispose();
    this.logger.info("NewsReaderService disposed");
  }

  /**
   * Clear the reader cache
   */
  public async clearCache(): Promise<void> {
    await this.cacheManager.clearCache("all");
    this.logger.info("Reader cache cleared manually");
  }

  public async openReader(url: string, title?: string): Promise<void> {
    try {
      // 1. Check cache
      const cachedHtml = await this.cacheManager.getResponse(url);
      if (cachedHtml) {
        this.logger.info(`Cache hit for reader: ${url}`);
        this.showPanel(cachedHtml, title || "Reader View");
        return;
      }

      // 2. Fetch content
      this.logger.info(`Fetching content for reader: ${url}`);

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Opening Reader Mode...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Fetching content..." });
          const response = await axios.get(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            timeout: 10000, // 10s timeout
          });
          const html = response.data;

          progress.report({ message: "Parsing content..." });
          const doc = new JSDOM(html, { url });
          const reader = new Readability(doc.window.document);
          const article = reader.parse();

          if (!article) {
            throw new Error("Could not parse article content");
          }

          const readerHtml = this.getReaderHtml(article);

          // Cache the result
          await this.cacheManager.setResponse(url, readerHtml);

          this.showPanel(readerHtml, article.title || title || "Reader View");
        },
      );
    } catch (error: any) {
      this.logger.error(`Failed to open reader for ${url}`, error);
      const choice = await vscode.window.showErrorMessage(
        `Reader Mode failed: ${error.message}. Open in external browser?`,
        "Open External",
        "Cancel",
      );

      if (choice === "Open External") {
        vscode.env.openExternal(vscode.Uri.parse(url));
      }
    }
  }

  private showPanel(html: string, title: string): void {
    if (this.currentPanel) {
      this.currentPanel.reveal(vscode.ViewColumn.One);
    } else {
      this.currentPanel = vscode.window.createWebviewPanel(
        "codeBuddyReader",
        "CodeBuddy Reader",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [],
        },
      );

      this.currentPanel.onDidDispose(() => {
        this.currentPanel = undefined;
      });
    }

    this.currentPanel.title = title;
    this.currentPanel.webview.html = html;
  }

  private getReaderHtml(article: {
    title: string;
    content: string;
    byline: string;
    siteName: string;
  }): string {
    // Sanitize content
    const window = new JSDOM("").window;
    const DOMPurify = createDOMPurify(window as any);
    const cleanContent = DOMPurify.sanitize(article.content);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        :root {
            --bg-color: var(--vscode-editor-background);
            --text-color: var(--vscode-editor-foreground);
            --link-color: var(--vscode-textLink-foreground);
            --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-family);
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 0.2em;
            line-height: 1.2;
        }

        .meta {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
            margin-bottom: 2em;
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 1em;
        }

        .content {
            font-size: 1.1em;
        }

        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
            display: block;
        }

        .content pre {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: var(--vscode-editor-font-family, monospace);
        }
        
        .content code {
            font-family: var(--vscode-editor-font-family, monospace);
            background-color: var(--vscode-textBlockQuote-background);
            padding: 2px 4px;
            border-radius: 4px;
        }

        .content blockquote {
            border-left: 4px solid var(--vscode-textLink-foreground);
            margin: 0;
            padding-left: 16px;
            color: var(--vscode-descriptionForeground);
        }

        a {
            color: var(--link-color);
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <article>
        <h1>${article.title}</h1>
        <div class="meta">
            ${article.siteName ? `<span>${article.siteName}</span> • ` : ""}
            ${article.byline ? `<span>${article.byline}</span>` : ""}
        </div>
        <div class="content">
            ${cleanContent}
        </div>
    </article>
</body>
</html>`;
  }
}
