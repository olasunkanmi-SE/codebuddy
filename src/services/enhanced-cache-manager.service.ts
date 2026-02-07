import { IDisposable } from "../interfaces/disposable";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
  size: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hitCount: number;
  missCount: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
  avgAccessTime: number;
  evictionCount: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  maxMemoryMB: number;
  cleanupInterval: number;
  evictionPolicy: "LRU" | "LFU" | "TTL";
}

/**
 * Enhanced multi-level cache system for vector database operations
 */
export class EnhancedCacheManager implements IDisposable {
  private logger: Logger;
  private config: CacheConfig;

  // Multi-level cache storage
  private embeddingCache = new Map<string, CacheEntry<number[]>>();
  private searchCache = new Map<string, CacheEntry<any>>();
  private metadataCache = new Map<string, CacheEntry<any>>();
  private responseCache = new Map<string, CacheEntry<string>>();

  // Cache statistics
  private stats: CacheStats = {
    hitCount: 0,
    missCount: 0,
    size: 0,
    maxSize: 0,
    memoryUsage: 0,
    avgAccessTime: 0,
    evictionCount: 0,
  };

  private accessTimes: number[] = [];
  private cleanupInterval?: NodeJS.Timeout;
  private performanceProfiler?: any;
  private readonly disposables: IDisposable[] = [];

  constructor(config: Partial<CacheConfig> = {}, performanceProfiler?: any) {
    this.logger = Logger.initialize("EnhancedCacheManager", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });

    this.performanceProfiler = performanceProfiler;

    this.config = {
      maxSize: config.maxSize ?? 10000,
      defaultTtl: config.defaultTtl ?? 3600000, // 1 hour
      maxMemoryMB: config.maxMemoryMB ?? 100,
      cleanupInterval: config.cleanupInterval ?? 300000, // 5 minutes
      evictionPolicy: config.evictionPolicy ?? "LRU",
    };

    this.stats.maxSize = this.config.maxSize;
    this.startCleanupTimer();

    this.logger.info("Enhanced cache manager initialized", {
      maxSize: this.config.maxSize,
      maxMemoryMB: this.config.maxMemoryMB,
      evictionPolicy: this.config.evictionPolicy,
    });
  }

  /**
   * Get embedding from cache
   */
  async getEmbedding(key: string): Promise<number[] | null> {
    return this.getCacheEntry(this.embeddingCache, key, "embedding");
  }

  /**
   * Set embedding in cache
   */
  async setEmbedding(
    key: string,
    embedding: number[],
    ttl?: number,
  ): Promise<void> {
    await this.setCacheEntry(
      this.embeddingCache,
      key,
      embedding,
      ttl,
      "embedding",
    );
  }

  /**
   * Get search results from cache
   */
  async getSearchResults(key: string): Promise<any | null> {
    return this.getCacheEntry(this.searchCache, key, "search");
  }

  /**
   * Set search results in cache
   */
  async setSearchResults(
    key: string,
    results: any,
    ttl?: number,
  ): Promise<void> {
    await this.setCacheEntry(this.searchCache, key, results, ttl, "search");
  }

  /**
   * Get metadata from cache
   */
  async getMetadata(key: string): Promise<any | null> {
    return this.getCacheEntry(this.metadataCache, key, "metadata");
  }

  /**
   * Set metadata in cache
   */
  async setMetadata(key: string, metadata: any, ttl?: number): Promise<void> {
    await this.setCacheEntry(
      this.metadataCache,
      key,
      metadata,
      ttl,
      "metadata",
    );
  }

  /**
   * Get response from cache
   */
  async getResponse(key: string): Promise<string | null> {
    return this.getCacheEntry(this.responseCache, key, "response");
  }

  /**
   * Set response in cache
   */
  async setResponse(
    key: string,
    response: string,
    ttl?: number,
  ): Promise<void> {
    await this.setCacheEntry(
      this.responseCache,
      key,
      response,
      ttl,
      "response",
    );
  }

  /**
   * Generic cache get operation
   */
  private async getCacheEntry<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    type: string,
  ): Promise<T | null> {
    const start = performance.now();

    try {
      const entry = cache.get(key);

      if (!entry) {
        this.stats.missCount++;
        this.recordAccessTime(performance.now() - start);
        return null;
      }

      // Check TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        cache.delete(key);
        this.stats.missCount++;
        this.stats.evictionCount++;
        this.recordAccessTime(performance.now() - start);
        return null;
      }

      // Update access metadata
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      this.stats.hitCount++;
      this.recordAccessTime(performance.now() - start);

      // Record cache hit for performance profiler
      if (this.performanceProfiler) {
        this.performanceProfiler.recordCacheHit(true);
      }

      this.logger.debug(`Cache hit for ${type}:`, {
        key: key.substring(0, 50),
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
      });

      return entry.data;
    } catch (error: any) {
      this.logger.error(`Cache get error for ${type}:`, error);
      this.stats.missCount++;

      if (this.performanceProfiler) {
        this.performanceProfiler.recordCacheHit(false);
      }

      return null;
    }
  }

  /**
   * Generic cache set operation
   */
  private async setCacheEntry<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
    ttl?: number,
    type?: string,
  ): Promise<void> {
    try {
      const size = this.estimateSize(data);
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now,
        ttl: ttl ?? this.config.defaultTtl,
        size,
      };

      // Check if we need to evict entries
      if (this.shouldEvict(cache, size)) {
        await this.evictEntries(cache, size);
      }

      cache.set(key, entry);
      this.updateCacheStats();

      this.logger.debug(`Cache set for ${type}:`, {
        key: key.substring(0, 50),
        size,
        ttl: entry.ttl,
      });
    } catch (error: any) {
      this.logger.error(`Cache set error for ${type}:`, error);
    }
  }

  /**
   * Check if eviction is needed
   */
  private shouldEvict<T>(
    cache: Map<string, CacheEntry<T>>,
    newEntrySize: number,
  ): boolean {
    const totalEntries = this.getTotalCacheSize();
    const totalMemory = this.getTotalMemoryUsage();

    return (
      totalEntries >= this.config.maxSize ||
      totalMemory + newEntrySize > this.config.maxMemoryMB * 1024 * 1024
    );
  }

  /**
   * Evict entries based on configured policy
   */
  private async evictEntries<T>(
    cache: Map<string, CacheEntry<T>>,
    requiredSpace: number,
  ): Promise<void> {
    const entries = Array.from(cache.entries());
    let evicted = 0;
    let freedSpace = 0;

    switch (this.config.evictionPolicy) {
      case "LRU":
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;

      case "LFU":
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;

      case "TTL":
        entries.sort(
          (a, b) => a[1].timestamp + a[1].ttl - (b[1].timestamp + b[1].ttl),
        );
        break;
    }

    // Evict entries until we have enough space
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace && evicted >= 10) {
        break;
      }

      cache.delete(key);
      freedSpace += entry.size;
      evicted++;
      this.stats.evictionCount++;
    }

    this.logger.debug(`Evicted ${evicted} entries, freed ${freedSpace} bytes`);
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      if (typeof data === "string") {
        return data.length * 2; // UTF-16
      }

      if (Array.isArray(data)) {
        if (typeof data[0] === "number") {
          return data.length * 8; // Assume float64
        }
        return JSON.stringify(data).length * 2;
      }

      if (typeof data === "object") {
        return JSON.stringify(data).length * 2;
      }

      return 64; // Default estimate
    } catch {
      return 64;
    }
  }

  /**
   * Get total cache size across all caches
   */
  private getTotalCacheSize(): number {
    return (
      this.embeddingCache.size +
      this.searchCache.size +
      this.metadataCache.size +
      this.responseCache.size
    );
  }

  /**
   * Get total memory usage across all caches
   */
  private getTotalMemoryUsage(): number {
    let totalSize = 0;

    for (const entry of this.embeddingCache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.searchCache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.metadataCache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.responseCache.values()) {
      totalSize += entry.size;
    }

    return totalSize;
  }

  /**
   * Update cache statistics
   */
  private updateCacheStats(): void {
    this.stats.size = this.getTotalCacheSize();
    this.stats.memoryUsage = this.getTotalMemoryUsage();

    if (this.accessTimes.length > 0) {
      this.stats.avgAccessTime =
        this.accessTimes.reduce((sum, time) => sum + time, 0) /
        this.accessTimes.length;
    }
  }

  /**
   * Record cache access time
   */
  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);

    // Keep only recent access times
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-500);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform cache cleanup
   */
  private async performCleanup(): Promise<void> {
    try {
      const now = Date.now();
      let expiredCount = 0;

      // Clean up expired entries
      const caches = [
        { cache: this.embeddingCache, name: "embedding" },
        { cache: this.searchCache, name: "search" },
        { cache: this.metadataCache, name: "metadata" },
        { cache: this.responseCache, name: "response" },
      ];

      for (const { cache, name } of caches) {
        const expiredKeys: string[] = [];

        for (const [key, entry] of cache) {
          if (now - entry.timestamp > entry.ttl) {
            expiredKeys.push(key);
          }
        }

        for (const key of expiredKeys) {
          cache.delete(key);
          expiredCount++;
        }
      }

      this.updateCacheStats();

      if (expiredCount > 0) {
        this.logger.debug(
          `Cleanup removed ${expiredCount} expired cache entries`,
        );
      }

      // Check memory usage and evict if necessary
      const memoryUsage = this.getTotalMemoryUsage();
      const memoryLimitBytes = this.config.maxMemoryMB * 1024 * 1024;

      if (memoryUsage > memoryLimitBytes * 0.8) {
        this.logger.warn(
          `Cache memory usage high: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        );

        // Evict 10% of entries from largest cache
        const largestCache = [
          this.embeddingCache,
          this.searchCache,
          this.metadataCache,
          this.responseCache,
        ].reduce((largest, cache) =>
          cache.size > largest.size ? cache : largest,
        );

        const entriesToEvict = Math.ceil(largestCache.size * 0.1);
        await this.evictEntries(largestCache, 0);
      }
    } catch (error: any) {
      this.logger.error("Cache cleanup error:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateCacheStats();
    return { ...this.stats };
  }

  /**
   * Get detailed cache info
   */
  getCacheInfo(): {
    embedding: { size: number; memoryMB: number };
    search: { size: number; memoryMB: number };
    metadata: { size: number; memoryMB: number };
    response: { size: number; memoryMB: number };
    total: { size: number; memoryMB: number; hitRate: number };
  } {
    const getMemoryMB = (cache: Map<string, CacheEntry<any>>) => {
      let totalSize = 0;
      for (const entry of cache.values()) {
        totalSize += entry.size;
      }
      return totalSize / 1024 / 1024;
    };

    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate = totalRequests > 0 ? this.stats.hitCount / totalRequests : 0;

    return {
      embedding: {
        size: this.embeddingCache.size,
        memoryMB: getMemoryMB(this.embeddingCache),
      },
      search: {
        size: this.searchCache.size,
        memoryMB: getMemoryMB(this.searchCache),
      },
      metadata: {
        size: this.metadataCache.size,
        memoryMB: getMemoryMB(this.metadataCache),
      },
      response: {
        size: this.responseCache.size,
        memoryMB: getMemoryMB(this.responseCache),
      },
      total: {
        size: this.getTotalCacheSize(),
        memoryMB: this.getTotalMemoryUsage() / 1024 / 1024,
        hitRate,
      },
    };
  }

  /**
   * Clear specific cache type
   */
  async clearCache(
    type: "embedding" | "search" | "metadata" | "response" | "all",
  ): Promise<void> {
    try {
      switch (type) {
        case "embedding":
          this.embeddingCache.clear();
          break;
        case "search":
          this.searchCache.clear();
          break;
        case "metadata":
          this.metadataCache.clear();
          break;
        case "response":
          this.responseCache.clear();
          break;
        case "all":
          this.embeddingCache.clear();
          this.searchCache.clear();
          this.metadataCache.clear();
          this.responseCache.clear();
          break;
      }

      this.updateCacheStats();
      this.logger.info(`Cleared ${type} cache`);
    } catch (error: any) {
      this.logger.error(`Failed to clear ${type} cache:`, error);
    }
  }

  /**
   * Optimize cache configuration based on usage patterns
   */
  async optimizeConfiguration(): Promise<void> {
    try {
      const hitRate =
        this.stats.hitCount / (this.stats.hitCount + this.stats.missCount) || 0;
      const memoryUsage = this.getTotalMemoryUsage() / 1024 / 1024; // MB

      // Adjust cache size based on hit rate
      if (hitRate < 0.5 && this.config.maxSize > 1000) {
        this.config.maxSize = Math.floor(this.config.maxSize * 0.8);
        this.logger.info(
          `Reduced cache size to ${this.config.maxSize} due to low hit rate`,
        );
      } else if (hitRate > 0.8 && memoryUsage < this.config.maxMemoryMB * 0.6) {
        this.config.maxSize = Math.floor(this.config.maxSize * 1.2);
        this.logger.info(
          `Increased cache size to ${this.config.maxSize} due to high hit rate`,
        );
      }

      // Adjust TTL based on access patterns
      if (this.stats.avgAccessTime > 10) {
        this.config.defaultTtl = Math.floor(this.config.defaultTtl * 1.2);
        this.logger.info(
          `Increased default TTL to ${this.config.defaultTtl}ms`,
        );
      }

      this.stats.maxSize = this.config.maxSize;
    } catch (error: any) {
      this.logger.error("Cache optimization error:", error);
    }
  }

  /**
   * Export cache state for debugging
   */
  exportState(): {
    config: CacheConfig;
    stats: CacheStats;
    cacheInfo: any;
    sampleEntries: any;
  } {
    const getSampleEntries = (
      cache: Map<string, CacheEntry<any>>,
      name: string,
    ) => {
      const entries = Array.from(cache.entries()).slice(0, 3);
      return entries.map(([key, entry]) => ({
        key: key.substring(0, 50),
        timestamp: new Date(entry.timestamp).toISOString(),
        accessCount: entry.accessCount,
        size: entry.size,
        ttl: entry.ttl,
      }));
    };

    return {
      config: this.config,
      stats: this.getStats(),
      cacheInfo: this.getCacheInfo(),
      sampleEntries: {
        embedding: getSampleEntries(this.embeddingCache, "embedding"),
        search: getSampleEntries(this.searchCache, "search"),
        metadata: getSampleEntries(this.metadataCache, "metadata"),
        response: getSampleEntries(this.responseCache, "response"),
      },
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    this.embeddingCache.clear();
    this.searchCache.clear();
    this.metadataCache.clear();
    this.responseCache.clear();

    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;

    this.logger.info("Enhanced cache manager disposed");
  }
}
