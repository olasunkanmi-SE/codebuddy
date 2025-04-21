import { AgentState } from "../agents/interface";
import { COMMON } from "../application/constant";
import { GeminiLLMSnapShot } from "../llms/interface";
import { FileStorage, IStorage } from "./file-storage";

export class AgentService {
  private static instance: AgentService;
  private readonly storage: IStorage;

  private constructor(storage: IStorage) {
    this.storage = storage;
  }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService(new FileStorage());
    }
    return AgentService.instance;
  }

  async getState(agentId: string): Promise<AgentState | undefined> {
    return this.storage.get<AgentState>(`${COMMON.AGENT_STATE_PREFIX}_${agentId}`);
  }

  async saveState(agentId: string, state: AgentState): Promise<void> {
    return this.storage.set(`${COMMON.AGENT_STATE_PREFIX}_${agentId}`, state);
  }

  async getChatHistory(agentId: string): Promise<any[]> {
    return (await this.storage.get<any[]>(`${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`)) || [];
  }

  async saveChatHistory(agentId: string, history: any[]): Promise<void> {
    return this.storage.set(`${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`, history);
  }

  async getSnapshot(agentId: string): Promise<GeminiLLMSnapShot | undefined> {
    return this.storage.get<GeminiLLMSnapShot>(`${COMMON.SNAPSHOT_PREFIX}_${agentId}`);
  }

  async saveSnapshot(agentId: string, snapshot: GeminiLLMSnapShot): Promise<void> {
    return this.storage.set(`${COMMON.SNAPSHOT_PREFIX}_${agentId}`, snapshot);
  }

  async clearAgentData(agentId: string): Promise<void> {
    await this.storage.delete(`${COMMON.AGENT_STATE_PREFIX}_${agentId}`);
    await this.storage.delete(`${COMMON.CHAT_HISTORY_PREFIX}_${agentId}`);
    await this.storage.delete(`${COMMON.SNAPSHOT_PREFIX}_${agentId}`);
  }
}
