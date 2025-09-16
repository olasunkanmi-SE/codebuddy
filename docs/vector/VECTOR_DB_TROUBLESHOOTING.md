# Vector Database Troubleshooting Guide

## 🚨 Quick Diagnosis

Use this checklist to quickly identify common issues:

- [ ] Vector database initialized properly
- [ ] File system watcher is running
- [ ] ChromaDB dependencies installed
- [ ] API keys configured correctly
- [ ] File permissions are adequate
- [ ] Memory usage within limits
- [ ] VS Code extension host running

## 🔍 Common Issues & Solutions

### 1. Embedding Model API Issues

#### Issue: "Gemini API key is required for embedding generation"

**Symptoms:**

- Error occurs even when using Groq/Anthropic as chat model
- Vector database initialization fails
- Context extraction doesn't work

**Root Cause:**
The embedding system always uses Gemini's `text-embedding-004` model for consistency, regardless of your selected chat model.

**Solutions:**

1. **Configure Gemini API Key (Required for All Users):**

   ```json
   {
     "generativeAi.option": "Groq",
     "groq.llama3.apiKey": "your-groq-key",
     "google.gemini.apiKeys": "your-gemini-key" // Required for embeddings!
   }
   ```

2. **Get Gemini API Key:**

   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Add it to VS Code settings under `google.gemini.apiKeys`

3. **Test Embedding Generation:**
   ```typescript
   // Test if embeddings work
   const { apiKey } = getAPIKeyAndModel("Gemini");
   const embeddingService = new EmbeddingService(apiKey);
   const testEmbedding = await embeddingService.generateEmbedding("test");
   console.log("Success! Embedding dimensions:", testEmbedding.length);
   ```

---

### 2. Initialization Problems

#### Issue: `VectorDatabaseNotInitializedError`

**Symptoms:**

```
Error: Vector database not initialized. Call initialize() first.
```

**Causes:**

- `initialize()` method not called
- Initialization failed silently
- ChromaDB installation issues

**Solutions:**

1. **Ensure Proper Initialization Order**

   ```typescript
   // ✅ Correct
   const vectorDb = new VectorDatabaseService(context, apiKey);
   await vectorDb.initialize(); // Must be called first
   await vectorDb.indexCodeSnippets(snippets);

   // ❌ Incorrect
   const vectorDb = new VectorDatabaseService(context, apiKey);
   await vectorDb.indexCodeSnippets(snippets); // Will fail
   ```

2. **Check Initialization Success**

   ```typescript
   try {
     await vectorDb.initialize();
     const stats = vectorDb.getStats();
     if (!stats.isInitialized) {
       throw new Error("Database initialization failed");
     }
   } catch (error) {
     logger.error("Vector DB initialization failed:", error);
     // Handle graceful degradation
   }
   ```

3. **Verify ChromaDB Installation**

   ```bash
   npm list chromadb
   # Should show installed version

   # If missing or outdated:
   npm install chromadb@latest
   ```

#### Issue: `EACCES: permission denied`

**Symptoms:**

```
Error: EACCES: permission denied, mkdir '/path/to/vector_db'
```

**Solutions:**

1. **Check Directory Permissions**

   ```typescript
   const dbPath = path.join(context.extensionPath, "vector_db");

   // Ensure directory exists and is writable
   if (!fs.existsSync(path.dirname(dbPath))) {
     fs.mkdirSync(path.dirname(dbPath), { recursive: true });
   }
   ```

2. **Use Alternative Path**
   ```typescript
   // Use user data directory instead of extension path
   const dbPath = path.join(context.globalStorageUri.fsPath, "vector_db");
   ```

### 2. Embedding Generation Issues

#### Issue: `OpenAI API Rate Limit Exceeded`

**Symptoms:**

```
Error: Rate limit exceeded. Please try again later.
```

**Solutions:**

1. **Implement Rate Limiting**

   ```typescript
   class RateLimitedEmbeddingService {
     private lastRequest = 0;
     private readonly minInterval = 1000; // 1 second between requests

     async generateEmbedding(text: string): Promise<number[]> {
       const now = Date.now();
       const timeSinceLastRequest = now - this.lastRequest;

       if (timeSinceLastRequest < this.minInterval) {
         await new Promise((resolve) => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
       }

       this.lastRequest = Date.now();
       return this.callOpenAI(text);
     }
   }
   ```

2. **Batch Processing**

   ```typescript
   // Process in smaller batches
   const batchSize = 10; // Reduce from default 50

   for (let i = 0; i < snippets.length; i += batchSize) {
     const batch = snippets.slice(i, i + batchSize);
     await this.processBatch(batch);

     // Add delay between batches
     await new Promise((resolve) => setTimeout(resolve, 2000));
   }
   ```

3. **Use Local Embeddings as Fallback**
   ```typescript
   async generateEmbeddings(texts: string[]): Promise<number[][]> {
     try {
       return await this.openAIEmbeddings(texts);
     } catch (error) {
       if (error.message.includes('rate limit')) {
         logger.warn('OpenAI rate limited, switching to local embeddings');
         return await this.localEmbeddings(texts);
       }
       throw error;
     }
   }
   ```

#### Issue: `Invalid API Key`

**Symptoms:**

```
Error: Invalid API key provided
```

**Solutions:**

1. **Verify API Key Configuration**

   ```typescript
   const apiKey = process.env.OPENAI_API_KEY || vscode.workspace.getConfiguration().get("codebuddy.apiKey");

   if (!apiKey || apiKey.startsWith("sk-") === false) {
     throw new Error("Valid OpenAI API key required");
   }
   ```

2. **Graceful Degradation**
   ```typescript
   try {
     const embeddingFunction = new OpenAIEmbeddingFunction({
       openai_api_key: apiKey,
     });
   } catch (error) {
     logger.warn("OpenAI unavailable, using local embeddings");
     // Fallback to local embedding function
     const embeddingFunction = new LocalEmbeddingFunction();
   }
   ```

### 3. File Synchronization Issues

#### Issue: File Changes Not Detected

**Symptoms:**

- Code changes don't update vector database
- Search results become stale
- New files not indexed

**Solutions:**

1. **Verify File Watcher Setup**

   ```typescript
   // Debug file watcher events
   const watcher = vscode.workspace.createFileSystemWatcher("**/*.{ts,tsx,js,jsx}");

   watcher.onDidCreate((uri) => {
     logger.debug(`File created: ${uri.fsPath}`);
     // Verify this log appears when creating files
   });

   watcher.onDidChange((uri) => {
     logger.debug(`File changed: ${uri.fsPath}`);
     // Verify this log appears when editing files
   });
   ```

2. **Check File Patterns**

   ```typescript
   // Ensure pattern matches your file types
   const patterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"];

   // Create separate watchers if needed
   patterns.forEach((pattern) => {
     const watcher = vscode.workspace.createFileSystemWatcher(pattern);
     // ... setup handlers
   });
   ```

3. **Manual Sync Trigger**
   ```typescript
   // Add command for manual sync
   vscode.commands.registerCommand("codebuddy.syncVectorDb", async () => {
     await syncService.performFullReindex();
     vscode.window.showInformationMessage("Vector database synchronized");
   });
   ```

#### Issue: High CPU Usage During Sync

**Symptoms:**

- VS Code becomes unresponsive
- High CPU usage during file operations
- System slowdown

**Solutions:**

1. **Implement Throttling**

   ```typescript
   class ThrottledSyncService {
     private syncQueue: Set<string> = new Set();
     private isProcessing = false;
     private readonly maxConcurrent = 2; // Limit concurrent operations

     async processSyncQueue(): Promise<void> {
       if (this.isProcessing) return;
       this.isProcessing = true;

       try {
         const files = Array.from(this.syncQueue);
         this.syncQueue.clear();

         // Process in small batches
         for (let i = 0; i < files.length; i += this.maxConcurrent) {
           const batch = files.slice(i, i + this.maxConcurrent);
           await Promise.all(batch.map((file) => this.processFile(file)));

           // Yield control between batches
           await new Promise((resolve) => setImmediate(resolve));
         }
       } finally {
         this.isProcessing = false;
       }
     }
   }
   ```

2. **Use Worker Threads for Heavy Operations**

   ```typescript
   // offload-worker.ts
   const { parentPort } = require("worker_threads");

   parentPort.on("message", async (data) => {
     const { operation, payload } = data;

     switch (operation) {
       case "generateEmbeddings":
         const embeddings = await generateEmbeddings(payload.texts);
         parentPort.postMessage({ success: true, result: embeddings });
         break;
     }
   });

   // main-service.ts
   const worker = new Worker("./offload-worker.js");
   const embeddings = await this.callWorker("generateEmbeddings", { texts });
   ```

### 4. Memory Issues

#### Issue: `JavaScript heap out of memory`

**Symptoms:**

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Implement Streaming for Large Datasets**

   ```typescript
   async processLargeCodebase(): Promise<void> {
     const allFiles = await this.getAllTypeScriptFiles();

     // Process in chunks to avoid memory buildup
     const chunkSize = 100;

     for (let i = 0; i < allFiles.length; i += chunkSize) {
       const chunk = allFiles.slice(i, i + chunkSize);

       // Process chunk
       const snippets = await this.extractSnippetsFromFiles(chunk);
       await this.vectorDb.indexCodeSnippets(snippets);

       // Force garbage collection
       if (global.gc) {
         global.gc();
       }

       // Clear processed data
       snippets.length = 0;
     }
   }
   ```

2. **Memory Monitoring**

   ```typescript
   function logMemoryUsage(operation: string): void {
     const used = process.memoryUsage();
     logger.info(`Memory usage after ${operation}:`, {
       rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
       heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
       heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
     });
   }

   // Usage
   await this.vectorDb.indexCodeSnippets(snippets);
   logMemoryUsage("indexing");
   ```

3. **Increase Node.js Memory Limit**
   ```json
   // package.json
   {
     "scripts": {
       "compile": "node --max-old-space-size=4096 ./node_modules/.bin/tsc"
     }
   }
   ```

### 5. Search Performance Issues

#### Issue: Slow Semantic Search

**Symptoms:**

- Search takes > 5 seconds
- UI becomes unresponsive during search
- High memory usage during queries

**Solutions:**

1. **Implement Search Caching**

   ```typescript
   class CachedVectorSearch {
     private cache = new Map<string, SearchResult[]>();
     private readonly cacheSize = 100;

     async semanticSearch(query: string): Promise<SearchResult[]> {
       const cacheKey = this.normalizeQuery(query);

       if (this.cache.has(cacheKey)) {
         return this.cache.get(cacheKey)!;
       }

       const results = await this.vectorDb.semanticSearch(query);

       // Manage cache size
       if (this.cache.size >= this.cacheSize) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
       }

       this.cache.set(cacheKey, results);
       return results;
     }
   }
   ```

2. **Optimize Query Parameters**

   ```typescript
   // Reduce result count for faster queries
   const results = await vectorDb.semanticSearch(
     query,
     5, // Reduced from 10
     {
       // Add filters to reduce search space
       type: "function", // Only search functions
     }
   );
   ```

3. **Implement Progressive Search**

   ```typescript
   async progressiveSearch(query: string): Promise<SearchResult[]> {
     // Start with quick, limited search
     let results = await this.vectorDb.semanticSearch(query, 3);

     if (results.length < 3) {
       // Expand search if needed
       results = await this.vectorDb.semanticSearch(query, 10);
     }

     return results;
   }
   ```

### 6. Context Extraction Issues

#### Issue: Context Too Generic

**Symptoms:**

- AI responses lack specific code examples
- No file references in responses
- Generic explanations instead of codebase-specific

**Solutions:**

1. **Improve Search Query Processing**

   ```typescript
   private enhanceQuery(originalQuery: string): string {
     // Extract technical terms
     const techTerms = this.extractTechnicalTerms(originalQuery);

     // Add context keywords
     const contextKeywords = ['implementation', 'code', 'function', 'class'];

     // Combine for better search
     return `${originalQuery} ${techTerms.join(' ')} ${contextKeywords.join(' ')}`;
   }
   ```

2. **Boost File-Specific Results**

   ```typescript
   async getEnhancedContext(query: string, activeFile?: string): Promise<string> {
     let results = await this.vectorDb.semanticSearch(query, 10);

     if (activeFile) {
       // Boost results from active file
       const fileResults = await this.vectorDb.semanticSearch(
         query,
         5,
         { filePath: { $eq: activeFile } }
       );

       // Merge and deduplicate
       results = [...fileResults, ...results].slice(0, 8);
     }

     return this.formatResults(results);
   }
   ```

3. **Validate Context Quality**

   ````typescript
   private validateContext(context: string): boolean {
     const qualityIndicators = [
       context.includes('```'), // Has code blocks
       context.includes('File:'), // Has file references
       context.length > 500, // Sufficient detail
       /\.(ts|js|tsx|jsx):/.test(context) // Has file extensions
     ];

     return qualityIndicators.filter(Boolean).length >= 3;
   }
   ````

## 🛠️ Diagnostic Tools

### Health Check Script

```typescript
// src/diagnostics/vector-db-health.ts
export class VectorDbHealthCheck {
  async runFullDiagnostic(): Promise<DiagnosticReport> {
    const report: DiagnosticReport = {
      timestamp: new Date(),
      checks: [],
    };

    // 1. Database Connection
    report.checks.push(await this.checkDatabaseConnection());

    // 2. File Watcher Status
    report.checks.push(await this.checkFileWatcher());

    // 3. Embedding Service
    report.checks.push(await this.checkEmbeddingService());

    // 4. Memory Usage
    report.checks.push(await this.checkMemoryUsage());

    // 5. Search Performance
    report.checks.push(await this.checkSearchPerformance());

    return report;
  }

  private async checkDatabaseConnection(): Promise<HealthCheckResult> {
    try {
      const stats = this.vectorDb.getStats();
      return {
        name: "Database Connection",
        status: stats.isInitialized ? "healthy" : "unhealthy",
        details: stats,
      };
    } catch (error) {
      return {
        name: "Database Connection",
        status: "error",
        error: error.message,
      };
    }
  }

  private async checkSearchPerformance(): Promise<HealthCheckResult> {
    const testQuery = "test function implementation";
    const startTime = Date.now();

    try {
      const results = await this.vectorDb.semanticSearch(testQuery, 5);
      const duration = Date.now() - startTime;

      return {
        name: "Search Performance",
        status: duration < 1000 ? "healthy" : "warning",
        details: {
          duration: `${duration}ms`,
          resultCount: results.length,
        },
      };
    } catch (error) {
      return {
        name: "Search Performance",
        status: "error",
        error: error.message,
      };
    }
  }
}
```

### Debug Logging Configuration

```typescript
// Enable debug logging
const logger = Logger.initialize("VectorDb", {
  minLevel: LogLevel.DEBUG,
  enableFileLogging: true,
  logFilePath: path.join(context.extensionPath, "logs", "vector-db.log"),
});

// Log configuration
logger.debug("Vector DB Configuration:", {
  maxContextTokens: config.maxTokens,
  batchSize: config.batchSize,
  embeddingModel: config.embeddingModel,
  dbPath: vectorDbPath,
});
```

### Performance Profiler

```typescript
class VectorDbProfiler {
  private metrics: Map<string, number[]> = new Map();

  async profile<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }

      this.metrics.get(operation)!.push(duration);
      return result;
    } catch (error) {
      logger.error(`Operation ${operation} failed:`, error);
      throw error;
    }
  }

  getReport(): PerformanceReport {
    const report: PerformanceReport = {};

    for (const [operation, times] of this.metrics) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      report[operation] = { avg, min, max, count: times.length };
    }

    return report;
  }
}

// Usage
const profiler = new VectorDbProfiler();

const results = await profiler.profile("semantic_search", () => vectorDb.semanticSearch(query, 10));
```

## 📊 Monitoring & Alerting

### Key Metrics to Monitor

1. **Search Latency**

   - Target: < 500ms for typical queries
   - Alert: > 2 seconds

2. **Memory Usage**

   - Target: < 500MB for VS Code extension
   - Alert: > 1GB

3. **Indexing Rate**

   - Target: > 10 files/second
   - Alert: < 1 file/second

4. **Error Rate**
   - Target: < 1% of operations
   - Alert: > 5% of operations

### Monitoring Implementation

```typescript
class VectorDbMonitor {
  private metrics = {
    searchCount: 0,
    searchLatencySum: 0,
    indexingCount: 0,
    errorCount: 0,
  };

  recordSearch(latency: number): void {
    this.metrics.searchCount++;
    this.metrics.searchLatencySum += latency;
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  getMetrics(): MonitoringMetrics {
    const avgLatency = this.metrics.searchCount > 0 ? this.metrics.searchLatencySum / this.metrics.searchCount : 0;

    return {
      avgSearchLatency: avgLatency,
      totalSearches: this.metrics.searchCount,
      errorRate: this.metrics.errorCount / (this.metrics.searchCount + this.metrics.indexingCount),
      memoryUsage: process.memoryUsage(),
    };
  }
}
```

## 🆘 Emergency Recovery

### Database Corruption Recovery

```typescript
async recoverFromCorruption(): Promise<void> {
  logger.warn('Attempting vector database recovery...');

  try {
    // 1. Backup current state (if possible)
    await this.backupVectorDb();

    // 2. Clear corrupted database
    await this.vectorDb.clearAll();

    // 3. Reinitialize
    await this.vectorDb.initialize();

    // 4. Perform full reindex
    await this.syncService.performFullReindex();

    logger.info('Vector database recovery completed');

  } catch (error) {
    logger.error('Recovery failed:', error);

    // Last resort: disable vector search
    this.disableVectorSearch();
  }
}

private disableVectorSearch(): void {
  logger.warn('Disabling vector search due to unrecoverable errors');

  // Switch to fallback mode
  this.useVectorSearch = false;

  // Notify user
  vscode.window.showWarningMessage(
    'Vector search temporarily disabled. Context extraction will use keyword matching.',
    'Retry', 'Dismiss'
  ).then(selection => {
    if (selection === 'Retry') {
      this.recoverFromCorruption();
    }
  });
}
```

### Reset to Factory Settings

```typescript
async factoryReset(): Promise<void> {
  const confirmed = await vscode.window.showWarningMessage(
    'This will delete all indexed data and start fresh. Continue?',
    { modal: true },
    'Yes, Reset'
  );

  if (confirmed === 'Yes, Reset') {
    // Clear all data
    await this.vectorDb.clearAll();
    await this.sqliteDb.clearCache();

    // Reinitialize
    await this.initializeFromScratch();
  }
}
```

## 📞 Getting Help

### Log Collection for Support

```typescript
async collectSupportLogs(): Promise<string> {
  const logs = {
    timestamp: new Date().toISOString(),
    version: this.getVersion(),
    configuration: this.getConfiguration(),
    healthCheck: await this.healthCheck.runFullDiagnostic(),
    recentLogs: this.getRecentLogs(100),
    performance: this.profiler.getReport()
  };

  const logPath = path.join(context.extensionPath, `support-logs-${Date.now()}.json`);
  await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

  return logPath;
}
```

### Support Channels

- **GitHub Issues**: [CodeBuddy Repository](https://github.com/olasunkanmi-SE/codebuddy/issues)
- **Documentation**: [Vector DB Knowledgebase](VECTOR_DATABASE_KNOWLEDGEBASE.md)
- **API Reference**: [Vector DB API Reference](VECTOR_DB_API_REFERENCE.md)

When reporting issues, please include:

1. Steps to reproduce
2. Expected vs actual behavior
3. Support logs (use `collectSupportLogs()`)
4. Environment information (OS, VS Code version, Node.js version)
5. Extension version and configuration
