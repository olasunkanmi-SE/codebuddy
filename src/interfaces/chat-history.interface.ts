/** A row returned by the DB history query (ChatHistoryRepository.getSessionHistory). */
export interface DbChatMessage {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: number;
  sessionId: string;
  metadata: Record<string, any> | null;
}

/** The compact format stored in the in-memory LLM context. */
export interface LlmChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Original DB timestamp, preserved so cached history can display accurate times. */
  originalTimestamp?: number;
}

/** The shape the webview expects when rendering chat bubbles. */
export interface WebviewChatMessage {
  type: "user" | "bot";
  content: string;
  timestamp: number;
  alias: string;
  language: string;
  metadata?: Record<string, any> | null;
}
