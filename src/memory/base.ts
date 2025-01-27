import { MEMORY_CACHE_OPTIONS } from "../application/constant";

interface ICacheEntry {
  value: any;
  expiry: number;
}

export class Memory {
  private static bank: Map<string, ICacheEntry>;
  private static instance: Memory;

  constructor() {
    Memory.bank = new Map();
  }

  public static getInstance(): Memory {
    if (!Memory.instance) {
      return (Memory.instance = new Memory());
    }
    return Memory.instance;
  }

  static set(key: string, value: any): Map<string, ICacheEntry> {
    const expiry = Date.now() + MEMORY_CACHE_OPTIONS.sessionTTL;
    return Memory.bank.set(key, { value, expiry });
  }

  static get(key: string): any {
    const entry = Memory.bank.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.value;
    }
    return undefined;
  }

  static delete(key: string): boolean | undefined {
    const cached = Memory.get(key);
    if (cached) {
      return Memory.bank.delete(key);
    }
    return undefined;
  }

  static keys(): string[] {
    return Array.from(Memory.bank.keys());
  }

  static values(): ICacheEntry[] {
    return Array.from(Memory.bank.values());
  }

  static has(key: string): boolean {
    return Memory.bank.has(key);
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
}
