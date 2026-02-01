import * as vscode from "vscode";
import * as crypto from "crypto";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
  expiresAt: number;
}

export class CodebaseAnalysisCache {
  private static instance: CodebaseAnalysisCache;
  private readonly logger: Logger;
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.logger = Logger.initialize("CodebaseAnalysisCache", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });

    // Clean up expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  public static getInstance(): CodebaseAnalysisCache {
    if (!CodebaseAnalysisCache.instance) {
      CodebaseAnalysisCache.instance = new CodebaseAnalysisCache();
    }
    return CodebaseAnalysisCache.instance;
  }

  /**
   * Generate a hash for the current workspace state
   */
  private async getWorkspaceHash(): Promise<string> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return "no-workspace";
      }

      // Get recent file modification times as a simple hash
      const files = await vscode.workspace.findFiles(
        "**/*.{ts,js,tsx,jsx,json,py,java,cs,php}",
        "**/node_modules/**",
        100,
      );

      const fileHashes = await Promise.all(
        files.slice(0, 20).map(async (uri) => {
          try {
            const stat = await vscode.workspace.fs.stat(uri);
            return `${uri.fsPath}:${stat.mtime}:${stat.size}`;
          } catch {
            return uri.fsPath;
          }
        }),
      );

      const combinedHash = fileHashes.join("|");
      return crypto.createHash("md5").update(combinedHash).digest("hex");
    } catch (error: any) {
      this.logger.warn("Failed to generate workspace hash", error);
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * Get cached data if valid
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache entry expired: ${key}`);
      return null;
    }

    // Check if workspace has changed (for workspace-dependent caches)
    if (key.includes("workspace")) {
      const currentHash = await this.getWorkspaceHash();
      if (currentHash !== entry.hash) {
        this.cache.delete(key);
        this.logger.debug(`Cache invalidated due to workspace changes: ${key}`);
        return null;
      }
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = this.defaultTTL,
    workspaceDependent = true,
  ): Promise<void> {
    const hash = workspaceDependent ? await this.getWorkspaceHash() : "static";

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hash,
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
    this.logger.debug(`Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug("Cache cleared");
  }

  /**
   * Clear cache for specific pattern
   */
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    this.logger.debug(
      `Cache cleared for pattern: ${pattern} (${keysToDelete.length} entries)`,
    );
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: number;
  } {
    const entries = Array.from(this.cache.values());

    return {
      totalEntries: entries.length,
      totalSize: JSON.stringify(entries).length,
      hitRate: 0, // Would need hit/miss tracking for accurate rate
      oldestEntry:
        entries.length > 0 ? Math.min(...entries.map((e) => e.timestamp)) : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}
