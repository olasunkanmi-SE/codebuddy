import { SqliteDatabaseService } from "../../services/sqlite-database.service";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";

/**
 * Persistent chat history repository using SQLite
 * Provides persistent storage for chat conversations across VS Code sessions
 */
export class ChatHistoryRepository {
  private static instance: ChatHistoryRepository;
  private readonly dbService: SqliteDatabaseService;
  private readonly logger: Logger;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    this.logger = Logger.initialize("ChatHistoryRepository", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    // this.initializeSchema();
  }

  public static getInstance(): ChatHistoryRepository {
    return (ChatHistoryRepository.instance ??= new ChatHistoryRepository());
  }

  /**
   * Get chat history for a specific agent
   */
  public async get(agentId: string): Promise<any[]> {
    try {
      await this.dbService.ensureInitialized();
      const results = this.dbService.executeSqlAll(
        "SELECT * FROM chat_history WHERE agent_id = ? ORDER BY timestamp ASC",
        [agentId],
      );

      return results.map((row: any) => ({
        id: row.id,
        content: row.message_content,
        type: row.message_type,
        timestamp: row.timestamp,
        sessionId: row.session_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error: any) {
      this.logger.warn(
        `Failed to get chat history for agent ${agentId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Set/replace chat history for a specific agent
   */
  public async set(agentId: string, history: any[]): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      // Clear existing history first to avoid duplication
      await this.clear(agentId);

      // Insert new history
      const insertStmt = `
        INSERT INTO chat_history (agent_id, message_content, message_type, session_id, metadata)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const message of history) {
        this.dbService.executeSqlCommand(insertStmt, [
          agentId,
          message.content || "",
          message.type || "message",
          message.sessionId || null,
          message.metadata ? JSON.stringify(message.metadata) : null,
        ]);
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to set chat history for agent ${agentId}:`,
        error,
      );
    }
  }

  /**
   * Add a single message to chat history
   */
  public async addMessage(
    agentId: string,
    message: {
      content: string;
      type: string;
      sessionId?: string;
      metadata?: any;
    },
  ): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      const insertStmt = `
        INSERT INTO chat_history (agent_id, message_content, message_type, session_id, metadata)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.dbService.executeSqlCommand(insertStmt, [
        agentId,
        message.content,
        message.type,
        message.sessionId || null,
        message.metadata ? JSON.stringify(message.metadata) : null,
      ]);
    } catch (error: any) {
      this.logger.warn(`Failed to add message for agent ${agentId}:`, error);
    }
  }

  /**
   * Save chat summary for a specific agent
   */
  public async saveSummary(agentId: string, summary: string): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      const insertStmt = `
        INSERT INTO chat_summaries (agent_id, summary)
        VALUES (?, ?)
      `;
      this.dbService.executeSqlCommand(insertStmt, [agentId, summary]);
    } catch (error: any) {
      this.logger.warn(`Failed to save summary for agent ${agentId}:`, error);
    }
  }

  /**
   * Get the latest chat summary for a specific agent
   */
  public async getSummary(agentId: string): Promise<string | null> {
    try {
      await this.dbService.ensureInitialized();
      const results = this.dbService.executeSqlAll(
        "SELECT summary FROM chat_summaries WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 1",
        [agentId],
      );

      if (results.length > 0) {
        return results[0].summary;
      }
      return null;
    } catch (error: any) {
      this.logger.warn(`Failed to get summary for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Clear chat history for a specific agent
   */
  public async clear(agentId: string): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      this.dbService.executeSqlCommand(
        "DELETE FROM chat_history WHERE agent_id = ?",
        [agentId],
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to clear chat history for agent ${agentId}:`,
        error,
      );
    }
  }

  /**
   * Clear all chat history
   */
  public async clearAll(): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      this.dbService.executeSqlCommand("DELETE FROM chat_history");
    } catch (error: any) {
      this.logger.warn("Failed to clear all chat history:", error);
    }
  }

  /**
   * Get recent chat history with limit
   */
  public async getRecent(agentId: string, limit = 50): Promise<any[]> {
    try {
      await this.dbService.ensureInitialized();
      const results = this.dbService.executeSqlAll(
        "SELECT * FROM chat_history WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?",
        [agentId, limit],
      );

      const reversedResults = [...results].reverse();
      return reversedResults.map((row: any) => ({
        id: row.id,
        content: row.message_content,
        type: row.message_type,
        timestamp: row.timestamp,
        sessionId: row.session_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error: any) {
      this.logger.warn(
        `Failed to get recent chat history for agent ${agentId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Delete old chat history to manage storage size
   */
  public async cleanup(daysToKeep = 30): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.dbService.executeSqlCommand(
        "DELETE FROM chat_history WHERE timestamp < ?",
        [cutoffDate.toISOString()],
      );
    } catch (error: any) {
      this.logger.warn("Failed to cleanup old chat history:", error);
    }
  }
}
