import { SqliteDatabaseService } from "../../services/sqlite-database.service";

/**
 * Persistent chat history repository using SQLite
 * Provides persistent storage for chat conversations across VS Code sessions
 */
export class ChatHistoryRepository {
  private static instance: ChatHistoryRepository;
  private readonly dbService: SqliteDatabaseService;

  private constructor() {
    this.dbService = SqliteDatabaseService.getInstance();
    // this.initializeSchema();
  }

  public static getInstance(): ChatHistoryRepository {
    return (ChatHistoryRepository.instance ??= new ChatHistoryRepository());
  }

  /**
   * Get chat history for a specific agent
   */
  public get(agentId: string): any[] {
    try {
      const results = this.dbService.executeSql(
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
      console.warn(`Failed to get chat history for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Set/replace chat history for a specific agent
   */
  public set(agentId: string, history: any[]): void {
    try {
      // Insert new history
      const insertStmt = `
        INSERT INTO chat_history (agent_id, message_content, message_type, session_id, metadata)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const message of history) {
        this.dbService.executeSql(insertStmt, [
          agentId,
          message.content || "",
          message.type || "message",
          message.sessionId || null,
          message.metadata ? JSON.stringify(message.metadata) : null,
        ]);
      }
    } catch (error: any) {
      console.warn(`Failed to set chat history for agent ${agentId}:`, error);
    }
  }

  /**
   * Add a single message to chat history
   */
  public addMessage(
    agentId: string,
    message: {
      content: string;
      type: string;
      sessionId?: string;
      metadata?: any;
    },
  ): void {
    try {
      const insertStmt = `
        INSERT INTO chat_history (agent_id, message_content, message_type, session_id, metadata)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.dbService.executeSql(insertStmt, [
        agentId,
        message.content,
        message.type,
        message.sessionId || null,
        message.metadata ? JSON.stringify(message.metadata) : null,
      ]);
    } catch (error: any) {
      console.warn(`Failed to add message for agent ${agentId}:`, error);
    }
  }

  /**
   * Clear chat history for a specific agent
   */
  public clear(agentId: string): void {
    try {
      this.dbService.executeSql("DELETE FROM chat_history WHERE agent_id = ?", [
        agentId,
      ]);
    } catch (error: any) {
      console.warn(`Failed to clear chat history for agent ${agentId}:`, error);
    }
  }

  /**
   * Clear all chat history
   */
  public clearAll(): void {
    try {
      this.dbService.executeSql("DELETE FROM chat_history");
    } catch (error: any) {
      console.warn("Failed to clear all chat history:", error);
    }
  }

  /**
   * Get recent chat history with limit
   */
  public getRecent(agentId: string, limit = 50): any[] {
    try {
      const results = this.dbService.executeSql(
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
      console.warn(
        `Failed to get recent chat history for agent ${agentId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Delete old chat history to manage storage size
   */
  public cleanup(daysToKeep = 30): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.dbService.executeSql(
        "DELETE FROM chat_history WHERE timestamp < ?",
        [cutoffDate.toISOString()],
      );
    } catch (error: any) {
      console.warn("Failed to cleanup old chat history:", error);
    }
  }
}
