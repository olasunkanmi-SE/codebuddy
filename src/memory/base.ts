import { MEMORY_CACHE_OPTIONS } from "../application/constant";

export class Memory {
  private static readonly MAX_MEMORY_ITEMS = 3;
  private static readonly MAX_SESSION_CACHE_ENTRIES = 10;
  private static bank: Map<string, any>;
  private static instance: Memory;
  /** Tracks access order for chatHistory:* keys (most-recent at end). */
  private static sessionCacheLRU: string[] = [];

  constructor() {
    Memory.bank = new Map();
  }

  public static getInstance(): Memory {
    Memory.instance ??= new Memory();
    return Memory.instance;
  }

  static set(key: string, value: any): Map<string, any> {
    const expiry = Date.now() + MEMORY_CACHE_OPTIONS.sessionTTL;
    const result = Memory.bank.set(key, { value, expiry });
    if (key.startsWith("chatHistory:")) {
      Memory.touchSessionCacheKey(key);
    }
    return result;
  }

  static get(key: string): any {
    const entry = Memory.bank.get(key);
    if (entry && Date.now() < entry.expiry) {
      if (key.startsWith("chatHistory:")) {
        Memory.touchSessionCacheKey(key);
      }
      return entry.value;
    }
    // Clean up expired entry
    if (entry) {
      Memory.bank.delete(key);
      Memory.sessionCacheLRU = Memory.sessionCacheLRU.filter(k => k !== key);
    }
    return undefined;
  }

  static delete(key: string): boolean | undefined {
    if (Memory.bank.has(key)) {
      Memory.sessionCacheLRU = Memory.sessionCacheLRU.filter(k => k !== key);
      return Memory.bank.delete(key);
    }
    return undefined;
  }

  static keys(): string[] {
    return Array.from(Memory.bank.keys());
  }

  static values(): any[] {
    return Array.from(Memory.bank.values());
  }

  static has(key: string): boolean {
    // Check expiry so callers don't see stale entries
    return Memory.get(key) !== undefined;
  }

  static clear(): void {
    Memory.sessionCacheLRU = [];
    return Memory.bank.clear();
  }

  /** Promote a chatHistory:* key to most-recent and evict the oldest if over limit. */
  private static touchSessionCacheKey(key: string): void {
    Memory.sessionCacheLRU = Memory.sessionCacheLRU.filter(k => k !== key);
    Memory.sessionCacheLRU.push(key);
    while (Memory.sessionCacheLRU.length > Memory.MAX_SESSION_CACHE_ENTRIES) {
      const evicted = Memory.sessionCacheLRU.shift();
      if (evicted) {
        Memory.bank.delete(evicted);
      }
    }
  }

  static createSnapShot(): Memory {
    return this.instance;
  }

  static loadSnapShot(snapShot: Memory): void {
    Object.assign(this, snapShot);
  }

  static removeItems(key: string, count = 3) {
    let content = Memory.get(key);
    if (Array.isArray(content) && content?.length > count) {
      content = content.slice(-Memory.MAX_MEMORY_ITEMS);
    }
    return content;
  }
}
