import * as assert from "assert";
import * as vscode from "vscode";
import {
  ProductionSafeguards,
  ServiceStatusChecker,
} from "../../services/production-safeguards.service";

/**
 * Test suite for production safeguards indexing status fix
 */
suite("ProductionSafeguards - Indexing Status Fix", () => {
  let productionSafeguards: ProductionSafeguards;

  teardown(() => {
    productionSafeguards?.dispose();
  });

  test("should not trigger PAUSE_INDEXING when indexing is not running", async () => {
    // Create a mock service status checker that reports indexing as NOT running
    const mockStatusChecker: ServiceStatusChecker = {
      isIndexingInProgress: () => false,
      getIndexingStats: () => ({ isIndexing: false, indexingPhase: "idle" }),
    };

    productionSafeguards = new ProductionSafeguards(
      {
        maxMemoryMB: 1024,
        maxHeapMB: 100, // Very low threshold to trigger memory limit
        maxCpuPercent: 80,
        gcThresholdMB: 256,
        alertThresholdMB: 80, // Low threshold
      },
      mockStatusChecker,
    );

    // Mock high memory usage that would normally trigger PAUSE_INDEXING
    const mockHighMemoryUsage = {
      memoryUsage: {
        heapUsed: 95 * 1024 * 1024, // 95MB - above 90% of 100MB limit
        heapTotal: 120 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        rss: 200 * 1024 * 1024,
      },
      cpuUsage: {
        user: 1000,
        system: 500,
      },
      timestamp: new Date(),
    };

    // Get the recovery strategies and find PAUSE_INDEXING
    const strategies = (productionSafeguards as any).recoveryStrategies;
    const pauseIndexingStrategy = strategies.find(
      (s: any) => s.action === "PAUSE_INDEXING",
    );

    assert.ok(pauseIndexingStrategy, "PAUSE_INDEXING strategy should exist");

    // Test that the condition returns false when indexing is not running
    const shouldTrigger = pauseIndexingStrategy.condition(
      mockHighMemoryUsage,
      (productionSafeguards as any).resourceLimits,
    );

    assert.strictEqual(
      shouldTrigger,
      false,
      "PAUSE_INDEXING should not trigger when indexing is not running, even with high memory",
    );
  });

  test("should trigger PAUSE_INDEXING when indexing IS running and memory is high", async () => {
    // Create a mock service status checker that reports indexing as running
    const mockStatusChecker: ServiceStatusChecker = {
      isIndexingInProgress: () => true,
      getIndexingStats: () => ({ isIndexing: true, indexingPhase: "initial" }),
    };

    productionSafeguards = new ProductionSafeguards(
      {
        maxMemoryMB: 1024,
        maxHeapMB: 100, // Very low threshold to trigger memory limit
        maxCpuPercent: 80,
        gcThresholdMB: 256,
        alertThresholdMB: 80, // Low threshold
      },
      mockStatusChecker,
    );

    // Mock high memory usage
    const mockHighMemoryUsage = {
      memoryUsage: {
        heapUsed: 95 * 1024 * 1024, // 95MB - above 90% of 100MB limit
        heapTotal: 120 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        rss: 200 * 1024 * 1024,
      },
      cpuUsage: {
        user: 1000,
        system: 500,
      },
      timestamp: new Date(),
    };

    // Get the recovery strategies and find PAUSE_INDEXING
    const strategies = (productionSafeguards as any).recoveryStrategies;
    const pauseIndexingStrategy = strategies.find(
      (s: any) => s.action === "PAUSE_INDEXING",
    );

    assert.ok(pauseIndexingStrategy, "PAUSE_INDEXING strategy should exist");

    // Test that the condition returns true when indexing IS running
    const shouldTrigger = pauseIndexingStrategy.condition(
      mockHighMemoryUsage,
      (productionSafeguards as any).resourceLimits,
    );

    assert.strictEqual(
      shouldTrigger,
      true,
      "PAUSE_INDEXING should trigger when indexing is running and memory is high",
    );
  });

  test("should not trigger REDUCE_BATCH_SIZE when indexing is not running", async () => {
    const mockStatusChecker: ServiceStatusChecker = {
      isIndexingInProgress: () => false,
      getIndexingStats: () => ({ isIndexing: false, indexingPhase: "idle" }),
    };

    productionSafeguards = new ProductionSafeguards(
      {
        maxMemoryMB: 1024,
        maxHeapMB: 100,
        maxCpuPercent: 80,
        gcThresholdMB: 256,
        alertThresholdMB: 80,
      },
      mockStatusChecker,
    );

    const mockMemoryUsage = {
      memoryUsage: {
        heapUsed: 65 * 1024 * 1024, // 65MB - above 80% of 80MB alert threshold
        heapTotal: 120 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        rss: 200 * 1024 * 1024,
      },
      cpuUsage: {
        user: 1000,
        system: 500,
      },
      timestamp: new Date(),
    };

    const strategies = (productionSafeguards as any).recoveryStrategies;
    const reduceBatchStrategy = strategies.find(
      (s: any) => s.action === "REDUCE_BATCH_SIZE",
    );

    const shouldTrigger = reduceBatchStrategy.condition(
      mockMemoryUsage,
      (productionSafeguards as any).resourceLimits,
    );

    assert.strictEqual(
      shouldTrigger,
      false,
      "REDUCE_BATCH_SIZE should not trigger when indexing is not running",
    );
  });

  test("should always allow CLEAR_CACHE regardless of indexing status", async () => {
    const mockStatusChecker: ServiceStatusChecker = {
      isIndexingInProgress: () => false,
      getIndexingStats: () => ({ isIndexing: false, indexingPhase: "idle" }),
    };

    productionSafeguards = new ProductionSafeguards(
      {
        maxMemoryMB: 1024,
        maxHeapMB: 100,
        maxCpuPercent: 80,
        gcThresholdMB: 256,
        alertThresholdMB: 80,
      },
      mockStatusChecker,
    );

    const mockHighMemoryUsage = {
      memoryUsage: {
        heapUsed: 85 * 1024 * 1024, // 85MB - above 80MB alert threshold
        heapTotal: 120 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        rss: 200 * 1024 * 1024,
      },
      cpuUsage: {
        user: 1000,
        system: 500,
      },
      timestamp: new Date(),
    };

    const strategies = (productionSafeguards as any).recoveryStrategies;
    const clearCacheStrategy = strategies.find(
      (s: any) => s.action === "CLEAR_CACHE",
    );

    const shouldTrigger = clearCacheStrategy.condition(
      mockHighMemoryUsage,
      (productionSafeguards as any).resourceLimits,
    );

    assert.strictEqual(
      shouldTrigger,
      true,
      "CLEAR_CACHE should trigger when memory is high, regardless of indexing status",
    );
  });

  test("should update service status checker after construction", async () => {
    productionSafeguards = new ProductionSafeguards({
      maxMemoryMB: 1024,
      maxHeapMB: 512,
    });

    // Initially no status checker
    assert.strictEqual(
      (productionSafeguards as any).serviceStatusChecker,
      undefined,
      "Service status checker should be undefined initially",
    );

    // Set status checker
    const mockStatusChecker: ServiceStatusChecker = {
      isIndexingInProgress: () => true,
      getIndexingStats: () => ({ isIndexing: true, indexingPhase: "initial" }),
    };

    productionSafeguards.setServiceStatusChecker(mockStatusChecker);

    assert.strictEqual(
      (productionSafeguards as any).serviceStatusChecker,
      mockStatusChecker,
      "Service status checker should be set after calling setServiceStatusChecker",
    );
  });
});
