import { Memory } from "../memory/base";
import {
  FormattedMessage,
  LLM_CONFIGS,
  CHAT_HISTORY_CONFIG,
} from "./../application/constant";
import { AgentService } from "./agent-state";
import { getConfigValue } from "../utils/utils";

interface ChatMessage {
  type: "bot" | "user";
  content: string;
}

export interface ILLMConfig {
  botRole: string;
  userRole: string;
  formatMessage: (role: string, content: string) => any;
}

interface IChatHistory {
  type: string;
  content: string;
  alias: string;
  timestamp?: number;
  tokenCount?: number;
}

interface IPruningConfig {
  maxMessages: number;
  maxTokens: number;
  maxAgeHours: number;
  preserveSystemMessages: boolean;
}

/**
 * ChatHistoryManager - Manages conversation history with automatic pruning
 *
 * Features:
 * - Auto-pruning enabled by default for optimal performance
 * - Configurable via VS Code settings (chatHistory.*)
 * - Supports multiple pruning strategies (age, count, tokens)
 * - Permanently removes old data to save memory and improve performance
 * - Maintains context while staying within LLM token limits
 */
export class ChatHistoryManager {
  private readonly agentService: AgentService;
  private static instance: ChatHistoryManager;
  chatHistory: IChatHistory[] = [];

  // Default pruning configuration
  private readonly defaultPruningConfig: IPruningConfig = {
    maxMessages: 3, // Keep last 5 messages
    maxTokens: 8000, // Keep messages within 8K tokens
    maxAgeHours: 24, // Keep messages from last 24 hours
    preserveSystemMessages: true,
  };

  constructor() {
    this.agentService = AgentService.getInstance();

    // Log auto-pruning status on initialization
    const autoPruningStatus = this.isAutoPruningEnabled();
    console.log(
      `ChatHistoryManager initialized with auto-pruning: ${autoPruningStatus ? "ENABLED" : "DISABLED"}`,
    );
  }

  static validateLLM(llm: string) {
    if (!Object.keys(LLM_CONFIGS).includes(llm)) {
      throw new Error(`Invalid LLM: ${llm}`);
    }
  }

  static getInstance(): ChatHistoryManager {
    if (!ChatHistoryManager.instance) {
      ChatHistoryManager.instance = new ChatHistoryManager();
    }
    return ChatHistoryManager.instance;
  }
  async getHistory(
    key: string,
    pruneConfig?: Partial<IPruningConfig>,
  ): Promise<any> {
    const history = await this.agentService.getChatHistory(key);

    let finalHistory = history;
    if (history && history.length > 0 && this.isAutoPruningEnabled()) {
      const config = { ...this.getCurrentPruningConfig(), ...pruneConfig };
      finalHistory = this.pruneHistory(history, config);
    }

    // Sync with memory to ensure consistency
    if (finalHistory && finalHistory.length > 0) {
      Memory.set(key, finalHistory);
    }

    return finalHistory;
  }

  async clearHistory(key: string): Promise<void> {
    await this.agentService.clearAgentData(key);
    Memory.delete(key);
  }

  async setHistory(
    key: string,
    data: any[],
    pruneConfig?: Partial<IPruningConfig>,
  ): Promise<void> {
    // Add timestamps to messages if not present
    const timestampedData = data.map((msg) => this.addTimestamp(msg));

    // Prune before saving if auto-pruning is enabled
    let dataToSave = timestampedData;
    if (this.isAutoPruningEnabled()) {
      const config = { ...this.getCurrentPruningConfig(), ...pruneConfig };
      dataToSave = this.pruneHistory(timestampedData, config);
    }

    await this.agentService.saveChatHistory(key, dataToSave);
  }

  async formatChatHistory(
    role: string,
    message: string,
    model: string,
    key: string,
    pruneConfig?: Partial<IPruningConfig>,
  ): Promise<any[]> {
    const config = LLM_CONFIGS[model];

    // Get existing history from database first, then fallback to memory
    let existingHistory = await this.agentService.getChatHistory(key);
    if (!existingHistory || existingHistory.length === 0) {
      existingHistory = Memory.get(key) ?? [];
    }

    // Add new message to raw history first
    const newRawMessage = {
      role: role,
      content: message,
      timestamp: Date.now(),
    };
    const fullRawHistory = [...existingHistory, newRawMessage];

    // Prune the raw history (this actually removes old data)
    let prunedRawHistory = fullRawHistory;
    if (this.isAutoPruningEnabled()) {
      const pruningConfig = {
        ...this.getCurrentPruningConfig(),
        ...pruneConfig,
      };
      const originalCount = fullRawHistory.length;
      prunedRawHistory = this.pruneHistory(fullRawHistory, pruningConfig);

      // Log pruning activity if data was removed
      if (prunedRawHistory.length < originalCount) {
        console.log(
          `Auto-pruning: Reduced history from ${originalCount} to ${prunedRawHistory.length} messages`,
        );
      }
    }

    // Save the pruned raw history back to database (old data is now deleted)
    await this.agentService.saveChatHistory(key, prunedRawHistory);

    // Format only the pruned history for the LLM
    const formattedHistory: Record<string, ILLMConfig>[] = prunedRawHistory.map(
      (historyItem: FormattedMessage) => {
        const currentRole =
          historyItem.role === "user" ? config.userRole : config.botRole;
        return config.formatMessage(
          currentRole,
          "content" in historyItem
            ? historyItem.content
            : historyItem.parts[0].text,
        );
      },
    );

    // Return the formatted history for the LLM
    return formattedHistory;
  }

  // Ensure memory and database are synchronized
  async syncHistoryWithMemory(key: string): Promise<void> {
    const dbHistory = await this.agentService.getChatHistory(key);
    const memoryHistory = Memory.get(key);

    // If database has more recent data, update memory
    if (dbHistory && dbHistory.length > 0) {
      Memory.set(key, dbHistory);
    }
    // If memory has data but database doesn't, save to database
    else if (memoryHistory && memoryHistory.length > 0) {
      await this.agentService.saveChatHistory(key, memoryHistory);
    }
  }

  // Initialize chat history - ensures consistency between memory and database
  async initializeHistory(key: string): Promise<any[]> {
    await this.syncHistoryWithMemory(key);
    return await this.getHistory(key);
  }

  // Clear memory cache and reload from database - useful for ensuring fresh history
  async refreshHistory(key: string): Promise<any[]> {
    Memory.delete(key);
    return await this.getHistory(key);
  }

  // Utility method to estimate token count (rough approximation)
  private estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for most models
    return Math.ceil(text.length / 4);
  }

  // Utility method to add timestamp to messages
  private addTimestamp(message: any): any {
    if (typeof message === "object" && message !== null) {
      return {
        ...message,
        timestamp: Date.now(),
      };
    }
    return message;
  }

  // Prune chat history based on various criteria
  private pruneHistory(
    history: any[],
    config: IPruningConfig = this.defaultPruningConfig,
  ): any[] {
    if (!history || history.length === 0) {
      return history;
    }

    let prunedHistory = [...history];

    // 1. Remove messages older than maxAgeHours
    prunedHistory = this.pruneByAge(prunedHistory, config);

    // // 2. Limit by message count (keep most recent)
    // prunedHistory = this.pruneByMessageCount(prunedHistory, config);

    // // 3. Limit by token count (remove oldest messages first)
    // prunedHistory = this.pruneByTokenCount(prunedHistory, config);

    return prunedHistory;
  }

  private pruneByAge(history: any[], config: IPruningConfig): any[] {
    if (config.maxAgeHours <= 0) {
      return history;
    }

    const cutoffTime = Date.now() - config.maxAgeHours * 60 * 60 * 5000;
    return history.filter((msg) => {
      const timestamp = msg.timestamp || 0;
      return (
        timestamp > cutoffTime ||
        (config.preserveSystemMessages && msg.role === "system")
      );
    });
  }

  private pruneByMessageCount(history: any[], config: IPruningConfig): any[] {
    if (config.maxMessages <= 0 || history.length <= config.maxMessages) {
      return history;
    }

    const systemMessages = config.preserveSystemMessages
      ? history.filter((msg) => msg.role === "system")
      : [];
    const nonSystemMessages = history.filter((msg) => msg.role !== "system");

    // Keep last N non-system messages
    const recentMessages = nonSystemMessages.slice(-config.maxMessages);
    return [...systemMessages, ...recentMessages];
  }

  private pruneByTokenCount(history: any[], config: IPruningConfig): any[] {
    if (config.maxTokens <= 0) {
      return history;
    }

    let totalTokens = 0;
    const tokenLimitedHistory = [];

    // Count from most recent messages backwards
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const content = msg.content || msg.parts?.[0]?.text || "";
      const tokenCount = this.estimateTokenCount(content);

      if (totalTokens + tokenCount <= config.maxTokens) {
        tokenLimitedHistory.unshift(msg);
        totalTokens += tokenCount;
      } else if (config.preserveSystemMessages && msg.role === "system") {
        // Always include system messages regardless of token limit
        tokenLimitedHistory.unshift(msg);
      } else {
        break;
      }
    }

    return tokenLimitedHistory;
  }

  // Manual pruning method for specific scenarios
  async pruneHistoryForKey(
    key: string,
    pruneConfig?: Partial<IPruningConfig>,
  ): Promise<void> {
    const history = await this.agentService.getChatHistory(key);
    if (history && history.length > 0) {
      const config = { ...this.getCurrentPruningConfig(), ...pruneConfig };
      const prunedHistory = this.pruneHistory(history, config);
      await this.agentService.saveChatHistory(key, prunedHistory);
    }
  }

  // Get pruning statistics
  async getPruningStats(key: string): Promise<{
    totalMessages: number;
    estimatedTokens: number;
    oldestMessageAge: number;
    newestMessageAge: number;
  }> {
    const history = await this.agentService.getChatHistory(key);
    if (!history || history.length === 0) {
      return {
        totalMessages: 0,
        estimatedTokens: 0,
        oldestMessageAge: 0,
        newestMessageAge: 0,
      };
    }

    const now = Date.now();
    const totalMessages = history.length;
    const estimatedTokens = history.reduce((total, msg) => {
      const content = msg.content || msg.parts?.[0]?.text || "";
      return total + this.estimateTokenCount(content);
    }, 0);

    const timestamps = history
      .map((msg) => msg.timestamp || 0)
      .filter((t) => t > 0);
    const oldestMessageAge =
      timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestMessageAge =
      timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      totalMessages,
      estimatedTokens,
      oldestMessageAge: oldestMessageAge ? now - oldestMessageAge : 0,
      newestMessageAge: newestMessageAge ? now - newestMessageAge : 0,
    };
  }

  // Update pruning configuration
  updatePruningConfig(newConfig: Partial<IPruningConfig>): void {
    Object.assign(this.defaultPruningConfig, newConfig);
  }

  // Get current pruning configuration
  getPruningConfig(): IPruningConfig {
    return { ...this.defaultPruningConfig };
  }

  // Get current pruning configuration from VS Code settings
  private getCurrentPruningConfig(): IPruningConfig {
    return {
      maxMessages:
        getConfigValue(CHAT_HISTORY_CONFIG.maxMessages) ||
        this.defaultPruningConfig.maxMessages,
      maxTokens:
        getConfigValue(CHAT_HISTORY_CONFIG.maxTokens) ||
        this.defaultPruningConfig.maxTokens,
      maxAgeHours:
        getConfigValue(CHAT_HISTORY_CONFIG.maxAgeHours) ||
        this.defaultPruningConfig.maxAgeHours,
      preserveSystemMessages:
        getConfigValue(CHAT_HISTORY_CONFIG.preserveSystemMessages) ??
        this.defaultPruningConfig.preserveSystemMessages,
    };
  }

  // Check if auto-pruning is enabled (defaults to true for performance)
  private isAutoPruningEnabled(): boolean {
    const configValue = getConfigValue(CHAT_HISTORY_CONFIG.enableAutoPruning);
    // Default to true if not explicitly set to false
    return configValue !== false;
  }

  // Enable auto-pruning (default behavior)
  enableAutoPruning(): void {
    // This would typically be set via VS Code settings, but we can update the default
    console.log(
      "Auto-pruning is enabled by default. Configure via VS Code settings: chatHistory.enableAutoPruning",
    );
  }

  // Disable auto-pruning (not recommended for performance)
  disableAutoPruning(): void {
    console.log(
      "To disable auto-pruning, set chatHistory.enableAutoPruning to false in VS Code settings",
    );
    console.warn(
      "Warning: Disabling auto-pruning may lead to memory and performance issues",
    );
  }

  // Check current auto-pruning status
  getAutoPruningStatus(): { enabled: boolean; source: string } {
    const configValue = getConfigValue(CHAT_HISTORY_CONFIG.enableAutoPruning);
    return {
      enabled: this.isAutoPruningEnabled(),
      source: configValue === undefined ? "default" : "user-configured",
    };
  }

  // Debug method to check history consistency
  async debugHistoryState(key: string): Promise<{
    memoryHistory: any[];
    dbHistory: any[];
    isConsistent: boolean;
    memoryCount: number;
    dbCount: number;
  }> {
    const memoryHistory = Memory.get(key) || [];
    const dbHistory = (await this.agentService.getChatHistory(key)) || [];

    return {
      memoryHistory,
      dbHistory,
      isConsistent: memoryHistory.length === dbHistory.length,
      memoryCount: memoryHistory.length,
      dbCount: dbHistory.length,
    };
  }

  // Aggressive pruning - permanently deletes old data from database
  async permanentlyPruneHistory(
    key: string,
    pruneConfig?: Partial<IPruningConfig>,
  ): Promise<{
    originalCount: number;
    prunedCount: number;
    deletedCount: number;
  }> {
    const originalHistory = await this.agentService.getChatHistory(key);
    if (!originalHistory || originalHistory.length === 0) {
      return { originalCount: 0, prunedCount: 0, deletedCount: 0 };
    }

    const config = { ...this.getCurrentPruningConfig(), ...pruneConfig };
    const prunedHistory = this.pruneHistory(originalHistory, config);

    // Save only the pruned history (old data is permanently deleted)
    await this.agentService.saveChatHistory(key, prunedHistory);

    // Clear memory and reload with pruned data
    Memory.delete(key);
    Memory.set(key, prunedHistory);

    return {
      originalCount: originalHistory.length,
      prunedCount: prunedHistory.length,
      deletedCount: originalHistory.length - prunedHistory.length,
    };
  }

  // Smart pruning that removes data based on importance/relevance
  async intelligentPrune(
    key: string,
    targetTokens = 4000,
  ): Promise<{
    originalTokens: number;
    finalTokens: number;
    messagesKept: number;
    messagesRemoved: number;
  }> {
    const history = await this.agentService.getChatHistory(key);
    if (!history || history.length === 0) {
      return {
        originalTokens: 0,
        finalTokens: 0,
        messagesKept: 0,
        messagesRemoved: 0,
      };
    }

    const originalTokens = history.reduce((total, msg) => {
      const content = msg.content || msg.parts?.[0]?.text || "";
      return total + this.estimateTokenCount(content);
    }, 0);

    // If already within target, no need to prune
    if (originalTokens <= targetTokens) {
      return {
        originalTokens,
        finalTokens: originalTokens,
        messagesKept: history.length,
        messagesRemoved: 0,
      };
    }

    // Keep system messages and recent important messages
    const systemMessages = history.filter((msg) => msg.role === "system");
    const nonSystemMessages = history.filter((msg) => msg.role !== "system");

    // Start with system messages
    const prunedHistory = [...systemMessages];
    let currentTokens = systemMessages.reduce((total, msg) => {
      const content = msg.content || msg.parts?.[0]?.text || "";
      return total + this.estimateTokenCount(content);
    }, 0);

    // Add recent messages from newest to oldest until we hit token limit
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i];
      const content = msg.content || msg.parts?.[0]?.text || "";
      const tokenCount = this.estimateTokenCount(content);

      if (currentTokens + tokenCount <= targetTokens) {
        prunedHistory.push(msg);
        currentTokens += tokenCount;
      } else {
        break;
      }
    }

    // Sort by timestamp to maintain chronological order
    prunedHistory.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Save the pruned history (permanently delete old data)
    await this.agentService.saveChatHistory(key, prunedHistory);
    Memory.set(key, prunedHistory);

    return {
      originalTokens,
      finalTokens: currentTokens,
      messagesKept: prunedHistory.length,
      messagesRemoved: history.length - prunedHistory.length,
    };
  }

  // Configure for minimal memory usage and aggressive pruning
  enableAggressivePruning(): void {
    this.updatePruningConfig({
      maxMessages: 3, // Keep only last 3 messages
      maxTokens: 4000, // Keep only 4K tokens
      maxAgeHours: 12, // Keep only last 12 hours
      preserveSystemMessages: true, // Always keep system messages
    });
  }

  // Configure for balanced pruning
  enableBalancedPruning(): void {
    this.updatePruningConfig({
      maxMessages: 3, // Keep last 3 messages
      maxTokens: 4000, // Keep 4K tokens
      maxAgeHours: 24, // Keep last 24 hours
      preserveSystemMessages: true,
    });
  }

  // Configure for minimal pruning (more history retained)
  enableMinimalPruning(): void {
    this.updatePruningConfig({
      maxMessages: 3, // Keep last 3 messages
      maxTokens: 4000, // Keep 4K tokens
      maxAgeHours: 72, // Keep last 72 hours
      preserveSystemMessages: true,
    });
  }
}
