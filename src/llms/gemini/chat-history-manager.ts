import { Content } from "@google/generative-ai";
import { IMemoryManager } from "./interfaces";

/**
 * Manages chat history with proper separation of concerns
 */
export class GeminiChatHistoryManager {
  private readonly maxHistoryLength = 50;

  constructor(private readonly memory: IMemoryManager) {}

  /**
   * Builds chat history for a given session
   */
  async buildChatHistory(
    userQuery: string,
    historyKey: string,
    isInitialQuery: boolean = false,
  ): Promise<Content[]> {
    let chatHistory: Content[] = this.memory.get<Content[]>(historyKey) || [];

    if (!isInitialQuery && chatHistory.length === 0) {
      console.warn("No chat history available for non-initial query");
    }

    const userMessage: Content = { role: "user", parts: [{ text: userQuery }] };

    chatHistory.push(userMessage);

    // Limit history length for memory management
    if (chatHistory.length > this.maxHistoryLength) {
      chatHistory = chatHistory.slice(-this.maxHistoryLength);
    }

    this.memory.set(historyKey, chatHistory);
    return chatHistory;
  }

  /**
   * Adds a model response to chat history
   */
  addModelResponse(
    historyKey: string,
    functionCall: any,
    functionResponse: any,
  ): void {
    const chatHistory = this.memory.get<Content[]>(historyKey) || [];

    if (functionCall) {
      chatHistory.push({ role: "model", parts: [{ functionCall }] });
    }

    if (functionResponse) {
      chatHistory.push({
        role: "user",
        parts: [{ text: `Tool result: ${JSON.stringify(functionResponse)}` }],
      });
    }

    // Limit history length
    if (chatHistory.length > this.maxHistoryLength) {
      chatHistory.splice(0, chatHistory.length - this.maxHistoryLength);
    }

    this.memory.set(historyKey, chatHistory);
  }

  /**
   * Clears chat history for a given session
   */
  clearHistory(historyKey: string): void {
    this.memory.delete(historyKey);
  }

  /**
   * Gets current chat history
   */
  getHistory(historyKey: string): Content[] {
    return this.memory.get<Content[]>(historyKey) || [];
  }

  /**
   * Gets history length
   */
  getHistoryLength(historyKey: string): number {
    return this.getHistory(historyKey).length;
  }

  /**
   * Prunes old history entries
   */
  pruneHistory(
    historyKey: string,
    maxEntries: number = this.maxHistoryLength,
  ): void {
    const history = this.getHistory(historyKey);
    if (history.length > maxEntries) {
      const prunedHistory = history.slice(-maxEntries);
      this.memory.set(historyKey, prunedHistory);
    }
  }
}
