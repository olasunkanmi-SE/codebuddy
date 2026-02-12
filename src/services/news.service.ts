import axios from "axios";
import Parser from "rss-parser";
import { SqliteDatabaseService } from "./sqlite-database.service";
import { Logger } from "../infrastructure/logger/logger";

export interface NewsItem {
  id?: number;
  title: string;
  url: string;
  summary?: string;
  source: string;
  published_at?: string;
  fetched_at?: string;
  read_status?: number; // 0 = unread, 1 = read
  saved?: number; // 0 = not saved, 1 = saved
}

// Top engineering company blogs with RSS feeds
const ENGINEERING_BLOG_FEEDS = [
  { name: "OpenAI", url: "https://openai.com/blog/rss.xml" },
  {
    name: "Google Developers",
    url: "https://developers.googleblog.com/feeds/posts/default?alt=rss",
  },
  { name: "Stripe Engineering", url: "https://stripe.com/blog/feed.rss" },
  { name: "GitHub Engineering", url: "https://github.blog/engineering/feed/" },
  { name: "Microsoft DevBlogs", url: "https://devblogs.microsoft.com/feed/" },
  {
    name: "AWS Architecture",
    url: "https://aws.amazon.com/blogs/architecture/feed/",
  },
  { name: "Slack Engineering", url: "https://slack.engineering/feed/" },
  { name: "Netflix Tech Blog", url: "https://netflixtechblog.com/feed" },
  {
    name: "Uber Engineering Blog",
    url: "https://www.uber.com/blog/engineering/rss/",
  },
  { name: "Dropbox Tech Blog", url: "https://dropbox.tech/feed" },
  {
    name: "Pinterest Engineering",
    url: "https://medium.com/feed/pinterest-engineering",
  },
  // Human Side of Tech & Leadership
  {
    name: "The Engineering Manager",
    url: "https://theengineeringmanager.com/feed/",
  },
  { name: "Lara Hogan’s Blog", url: "https://larahogan.me/feed.xml" },
  { name: "Rands in Repose", url: "https://randsinrepose.com/feed/" },
  {
    name: "Irrational Exuberance (Will Larson)",
    url: "https://lethain.com/feeds.xml",
  },
  { name: "LeadDev", url: "https://leaddev.com/feed" },
  { name: "Jellyfish Blog", url: "https://jellyfish.co/blog/feed" },
  { name: "StaffEng", url: "https://staffeng.com/rss" },
  // Substack & Independent - Architecture & Leadership
  {
    name: "The Pragmatic Engineer",
    url: "https://newsletter.pragmaticengineer.com/feed",
  },
  { name: "ByteByteGo System Design", url: "https://blog.bytebytego.com/feed" },
  { name: "Refactoring (Luca Rossi)", url: "https://refactoring.fm/feed" },
  {
    name: "Tidy First? (Kent Beck)",
    url: "https://tidyfirst.substack.com/feed",
  },
  {
    name: "The Beautiful Mess (John Cutler)",
    url: "https://cutlefish.substack.com/feed",
  },
  { name: "Martin Fowler", url: "https://martinfowler.com/feed.atom" },
  { name: "Julia Evans (jvns)", url: "https://jvns.ca/atom.xml" },
  { name: "LangChain Blog", url: "https://blog.langchain.dev/rss/" },
  { name: "Towards Data Science", url: "https://towardsdatascience.com/feed" },
  // AI Agents & Research
  { name: "Google Research", url: "https://research.google/blog/rss" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  {
    name: "BAIR (Berkeley AI)",
    url: "https://bair.berkeley.edu/blog/feed.xml",
  },
  {
    name: "Lil'Log (Lilian Weng)",
    url: "https://lilianweng.github.io/index.xml",
  },
];

export class NewsService {
  private static instance: NewsService;
  private dbService: SqliteDatabaseService;
  private logger: Logger;
  private rssParser: Parser;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    this.logger = Logger.initialize("NewsService", {});
    this.rssParser = new Parser({
      timeout: 10000,
      headers: {
        "User-Agent": "CodeBuddy/1.0 (Engineering News Aggregator)",
      },
    });
  }

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private async ensureInitialized(): Promise<void> {
    await this.dbService.ensureInitialized();
  }

  public async fetchAndStoreNews(): Promise<void> {
    try {
      await this.ensureInitialized();
      this.logger.info("Fetching engineering news from top company blogs...");

      const newsItems: NewsItem[] = [];

      // Fetch from each engineering blog RSS feed
      const fetchPromises = ENGINEERING_BLOG_FEEDS.map(async (feed) => {
        try {
          const parsed = await this.rssParser.parseURL(feed.url);

          // Get the 2 most recent articles from each feed
          const recentItems = (parsed.items || []).slice(0, 2);

          return recentItems.map((item) => ({
            title: item.title || "Untitled",
            url: item.link || "",
            source: feed.name,
            published_at:
              item.pubDate || item.isoDate || new Date().toISOString(),
            summary:
              item.contentSnippet || item.content?.substring(0, 300) || "",
          }));
        } catch (err) {
          this.logger.warn(`Failed to fetch from ${feed.name}: ${err}`);
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);

      for (const result of results) {
        if (result.status === "fulfilled") {
          newsItems.push(...result.value);
        }
      }

      // Sort by published date and take top 10
      newsItems.sort((a, b) => {
        const dateA = new Date(a.published_at || 0).getTime();
        const dateB = new Date(b.published_at || 0).getTime();
        return dateB - dateA;
      });

      const topItems = newsItems.slice(0, 100);

      // Store in DB
      this.logger.info(
        `Storing ${topItems.length} news items from top engineering blogs...`,
      );
      for (const item of topItems) {
        // Check for duplicates based on URL
        const existing = this.dbService.executeSql(
          `SELECT id FROM news_items WHERE url = ?`,
          [item.url],
        );

        if (existing.length === 0) {
          this.dbService.executeSqlCommand(
            `INSERT INTO news_items (title, url, source, published_at, read_status, summary) 
                         VALUES (?, ?, ?, ?, 0, ?)`,
            [
              item.title,
              item.url,
              item.source,
              item.published_at,
              item.summary || "",
            ],
          );
        }
      }

      this.logger.info("Engineering news fetched and stored successfully.");
    } catch (error) {
      this.logger.error("Failed to fetch engineering news", error);
    }
  }

  public async getNews(): Promise<NewsItem[]> {
    await this.ensureInitialized();
    try {
      // Return unread OR saved news, ordered by date
      const results = this.dbService.executeSql(
        `SELECT * FROM news_items WHERE read_status = 0 OR saved = 1 ORDER BY published_at DESC LIMIT 100`,
      );
      this.logger.info(`getNews returned ${results.length} items`);

      // If no news, trigger a background fetch (if we haven't fetched recently?)
      // But don't block.
      if (results.length === 0) {
        this.logger.info("No news found in DB, triggering fetch...");
        // We don't await this, so it runs in background.
        // But we should probably return empty array now and let the UI refresh later.
        this.fetchAndStoreNews().catch((err) =>
          this.logger.error("Background fetch failed", err),
        );
      }

      return results as NewsItem[];
    } catch (error: any) {
      this.logger.error("Failed to get news", error);
      // Fallback: if 'saved' column is missing, try getting without it
      if (error.message?.includes("no such column: saved")) {
        try {
          const results = this.dbService.executeSql(
            `SELECT * FROM news_items WHERE read_status = 0 ORDER BY published_at DESC LIMIT 100`,
          );
          return results as NewsItem[];
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  }

  // Deprecated: use getNews()
  public async getUnreadNews(): Promise<NewsItem[]> {
    return this.getNews();
  }

  public async markAsRead(ids: number[]): Promise<void> {
    await this.ensureInitialized();
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    this.dbService.executeSqlCommand(
      `UPDATE news_items SET read_status = 1 WHERE id IN (${placeholders})`,
      ids,
    );
  }

  public async toggleSaved(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = this.dbService.executeSql(
      `SELECT saved FROM news_items WHERE id = ?`,
      [id],
    );

    if (result.length === 0) return false;

    const currentSaved = result[0].saved;
    const newSaved = currentSaved === 1 ? 0 : 1;

    this.dbService.executeSqlCommand(
      `UPDATE news_items SET saved = ? WHERE id = ?`,
      [newSaved, id],
    );

    return newSaved === 1;
  }

  public async deleteNewsItem(id: number): Promise<void> {
    await this.ensureInitialized();
    this.dbService.executeSqlCommand(`DELETE FROM news_items WHERE id = ?`, [
      id,
    ]);
  }

  public async deleteAllNews(): Promise<void> {
    await this.ensureInitialized();
    this.dbService.executeSqlCommand(`DELETE FROM news_items`);
    this.logger.info("All news items deleted");
  }

  public async cleanupOldNews(daysToKeep = 1): Promise<void> {
    await this.ensureInitialized();
    // Delete items that are NOT saved and older than X days
    this.dbService.executeSqlCommand(
      `DELETE FROM news_items WHERE saved = 0 AND fetched_at < datetime('now', '-${daysToKeep} days')`,
    );
    this.logger.info(`Cleaned up unsaved news older than ${daysToKeep} days`);
  }
}
