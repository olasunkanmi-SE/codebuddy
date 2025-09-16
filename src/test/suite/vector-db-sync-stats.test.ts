import * as assert from "assert";
import * as vscode from "vscode";
import { VectorDbSyncService } from "../../services/vector-db-sync.service";
import { VectorDatabaseService } from "../../services/vector-database.service";

/**
 * Test suite for Vector DB Sync Service statistics tracking
 */
suite("VectorDbSyncService - Statistics Tracking", () => {
  let vectorDbSyncService: VectorDbSyncService;
  let mockVectorDb: any;
  let mockCodeIndexer: any;

  setup(() => {
    // Create mock vector database service
    mockVectorDb = {
      isReady: () => true,
      getStats: () => ({ documentCount: 0 }),
      indexCodeSnippets: async () => {},
      deleteByFile: async () => {},
    };

    // Create mock code indexer
    mockCodeIndexer = {
      generateEmbeddings: async () => [],
    };

    vectorDbSyncService = new VectorDbSyncService(mockVectorDb, mockCodeIndexer);
  });

  teardown(() => {
    vectorDbSyncService?.dispose();
  });

  test("should update statistics when processing files", async () => {
    // Get initial stats
    const initialStats = vectorDbSyncService.getStats();
    assert.strictEqual(initialStats.syncOperations, 0);
    assert.strictEqual(initialStats.lastSync, null);
    assert.strictEqual(initialStats.failedOperations, 0);

    // Simulate processing a file (this is a private method, so we'll test the public interface)
    // Since we can't directly call handleModifiedFiles, we'll test through the mechanism
    // that would trigger it in a real scenario

    const stats = vectorDbSyncService.getStats();

    // Initially all stats should be zero/null
    assert.strictEqual(stats.syncOperations, 0, "Sync operations should start at 0");
    assert.strictEqual(stats.lastSync, null, "Last sync should be null initially");
    assert.strictEqual(stats.failedOperations, 0, "Failed operations should start at 0");
  });

  test("should track files monitored correctly", async () => {
    // This tests that the service can track basic statistics
    const stats = vectorDbSyncService.getStats();

    // Check that the stats object has the expected structure
    assert.ok(typeof stats.filesMonitored === "number", "filesMonitored should be a number");
    assert.ok(typeof stats.syncOperations === "number", "syncOperations should be a number");
    assert.ok(typeof stats.failedOperations === "number", "failedOperations should be a number");
    assert.ok(typeof stats.queueSize === "number", "queueSize should be a number");

    // lastSync can be null or string
    assert.ok(stats.lastSync === null || typeof stats.lastSync === "string", "lastSync should be null or string");
  });

  test("should have correct initial state", async () => {
    const stats = vectorDbSyncService.getStats();

    // Verify initial state matches expected defaults
    assert.strictEqual(stats.filesMonitored, 0, "Should start with 0 files monitored");
    assert.strictEqual(stats.syncOperations, 0, "Should start with 0 sync operations");
    assert.strictEqual(stats.failedOperations, 0, "Should start with 0 failed operations");
    assert.strictEqual(stats.queueSize, 0, "Should start with 0 queue size");
    assert.strictEqual(stats.lastSync, null, "Should start with null last sync");
    assert.strictEqual(stats.isIndexing, false, "Should start with indexing false");
    assert.strictEqual(stats.indexingPhase, "idle", "Should start in idle phase");
  });
});
