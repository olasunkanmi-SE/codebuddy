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

  // Expose current article for Agent context
  public currentArticle:
    | { title: string; content: string; url: string }
    | undefined;

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

  public async analyzeContent(url: string): Promise<void> {
    try {
      this.logger.info(`Analyzing content for context: ${url}`);
      const article = await this._fetchArticle(url);
      if (article) {
        this.currentArticle = {
          title: article.title,
          content: article.textContent,
          url: url,
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to analyze content for ${url}`, error);
    }
  }

  private async _fetchArticle(url: string): Promise<any> {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // 10s timeout
    });
    const html = response.data;
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    return reader.parse();
  }

  public async openReader(url: string, title?: string): Promise<void> {
    try {
      // 1. Check cache
      const cachedHtml = await this.cacheManager.getResponse(url);
      if (cachedHtml) {
        this.logger.info(`Cache hit for reader: ${url}`);
        // We try to reconstruct context from cache if possible, or just skip it.
        // Since we don't store metadata separately, we might miss context on cache hit.
        // But if analyzeContent was called before, we might have it.
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

          const article = await this._fetchArticle(url);

          if (!article) {
            throw new Error("Could not parse article content");
          }

          // Set current article for context
          this.currentArticle = {
            title: article.title,
            content: article.textContent,
            url: url,
          };

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
        this.currentArticle = undefined; // Clear context when closed
      });

      // Handle messages from the webview
      this.currentPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "open":
              if (message.url) {
                this.openReader(message.url);
              }
              break;
            case "open-new":
              if (message.url) {
                // Open in a new column/split if possible, or just a new panel
                // For now, openReader reuses currentPanel if it exists.
                // To support "New Tab", we'd need to manage multiple panels.
                // Let's force a new panel by setting currentPanel to undefined temporarily?
                // No, that would lose the reference to the old one.
                // We need to change how we manage panels to support multiple tabs.
                // But for now, let's just open in external browser as "New Tab" equivalent
                // OR, we can instantiate a new NewsReaderService? No, it's a singleton.

                // Simplest "New Tab" emulation: Open in system browser
                vscode.env.openExternal(vscode.Uri.parse(message.url));
              }
              break;
          }
        },
        undefined,
        [],
      );
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
            --menu-bg: var(--vscode-menu-background);
            --menu-fg: var(--vscode-menu-foreground);
            --menu-border: var(--vscode-menu-border);
            --menu-hover-bg: var(--vscode-menu-selectionBackground);
            --menu-hover-fg: var(--vscode-menu-selectionForeground);
            --toolbar-bg: var(--vscode-editor-background);
            --toolbar-border: var(--vscode-widget-border);
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

        /* Toolbar Styles */
        #toolbar {
            position: sticky;
            top: 0;
            background: var(--toolbar-bg);
            border-bottom: 1px solid var(--toolbar-border);
            padding: 10px 0;
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 100;
        }

        .tool-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }

        .tool-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .font-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
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
            cursor: pointer;
        }

        a:hover {
            text-decoration: underline;
        }

        /* Custom Context Menu */
        #context-menu {
            display: none;
            position: fixed;
            z-index: 1000;
            background: var(--menu-bg);
            color: var(--menu-fg);
            border: 1px solid var(--menu-border);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border-radius: 4px;
            padding: 4px 0;
            min-width: 150px;
        }

        .menu-item {
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
        }

        .menu-item:hover {
            background: var(--menu-hover-bg);
            color: var(--menu-hover-fg);
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <span class="font-label">Font Size:</span>
        <button class="tool-button" id="font-minus">-</button>
        <button class="tool-button" id="font-plus">+</button>
    </div>
    <article id="main-content">
        <h1>${article.title}</h1>
        <div class="meta">
            ${article.siteName ? `<span>${article.siteName}</span> • ` : ""}
            ${article.byline ? `<span>${article.byline}</span>` : ""}
        </div>
        <div class="content">
            ${cleanContent}
        </div>
    </article>

    <div id="context-menu">
        <div class="menu-item" id="menu-open-new">Open in System Browser</div>
        <div class="menu-item" id="menu-copy-link">Copy Link Address</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const contextMenu = document.getElementById('context-menu');
        const openNewItem = document.getElementById('menu-open-new');
        const copyLinkItem = document.getElementById('menu-copy-link');
        const fontPlus = document.getElementById('font-plus');
        const fontMinus = document.getElementById('font-minus');
        const mainContent = document.getElementById('main-content');
        let currentLink = null;
        let currentFontSize = 1.1; // Default em

        // Font size handlers
        fontPlus.addEventListener('click', () => {
            currentFontSize += 0.1;
            mainContent.style.fontSize = currentFontSize + 'em';
        });

        fontMinus.addEventListener('click', () => {
            if (currentFontSize > 0.5) {
                currentFontSize -= 0.1;
                mainContent.style.fontSize = currentFontSize + 'em';
            }
        });

        // Handle regular clicks
        document.addEventListener('click', (e) => {
            // Hide context menu on any click
            if (contextMenu.style.display === 'block') {
                contextMenu.style.display = 'none';
            }

            const link = e.target.closest('a');
            if (link) {
                // If it's a regular click, navigate in reader
                e.preventDefault();
                vscode.postMessage({ command: 'open', url: link.href });
            }
        });

        // Handle right-click (context menu)
        document.addEventListener('contextmenu', (e) => {
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                currentLink = link.href;
                
                // Position menu
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = e.clientY + 'px';
                contextMenu.style.display = 'block';
            }
        });

        // Menu actions
        openNewItem.addEventListener('click', () => {
            if (currentLink) {
                vscode.postMessage({ command: 'open-new', url: currentLink });
                contextMenu.style.display = 'none';
            }
        });

        copyLinkItem.addEventListener('click', () => {
            if (currentLink) {
                navigator.clipboard.writeText(currentLink);
                contextMenu.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
  }
}
