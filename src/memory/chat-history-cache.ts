import { Memory } from "./base";

/**
 * LRU cache for session-scoped chat history.
 *
 * Wraps the generic `Memory` store and adds:
 * - A `chatHistory:${sessionId}` naming convention (callers pass plain sessionIds).
 * - Bounded LRU eviction so at most `MAX_ENTRIES` sessions are cached.
 *
 * The *active* LLM history is still stored under the plain `"chatHistory"` key
 * in `Memory`; this class only manages the per-session slots.
 */
export class ChatHistoryCache {
  private static readonly MAX_ENTRIES = 10;
  private static readonly KEY_PREFIX = "chatHistory:";
  /** Access-ordered list of sessionIds (most-recent at end). */
  private static lru: string[] = [];

  private constructor() {}

  private static cacheKey(sessionId: string): string {
    return `${ChatHistoryCache.KEY_PREFIX}${sessionId}`;
  }

  /** Store a session's LLM history, promoting it in the LRU. */
  static set(sessionId: string, value: any[]): void {
    Memory.set(ChatHistoryCache.cacheKey(sessionId), value);
    ChatHistoryCache.touch(sessionId);
  }

  /** Retrieve a session's LLM history (or `undefined` if missing / expired). */
  static get(sessionId: string): any[] | undefined {
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

  // --- Active session helpers (thin wrappers around the plain "chatHistory" key) ---

  /** Get the currently active LLM history. */
  static getActive(): any[] {
    return Memory.get("chatHistory") ?? [];
  }

  /** Set the currently active LLM history. */
  static setActive(history: any[]): void {
    Memory.set("chatHistory", history);
  }

  /** Save the active history under `currentSessionId`, then load `targetSessionId`. */
  static swap(currentSessionId: string | null, targetHistory: any[]): void {
    if (currentSessionId && Memory.has("chatHistory")) {
      ChatHistoryCache.set(currentSessionId, Memory.get("chatHistory"));
    }
    ChatHistoryCache.setActive(targetHistory);
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
