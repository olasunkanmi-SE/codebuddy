import { MEMORY_CACHE_OPTIONS } from "../application/constant";

export class Memory {
  private static readonly MAX_MEMORY_ITEMS = 3;
  private static bank: Map<string, any>;
  private static instance: Memory;

  constructor() {
    Memory.bank = new Map();
  }

  public static getInstance(): Memory {
    Memory.instance ??= new Memory();
    return Memory.instance;
  }

  static set(key: string, value: any): Map<string, any> {
    const expiry = Date.now() + MEMORY_CACHE_OPTIONS.sessionTTL;
    return Memory.bank.set(key, { value, expiry });
  }

  static get(key: string): any {
    const entry = Memory.bank.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.value;
    }
    // Clean up expired entry
    if (entry) {
      Memory.bank.delete(key);
    }
    return undefined;
  }

  static delete(key: string): boolean {
    return Memory.bank.delete(key);
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
    return Memory.bank.clear();
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
