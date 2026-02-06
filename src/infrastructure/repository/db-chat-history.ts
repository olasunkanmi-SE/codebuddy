import { SqliteDatabaseService } from "../../services/sqlite-database.service";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { generateUUID } from "../../utils/utils";

export interface ChatSession {
  sessionId: string;
  title: string;
  startTime: string;
  endTime: string;
  messageCount: number;
  isActive: boolean;
}

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
   * Get all chat sessions for a specific agent
   */
  public async getSessions(agentId: string): Promise<ChatSession[]> {
    try {
      await this.dbService.ensureInitialized();

      // First, get session metadata from the sessions table
      const sessionsQuery = `
        SELECT 
          s.session_id,
          s.title,
          s.is_active,
          s.created_at,
          COALESCE(h.start_time, s.created_at) as start_time,
          COALESCE(h.end_time, s.created_at) as end_time,
          COALESCE(h.message_count, 0) as message_count
        FROM chat_sessions s
        LEFT JOIN (
          SELECT 
            session_id,
            MIN(timestamp) as start_time,
            MAX(timestamp) as end_time,
            COUNT(*) as message_count
          FROM chat_history 
          WHERE agent_id = ? AND session_id IS NOT NULL
          GROUP BY session_id
        ) h ON s.session_id = h.session_id
        WHERE s.agent_id = ?
        ORDER BY s.created_at DESC
      `;

      const results = this.dbService.executeSqlAll(sessionsQuery, [
        agentId,
        agentId,
      ]);

      return results.map((row: any) => ({
        sessionId: row.session_id,
        title: row.title || "New Chat",
        startTime: row.start_time,
        endTime: row.end_time,
        messageCount: row.message_count || 0,
        isActive: row.is_active === 1,
      }));
    } catch (error: any) {
      this.logger.warn(`Failed to get sessions for agent ${agentId}:`, error);
      // Fallback to legacy query for backwards compatibility
      return this.getSessionsLegacy(agentId);
    }
  }

  /**
   * Legacy method to get sessions from chat_history table only
   */
  private async getSessionsLegacy(agentId: string): Promise<ChatSession[]> {
    try {
      const query = `
        SELECT 
          session_id,
          MIN(timestamp) as start_time,
          MAX(timestamp) as end_time,
          COUNT(*) as message_count
        FROM chat_history 
        WHERE agent_id = ? AND session_id IS NOT NULL
        GROUP BY session_id
        ORDER BY start_time DESC
      `;

      const results = this.dbService.executeSqlAll(query, [agentId]);

      return results.map((row: any) => ({
        sessionId: row.session_id,
        title: "Chat Session",
        startTime: row.start_time,
        endTime: row.end_time,
        messageCount: row.message_count,
        isActive: false,
      }));
    } catch (error: any) {
      return [];
    }
  }

  /**
   * Create a new chat session
   */
  public async createSession(agentId: string, title?: string): Promise<string> {
    try {
      await this.dbService.ensureInitialized();

      // Deactivate all existing sessions for this agent
      this.dbService.executeSqlCommand(
        "UPDATE chat_sessions SET is_active = 0 WHERE agent_id = ?",
        [agentId],
      );

      const sessionId = generateUUID();
      const now = new Date().toISOString();

      const insertStmt = `
        INSERT INTO chat_sessions (session_id, agent_id, title, is_active, created_at)
        VALUES (?, ?, ?, 1, ?)
      `;

      this.dbService.executeSqlCommand(insertStmt, [
        sessionId,
        agentId,
        title || "New Chat",
        now,
      ]);

      this.logger.info(`Created new session ${sessionId} for agent ${agentId}`);
      return sessionId;
    } catch (error: any) {
      this.logger.warn(`Failed to create session for agent ${agentId}:`, error);
      // Return a generated UUID even if DB fails
      return generateUUID();
    }
  }

  /**
   * Get the current active session for an agent
   */
  public async getCurrentSession(agentId: string): Promise<string | null> {
    try {
      await this.dbService.ensureInitialized();
      const results = this.dbService.executeSqlAll(
        "SELECT session_id FROM chat_sessions WHERE agent_id = ? AND is_active = 1 LIMIT 1",
        [agentId],
      );

      if (results.length > 0) {
        return results[0].session_id;
      }
      return null;
    } catch (error: any) {
      this.logger.warn(
        `Failed to get current session for agent ${agentId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Switch to a different session (makes it active)
   */
  public async switchSession(
    agentId: string,
    sessionId: string,
  ): Promise<boolean> {
    try {
      await this.dbService.ensureInitialized();

      // Deactivate all sessions
      this.dbService.executeSqlCommand(
        "UPDATE chat_sessions SET is_active = 0 WHERE agent_id = ?",
        [agentId],
      );

      // Activate the specified session
      this.dbService.executeSqlCommand(
        "UPDATE chat_sessions SET is_active = 1 WHERE agent_id = ? AND session_id = ?",
        [agentId, sessionId],
      );

      this.logger.info(`Switched to session ${sessionId} for agent ${agentId}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`Failed to switch session for agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Update session title
   */
  public async updateSessionTitle(
    agentId: string,
    sessionId: string,
    title: string,
  ): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      this.dbService.executeSqlCommand(
        "UPDATE chat_sessions SET title = ? WHERE agent_id = ? AND session_id = ?",
        [title, agentId, sessionId],
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to update session title for ${sessionId}:`,
        error,
      );
    }
  }

  /**
   * Delete a session and its messages
   */
  public async deleteSession(
    agentId: string,
    sessionId: string,
  ): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      this.logger.info(`Deleting session ${sessionId} for agent ${agentId}`);

      // Delete messages for this session
      const msgResult = this.dbService.executeSqlCommand(
        "DELETE FROM chat_history WHERE agent_id = ? AND session_id = ?",
        [agentId, sessionId],
      );
      this.logger.info(`Deleted messages result: ${JSON.stringify(msgResult)}`);

      // Delete the session record
      const sessionResult = this.dbService.executeSqlCommand(
        "DELETE FROM chat_sessions WHERE agent_id = ? AND session_id = ?",
        [agentId, sessionId],
      );
      this.logger.info(
        `Deleted session result: ${JSON.stringify(sessionResult)}`,
      );

      this.logger.info(
        `Successfully deleted session ${sessionId} for agent ${agentId}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get chat history for a specific session
   */
  public async getSessionHistory(
    agentId: string,
    sessionId: string,
  ): Promise<any[]> {
    try {
      await this.dbService.ensureInitialized();
      const results = this.dbService.executeSqlAll(
        "SELECT * FROM chat_history WHERE agent_id = ? AND session_id = ? ORDER BY timestamp ASC",
        [agentId, sessionId],
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
        `Failed to get session history for agent ${agentId} session ${sessionId}:`,
        error,
      );
      return [];
    }
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
        INSERT INTO chat_history (agent_id, message_content, message_type, session_id, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (const message of history) {
        const timestamp = message.timestamp
          ? typeof message.timestamp === "number"
            ? new Date(message.timestamp).toISOString()
            : message.timestamp
          : new Date().toISOString();

        this.dbService.executeSqlCommand(insertStmt, [
          agentId,
          message.content || "",
          message.type || "message",
          message.sessionId || null,
          timestamp,
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
      timestamp?: number | string;
      metadata?: any;
    },
  ): Promise<void> {
    try {
      await this.dbService.ensureInitialized();
      const insertStmt = `
        INSERT INTO chat_history (agent_id, message_content, message_type, session_id, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const timestamp = message.timestamp
        ? typeof message.timestamp === "number"
          ? new Date(message.timestamp).toISOString()
          : message.timestamp
        : new Date().toISOString();

      this.dbService.executeSqlCommand(insertStmt, [
        agentId,
        message.content,
        message.type,
        message.sessionId || null,
        timestamp,
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
