import * as assert from "assert";
import * as sinon from "sinon";
import { PerformanceProfiler } from "../../services/performance-profiler.service";
import { ProductionSafeguards } from "../../services/production-safeguards.service";
import { EnhancedCacheManager } from "../../services/enhanced-cache-manager.service";

suite("Phase 5: Performance & Production Tests", () => {
  let performanceProfiler: PerformanceProfiler;
  let productionSafeguards: ProductionSafeguards;
  let enhancedCacheManager: EnhancedCacheManager;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
    performanceProfiler?.dispose();
    productionSafeguards?.dispose();
    enhancedCacheManager?.dispose();
  });

  suite("PerformanceProfiler", () => {
    test("should initialize with default configuration", () => {
      performanceProfiler = new PerformanceProfiler();

      const stats = performanceProfiler.getStats();
      assert.strictEqual(stats.searchLatency.count, 0);
      assert.strictEqual(stats.indexingThroughput.count, 0);
      assert.strictEqual(stats.alertCount, 0);
    });

    test("should measure operation performance", async () => {
      performanceProfiler = new PerformanceProfiler();

      const result = await performanceProfiler.measure("search", async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "test result";
      });

      assert.strictEqual(result, "test result");

      const stats = performanceProfiler.getStats();
      assert.strictEqual(stats.searchLatency.count, 1);
      assert.ok(stats.searchLatency.avg >= 100);
    });

    test("should record search latency", () => {
      performanceProfiler = new PerformanceProfiler();

      performanceProfiler.recordSearchLatency(250);
      performanceProfiler.recordSearchLatency(150);

      const stats = performanceProfiler.getStats();
      assert.strictEqual(stats.searchLatency.count, 2);
      assert.strictEqual(stats.searchLatency.avg, 200);
    });

    test("should generate performance report", () => {
      performanceProfiler = new PerformanceProfiler();

      performanceProfiler.recordSearchLatency(300);
      performanceProfiler.recordIndexingOperation(10, 1000);
      performanceProfiler.recordCacheHit(true);
      performanceProfiler.recordCacheHit(false);

      const report = performanceProfiler.getPerformanceReport();
      assert.strictEqual(report.avgSearchLatency, 300);
      assert.strictEqual(report.avgIndexingThroughput, 10);
      assert.strictEqual(report.cacheHitRate, 0.5);
    });

    test("should check for performance alerts", () => {
      performanceProfiler = new PerformanceProfiler();

      // Record high latency to trigger alert
      performanceProfiler.recordSearchLatency(1200);

      const alerts = performanceProfiler.checkPerformanceAlerts();
      assert.ok(alerts.length > 0);
      assert.strictEqual(alerts[0].type, "HIGH_SEARCH_LATENCY");
      assert.strictEqual(alerts[0].severity, "critical");
    });

    test("should get optimized configuration", () => {
      performanceProfiler = new PerformanceProfiler();

      const config = performanceProfiler.getOptimizedConfig();
      assert.ok(config.embeddings.batchSize > 0);
      assert.ok(config.search.maxResults > 0);
      assert.ok(config.memory.maxHeapMB > 0);
    });
  });

  suite("ProductionSafeguards", () => {
    test("should initialize with default limits", () => {
      productionSafeguards = new ProductionSafeguards();

      const status = productionSafeguards.getStatus();
      assert.strictEqual(status.emergencyStopActive, false);
      assert.strictEqual(status.circuitBreakerState, "CLOSED");
      assert.ok(status.resourceLimits.maxMemoryMB > 0);
    });

    test("should execute operation with safeguards", async () => {
      productionSafeguards = new ProductionSafeguards({
        maxMemoryMB: 2048,
        maxHeapMB: 1024,
        maxCpuPercent: 80,
        gcThresholdMB: 512,
        alertThresholdMB: 800,
      });

      const result = await productionSafeguards.executeWithSafeguards("test-operation", async () => {
        return "success";
      });

      assert.strictEqual(result, "success");
    });

    test("should handle operation timeout", async () => {
      productionSafeguards = new ProductionSafeguards();

      const start = Date.now();
      try {
        await productionSafeguards.executeWithSafeguards(
          "timeout-operation",
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return "should not reach here";
          },
          { timeoutMs: 20 }
        );
        assert.fail("Should have thrown timeout error");
      } catch (error) {
        const duration = Date.now() - start;
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes("timed out"));
        assert.ok(duration < 100); // Should timeout before the operation completes
      }
    });

    test("should update resource limits", () => {
      productionSafeguards = new ProductionSafeguards();

      productionSafeguards.updateResourceLimits({
        maxMemoryMB: 512,
        maxHeapMB: 256,
      });

      const status = productionSafeguards.getStatus();
      assert.strictEqual(status.resourceLimits.maxMemoryMB, 512);
      assert.strictEqual(status.resourceLimits.maxHeapMB, 256);
    });
  });

  suite("EnhancedCacheManager", () => {
    test("should initialize with default configuration", () => {
      enhancedCacheManager = new EnhancedCacheManager();

      const stats = enhancedCacheManager.getStats();
      assert.strictEqual(stats.size, 0);
      assert.strictEqual(stats.hitCount, 0);
      assert.strictEqual(stats.missCount, 0);
    });

    test("should cache and retrieve embeddings", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      const embedding = [0.1, 0.2, 0.3, 0.4];
      await enhancedCacheManager.setEmbedding("test-key", embedding);

      const retrieved = await enhancedCacheManager.getEmbedding("test-key");
      assert.deepStrictEqual(retrieved, embedding);

      const stats = enhancedCacheManager.getStats();
      assert.strictEqual(stats.hitCount, 1);
      assert.strictEqual(stats.missCount, 0);
    });

    test("should handle cache miss", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      const result = await enhancedCacheManager.getEmbedding("non-existent-key");
      assert.strictEqual(result, null);

      const stats = enhancedCacheManager.getStats();
      assert.strictEqual(stats.hitCount, 0);
      assert.strictEqual(stats.missCount, 1);
    });

    test("should cache search results", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      const searchResults = { results: ["result1", "result2"], score: 0.95 };
      await enhancedCacheManager.setSearchResults("search-key", searchResults);

      const retrieved = await enhancedCacheManager.getSearchResults("search-key");
      assert.deepStrictEqual(retrieved, searchResults);
    });

    test("should respect TTL for cache entries", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      // Set entry with very short TTL
      await enhancedCacheManager.setEmbedding("ttl-key", [1, 2, 3], 1); // 1ms TTL

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await enhancedCacheManager.getEmbedding("ttl-key");
      assert.strictEqual(result, null);
    });

    test("should clear specific cache types", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      await enhancedCacheManager.setEmbedding("emb-key", [1, 2, 3]);
      await enhancedCacheManager.setSearchResults("search-key", { results: [] });

      await enhancedCacheManager.clearCache("embedding");

      const embResult = await enhancedCacheManager.getEmbedding("emb-key");
      const searchResult = await enhancedCacheManager.getSearchResults("search-key");

      assert.strictEqual(embResult, null);
      assert.ok(searchResult !== null); // Search cache should still exist
    });

    test("should get cache info", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      await enhancedCacheManager.setEmbedding("key1", [1, 2, 3]);
      await enhancedCacheManager.setSearchResults("key2", { data: "test" });

      const info = enhancedCacheManager.getCacheInfo();
      assert.strictEqual(info.embedding.size, 1);
      assert.strictEqual(info.search.size, 1);
      assert.strictEqual(info.total.size, 2);
    });

    test("should optimize configuration", async () => {
      enhancedCacheManager = new EnhancedCacheManager();

      // Simulate some cache activity
      await enhancedCacheManager.setEmbedding("key1", [1, 2, 3]);
      await enhancedCacheManager.getEmbedding("key1"); // Hit
      await enhancedCacheManager.getEmbedding("key2"); // Miss

      await enhancedCacheManager.optimizeConfiguration();

      // Should not throw and should complete successfully
      const stats = enhancedCacheManager.getStats();
      assert.ok(stats.hitCount >= 0);
    });
  });

  suite("Integration", () => {
    test("should work together for performance monitoring", async () => {
      performanceProfiler = new PerformanceProfiler();
      enhancedCacheManager = new EnhancedCacheManager({}, performanceProfiler);

      // Simulate cache operations
      await enhancedCacheManager.setEmbedding("test", [1, 2, 3]);
      await enhancedCacheManager.getEmbedding("test"); // Hit
      await enhancedCacheManager.getEmbedding("miss"); // Miss

      // Should record cache metrics
      const cacheInfo = enhancedCacheManager.getCacheInfo();
      assert.strictEqual(cacheInfo.total.hitRate, 0.5); // 1 hit, 1 miss
    });

    test("should handle production workload simulation", async () => {
      performanceProfiler = new PerformanceProfiler();
      productionSafeguards = new ProductionSafeguards();
      enhancedCacheManager = new EnhancedCacheManager({}, performanceProfiler);

      // Simulate production workload
      const operations = Array.from({ length: 10 }, (_, i) =>
        productionSafeguards.executeWithSafeguards(`operation-${i}`, async () => {
          // Simulate search with caching
          const cached = await enhancedCacheManager.getEmbedding(`key-${i}`);
          if (!cached) {
            const embedding = Array.from({ length: 384 }, () => Math.random());
            await enhancedCacheManager.setEmbedding(`key-${i}`, embedding);
            performanceProfiler.recordSearchLatency(100 + Math.random() * 200);
          }
          return `result-${i}`;
        })
      );

      const results = await Promise.all(operations);
      assert.strictEqual(results.length, 10);

      const stats = performanceProfiler.getStats();
      assert.ok(stats.searchLatency.count >= 0);

      const status = productionSafeguards.getStatus();
      assert.strictEqual(status.emergencyStopActive, false);
    });
  });
});
