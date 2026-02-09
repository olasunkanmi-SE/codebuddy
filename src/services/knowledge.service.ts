import { SqliteDatabaseService } from "./sqlite-database.service";
import { Logger } from "../infrastructure/logger/logger";
import { NewsItem } from "../interfaces/news.interface";
import { KNOWLEDGE_SCORING } from "../application/constant";
import { z } from "zod";

const TopicsSchema = z.array(z.string().min(2)).or(
  z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (t): t is string => typeof t === "string" && t.length > 1,
        );
      }
      return [str].filter((t) => t.length > 1);
    } catch {
      return str
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 1);
    }
  }),
);

export interface KnowledgeTopic {
  id?: number;
  topic: string;
  proficiency_score: number;
  last_interaction_at: string;
  article_count: number;
}

export interface ReadingHistoryItem {
  id?: number;
  news_item_id: number;
  read_at: string;
  interaction_type: "read" | "discuss";
  title?: string;
  url?: string;
}

export class KnowledgeService {
  private static instance: KnowledgeService;
  private dbService: SqliteDatabaseService;
  private logger: Logger;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    this.logger = Logger.initialize("KnowledgeService", {});
  }

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  /**
   * Record a reading or discussion interaction
   */
  public async recordInteraction(
    newsItem: NewsItem,
    type: "read" | "discuss",
  ): Promise<boolean> {
    try {
      this.logger.info(`Recording ${type} interaction for item ${newsItem.id}`);

      // 1. Log to reading history
      if (newsItem.id) {
        this.dbService.executeSqlCommand(
          `INSERT INTO reading_history (news_item_id, interaction_type, read_at) VALUES (?, ?, ?)`,
          [newsItem.id, type, new Date().toISOString()],
        );
      }

      // 2. Update Knowledge Graph
      if (newsItem.topics) {
        let topics: string[] = [];
        const result = TopicsSchema.safeParse(newsItem.topics);
        if (result.success) {
          topics = result.data as string[];
        } else {
          this.logger.warn(
            `Failed to parse topics for item ${newsItem.id}`,
            result.error,
          );
        }

        const weight =
          type === "discuss"
            ? KNOWLEDGE_SCORING.DISCUSS_WEIGHT
            : KNOWLEDGE_SCORING.READ_WEIGHT; // Discussion is worth 5x reading

        for (const topic of topics) {
          await this.updateTopicKnowledge(topic, weight);
        }
      }
      return true;
    } catch (error) {
      this.logger.error("Failed to record interaction", error);
      return false;
    }
  }

  /**
   * Update the score/count for a specific topic
   */
  private async updateTopicKnowledge(
    topic: string,
    weight: number,
  ): Promise<void> {
    // Normalize topic to lowercase to ensure consistency (e.g. "React" == "react")
    const cleanTopic = topic.trim().toLowerCase();
    if (!cleanTopic) return;

    // Use UPSERT pattern (ON CONFLICT DO UPDATE) for atomicity and race condition prevention
    this.dbService.executeSqlCommand(
      `INSERT INTO user_knowledge (topic, proficiency_score, article_count, last_interaction_at) 
       VALUES (?, ?, 1, ?) 
       ON CONFLICT(topic) DO UPDATE SET 
         proficiency_score = MIN(100, proficiency_score + ?),
         article_count = article_count + 1,
         last_interaction_at = ?`,
      [
        cleanTopic,
        weight,
        new Date().toISOString(),
        weight,
        new Date().toISOString(),
      ],
    );
  }

  /**
   * Record the result of a knowledge quiz
   */
  public async recordQuizResult(
    topic: string,
    isCorrect: boolean,
  ): Promise<boolean> {
    try {
      this.logger.info(
        `Recording quiz result for topic ${topic}: ${isCorrect ? "Correct" : "Incorrect"}`,
      );

      const weight = isCorrect
        ? KNOWLEDGE_SCORING.QUIZ_CORRECT_WEIGHT
        : KNOWLEDGE_SCORING.QUIZ_INCORRECT_WEIGHT; // +10 for correct, +1 for effort
      await this.updateTopicKnowledge(topic, weight);
      return true;
    } catch (error) {
      this.logger.error("Failed to record quiz result", error);
      return false;
    }
  }

  public async getTopTopics(limit: number = 10): Promise<KnowledgeTopic[]> {
    return this.dbService.executeSql(
      `SELECT * FROM user_knowledge ORDER BY proficiency_score DESC LIMIT ?`,
      [limit],
    ) as KnowledgeTopic[];
  }

  public async getRecentHistory(
    limit: number = 20,
  ): Promise<ReadingHistoryItem[]> {
    return this.dbService.executeSql(
      `SELECT rh.*, ni.title, ni.url 
         FROM reading_history rh 
         JOIN news_items ni ON rh.news_item_id = ni.id 
         ORDER BY rh.read_at DESC LIMIT ?`,
      [limit],
    ) as ReadingHistoryItem[];
  }

  public async getTopicDetails(topics: string[]): Promise<KnowledgeTopic[]> {
    if (topics.length === 0) return [];
    const placeholders = topics.map(() => "?").join(",");
    return this.dbService.executeSql(
      `SELECT * FROM user_knowledge WHERE topic IN (${placeholders})`,
      topics,
    ) as KnowledgeTopic[];
  }
}
