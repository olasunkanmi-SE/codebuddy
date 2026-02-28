import { LlmChatMessage } from "../interfaces/chat-history.interface";
import { Memory } from "./base";

/**
 * LRU cache for session-scoped chat history.
 *
 * Wraps the generic `Memory` store and adds:
 * - A `chatHistory:${sessionId}` naming convention (callers pass plain sessionIds).
 * - Bounded LRU eviction so at most `MAX_ENTRIES` sessions are cached.
 * - Tracking of the currently active session via `_activeSessionId`.
 *
 * The active LLM history is written to `Memory` under the `"chatHistory"` key
 * for backward-compatibility with LLM providers that read it directly.
 */
export class ChatHistoryCache {
  private static MAX_ENTRIES = 10;
  private static readonly KEY_PREFIX = "chatHistory:";
  /** Access-ordered list of sessionIds (most-recent at end). */
  private static lru: string[] = [];
  /** The session whose history is currently loaded as the active LLM context. */
  private static _activeSessionId: string | null = null;

  private constructor() {}

  /** Allow callers (e.g. config changes) to adjust the max cached sessions. */
  static setMaxEntries(max: number): void {
    ChatHistoryCache.MAX_ENTRIES = Math.max(1, max);
  }

  /** Return the ID of the currently active session (or `null`). */
  static getActiveSessionId(): string | null {
    return ChatHistoryCache._activeSessionId;
  }

  private static cacheKey(sessionId: string): string {
    return `${ChatHistoryCache.KEY_PREFIX}${sessionId}`;
  }

  /** Store a session's LLM history, promoting it in the LRU. */
  static set(sessionId: string, value: LlmChatMessage[]): void {
    Memory.set(ChatHistoryCache.cacheKey(sessionId), value);
    ChatHistoryCache.touch(sessionId);
  }

  /** Retrieve a session's LLM history (or `undefined` if missing / expired). */
  static get(sessionId: string): LlmChatMessage[] | undefined {
    const value = Memory.get(ChatHistoryCache.cacheKey(sessionId));
    if (value !== undefined) {
      ChatHistoryCache.touch(sessionId);
    }
    return value;
  }

  /** Check whether a session's history is cached and not expired. */
  static has(sessionId: string): boolean {
    return Memory.has(ChatHistoryCache.cacheKey(sessionId));
  }

  /** Remove a session's cached history. */
  static delete(sessionId: string): void {
    Memory.delete(ChatHistoryCache.cacheKey(sessionId));
    ChatHistoryCache.lru = ChatHistoryCache.lru.filter(
      (id) => id !== sessionId,
    );
  }

  /** Drop all cached session histories. */
  static clear(): void {
    for (const id of ChatHistoryCache.lru) {
      Memory.delete(ChatHistoryCache.cacheKey(id));
    }
    ChatHistoryCache.lru = [];
  }

  // --- Active session management ───────────────────────────────────────

  /** Get the currently active LLM history. */
  static getActive(): LlmChatMessage[] {
    return Memory.get("chatHistory") ?? [];
  }

  /** Activate `sessionId` with the given history as the current LLM context. */
  static setActive(sessionId: string, history: LlmChatMessage[]): void {
    Memory.set("chatHistory", history);
    ChatHistoryCache._activeSessionId = sessionId;
  }

  /** Clear the active session state (e.g. after the active session is deleted). */
  static deactivate(): void {
    Memory.delete("chatHistory");
    ChatHistoryCache._activeSessionId = null;
  }

  /**
   * Persist the current active session's history into the per-session cache,
   * then activate `targetSessionId` with `targetHistory`.
   */
  static swap(targetSessionId: string, targetHistory: LlmChatMessage[]): void {
    if (ChatHistoryCache._activeSessionId) {
      ChatHistoryCache.set(
        ChatHistoryCache._activeSessionId,
        ChatHistoryCache.getActive(),
      );
    }
    ChatHistoryCache.setActive(targetSessionId, targetHistory);
  }

  // --- internals ---

  private static touch(sessionId: string): void {
    ChatHistoryCache.lru = ChatHistoryCache.lru.filter(
      (id) => id !== sessionId,
    );
    ChatHistoryCache.lru.push(sessionId);

    while (ChatHistoryCache.lru.length > ChatHistoryCache.MAX_ENTRIES) {
      const evicted = ChatHistoryCache.lru.shift();
      if (evicted) {
        Memory.delete(ChatHistoryCache.cacheKey(evicted));
      }
    }
  }
}
