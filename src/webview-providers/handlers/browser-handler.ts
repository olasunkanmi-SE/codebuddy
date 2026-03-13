import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { AgentService } from "../../services/agent-state";
import type { MCPToolResult } from "../../MCP/types";

/** Article shape used throughout scraping — compatible with Readability.parse() output */
interface ScrapedArticle {
  title: string;
  content: string;
  textContent: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
}

/** Row shape from saved_articles table */
interface SavedArticleRow {
  id: number;
  url: string;
  title: string;
  content_html: string;
  author: string | null;
  site_name: string | null;
}

// ── URL Validation / SSRF Prevention ────────────────────────────────────────
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_HOSTNAMES =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|0\.0\.0\.0)/i;

export function validateArticleUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Disallowed protocol: ${parsed.protocol}`);
  }
  if (BLOCKED_HOSTNAMES.test(parsed.hostname)) {
    throw new Error(`Blocked hostname (SSRF protection): ${parsed.hostname}`);
  }
  if (parsed.hostname.length > 253 || parsed.pathname.length > 2048) {
    throw new Error("URL exceeds maximum length");
  }
  return parsed;
}

// ── Content Length Guard ────────────────────────────────────────────────────
const MAX_LLM_CHARS = 12_000;

export function truncateForLLM(text: string, maxChars = MAX_LLM_CHARS): string {
  if (text.length <= maxChars) return text;

  const head = Math.floor(maxChars * 0.8);
  const tail = Math.floor(maxChars * 0.1);

  return (
    text.slice(0, head) +
    `\n\n[... ${(text.length - head - tail).toLocaleString()} characters omitted ...]\n\n` +
    text.slice(-tail)
  );
}

/**
 * Sanitize article content before passing to LLM context to defend against
 * prompt injection attacks embedded in scraped web content.
 */
export function sanitizeForLLMContext(text: string): string {
  let sanitized = text;

  // Strip common prompt injection patterns
  sanitized = sanitized.replace(
    /\[\s*(SYSTEM|INST|INSTRUCTION|ADMIN|ASSISTANT)\s*\]\s*:?/gi,
    "[REDACTED_TAG]",
  );
  sanitized = sanitized.replace(
    /(?:ignore|forget|disregard|override)\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|context|rules)/gi,
    "[REDACTED_INJECTION]",
  );
  sanitized = sanitized.replace(
    /you\s+are\s+now\s+(?:a|an|the)\s+/gi,
    "[REDACTED_ROLEPLAY] ",
  );
  sanitized = sanitized.replace(
    /(?:new\s+)?(?:system\s+)?prompt\s*:/gi,
    "[REDACTED_PROMPT]",
  );
  // Strip invisible Unicode control characters (zero-width spaces, RTL overrides, etc.)
  /* eslint-disable no-control-regex */
  sanitized = sanitized.replace(
    /[\u200B-\u200F\u2028-\u202F\uFEFF\u0000-\u0008\u000E-\u001F]/g,
    "",
  );
  /* eslint-enable no-control-regex */

  // Wrap in clear delimiters so the LLM knows this is untrusted user content
  return `--- BEGIN UNTRUSTED ARTICLE CONTENT ---\n${sanitized}\n--- END UNTRUSTED ARTICLE CONTENT ---`;
}

/**
 * Sanitize HTML content using DOMPurify before storage (defense-in-depth).
 * Uses a lazy singleton to avoid re-creating JSDOM on every call (~100ms savings).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _domPurify: any = null;

async function getDOMPurify() {
  if (_domPurify) return _domPurify;

  const { JSDOM } = await import("jsdom");
  const createDOMPurify = (await import("dompurify")).default;
  const window = new JSDOM("").window;
  _domPurify = createDOMPurify(window as any);
  return _domPurify;
}

export async function sanitizeHtmlContent(html: string): Promise<string> {
  const DOMPurify = await getDOMPurify();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "em",
      "strong",
      "a",
      "br",
      "img",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title"],
    ALLOW_DATA_ATTR: false,
  });
}

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
    "scrape-and-save-article",
    "get-saved-articles",
    "delete-saved-article",
    "open-saved-article",
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
          const sanitizedText = sanitizeForLLMContext(
            truncateForLLM(message.text),
          );
          reader.currentArticle = {
            title: reader.currentArticle?.title || "Reader Selection",
            content: await sanitizeHtmlContent(message.text),
            url: reader.currentArticle?.url || "reader-selection",
          };
          const readerContent = `📎 **Context added from Reader:**\n\n${sanitizedText}\n\n*This content will be included as context in your next message to the AI.*`;
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
              ? truncateForLLM(article.content)
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

      case "scrape-and-save-article": {
        if (!message.url) break;

        // Validate URL before any network calls (SSRF protection)
        let validatedUrl: URL;
        try {
          validatedUrl = validateArticleUrl(message.url);
        } catch (err: unknown) {
          await ctx.webview.webview.postMessage({
            type: "scrape-article-status",
            status: "error",
            url: message.url,
            error: err instanceof Error ? err.message : String(err),
          });
          break;
        }

        try {
          const url = validatedUrl.href;

          await ctx.webview.webview.postMessage({
            type: "scrape-article-status",
            status: "scraping",
            url,
          });

          // Hoist all service imports once at the top of the handler
          const [
            { NewsReaderService },
            { MCPService },
            { SqliteDatabaseService },
            { JSDOM },
            { Readability },
            axiosMod,
          ] = await Promise.all([
            import("../../services/news-reader.service"),
            import("../../MCP/service"),
            import("../../services/sqlite-database.service"),
            import("jsdom"),
            import("@mozilla/readability"),
            import("axios"),
          ]);
          const axios = axiosMod.default;
          const reader = NewsReaderService.getInstance();
          const mcp = MCPService.getInstance();
          const db = SqliteDatabaseService.getInstance();
          await db.ensureInitialized();

          let article: ScrapedArticle | null = null;

          // Helper: check if parsed article has enough content (not truncated by paywall)
          const isFullArticle = (
            parsed: ScrapedArticle | null,
          ): parsed is ScrapedArticle =>
            parsed !== null &&
            !!parsed.content &&
            !!parsed.textContent &&
            parsed.textContent.length > 500;

          // Helper: extract structured HTML from Playwright accessibility snapshot.
          // Handles headings, lists, blockquotes, code, links — not just paragraphs.
          const extractTextFromSnapshot = (
            snapshot: string,
            skipPaywallMarkers = true,
          ): { title: string | null; html: string; text: string } => {
            const lines = snapshot.split("\n");
            const htmlParts: string[] = [];
            const textParts: string[] = [];
            let title: string | null = null;
            let inList = false;

            const closeList = () => {
              if (inList) {
                htmlParts.push("</ul>");
                inList = false;
              }
            };

            // Extract h1 title
            const h1Match = snapshot.match(/heading\s+"(.+?)"\s+\[level=1\]/);
            if (h1Match) {
              title = h1Match[1];
            }

            for (const line of lines) {
              const trimmed = line.trim();

              // Stop at paywall/sign-up walls (only for direct scraping, not archive.ph)
              if (
                skipPaywallMarkers &&
                /Create an account to read|Sign up to read|Subscribe to read|member.only/i.test(
                  trimmed,
                )
              ) {
                break;
              }

              // Headings: heading "Title" [level=N]
              const headingMatch = trimmed.match(
                /^-?\s*heading\s+"(.+?)"\s+\[level=(\d)\]/,
              );
              if (headingMatch) {
                closeList();
                const level = Math.min(
                  Math.max(parseInt(headingMatch[2], 10), 1),
                  6,
                );
                htmlParts.push(`<h${level}>${headingMatch[1]}</h${level}>`);
                textParts.push(headingMatch[1]);
                continue;
              }

              // List items: listitem or - listitem [ref=...]: text
              const listItemMatch = trimmed.match(
                /^-?\s*listitem\s*(?:\[ref=\w+\])?\s*:?\s*(.*)$/,
              );
              if (listItemMatch) {
                if (!inList) {
                  htmlParts.push("<ul>");
                  inList = true;
                }
                const itemText = listItemMatch[1].trim();
                if (itemText.length > 0) {
                  htmlParts.push(`<li>${itemText}</li>`);
                  textParts.push(`• ${itemText}`);
                }
                continue;
              }

              // Blockquote: blockquote [ref=...]: text
              const blockquoteMatch = trimmed.match(
                /^-?\s*blockquote\s*(?:\[ref=\w+\])?\s*:?\s*(.+)$/,
              );
              if (blockquoteMatch) {
                closeList();
                htmlParts.push(
                  `<blockquote>${blockquoteMatch[1].trim()}</blockquote>`,
                );
                textParts.push(`> ${blockquoteMatch[1].trim()}`);
                continue;
              }

              // Pre-formatted / code blocks: code [ref=...]: content
              const codeMatch = trimmed.match(
                /^-?\s*code\s+\[ref=\w+\]\s*:?\s*(.+)$/,
              );
              if (codeMatch) {
                closeList();
                htmlParts.push(`<pre><code>${codeMatch[1]}</code></pre>`);
                textParts.push(codeMatch[1]);
                continue;
              }

              // Links: link "text" [ref=...] — extract link text
              const linkMatch = trimmed.match(
                /^-?\s*link\s+"(.+?)"\s*(?:\[ref=\w+\])?/,
              );
              if (linkMatch && linkMatch[1].length > 2) {
                // Links inside text flow, don't close list or add block element
                textParts.push(linkMatch[1]);
                continue;
              }

              // Paragraph with inline text: paragraph [ref=...]: Text here
              const paraDirectMatch = trimmed.match(
                /^-?\s*paragraph\s+\[ref=\w+\]\s*:?\s*(.+)$/,
              );
              if (paraDirectMatch && paraDirectMatch[1].trim().length > 5) {
                closeList();
                htmlParts.push(`<p>${paraDirectMatch[1].trim()}</p>`);
                textParts.push(paraDirectMatch[1].trim());
                continue;
              }

              // Text nodes: text "content" or text: content
              const textMatch = trimmed.match(
                /^-?\s*text\s*:?\s*"?(.+?)"?\s*$/,
              );
              if (
                textMatch &&
                textMatch[1].length > 3 &&
                // Exclude navigation/UI text patterns
                !/^(text|paragraph|heading|list|link|button|navigation|banner|img)\s/i.test(
                  textMatch[1],
                )
              ) {
                closeList();
                htmlParts.push(`<p>${textMatch[1]}</p>`);
                textParts.push(textMatch[1]);
                continue;
              }

              // Image alt text: img "alt text" [ref=...]
              const imgMatch = trimmed.match(
                /^-?\s*img\s+"(.+?)"\s*(?:\[ref=\w+\])?/,
              );
              if (imgMatch && imgMatch[1].length > 3) {
                closeList();
                htmlParts.push(`<p><em>[Image: ${imgMatch[1]}]</em></p>`);
                textParts.push(`[Image: ${imgMatch[1]}]`);
                continue;
              }
            }

            closeList();

            return {
              title,
              html: htmlParts.join("\n"),
              text: textParts.join("\n\n"),
            };
          };

          // Helper: use browser_evaluate to extract real HTML from a navigated page,
          // then parse with Readability for properly formatted content.
          const extractHtmlViaEvaluate = async (
            mcpInstance: InstanceType<typeof MCPService>,
            sourceUrl: string,
          ): Promise<ScrapedArticle | null> => {
            try {
              const evalResult = await mcpInstance.callTool(
                "browser_evaluate",
                {
                  expression: `(() => {
                      const article = document.querySelector('article');
                      if (article) return article.innerHTML;
                      const main = document.querySelector('main, [role="main"], .post-content, .article-content, .entry-content');
                      if (main) return main.innerHTML;
                      return document.body.innerHTML;
                    })()`,
                },
                "playwright",
              );

              if (!evalResult.isError && evalResult.content?.length) {
                const rawHtml = evalResult.content
                  .map((c) => c.text ?? "")
                  .join("");

                if (rawHtml.length > 200) {
                  const dom = new JSDOM(rawHtml, { url: sourceUrl });
                  const parsed = new Readability(dom.window.document).parse();
                  if (
                    parsed &&
                    parsed.textContent &&
                    parsed.textContent.length > 300
                  ) {
                    return parsed;
                  }
                }
              }
            } catch (err: unknown) {
              ctx.logger.info(
                `browser_evaluate failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
            return null;
          };

          // --- Strategy 1: HTTP fetch with Google referrer ---
          // Many paywalled sites (Medium, etc.) serve full content to Google-referred visitors
          try {
            const response = await axios.get(url, {
              headers: {
                Referer: "https://www.google.com/",
                "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              },
              timeout: 15000,
              maxContentLength: 10 * 1024 * 1024, // 10MB cap
            });
            if (response.data && typeof response.data === "string") {
              const dom = new JSDOM(response.data, { url });
              const parsed = new Readability(dom.window.document).parse();
              if (isFullArticle(parsed)) {
                article = parsed;
                ctx.logger.info("Scrape: bypassed paywall via Google referrer");
              }
            }
          } catch (err: unknown) {
            ctx.logger.info(
              `Scrape strategy 1 (Google referrer) failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }

          // --- Strategy 2: Google Cache ---
          if (!article) {
            try {
              const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
              const response = await axios.get(cacheUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                },
                timeout: 15000,
              });
              if (response.data && typeof response.data === "string") {
                const dom = new JSDOM(response.data, { url });
                const parsed = new Readability(dom.window.document).parse();
                if (isFullArticle(parsed)) {
                  article = parsed;
                  ctx.logger.info("Scrape: got content from Google Cache");
                }
              }
            } catch (err: unknown) {
              ctx.logger.info(
                `Scrape strategy 2 (Google Cache) failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          // --- Strategy 3: archive.ph via Playwright MCP ---
          // archive.ph stores full copies of paywalled articles; most reliable bypass
          if (!article) {
            try {
              const archiveUrl = `https://archive.ph/newest/${url}`;
              const navResult = await mcp.callTool(
                "browser_navigate",
                { url: archiveUrl },
                "playwright",
              );

              if (!navResult.isError) {
                // Primary: extract real HTML via browser_evaluate + Readability
                const evaluated = await extractHtmlViaEvaluate(mcp, url);
                if (evaluated && isFullArticle(evaluated)) {
                  article = evaluated;
                  ctx.logger.info(
                    "Scrape: got full article from archive.ph via browser_evaluate",
                  );
                }

                // Fallback: parse accessibility snapshot
                if (!article) {
                  const snapResult = await mcp.callTool(
                    "browser_snapshot",
                    {},
                    "playwright",
                  );

                  if (!snapResult.isError && snapResult.content?.length) {
                    const snapshotRaw = snapResult.content
                      .map((c) => c.text ?? "")
                      .join("\n");

                    // Check we didn't land on an archive.ph error/search page
                    const isArchiveError =
                      /No results found|Webpage archive|Save a new page/i.test(
                        snapshotRaw.substring(0, 500),
                      );

                    if (!isArchiveError) {
                      // archive.ph has full content — don't stop at paywall markers
                      const {
                        title: snapTitle,
                        html: snapHtml,
                        text: snapText,
                      } = extractTextFromSnapshot(snapshotRaw, false);
                      if (snapText.length > 500) {
                        article = {
                          title: snapTitle || url,
                          content: snapHtml,
                          textContent: snapText,
                          byline: null,
                          siteName: null,
                          excerpt: snapText.substring(0, 200),
                        };
                        ctx.logger.info(
                          "Scrape: got full article from archive.ph via snapshot",
                        );
                      }
                    }
                  }
                }
              }
            } catch (err: unknown) {
              ctx.logger.info(
                `Scrape strategy 3 (archive.ph) failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          // --- Strategy 4: Playwright MCP via Google Cache ---
          if (!article) {
            try {
              const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
              const navResult = await mcp.callTool(
                "browser_navigate",
                { url: cacheUrl },
                "playwright",
              );

              if (!navResult.isError) {
                // Primary: extract real HTML via browser_evaluate + Readability
                const evaluated = await extractHtmlViaEvaluate(mcp, url);
                if (evaluated && isFullArticle(evaluated)) {
                  article = evaluated;
                  ctx.logger.info(
                    "Scrape: got content from Playwright + Google Cache via browser_evaluate",
                  );
                }

                // Fallback: parse accessibility snapshot
                if (!article) {
                  const snapResult = await mcp.callTool(
                    "browser_snapshot",
                    {},
                    "playwright",
                  );
                  if (!snapResult.isError && snapResult.content?.length) {
                    const snapshotRaw = snapResult.content
                      .map((c) => c.text ?? "")
                      .join("\n");
                    const {
                      title: snapTitle,
                      html: snapHtml,
                      text: snapText,
                    } = extractTextFromSnapshot(snapshotRaw);
                    if (snapText.length > 500) {
                      article = {
                        title: snapTitle || url,
                        content: snapHtml,
                        textContent: snapText,
                        byline: null,
                        siteName: null,
                        excerpt: snapText.substring(0, 200),
                      };
                      ctx.logger.info(
                        "Scrape: got content from Playwright + Google Cache via snapshot",
                      );
                    }
                  }
                }
              }
            } catch (err: unknown) {
              ctx.logger.info(
                `Scrape strategy 4 (Playwright + Google Cache) failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          // --- Strategy 5: Playwright MCP direct navigate + snapshot text extraction ---
          if (!article) {
            try {
              const navResult = await mcp.callTool(
                "browser_navigate",
                { url },
                "playwright",
              );

              if (!navResult.isError) {
                // Primary: extract real HTML via browser_evaluate + Readability
                const evaluated = await extractHtmlViaEvaluate(mcp, url);
                if (evaluated && isFullArticle(evaluated)) {
                  article = evaluated;
                  ctx.logger.info(
                    "Scrape: got content from direct Playwright via browser_evaluate",
                  );
                }

                // Fallback: parse accessibility snapshot
                if (!article) {
                  const snapResult = await mcp.callTool(
                    "browser_snapshot",
                    {},
                    "playwright",
                  );
                  if (!snapResult.isError && snapResult.content?.length) {
                    const snapshotRaw = snapResult.content
                      .map((c) => c.text ?? "")
                      .join("\n");
                    const {
                      title: snapTitle,
                      html: snapHtml,
                      text: snapText,
                    } = extractTextFromSnapshot(snapshotRaw);
                    if (snapText.length > 200) {
                      article = {
                        title: snapTitle || url,
                        content: snapHtml,
                        textContent: snapText,
                        byline: null,
                        siteName: null,
                        excerpt: snapText.substring(0, 200),
                      };
                      ctx.logger.info(
                        "Scrape: extracted text from direct Playwright snapshot (may be partial)",
                      );
                    }
                  }
                }
              }
            } catch (err: unknown) {
              ctx.logger.info(
                `Scrape strategy 5 (direct Playwright snapshot) failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          // --- Strategy 6: plain Readability via HTTP (for non-paywalled pages) ---
          if (!article) {
            try {
              const fetched = await reader.fetchArticle(url);
              if (isFullArticle(fetched)) {
                article = fetched;
              }
            } catch (err: unknown) {
              ctx.logger.info(
                `Scrape strategy 6 (plain Readability) failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          if (!article) {
            await ctx.webview.webview.postMessage({
              type: "scrape-article-status",
              status: "error",
              url,
              error:
                "Could not extract article content behind the paywall. All bypass strategies failed.",
            });
            break;
          }

          await ctx.webview.webview.postMessage({
            type: "scrape-article-status",
            status: "saving",
            url,
          });

          // Save to SQLite
          // Sanitize HTML before storage (defense-in-depth)
          const cleanHtml = await sanitizeHtmlContent(article.content || "");

          db.executeSqlCommand(
            `INSERT OR REPLACE INTO saved_articles (url, title, author, site_name, content_html, content_text, excerpt)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              url,
              article.title || url,
              article.byline || null,
              article.siteName || null,
              cleanHtml,
              article.textContent || "",
              article.excerpt || null,
            ],
          );

          // Fetch updated list
          const savedArticles = db.executeSql(
            `SELECT id, url, title, author, site_name, excerpt, saved_at FROM saved_articles ORDER BY saved_at DESC`,
          );

          await ctx.webview.webview.postMessage({
            type: "scrape-article-status",
            status: "done",
            url,
          });

          await ctx.webview.webview.postMessage({
            type: "saved-articles-list",
            articles: savedArticles,
          });

          // Also open it immediately in the Smart Reader
          reader.openReader(url, article.title);
        } catch (err: unknown) {
          ctx.logger.warn("Failed to scrape and save article", err);
          await ctx.webview.webview.postMessage({
            type: "scrape-article-status",
            status: "error",
            url: message.url,
            error:
              err instanceof Error ? err.message : "Failed to scrape article",
          });
        }
        break;
      }

      case "get-saved-articles": {
        try {
          const { SqliteDatabaseService } =
            await import("../../services/sqlite-database.service");
          const db = SqliteDatabaseService.getInstance();
          await db.ensureInitialized();
          const articles = db.executeSql(
            `SELECT id, url, title, author, site_name, excerpt, saved_at FROM saved_articles ORDER BY saved_at DESC`,
          );
          await ctx.webview.webview.postMessage({
            type: "saved-articles-list",
            articles,
          });
        } catch (err) {
          ctx.logger.warn("Failed to get saved articles", err);
        }
        break;
      }

      case "delete-saved-article": {
        if (message.id) {
          try {
            const { SqliteDatabaseService } =
              await import("../../services/sqlite-database.service");
            const db = SqliteDatabaseService.getInstance();
            await db.ensureInitialized();
            db.executeSqlCommand(`DELETE FROM saved_articles WHERE id = ?`, [
              message.id,
            ]);
            const articles = db.executeSql(
              `SELECT id, url, title, author, site_name, excerpt, saved_at FROM saved_articles ORDER BY saved_at DESC`,
            );
            await ctx.webview.webview.postMessage({
              type: "saved-articles-list",
              articles,
            });
          } catch (err) {
            ctx.logger.warn("Failed to delete saved article", err);
          }
        }
        break;
      }

      case "open-saved-article": {
        if (message.id) {
          try {
            const { SqliteDatabaseService } =
              await import("../../services/sqlite-database.service");
            const db = SqliteDatabaseService.getInstance();
            await db.ensureInitialized();
            const rows = db.executeSql(
              `SELECT url, title, content_html, author, site_name FROM saved_articles WHERE id = ?`,
              [message.id],
            );

            if (rows.length > 0) {
              const row = rows[0] as SavedArticleRow;
              const { NewsReaderService } =
                await import("../../services/news-reader.service");
              const reader = NewsReaderService.getInstance();

              // Sanitize stored HTML before display
              const sanitizedContent = await sanitizeHtmlContent(
                row.content_html,
              );

              await reader.displayOfflineArticle({
                title: row.title,
                content: sanitizedContent,
                byline: row.author || "",
                siteName: row.site_name || "",
                url: row.url,
              });
            }
          } catch (err) {
            ctx.logger.warn("Failed to open saved article", err);
          }
        }
        break;
      }
    }
  }
}
