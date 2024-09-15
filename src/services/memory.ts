import { MEMORY_CACHE_OPTIONS } from "../constant";

interface ICacheEntry {
  value: any;
  expiry: number;
}

export class MemoryCache {
  private static memCache: Map<string, ICacheEntry>;
  private static instance: MemoryCache;

  constructor() {
    MemoryCache.memCache = new Map();
  }

  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      return (MemoryCache.instance = new MemoryCache());
    }
    return MemoryCache.instance;
  }

  static set(key: string, value: any): Map<string, ICacheEntry> {
    const expiry = Date.now() + MEMORY_CACHE_OPTIONS.sessionTTL;
    return MemoryCache.memCache.set(key, { value, expiry });
  }

  static get(key: string): any {
    const entry = MemoryCache.memCache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.value;
    }
    return undefined;
  }

  static delete(key: string): boolean | undefined {
    const cached = MemoryCache.get(key);
    if (cached) {
      return MemoryCache.memCache.delete(key);
    }
    return undefined;
  }

  static keys(): string[] {
    return Array.from(MemoryCache.memCache.keys());
  }

  static values(): ICacheEntry[] {
    return Array.from(MemoryCache.memCache.values());
  }

  static has(key: string): boolean {
    return MemoryCache.memCache.has(key);
  }

  static clear(): void {
    return MemoryCache.memCache.clear();
  }
}
