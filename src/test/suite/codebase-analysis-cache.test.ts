import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import * as fs from "fs";
import { CodebaseAnalysisCache } from "../../services/codebase-analysis-cache";

suite("CodebaseAnalysisCache Tests", () => {
  let cache: CodebaseAnalysisCache;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    cache = CodebaseAnalysisCache.getInstance();
    cache.clear(); // Start with clean cache
  });

  teardown(() => {
    sandbox.restore();
    cache.clear();
  });

  suite("Basic Cache Operations", () => {
    test("should store and retrieve data", async () => {
      const testData = { test: "value", number: 42 };

      await cache.set("test-key", testData, 60000, false);
      const retrieved = await cache.get("test-key");

      assert.deepStrictEqual(retrieved, testData);
    });

    test("should return null for non-existent key", async () => {
      const result = await cache.get("non-existent");
      assert.strictEqual(result, null);
    });

    test("should handle different data types", async () => {
      const stringData = "test string";
      const numberData = 42;
      const objectData = { nested: { deep: "value" } };
      const arrayData = [1, 2, 3, "four"];

      await cache.set("string", stringData, 60000, false);
      await cache.set("number", numberData, 60000, false);
      await cache.set("object", objectData, 60000, false);
      await cache.set("array", arrayData, 60000, false);

      assert.strictEqual(await cache.get("string"), stringData);
      assert.strictEqual(await cache.get("number"), numberData);
      assert.deepStrictEqual(await cache.get("object"), objectData);
      assert.deepStrictEqual(await cache.get("array"), arrayData);
    });
  });

  suite("TTL and Expiration", () => {
    test("should expire entries after TTL", async () => {
      const testData = { expired: true };

      await cache.set("expiring-key", testData, 100, false); // 100ms TTL

      // Should be available immediately
      let result = await cache.get("expiring-key");
      assert.deepStrictEqual(result, testData);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      result = await cache.get("expiring-key");
      assert.strictEqual(result, null);
    });

    test("should use default TTL when not specified", async () => {
      const testData = { default: "ttl" };

      await cache.set("default-ttl-key", testData, undefined, false);
      const result = await cache.get("default-ttl-key");

      assert.deepStrictEqual(result, testData);
    });
  });

  suite("Workspace Hash Dependencies", () => {
    test("should invalidate workspace-dependent cache when workspace changes", async () => {
      // Mock workspace methods
      const mockFindFiles = sandbox.stub(vscode.workspace, "findFiles");
      const mockStat = sandbox.stub(vscode.workspace.fs, "stat");

      const mockUri1 = { fsPath: "/test/file1.ts" } as vscode.Uri;
      const mockUri2 = { fsPath: "/test/file2.ts" } as vscode.Uri;

      // First call - return initial files
      mockFindFiles.onFirstCall().resolves([mockUri1]);
      mockStat
        .onFirstCall()
        .resolves({ mtime: 1000, size: 100 } as vscode.FileStat);

      const testData = { workspace: "dependent" };
      await cache.set("workspace-test", testData, 60000, true);

      // Should retrieve successfully
      let result = await cache.get("workspace-test");
      assert.deepStrictEqual(result, testData);

      // Second call - return changed files (different mtime)
      mockFindFiles.onSecondCall().resolves([mockUri1, mockUri2]);
      mockStat
        .onSecondCall()
        .resolves({ mtime: 2000, size: 200 } as vscode.FileStat);
      mockStat
        .onThirdCall()
        .resolves({ mtime: 1500, size: 150 } as vscode.FileStat);

      // Should be invalidated due to workspace change
      result = await cache.get("workspace-test");
      assert.strictEqual(result, null);
    });

    test("should not invalidate non-workspace-dependent cache", async () => {
      const testData = { static: "data" };

      await cache.set("static-test", testData, 60000, false);

      // Should always retrieve successfully regardless of workspace changes
      const result = await cache.get("static-test");
      assert.deepStrictEqual(result, testData);
    });
  });

  suite("Cache Management", () => {
    test("should clear all cache entries", async () => {
      await cache.set("key1", "value1", 60000, false);
      await cache.set("key2", "value2", 60000, false);
      await cache.set("key3", "value3", 60000, false);

      cache.clear();

      assert.strictEqual(await cache.get("key1"), null);
      assert.strictEqual(await cache.get("key2"), null);
      assert.strictEqual(await cache.get("key3"), null);
    });

    test("should clear entries matching pattern", async () => {
      await cache.set("user-profile-123", { user: "data" }, 60000, false);
      await cache.set("user-settings-456", { settings: "data" }, 60000, false);
      await cache.set("system-config", { config: "data" }, 60000, false);

      cache.clearPattern("user-");

      // User entries should be cleared
      assert.strictEqual(await cache.get("user-profile-123"), null);
      assert.strictEqual(await cache.get("user-settings-456"), null);

      // System entry should remain
      assert.notStrictEqual(await cache.get("system-config"), null);
    });

    test("should provide cache statistics", async () => {
      await cache.set("stat-key1", "value1", 60000, false);
      await cache.set("stat-key2", "value2", 60000, false);

      const stats = cache.getStats();

      assert.strictEqual(typeof stats.totalEntries, "number");
      assert.strictEqual(typeof stats.totalSize, "number");
      assert.strictEqual(typeof stats.hitRate, "number");
      assert.strictEqual(typeof stats.oldestEntry, "number");

      assert.strictEqual(stats.totalEntries, 2);
      assert.ok(stats.totalSize > 0);
    });
  });

  suite("Error Handling", () => {
    test("should handle workspace hash generation errors gracefully", async () => {
      // Mock workspace methods to throw errors
      const mockFindFiles = sandbox.stub(vscode.workspace, "findFiles");
      mockFindFiles.rejects(new Error("Workspace error"));

      const testData = { error: "handling" };

      // Should not throw error
      await assert.doesNotReject(async () => {
        await cache.set("error-test", testData, 60000, true);
      });

      // Should still be able to retrieve
      const result = await cache.get("error-test");
      assert.deepStrictEqual(result, testData);
    });

    test("should handle file stat errors during hash generation", async () => {
      const mockFindFiles = sandbox.stub(vscode.workspace, "findFiles");
      const mockStat = sandbox.stub(vscode.workspace.fs, "stat");

      const mockUri = { fsPath: "/test/file.ts" } as vscode.Uri;
      mockFindFiles.resolves([mockUri]);
      mockStat.rejects(new Error("File not found"));

      const testData = { stat: "error" };

      await assert.doesNotReject(async () => {
        await cache.set("stat-error-test", testData, 60000, true);
      });

      const result = await cache.get("stat-error-test");
      assert.deepStrictEqual(result, testData);
    });
  });

  suite("Singleton Pattern", () => {
    test("should return same instance", () => {
      const instance1 = CodebaseAnalysisCache.getInstance();
      const instance2 = CodebaseAnalysisCache.getInstance();

      assert.strictEqual(instance1, instance2);
    });

    test("should share data between instances", async () => {
      const instance1 = CodebaseAnalysisCache.getInstance();
      const instance2 = CodebaseAnalysisCache.getInstance();

      const testData = { shared: "data" };
      await instance1.set("shared-key", testData, 60000, false);

      const result = await instance2.get("shared-key");
      assert.deepStrictEqual(result, testData);
    });
  });

  suite("Cleanup and Memory Management", () => {
    test("should automatically clean up expired entries", async () => {
      // Create cache with short cleanup interval for testing
      const testData1 = { cleanup: "test1" };
      const testData2 = { cleanup: "test2" };

      await cache.set("cleanup-key1", testData1, 50, false); // 50ms TTL
      await cache.set("cleanup-key2", testData2, 60000, false); // Long TTL

      // Wait for expiration and cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger cleanup by getting stats
      const stats = cache.getStats();

      // The expired entry should be cleaned up
      assert.strictEqual(await cache.get("cleanup-key1"), null);
      assert.notStrictEqual(await cache.get("cleanup-key2"), null);
    });
  });
});
