import { MEMORY_CACHE_OPTIONS } from "../application/constant";

interface ICacheEntry {
  value: any;
  expiry: number;
}

export class Brain {
  private static memoryBank: Map<string, ICacheEntry>;
  private static instance: Brain;

  constructor() {
    Brain.memoryBank = new Map();
  }

  public static getInstance(): Brain {
    if (!Brain.instance) {
      return (Brain.instance = new Brain());
    }
    return Brain.instance;
  }

  static set(key: string, value: any): Map<string, ICacheEntry> {
    const expiry = Date.now() + MEMORY_CACHE_OPTIONS.sessionTTL;
    return Brain.memoryBank.set(key, { value, expiry });
  }

  static get(key: string): any {
    const entry = Brain.memoryBank.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.value;
    }
    return undefined;
  }

  static delete(key: string): boolean | undefined {
    const cached = Brain.get(key);
    if (cached) {
      return Brain.memoryBank.delete(key);
    }
    return undefined;
  }

  static keys(): string[] {
    return Array.from(Brain.memoryBank.keys());
  }

  static values(): ICacheEntry[] {
    return Array.from(Brain.memoryBank.values());
  }

  static has(key: string): boolean {
    return Brain.memoryBank.has(key);
  }

  static clear(): void {
    return Brain.memoryBank.clear();
  }
}
