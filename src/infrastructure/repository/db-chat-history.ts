/**
 * Simple in-memory chat history repository
 * This replaces the database-dependent implementation for better maintainability
 */
export class ChatHistoryRepository {
  private static instance: ChatHistoryRepository;
  private readonly historyCache: Map<string, any[]> = new Map();

  private constructor() {
    // No database setup needed for in-memory implementation
  }

  public static getInstance(): ChatHistoryRepository {
    if (!ChatHistoryRepository.instance) {
      ChatHistoryRepository.instance = new ChatHistoryRepository();
    }
    return ChatHistoryRepository.instance;
  }

  public get(agentId: string): any[] {
    return this.historyCache.get(agentId) || [];
  }

  public set(agentId: string, history: any[]): void {
    this.historyCache.set(agentId, [...history]); // Create a copy to avoid mutations
  }

  public clear(agentId: string): void {
    this.historyCache.delete(agentId);
  }

  /**
   * Clear all chat history (useful for cleanup)
   */
  public clearAll(): void {
    this.historyCache.clear();
  }
}
