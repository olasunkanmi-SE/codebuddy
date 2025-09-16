# Vector Database Performance Optimization Guide

## 🎯 Overview

This guide provides comprehensive strategies for optimizing the performance of CodeBuddy's vector database and smart context extraction system. Follow these recommendations to ensure optimal speed, memory usage, and user experience.

## 📊 Performance Baselines

### Target Performance Metrics

| Operation                         | Target Time | Acceptable | Action Required |
| --------------------------------- | ----------- | ---------- | --------------- |
| Initial Indexing (1000 functions) | < 30s       | < 60s      | > 60s           |
| Incremental Update (10 files)     | < 2s        | < 5s       | > 5s            |
| Semantic Search                   | < 100ms     | < 500ms    | > 500ms         |
| Context Extraction                | < 200ms     | < 1s       | > 1s            |
| Memory Usage (Extension)          | < 200MB     | < 500MB    | > 500MB         |

### Measurement Tools

```typescript
// Performance measurement utility
class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const memBefore = process.memoryUsage();

    try {
      const result = await fn();
      const duration = performance.now() - start;
      const memAfter = process.memoryUsage();

      this.recordMeasurement(operation, {
        duration,
        memoryDelta: memAfter.heapUsed - memBefore.heapUsed,
      });

      return result;
    } catch (error) {
      logger.error(`Performance measurement failed for ${operation}:`, error);
      throw error;
    }
  }

  getStats(operation: string): PerformanceStats {
    const measurements = this.measurements.get(operation) || [];
    return {
      count: measurements.length,
      avgDuration: measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length,
      p95Duration: this.percentile(
        measurements.map((m) => m.duration),
        0.95
      ),
      maxDuration: Math.max(...measurements.map((m) => m.duration)),
    };
  }
}
```

## 🚀 Embedding Generation Optimization

### 1. Batch Processing Strategy

```typescript
class OptimizedEmbeddingService {
  private readonly OPTIMAL_BATCH_SIZE = 25; // Tuned for OpenAI rate limits
  private readonly MAX_CONCURRENT_BATCHES = 2;
  private requestQueue: Array<{ text: string; resolve: Function; reject: Function }> = [];
  private isProcessing = false;

  async generateEmbedding(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ text, resolve, reject });
      this.processBatchQueue();
    });
  }

  private async processBatchQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, this.OPTIMAL_BATCH_SIZE);
        const texts = batch.map((item) => item.text);

        try {
          const embeddings = await this.batchGenerateEmbeddings(texts);

          // Resolve promises
          batch.forEach((item, index) => {
            item.resolve(embeddings[index]);
          });
        } catch (error) {
          // Reject all promises in batch
          batch.forEach((item) => item.reject(error));
        }

        // Rate limiting delay
        await this.sleep(200);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    // Implement actual batch embedding generation
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  }
}
```

### 2. Embedding Caching

```typescript
class CachedEmbeddingService extends OptimizedEmbeddingService {
  private cache: Map<string, number[]> = new Map();
  private readonly MAX_CACHE_SIZE = 10000;

  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.generateCacheKey(text);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const embedding = await super.generateEmbedding(text);

    // Manage cache size (LRU eviction)
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, embedding);
    return embedding;
  }

  private generateCacheKey(text: string): string {
    // Use hash for consistent, compact keys
    return crypto.createHash("sha256").update(text).digest("hex").substring(0, 16);
  }

  getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: this.calculateHitRate(),
    };
  }
}
```

### 3. Text Preprocessing Optimization

```typescript
class TextPreprocessor {
  private readonly MAX_TOKEN_LENGTH = 8000; // OpenAI limit
  private readonly MIN_MEANINGFUL_LENGTH = 50;

  optimizeTextForEmbedding(text: string): string {
    // Remove noise and optimize for embedding generation
    let optimized = text
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/^\s+|\s+$/g, ""); // Trim

    // Skip very short or very long content
    if (optimized.length < this.MIN_MEANINGFUL_LENGTH) {
      return "";
    }

    if (optimized.length > this.MAX_TOKEN_LENGTH) {
      optimized = this.intelligentTruncation(optimized);
    }

    return optimized;
  }

  private intelligentTruncation(text: string): string {
    // Prioritize keeping function signatures and important parts
    const lines = text.split("\n");
    let result = "";
    let currentLength = 0;

    // First pass: include function signatures and class declarations
    for (const line of lines) {
      if (this.isImportantLine(line)) {
        if (currentLength + line.length < this.MAX_TOKEN_LENGTH) {
          result += line + "\n";
          currentLength += line.length;
        }
      }
    }

    // Second pass: fill remaining space with other content
    for (const line of lines) {
      if (!this.isImportantLine(line) && currentLength + line.length < this.MAX_TOKEN_LENGTH) {
        result += line + "\n";
        currentLength += line.length;
      }
    }

    return result;
  }

  private isImportantLine(line: string): boolean {
    const importantPatterns = [
      /^\s*(export\s+)?(function|class|interface|enum)\s+/,
      /^\s*(public|private|protected)\s+(async\s+)?[\w<>]+\s*\(/,
      /^\s*constructor\s*\(/,
      /^\s*@\w+/, // Decorators
    ];

    return importantPatterns.some((pattern) => pattern.test(line));
  }
}
```

## 🔍 Search Performance Optimization

### 1. Multi-tier Search Strategy

```typescript
class HybridSearchService {
  private cache: Map<string, SearchResult[]> = new Map();

  async performSearch(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    // Tier 1: Cache lookup
    const cacheKey = this.normalizeCacheKey(query);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.slice(0, maxResults);
    }

    // Tier 2: Quick vector search with limited results
    const quickResults = await this.vectorDb.semanticSearch(query, 5);

    if (quickResults.length >= 3 && quickResults[0].relevanceScore > 0.8) {
      // High confidence results, return immediately
      this.cache.set(cacheKey, quickResults);
      return quickResults;
    }

    // Tier 3: Expanded search if quick search wasn't satisfactory
    const expandedResults = await this.vectorDb.semanticSearch(query, maxResults);

    // Tier 4: Hybrid search combining vector and keyword results
    if (expandedResults.length < maxResults * 0.7) {
      const keywordResults = await this.keywordSearch(query);
      const combinedResults = this.combineResults(expandedResults, keywordResults, maxResults);
      this.cache.set(cacheKey, combinedResults);
      return combinedResults;
    }

    this.cache.set(cacheKey, expandedResults);
    return expandedResults;
  }

  private async keywordSearch(query: string): Promise<SearchResult[]> {
    // Fallback keyword-based search for when vector search is insufficient
    const keywords = this.extractKeywords(query);
    // Implementation depends on your existing keyword search
    return [];
  }

  private combineResults(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[],
    maxResults: number
  ): SearchResult[] {
    const combined = [...vectorResults];
    const seenIds = new Set(vectorResults.map((r) => r.metadata.id));

    for (const keywordResult of keywordResults) {
      if (!seenIds.has(keywordResult.metadata.id) && combined.length < maxResults) {
        combined.push(keywordResult);
        seenIds.add(keywordResult.metadata.id);
      }
    }

    return combined.slice(0, maxResults);
  }
}
```

### 2. Query Optimization

```typescript
class QueryOptimizer {
  private queryCache: Map<string, string> = new Map();

  optimizeQuery(originalQuery: string): string {
    const cacheKey = originalQuery.toLowerCase().trim();

    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    let optimizedQuery = originalQuery;

    // 1. Expand technical abbreviations
    optimizedQuery = this.expandAbbreviations(optimizedQuery);

    // 2. Add contextual keywords based on query type
    optimizedQuery = this.addContextualKeywords(optimizedQuery);

    // 3. Remove stop words that don't help in code search
    optimizedQuery = this.removeCodeIrrelevantStopWords(optimizedQuery);

    this.queryCache.set(cacheKey, optimizedQuery);
    return optimizedQuery;
  }

  private expandAbbreviations(query: string): string {
    const abbreviations = {
      auth: "authentication authorization",
      db: "database",
      api: "application programming interface endpoint",
      ui: "user interface",
      dto: "data transfer object",
      orm: "object relational mapping",
      crud: "create read update delete",
    };

    let expanded = query;
    for (const [abbrev, expansion] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, "gi");
      expanded = expanded.replace(regex, `${abbrev} ${expansion}`);
    }

    return expanded;
  }

  private addContextualKeywords(query: string): string {
    const contextualMappings = {
      how: ["implementation", "method", "function"],
      error: ["exception", "handling", "try", "catch"],
      data: ["model", "entity", "schema"],
      connect: ["connection", "client", "service"],
    };

    let enhanced = query;
    for (const [trigger, keywords] of Object.entries(contextualMappings)) {
      if (query.toLowerCase().includes(trigger)) {
        enhanced += " " + keywords.join(" ");
      }
    }

    return enhanced;
  }
}
```

### 3. Result Filtering and Ranking

```typescript
class ResultRanker {
  rankResults(results: SearchResult[], query: string, activeFile?: string): SearchResult[] {
    return results
      .map((result) => ({
        ...result,
        adjustedScore: this.calculateAdjustedScore(result, query, activeFile),
      }))
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .slice(0, 8); // Limit to top results
  }

  private calculateAdjustedScore(result: SearchResult, query: string, activeFile?: string): number {
    let score = result.relevanceScore;

    // Boost results from active file
    if (activeFile && result.metadata.filePath === activeFile) {
      score *= 1.5;
    }

    // Boost recent files
    const fileAge = this.getFileAge(result.metadata.filePath);
    if (fileAge < 7) {
      // Files modified in last week
      score *= 1.2;
    }

    // Boost based on content type
    const typeBoosts = {
      function: 1.1,
      class: 1.0,
      interface: 0.9,
      enum: 0.8,
    };

    score *= typeBoosts[result.metadata.type] || 1.0;

    // Boost based on query-specific factors
    if (query.toLowerCase().includes("implementation") && result.content.includes("implements")) {
      score *= 1.3;
    }

    if (query.toLowerCase().includes("error") && result.content.includes("throw")) {
      score *= 1.2;
    }

    return score;
  }

  private getFileAge(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays;
    } catch {
      return Infinity;
    }
  }
}
```

## 💾 Memory Optimization

### 1. Streaming Processing for Large Codebases

```typescript
class StreamingProcessor {
  private readonly CHUNK_SIZE = 50;
  private processingQueue: string[] = [];

  async processLargeCodebase(files: string[]): Promise<void> {
    logger.info(`Processing ${files.length} files in streaming mode`);

    // Sort files by size to process smaller files first
    const sortedFiles = await this.sortFilesBySize(files);

    for (let i = 0; i < sortedFiles.length; i += this.CHUNK_SIZE) {
      const chunk = sortedFiles.slice(i, i + this.CHUNK_SIZE);

      try {
        await this.processChunk(chunk);

        // Memory management
        if (global.gc && i % (this.CHUNK_SIZE * 4) === 0) {
          global.gc();
        }

        // Progress reporting
        const progress = Math.round((i / sortedFiles.length) * 100);
        logger.info(`Processing progress: ${progress}%`);

        // Yield control to prevent blocking
        await new Promise((resolve) => setImmediate(resolve));
      } catch (error) {
        logger.error(`Error processing chunk starting at index ${i}:`, error);
        // Continue with next chunk
      }
    }
  }

  private async processChunk(files: string[]): Promise<void> {
    const snippets: CodeSnippet[] = [];

    try {
      for (const file of files) {
        const fileSnippets = await this.extractSnippetsFromFile(file);
        snippets.push(...fileSnippets);
      }

      if (snippets.length > 0) {
        await this.vectorDb.indexCodeSnippets(snippets);
      }
    } finally {
      // Explicit cleanup
      snippets.length = 0;
    }
  }

  private async sortFilesBySize(files: string[]): Promise<string[]> {
    const fileStats = await Promise.all(
      files.map(async (file) => ({
        path: file,
        size: await this.getFileSize(file),
      }))
    );

    return fileStats.sort((a, b) => a.size - b.size).map((f) => f.path);
  }
}
```

### 2. Memory Pool Management

```typescript
class MemoryPool {
  private availableBuffers: ArrayBuffer[] = [];
  private readonly BUFFER_SIZE = 1024 * 1024; // 1MB buffers
  private readonly MAX_POOL_SIZE = 10;

  getBuffer(): ArrayBuffer {
    if (this.availableBuffers.length > 0) {
      return this.availableBuffers.pop()!;
    }

    return new ArrayBuffer(this.BUFFER_SIZE);
  }

  returnBuffer(buffer: ArrayBuffer): void {
    if (this.availableBuffers.length < this.MAX_POOL_SIZE) {
      // Clear buffer data
      new Uint8Array(buffer).fill(0);
      this.availableBuffers.push(buffer);
    }
    // Otherwise let it be garbage collected
  }

  cleanup(): void {
    this.availableBuffers.length = 0;
  }
}

// Usage in embedding processing
class MemoryOptimizedEmbeddingProcessor {
  private memoryPool = new MemoryPool();

  async processEmbeddings(texts: string[]): Promise<number[][]> {
    const buffer = this.memoryPool.getBuffer();

    try {
      // Use buffer for temporary processing
      const results = await this.generateEmbeddingsWithBuffer(texts, buffer);
      return results;
    } finally {
      this.memoryPool.returnBuffer(buffer);
    }
  }
}
```

### 3. Garbage Collection Optimization

```typescript
class GCOptimizer {
  private lastGCTime = 0;
  private readonly GC_INTERVAL = 30000; // 30 seconds
  private memoryThreshold = 500 * 1024 * 1024; // 500MB

  checkAndOptimizeMemory(): void {
    const now = Date.now();
    const memUsage = process.memoryUsage();

    if (memUsage.heapUsed > this.memoryThreshold || now - this.lastGCTime > this.GC_INTERVAL) {
      this.performOptimizedGC();
      this.lastGCTime = now;
    }
  }

  private performOptimizedGC(): void {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();

      const freed = before.heapUsed - after.heapUsed;
      logger.debug(`GC freed ${Math.round(freed / 1024 / 1024)}MB`);
    }
  }

  setMemoryThreshold(threshold: number): void {
    this.memoryThreshold = threshold;
  }
}
```

## ⚡ Indexing Performance

### 1. Parallel Processing with Worker Threads

```typescript
// worker-thread.ts
import { parentPort, workerData } from "worker_threads";
import { TypeScriptAtsMapper } from "./typescript-ats.service";

parentPort?.on("message", async (data) => {
  const { operation, payload } = data;

  try {
    switch (operation) {
      case "extractSnippets":
        const results = await extractSnippetsFromFiles(payload.files);
        parentPort?.postMessage({ success: true, results });
        break;

      case "generateEmbeddings":
        const embeddings = await generateEmbeddings(payload.texts);
        parentPort?.postMessage({ success: true, embeddings });
        break;
    }
  } catch (error) {
    parentPort?.postMessage({ success: false, error: error.message });
  }
});

// main-service.ts
class ParallelIndexingService {
  private workers: Worker[] = [];
  private readonly WORKER_COUNT = Math.min(4, os.cpus().length);

  async initializeWorkers(): Promise<void> {
    for (let i = 0; i < this.WORKER_COUNT; i++) {
      const worker = new Worker(__filename, {
        workerData: { workerId: i },
      });

      this.workers.push(worker);
    }
  }

  async processFilesInParallel(files: string[]): Promise<void> {
    const chunks = this.chunkArray(files, Math.ceil(files.length / this.WORKER_COUNT));

    const promises = chunks.map((chunk, index) => {
      const worker = this.workers[index % this.workers.length];
      return this.executeWorkerTask(worker, "extractSnippets", { files: chunk });
    });

    const results = await Promise.all(promises);

    // Combine and process results
    const allSnippets = results.flatMap((result) => result.results);
    await this.vectorDb.indexCodeSnippets(allSnippets);
  }

  private executeWorkerTask(worker: Worker, operation: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Worker task timeout"));
      }, 30000);

      const messageHandler = (message: any) => {
        clearTimeout(timeout);
        worker.off("message", messageHandler);

        if (message.success) {
          resolve(message);
        } else {
          reject(new Error(message.error));
        }
      };

      worker.on("message", messageHandler);
      worker.postMessage({ operation, payload });
    });
  }

  dispose(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}
```

### 2. Incremental Update Optimization

```typescript
class OptimizedSyncService extends VectorDbSyncService {
  private updateBatch: Map<string, "created" | "modified" | "deleted"> = new Map();
  private batchTimer?: NodeJS.Timeout;
  private readonly OPTIMAL_BATCH_SIZE = 25;
  private readonly BATCH_DELAY = 1000; // 1 second

  protected queueFileForSync(filePath: string, operation: "created" | "modified" | "deleted"): void {
    // Optimize operation - if a file is created then modified, just treat as created
    const existingOp = this.updateBatch.get(filePath);

    if (existingOp === "created" && operation === "modified") {
      // Keep as 'created'
      return;
    }

    if (existingOp === "modified" && operation === "deleted") {
      // Change to 'deleted'
      this.updateBatch.set(filePath, "deleted");
    } else {
      this.updateBatch.set(filePath, operation);
    }

    // Batch processing
    if (this.updateBatch.size >= this.OPTIMAL_BATCH_SIZE) {
      this.processBatchImmediately();
    } else {
      this.scheduleBatchProcessing();
    }
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatchImmediately();
    }, this.BATCH_DELAY);
  }

  private async processBatchImmediately(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    if (this.updateBatch.size === 0) return;

    const batch = new Map(this.updateBatch);
    this.updateBatch.clear();

    await this.processOptimizedBatch(batch);
  }

  private async processOptimizedBatch(batch: Map<string, "created" | "modified" | "deleted">): Promise<void> {
    const operations = {
      deleted: [] as string[],
      modified: [] as string[],
      created: [] as string[],
    };

    // Group operations
    for (const [filePath, operation] of batch) {
      operations[operation].push(filePath);
    }

    try {
      // Process deletions first (fastest)
      if (operations.deleted.length > 0) {
        await Promise.all(operations.deleted.map((file) => this.vectorDb.deleteByFilePath(file)));
      }

      // Process modifications and creations in parallel
      const toProcess = [...operations.modified, ...operations.created];
      if (toProcess.length > 0) {
        await this.processModificationsInParallel(toProcess);
      }

      logger.info(`Processed batch: ${operations.deleted.length} deleted, ${toProcess.length} updated/created`);
    } catch (error) {
      logger.error("Error processing optimized batch:", error);
    }
  }

  private async processModificationsInParallel(files: string[]): Promise<void> {
    const concurrency = Math.min(4, files.length);
    const semaphore = new Semaphore(concurrency);

    const promises = files.map(async (file) => {
      await semaphore.acquire();
      try {
        await this.reindexSingleFile(file);
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);
  }
}

class Semaphore {
  private tokens: number;
  private waitingQueue: Array<() => void> = [];

  constructor(tokens: number) {
    this.tokens = tokens;
  }

  async acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  release(): void {
    this.tokens++;

    if (this.waitingQueue.length > 0) {
      this.tokens--;
      const resolve = this.waitingQueue.shift()!;
      resolve();
    }
  }
}
```

## 📈 Monitoring and Profiling

### 1. Performance Dashboard

```typescript
class PerformanceDashboard {
  private metrics: PerformanceMetrics = {
    searchLatency: new RollingAverage(100),
    indexingThroughput: new RollingAverage(50),
    memoryUsage: new RollingAverage(20),
    cacheHitRate: new RollingAverage(100),
    errorRate: new RollingAverage(100),
  };

  recordSearchLatency(latency: number): void {
    this.metrics.searchLatency.add(latency);
  }

  recordIndexingOperation(itemsProcessed: number, timeMs: number): void {
    const throughput = itemsProcessed / (timeMs / 1000); // items per second
    this.metrics.indexingThroughput.add(throughput);
  }

  recordMemoryUsage(): void {
    const usage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.metrics.memoryUsage.add(usage);
  }

  getPerformanceReport(): PerformanceReport {
    return {
      avgSearchLatency: this.metrics.searchLatency.getAverage(),
      p95SearchLatency: this.metrics.searchLatency.getPercentile(0.95),
      avgIndexingThroughput: this.metrics.indexingThroughput.getAverage(),
      avgMemoryUsage: this.metrics.memoryUsage.getAverage(),
      cacheHitRate: this.metrics.cacheHitRate.getAverage(),
      errorRate: this.metrics.errorRate.getAverage(),
    };
  }

  checkPerformanceAlerts(): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const report = this.getPerformanceReport();

    if (report.avgSearchLatency > 500) {
      alerts.push({
        type: "HIGH_SEARCH_LATENCY",
        severity: "warning",
        message: `Average search latency is ${report.avgSearchLatency.toFixed(0)}ms`,
      });
    }

    if (report.avgMemoryUsage > 500) {
      alerts.push({
        type: "HIGH_MEMORY_USAGE",
        severity: "critical",
        message: `Memory usage is ${report.avgMemoryUsage.toFixed(0)}MB`,
      });
    }

    if (report.errorRate > 0.05) {
      alerts.push({
        type: "HIGH_ERROR_RATE",
        severity: "warning",
        message: `Error rate is ${(report.errorRate * 100).toFixed(1)}%`,
      });
    }

    return alerts;
  }
}

class RollingAverage {
  private values: number[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  add(value: number): void {
    this.values.push(value);
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((sum, val) => sum + val, 0) / this.values.length;
  }

  getPercentile(percentile: number): number {
    if (this.values.length === 0) return 0;

    const sorted = [...this.values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }
}
```

### 2. Automated Performance Testing

```typescript
class PerformanceTestSuite {
  async runPerformanceTests(): Promise<TestResults> {
    const results: TestResults = {
      timestamp: new Date(),
      tests: [],
    };

    // Test 1: Search performance
    results.tests.push(await this.testSearchPerformance());

    // Test 2: Indexing performance
    results.tests.push(await this.testIndexingPerformance());

    // Test 3: Memory usage
    results.tests.push(await this.testMemoryUsage());

    // Test 4: Concurrent operations
    results.tests.push(await this.testConcurrentOperations());

    return results;
  }

  private async testSearchPerformance(): Promise<TestResult> {
    const testQueries = [
      "authentication implementation",
      "database connection",
      "error handling",
      "user interface components",
      "API endpoint validation",
    ];

    const latencies: number[] = [];

    for (const query of testQueries) {
      const start = performance.now();
      await this.vectorDb.semanticSearch(query, 10);
      const latency = performance.now() - start;
      latencies.push(latency);
    }

    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    return {
      name: "Search Performance",
      passed: avgLatency < 500 && maxLatency < 1000,
      metrics: {
        avgLatency: avgLatency.toFixed(2) + "ms",
        maxLatency: maxLatency.toFixed(2) + "ms",
        queriesPerSecond: (1000 / avgLatency).toFixed(1),
      },
    };
  }

  private async testIndexingPerformance(): Promise<TestResult> {
    const testSnippets = this.generateTestSnippets(100);

    const start = performance.now();
    await this.vectorDb.indexCodeSnippets(testSnippets);
    const duration = performance.now() - start;

    const throughput = testSnippets.length / (duration / 1000);

    return {
      name: "Indexing Performance",
      passed: throughput > 10, // 10 snippets per second minimum
      metrics: {
        duration: duration.toFixed(2) + "ms",
        throughput: throughput.toFixed(1) + " snippets/sec",
        totalSnippets: testSnippets.length.toString(),
      },
    };
  }

  private async testMemoryUsage(): Promise<TestResult> {
    const memBefore = process.memoryUsage();

    // Perform memory-intensive operations
    const largeSnippets = this.generateTestSnippets(1000);
    await this.vectorDb.indexCodeSnippets(largeSnippets);

    const memAfter = process.memoryUsage();
    const memoryIncrease = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;

    return {
      name: "Memory Usage",
      passed: memoryIncrease < 100, // Less than 100MB increase
      metrics: {
        memoryIncrease: memoryIncrease.toFixed(2) + "MB",
        totalHeapUsed: (memAfter.heapUsed / 1024 / 1024).toFixed(2) + "MB",
      },
    };
  }
}
```

## 🎛️ Configuration Optimization

### 1. Environment-Specific Configurations

```typescript
// performance.config.ts
import { getGenerativeAiModel, getAPIKeyAndModel } from "../utils/utils";

export interface PerformanceConfig {
  model: {
    currentProvider: string; // From generativeAi.option
    apiKey: string;
    modelName: string;
  };
  embeddings: {
    batchSize: number;
    maxCacheSize: number;
    rateLimitDelay: number;
  };
  search: {
    maxResults: number;
    cacheSize: number;
    timeoutMs: number;
  };
  indexing: {
    chunkSize: number;
    concurrency: number;
    gcInterval: number;
  };
  memory: {
    maxHeapMB: number;
    gcThresholdMB: number;
    bufferPoolSize: number;
  };
}

export const getOptimalConfig = (): PerformanceConfig => {
  const isProduction = process.env.NODE_ENV === "production";
  const availableMemory = os.totalmem() / 1024 / 1024; // MB
  const cpuCount = os.cpus().length;

  // Get currently selected model from CodeBuddy configuration
  const currentProvider = getGenerativeAiModel() || "Gemini";
  const { apiKey, model } = getAPIKeyAndModel(currentProvider);

  if (isProduction) {
    return {
      model: {
        currentProvider,
        apiKey,
        modelName: model || "default",
      },
      embeddings: {
        batchSize: Math.min(50, Math.floor(availableMemory / 100)),
        maxCacheSize: Math.min(20000, Math.floor(availableMemory / 10)),
        rateLimitDelay: 100,
      },
      search: {
        maxResults: 15,
        cacheSize: 1000,
        timeoutMs: 5000,
      },
      indexing: {
        chunkSize: Math.min(100, Math.floor(availableMemory / 50)),
        concurrency: Math.min(6, cpuCount),
        gcInterval: 30000,
      },
      memory: {
        maxHeapMB: Math.floor(availableMemory * 0.6),
        gcThresholdMB: Math.floor(availableMemory * 0.4),
        bufferPoolSize: Math.min(20, Math.floor(availableMemory / 100)),
      },
    };
  } else {
    // Development settings - more conservative
    return {
      embeddings: {
        batchSize: 10,
        maxCacheSize: 1000,
        rateLimitDelay: 200,
      },
      search: {
        maxResults: 8,
        cacheSize: 100,
        timeoutMs: 3000,
      },
      indexing: {
        chunkSize: 25,
        concurrency: 2,
        gcInterval: 15000,
      },
      memory: {
        maxHeapMB: 512,
        gcThresholdMB: 256,
        bufferPoolSize: 5,
      },
    };
  }
};
```

## 🚀 Deployment Optimization

### 1. Production Deployment Checklist

```typescript
class ProductionOptimizer {
  async optimizeForProduction(): Promise<void> {
    // 1. Memory optimization
    this.configureMemorySettings();

    // 2. Database optimization
    await this.optimizeVectorDatabase();

    // 3. Cache warming
    await this.warmupCaches();

    // 4. Performance monitoring setup
    this.setupPerformanceMonitoring();

    // 5. Error handling optimization
    this.setupOptimizedErrorHandling();
  }

  private configureMemorySettings(): void {
    // Set optimal Node.js flags
    if (process.env.NODE_OPTIONS) {
      process.env.NODE_OPTIONS += " --max-old-space-size=4096 --optimize-for-size";
    } else {
      process.env.NODE_OPTIONS = "--max-old-space-size=4096 --optimize-for-size";
    }

    // Configure garbage collection
    if (global.gc) {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > 500 * 1024 * 1024) {
          // 500MB threshold
          global.gc();
        }
      }, 30000);
    }
  }

  private async warmupCaches(): Promise<void> {
    // Pre-populate commonly used queries
    const commonQueries = ["authentication", "database", "error handling", "user interface", "API endpoint"];

    for (const query of commonQueries) {
      try {
        await this.vectorDb.semanticSearch(query, 5);
      } catch (error) {
        logger.warn(`Cache warmup failed for query "${query}":`, error);
      }
    }
  }
}
```

This comprehensive performance optimization guide provides strategies for every aspect of the vector database system. Implement these optimizations progressively, starting with the most impactful ones for your specific use case.

For troubleshooting performance issues, refer to the [Troubleshooting Guide](VECTOR_DB_TROUBLESHOOTING.md).
