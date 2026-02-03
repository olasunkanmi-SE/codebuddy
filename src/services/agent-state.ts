import { AgentState } from "../agents/langgraph/interface";
import { COMMON } from "../application/constant";
import { GeminiLLMSnapShot } from "../llms/interface";
import { FileStorage, IStorage } from "./file-storage";
import {
  ChatHistoryWorker,
  ChatHistoryWorkerOperation,
} from "./chat-history-worker";

export class AgentService {
  private static instance: AgentService;
  private readonly storage: IStorage;
  private readonly chatHistoryWorker: ChatHistoryWorker;

  private constructor(storage: IStorage) {
    this.storage = storage;
    this.chatHistoryWorker = new ChatHistoryWorker();
  }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService(new FileStorage());
    }
    return AgentService.instance;
  }

  async getState(agentId: string): Promise<AgentState | undefined> {
    return this.storage.get<AgentState>(
      `${COMMON.AGENT_STATE_PREFIX}_${agentId}`,
    );
  }

  async saveState(agentId: string, state: AgentState): Promise<void> {
    return this.storage.set(`${COMMON.AGENT_STATE_PREFIX}_${agentId}`, state);
  }

  async getChatHistory(agentId: string): Promise<any[]> {
    try {
      // Use the chat history worker for async operations
      const requestId = `get-${agentId}-${Date.now()}`;
      const history = await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.GET_CHAT_HISTORY,
        { agentId },
        requestId,
      );
      return history || [];
    } catch (error: any) {
      console.warn(`Failed to get chat history for agent ${agentId}:`, error);
      // Fallback to file storage for backward compatibility
      return (
        (await this.storage.get<any[]>(
          `${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`,
        )) || []
      );
    }
  }

  // Save chat history using chat history worker
  async saveChatHistory(agentId: string, history: any[]): Promise<void> {
    try {
      // Use the chat history worker for async operations
      const requestId = `save-${agentId}-${Date.now()}`;
      await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.SAVE_CHAT_HISTORY,
        { agentId, history },
        requestId,
      );
    } catch (error: any) {
      console.warn(`Failed to save chat history for agent ${agentId}:`, error);
      // Fallback to file storage only for catastrophic database failures
      await this.storage.set(
        `${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`,
        history,
      );
    }
  }

  /**
   * Clear chat history for a specific agent
   */
  async clearChatHistory(agentId: string): Promise<void> {
    try {
      // Use the chat history worker for async operations
      const requestId = `clear-${agentId}-${Date.now()}`;
      await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.CLEAR_CHAT_HISTORY,
        { agentId },
        requestId,
      );
    } catch (error: any) {
      console.warn(`Failed to clear chat history for agent ${agentId}:`, error);
      // Fallback to file storage only for catastrophic database failures
      await this.storage.delete(`${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`);
    }
  }

  /**
   * Add a single message to chat history
   */
  async addChatMessage(
    agentId: string,
    message: {
      content: string;
      type: string;
      alias?: string;
      sessionId?: string;
      metadata?: any;
    },
  ): Promise<void> {
    try {
      // Use the chat history worker for async operations
      const requestId = `add-${agentId}-${Date.now()}`;
      await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.ADD_CHAT_MESSAGE,
        { agentId, message },
        requestId,
      );
    } catch (error: any) {
      console.warn(`Failed to add chat message for agent ${agentId}:`, error);
    }
  }

  /**
   * Save chat summary
   */
  async saveChatSummary(agentId: string, summary: string): Promise<void> {
    try {
      const requestId = `save-summary-${agentId}-${Date.now()}`;
      await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.SAVE_SUMMARY,
        { agentId, summary },
        requestId,
      );
    } catch (error: any) {
      console.warn(`Failed to save chat summary for agent ${agentId}:`, error);
    }
  }

  /**
   * Get chat summary
   */
  async getChatSummary(agentId: string): Promise<string | null> {
    try {
      const requestId = `get-summary-${agentId}-${Date.now()}`;
      const result = await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.GET_SUMMARY,
        { agentId },
        requestId,
      );
      return result.summary || null;
    } catch (error: any) {
      console.warn(`Failed to get chat summary for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get recent chat history for an agent (optimized for performance)
   */
  async getRecentChatHistory(agentId: string, limit = 50): Promise<any[]> {
    try {
      // Use the chat history worker for async operations
      const requestId = `recent-${agentId}-${Date.now()}`;
      const history = await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.GET_RECENT_HISTORY,
        { agentId, config: { limit } },
        requestId,
      );
      return history || [];
    } catch (error: any) {
      console.warn(
        `Failed to get recent chat history for agent ${agentId}:`,
        error,
      );
      // Fallback to regular getChatHistory
      const fullHistory = await this.getChatHistory(agentId);
      return fullHistory.slice(-limit);
    }
  }

  /**
   * Cleanup old chat history across all agents
   */
  async cleanupOldChatHistory(daysToKeep = 30): Promise<void> {
    try {
      // Use the chat history worker for async operations
      const requestId = `cleanup-${Date.now()}`;
      await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.CLEANUP_OLD_HISTORY,
        { agentId: "", config: { daysToKeep } },
        requestId,
      );
    } catch (error: any) {
      console.warn("Failed to cleanup old chat history:", error);
    }
  }

  async getSnapshot(agentId: string): Promise<GeminiLLMSnapShot | undefined> {
    return this.storage.get<GeminiLLMSnapShot>(
      `${COMMON.SNAPSHOT_PREFIX}_${agentId}`,
    );
  }

  async saveSnapshot(
    agentId: string,
    snapshot: GeminiLLMSnapShot,
  ): Promise<void> {
    return this.storage.set(`${COMMON.SNAPSHOT_PREFIX}_${agentId}`, snapshot);
  }

  async clearAgentData(agentId: string): Promise<void> {
    try {
      const requestId = `clear-agent-${agentId}-${Date.now()}`;
      await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.CLEAR_CHAT_HISTORY,
        { agentId },
        requestId,
      );
    } catch (error: any) {
      console.warn(
        `Failed to clear chat history from SQLite for agent ${agentId}:`,
        error,
      );
    }

    await this.storage.delete(`${COMMON.AGENT_STATE_PREFIX}_${agentId}`);
    await this.storage.delete(`${COMMON.SNAPSHOT_PREFIX}_${agentId}`);

    // Only clear chat history from file storage if SQLite failed
    try {
      const hasHistoryInDb = await this.chatHistoryWorker.processRequest(
        ChatHistoryWorkerOperation.GET_CHAT_HISTORY,
        { agentId },
        `check-${agentId}-${Date.now()}`,
      );
      if (!hasHistoryInDb || hasHistoryInDb.length === 0) {
        await this.storage.delete(`${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`);
      }
    } catch {
      // If we can't check SQLite, clear file storage as fallback
      await this.storage.delete(`${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`);
    }
  }
}
