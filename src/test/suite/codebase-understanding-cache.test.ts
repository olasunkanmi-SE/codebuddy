import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import * as fs from "fs";
import { CodebaseUnderstandingService } from "../../services/codebase-understanding.service";
import { CodebaseAnalysisCache } from "../../services/codebase-analysis-cache";

suite("CodebaseUnderstandingService Cache Integration Tests", () => {
  let service: CodebaseUnderstandingService;
  let cache: CodebaseAnalysisCache;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    service = CodebaseUnderstandingService.getInstance();
    cache = CodebaseAnalysisCache.getInstance();
    cache.clear(); // Start with clean cache
  });

  teardown(() => {
    sandbox.restore();
    cache.clear();
  });

  suite("Workspace Analysis Caching", () => {
    test("should cache workspace analysis results", async () => {
      // Mock workspace and file operations
      mockWorkspaceOperations(sandbox);

      const mockAnalysis = {
        frameworks: ["NestJS", "React"],
        dependencies: { "@nestjs/core": "^8.0.0" },
        files: ["/test/file1.ts", "/test/file2.ts"],
        apiEndpoints: [],
        dataModels: [],
        databaseSchema: { tables: [], relationships: [], migrations: [] },
        domainRelationships: [],
      };

      // Stub the individual analysis methods to return mock data
      sandbox.stub(service as any, "identifyFrameworks").returns(mockAnalysis.frameworks);
      sandbox.stub(service as any, "discoverApiEndpoints").resolves(mockAnalysis.apiEndpoints);
      sandbox.stub(service as any, "analyzeDataModels").resolves(mockAnalysis.dataModels);
      sandbox.stub(service as any, "introspectDatabaseSchema").resolves(mockAnalysis.databaseSchema);
      sandbox.stub(service as any, "mapDomainRelationships").resolves(mockAnalysis.domainRelationships);
      sandbox.stub(service as any, "findFile").resolves(vscode.Uri.file("/test/package.json"));

      // First call - should perform full analysis
      const result1 = await service.analyzeWorkspace();

      // Second call - should return cached result
      const result2 = await service.analyzeWorkspace();

      assert.deepStrictEqual(result1, result2);

      // Verify that expensive operations were only called once
      assert.strictEqual((service as any).discoverApiEndpoints.callCount, 1);
      assert.strictEqual((service as any).analyzeDataModels.callCount, 1);
    });

    test("should bypass cache after clearing", async () => {
      mockWorkspaceOperations(sandbox);

      // Stub analysis methods
      const mockFrameworks = sandbox.stub(service as any, "identifyFrameworks").returns(["React"]);
      sandbox.stub(service as any, "discoverApiEndpoints").resolves([]);
      sandbox.stub(service as any, "analyzeDataModels").resolves([]);
      sandbox
        .stub(service as any, "introspectDatabaseSchema")
        .resolves({ tables: [], relationships: [], migrations: [] });
      sandbox.stub(service as any, "mapDomainRelationships").resolves([]);
      sandbox.stub(service as any, "findFile").resolves(vscode.Uri.file("/test/package.json"));

      // First call
      await service.analyzeWorkspace();
      assert.strictEqual(mockFrameworks.callCount, 1);

      // Clear cache
      service.clearCache();

      // Second call - should trigger new analysis
      await service.analyzeWorkspace();
      assert.strictEqual(mockFrameworks.callCount, 2);
    });

    test("should provide cache statistics", async () => {
      const stats = service.getCacheStats();

      assert.strictEqual(typeof stats.totalEntries, "number");
      assert.strictEqual(typeof stats.totalSize, "number");
      assert.strictEqual(typeof stats.hitRate, "number");
    });

    test("should clear cache by pattern", async () => {
      // Set some test cache entries
      await cache.set("workspace-analysis", { test: "data" }, 60000, true);
      await cache.set("workspace-models", { models: [] }, 60000, true);
      await cache.set("user-settings", { user: "data" }, 60000, false);

      // Clear workspace pattern
      service.clearCachePattern("workspace");

      // Verify workspace entries are cleared
      assert.strictEqual(await cache.get("workspace-analysis"), null);
      assert.strictEqual(await cache.get("workspace-models"), null);

      // Verify non-matching entries remain
      assert.notStrictEqual(await cache.get("user-settings"), null);
    });
  });

  suite("Error Handling with Cache", () => {
    test("should handle cache errors gracefully", async () => {
      mockWorkspaceOperations(sandbox);

      // Stub cache to throw error
      const cacheStub = sandbox.stub(cache, "get").rejects(new Error("Cache error"));

      // Stub analysis methods
      sandbox.stub(service as any, "identifyFrameworks").returns(["React"]);
      sandbox.stub(service as any, "discoverApiEndpoints").resolves([]);
      sandbox.stub(service as any, "analyzeDataModels").resolves([]);
      sandbox
        .stub(service as any, "introspectDatabaseSchema")
        .resolves({ tables: [], relationships: [], migrations: [] });
      sandbox.stub(service as any, "mapDomainRelationships").resolves([]);
      sandbox.stub(service as any, "findFile").resolves(vscode.Uri.file("/test/package.json"));

      // Should not throw error and should perform analysis
      const result = await service.analyzeWorkspace();

      assert.notStrictEqual(result, null);
      assert.strictEqual(Array.isArray(result?.frameworks), true);
    });

    test("should handle cache set errors gracefully", async () => {
      mockWorkspaceOperations(sandbox);

      // Stub cache set to throw error
      sandbox.stub(cache, "set").rejects(new Error("Cache set error"));

      // Stub analysis methods
      sandbox.stub(service as any, "identifyFrameworks").returns(["React"]);
      sandbox.stub(service as any, "discoverApiEndpoints").resolves([]);
      sandbox.stub(service as any, "analyzeDataModels").resolves([]);
      sandbox
        .stub(service as any, "introspectDatabaseSchema")
        .resolves({ tables: [], relationships: [], migrations: [] });
      sandbox.stub(service as any, "mapDomainRelationships").resolves([]);
      sandbox.stub(service as any, "findFile").resolves(vscode.Uri.file("/test/package.json"));

      // Should not throw error
      const result = await service.analyzeWorkspace();

      assert.notStrictEqual(result, null);
    });
  });

  suite("Performance Optimization", () => {
    test("should reduce analysis time with cache", async () => {
      mockWorkspaceOperations(sandbox);

      // Create slower analysis methods
      const createSlowAnalysis = () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        });
      };

      sandbox.stub(service as any, "identifyFrameworks").returns(["React"]);
      sandbox.stub(service as any, "discoverApiEndpoints").callsFake(createSlowAnalysis);
      sandbox.stub(service as any, "analyzeDataModels").callsFake(createSlowAnalysis);
      sandbox.stub(service as any, "introspectDatabaseSchema").callsFake(createSlowAnalysis);
      sandbox.stub(service as any, "mapDomainRelationships").callsFake(createSlowAnalysis);
      sandbox.stub(service as any, "findFile").resolves(vscode.Uri.file("/test/package.json"));

      // First call (should be slower)
      const start1 = Date.now();
      await service.analyzeWorkspace();
      const duration1 = Date.now() - start1;

      // Second call (should be faster due to cache)
      const start2 = Date.now();
      await service.analyzeWorkspace();
      const duration2 = Date.now() - start2;

      // Cached call should be significantly faster
      assert.ok(
        duration2 < duration1 / 2,
        `Cached call (${duration2}ms) should be faster than uncached call (${duration1}ms)`
      );
    });
  });

  // Helper function to mock workspace operations
  function mockWorkspaceOperations(sandbox: sinon.SinonSandbox) {
    // Mock workspace folders
    const mockWorkspaceFolder = {
      uri: vscode.Uri.file("/test/workspace"),
      name: "test-workspace",
      index: 0,
    };
    sandbox.stub(vscode.workspace, "workspaceFolders").value([mockWorkspaceFolder]);

    // Mock file system operations for the native fs module
    const mockPackageJson = JSON.stringify({
      dependencies: { "@nestjs/core": "^8.0.0", react: "^17.0.0" },
      devDependencies: { typescript: "^4.0.0" },
    });

    // Mock native fs module used by CodebaseAnalysisWorker
    sandbox.stub(fs.promises, "readFile").resolves(mockPackageJson);
    sandbox.stub(fs, "existsSync").returns(true);

    // Mock workspace service
    const mockFiles = [vscode.Uri.file("/test/file1.ts"), vscode.Uri.file("/test/file2.ts")];

    sandbox.stub(vscode.workspace, "findFiles").resolves(mockFiles);
  }
});
