import { dbManager } from "./db-manager";

export class ChatHistoryRepository {
  private static instance: ChatHistoryRepository;
  private constructor() {
    this.ensureTable();
  }

  public static getInstance(): ChatHistoryRepository {
    if (!ChatHistoryRepository.instance) {
      ChatHistoryRepository.instance = new ChatHistoryRepository();
    }
    return ChatHistoryRepository.instance;
  }

  private ensureTable() {
    dbManager.run(`CREATE TABLE IF NOT EXISTS chat_history (
      agent_id TEXT PRIMARY KEY,
      history TEXT
    )`);
  }

  public get(agentId: string): any[] {
    const row = dbManager.get(
      `SELECT history FROM chat_history WHERE agent_id = ?`,
      agentId,
    ) as { history?: string } | undefined;
    if (row?.history) {
      try {
        return JSON.parse(row.history);
      } catch {
        return [];
      }
    }
    return [];
  }

  public set(agentId: string, history: any[]): void {
    dbManager.run(
      `INSERT INTO chat_history (agent_id, history) VALUES (?, ?)
        ON CONFLICT(agent_id) DO UPDATE SET history=excluded.history`,
      agentId,
      JSON.stringify(history),
    );
  }

  public clear(agentId: string): void {
    dbManager.run(`DELETE FROM chat_history WHERE agent_id = ?`, agentId);
  }
}
