/**
 * @fileoverview Chat History Worker
 *
 * This module provides a web worker implementation for performing
 * chat history operations without blocking the main VS Code thread.
 * It handles saving, retrieving, and managing chat history data
 * using SQLite for persistence.
 *
 * The worker provides asynchronous processing for chat history operations,
 * ensuring the VS Code interface remains responsive during intensive
 * database operations.
 *
 * @author CodeBuddy Team
 * @version 1.0.0
 * @since 2025-01-25
 */

import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { ChatHistoryRepository } from "../infrastructure/repository/db-chat-history";

/**
 * Enum for chat history worker operations (type-safe)
 */
export enum ChatHistoryWorkerOperation {
  GET_CHAT_HISTORY = "GET_CHAT_HISTORY",
  SAVE_CHAT_HISTORY = "SAVE_CHAT_HISTORY",
  CLEAR_CHAT_HISTORY = "CLEAR_CHAT_HISTORY",
  ADD_CHAT_MESSAGE = "ADD_CHAT_MESSAGE",
  GET_RECENT_HISTORY = "GET_RECENT_HISTORY",
  CLEANUP_OLD_HISTORY = "CLEANUP_OLD_HISTORY",
}

/**
 * Message types for communication between main thread and chat history worker
 */
export interface ChatHistoryWorkerMessage {
  /** Message type identifier */
  type: ChatHistoryWorkerOperation | "OPERATION_COMPLETE" | "OPERATION_ERROR";
  /** Request identifier for matching responses */
  requestId: string;
  /** Message payload data */
  payload?: any;
  /** Error message if applicable */
  error?: string;
}

/**
 * Data structure for chat history operations
 */
export interface ChatHistoryWorkerData {
  /** Agent ID for the chat history */
  agentId: string;
  /** Chat history messages (for save operations) */
  history?: any[];
  /** Single message (for add operations) */
  message?: {
    content: string;
    type: string;
    alias?: string;
    sessionId?: string;
    metadata?: any;
  };
  /** Configuration parameters */
  config?: {
    /** Number of recent messages to retrieve */
    limit?: number;
    /** Days to keep for cleanup operations */
    daysToKeep?: number;
  };
}

/**
 * Chat History Worker Class
 *
 * Simulates a web worker for chat history operations to avoid blocking
 * the main VS Code thread during database operations.
 */
export class ChatHistoryWorker {
  private readonly chatHistoryRepo: ChatHistoryRepository;
  private isProcessing: boolean = false;
  private currentRequestId: string | null = null;
  private readonly logger: Logger;

  constructor() {
    this.chatHistoryRepo = ChatHistoryRepository.getInstance();
    this.logger = Logger.initialize(ChatHistoryWorker.name, {
      minLevel: LogLevel.DEBUG,
    });
  }

  /**
   * Process chat history operation request
   */
  async processRequest(
    operation: ChatHistoryWorkerOperation,
    data: ChatHistoryWorkerData,
    requestId: string,
  ): Promise<any> {
    if (this.isProcessing) {
      throw new Error("Worker is busy processing another request");
    }

    this.isProcessing = true;
    this.currentRequestId = requestId;

    try {
      let result: any;

      switch (operation) {
        case ChatHistoryWorkerOperation.GET_CHAT_HISTORY:
          result = await this.getChatHistory(data.agentId);
          break;

        case ChatHistoryWorkerOperation.SAVE_CHAT_HISTORY:
          if (!data.history) {
            throw new Error("History data is required for save operation");
          }
          await this.saveChatHistory(data.agentId, data.history);
          result = { success: true };
          break;

        case ChatHistoryWorkerOperation.CLEAR_CHAT_HISTORY:
          await this.clearChatHistory(data.agentId);
          result = { success: true };
          break;

        case ChatHistoryWorkerOperation.ADD_CHAT_MESSAGE:
          if (!data.message) {
            throw new Error("Message data is required for add operation");
          }
          await this.addChatMessage(data.agentId, data.message);
          result = { success: true };
          break;

        case ChatHistoryWorkerOperation.GET_RECENT_HISTORY: {
          const limit = data.config?.limit || 50;
          result = await this.getRecentHistory(data.agentId, limit);
          break;
        }

        case ChatHistoryWorkerOperation.CLEANUP_OLD_HISTORY: {
          const daysToKeep = data.config?.daysToKeep || 30;
          await this.cleanupOldHistory(daysToKeep);
          result = { success: true };
          break;
        }

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return result;
    } finally {
      this.isProcessing = false;
      this.currentRequestId = null;
    }
  }

  /**
   * Get chat history for an agent
   */
  private async getChatHistory(agentId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const history = this.chatHistoryRepo.get(agentId);
          resolve(history || []);
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get chat history: ${errorMessage}`);
          reject(new Error(`Failed to get chat history: ${errorMessage}`));
        }
      }, 0);
    });
  }

  /**
   * Save chat history for an agent
   */
  private async saveChatHistory(
    agentId: string,
    history: any[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Convert to the format expected by ChatHistoryRepository
          const formattedHistory = history.map((message, index) => ({
            content: message.content || message.text || "",
            type: message.type || "message",
            sessionId: message.sessionId || null,
            metadata: {
              alias: message.alias,
              timestamp: message.timestamp || Date.now(),
              tokenCount: message.tokenCount,
              index: index,
            },
          }));

          this.chatHistoryRepo.set(agentId, formattedHistory);
          resolve();
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to save chat history: ${errorMessage}`);
          reject(new Error(`Failed to save chat history: ${errorMessage}`));
        }
      }, 0);
    });
  }

  /**
   * Clear chat history for an agent
   */
  private async clearChatHistory(agentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          this.chatHistoryRepo.clear(agentId);
          resolve();
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to clear chat history: ${errorMessage}`);
          reject(new Error(`Failed to clear chat history: ${errorMessage}`));
        }
      }, 0);
    });
  }

  /**
   * Add a single message to chat history
   */
  private async addChatMessage(
    agentId: string,
    message: {
      content: string;
      type: string;
      alias?: string;
      sessionId?: string;
      metadata?: any;
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          this.chatHistoryRepo.addMessage(agentId, {
            content: message.content,
            type: message.type,
            sessionId: message.sessionId,
            metadata: {
              alias: message.alias,
              timestamp: Date.now(),
              ...message.metadata,
            },
          });
          resolve();
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to add chat message: ${errorMessage}`);
          reject(new Error(`Failed to add chat message: ${errorMessage}`));
        }
      }, 0);
    });
  }

  /**
   * Get recent chat history for an agent
   */
  private async getRecentHistory(
    agentId: string,
    limit: number,
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const history = this.chatHistoryRepo.getRecent(agentId, limit);
          resolve(history || []);
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to get recent chat history: ${errorMessage}`,
          );
          reject(
            new Error(`Failed to get recent chat history: ${errorMessage}`),
          );
        }
      }, 0);
    });
  }

  /**
   * Clean up old chat history
   */
  private async cleanupOldHistory(daysToKeep: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          this.chatHistoryRepo.cleanup(daysToKeep);
          resolve();
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to cleanup old chat history: ${errorMessage}`,
          );
          reject(
            new Error(`Failed to cleanup old chat history: ${errorMessage}`),
          );
        }
      }, 0);
    });
  }

  /**
   * Check if worker is currently processing a request
   */
  isWorkerBusy(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current request ID being processed
   */
  getCurrentRequestId(): string | null {
    return this.currentRequestId;
  }

  /**
   * Cancel current operation (if possible)
   */
  cancel(): void {
    if (this.isProcessing) {
      console.warn(
        `Cancelling chat history operation: ${this.currentRequestId}`,
      );
      this.isProcessing = false;
      this.currentRequestId = null;
    }
  }
}
