import { Memory } from "../memory/base";
import { FormattedMessage, LLM_CONFIGS } from "./../application/constant";
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

interface IChatHistory {
  type: string;
  content: string;
  alias: string;
}

export class ChatHistoryManager {
  private readonly agentService: AgentService;
  private static instance: ChatHistoryManager;
  chatHistory: IChatHistory[] = [];
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

  async clearHistory(key: string): Promise<void> {
    await this.agentService.clearAgentData(key);
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
    const existingHistory = Memory.get(key) ?? [];

    const formattedHistory: Record<string, ILLMConfig>[] = existingHistory.map(
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

    const formattedNewMessage = config.formatMessage(role, message);
    this.chatHistory = [...formattedHistory, formattedNewMessage];

    Memory.set(key, this.chatHistory);

    return this.chatHistory;
  }
}
