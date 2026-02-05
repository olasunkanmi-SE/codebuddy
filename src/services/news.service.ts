import axios from "axios";
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
}

export class NewsService {
  private static instance: NewsService;
  private dbService: SqliteDatabaseService;
  private logger: Logger;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    this.logger = Logger.initialize("NewsService", {});
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
      this.logger.info("Fetching news from Hacker News...");

      // Get top stories IDs
      const { data: topStories } = await axios.get<number[]>(
        "https://hacker-news.firebaseio.com/v0/topstories.json",
      );

      // Get details for top 5 stories
      const top5 = topStories.slice(0, 5);
      const newsItems: NewsItem[] = [];

      for (const id of top5) {
        const { data: story } = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        );
        if (story && story.url) {
          newsItems.push({
            title: story.title,
            url: story.url,
            source: "Hacker News",
            published_at: new Date(story.time * 1000).toISOString(),
          });
        }
      }

      // Store in DB
      this.logger.info(`Storing ${newsItems.length} news items...`);
      for (const item of newsItems) {
        // Check for duplicates based on URL
        const existing = this.dbService.executeSql(
          `SELECT id FROM news_items WHERE url = ?`,
          [item.url],
        );

        if (existing.length === 0) {
          this.dbService.executeSqlCommand(
            `INSERT INTO news_items (title, url, source, published_at, read_status) 
                         VALUES (?, ?, ?, ?, 0)`,
            [item.title, item.url, item.source, item.published_at],
          );
        }
      }

      this.logger.info("News fetched and stored successfully.");
    } catch (error) {
      this.logger.error("Failed to fetch news", error);
    }
  }

  public async getUnreadNews(): Promise<NewsItem[]> {
    await this.ensureInitialized();
    const results = this.dbService.executeSql(
      `SELECT * FROM news_items WHERE read_status = 0 ORDER BY fetched_at DESC LIMIT 10`,
    );
    return results as NewsItem[];
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

  public async cleanupOldNews(retentionDays: number): Promise<void> {
    await this.ensureInitialized();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();

    this.logger.info(
      `Cleaning up news older than ${retentionDays} days (before ${cutoffISO})...`,
    );

    const result = this.dbService.executeSqlCommand(
      `DELETE FROM news_items WHERE fetched_at < ?`,
      [cutoffISO],
    );

    this.logger.info(`Deleted ${result.changes} old news items.`);
  }
}
