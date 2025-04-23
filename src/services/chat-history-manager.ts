import { LLM_CONFIGS } from "./../application/constant";
import { AgentService } from "./agent-state";

interface ChatMessage {
  type: "bot" | "user";
  content: string;
}

export interface ILLMConfig {
  botRole: string;
  userRole: string;
  formatMessage: (role: string, content: string) => any;
}

export class ChatHistoryManager {
  private readonly agentService: AgentService;
  private static instance: ChatHistoryManager;
  chatHistory: any[] = [];
  constructor() {
    this.agentService = AgentService.getInstance();
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
  async getHistory(key: string): Promise<any> {
    const history = await this.agentService.getChatHistory(key);
    return history;
  }

  async setHistory(key: string, data: any[]): Promise<void> {
    await this.agentService.saveChatHistory(key, data);
  }

  async formatChatHistory(
    role: string,
    message: string,
    model: string,
    key: string,
  ): Promise<any[]> {
    const config = LLM_CONFIGS[model];
    const chatHistory =
      (await new Promise<any[]>((resolve) =>
        setTimeout(async () => resolve(await this.getHistory(key)), 1000),
      )) ?? [];

    this.chatHistory = [];

    if (!chatHistory || chatHistory.length === 0) {
      this.chatHistory.push(config.formatMessage(role, message));
      return this.chatHistory;
    }

    for (const historyItem of chatHistory) {
      const currentRole =
        historyItem.type === "bot" ? config.botRole : config.userRole;
      this.chatHistory.push(
        config.formatMessage(currentRole, historyItem.content),
      );
    }

    return this.chatHistory;
  }
}
