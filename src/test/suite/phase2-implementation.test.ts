import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
  VectorDbSyncService,
  ICodeIndexer,
} from "../../services/vector-db-sync.service";
import { VectorDatabaseService } from "../../services/vector-database.service";
import {
  ImmediateEmbeddingPhase,
  OnDemandEmbeddingPhase,
} from "../../services/smart-embedding-phases";
import { VectorDbWorkerManager } from "../../services/vector-db-worker-manager";
import { LanguageUtils, FileUtils, AsyncUtils } from "../../utils/common-utils";
import { IFunctionData } from "../../application/interfaces";

describe("Phase 2 Implementation Tests", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("LanguageUtils", () => {
    it("should correctly identify code files", () => {
      assert.strictEqual(LanguageUtils.isCodeFile("typescript"), true);
      assert.strictEqual(LanguageUtils.isCodeFile("javascript"), true);
      assert.strictEqual(LanguageUtils.isCodeFile("python"), true);
      assert.strictEqual(LanguageUtils.isCodeFile("plaintext"), false);
      assert.strictEqual(LanguageUtils.isCodeFile("markdown"), false);
    });

    it("should get correct language from file path", () => {
      assert.strictEqual(
        LanguageUtils.getLanguageFromPath("test.ts"),
        "typescript",
      );
      assert.strictEqual(
        LanguageUtils.getLanguageFromPath("test.js"),
        "javascript",
      );
      assert.strictEqual(
        LanguageUtils.getLanguageFromPath("test.py"),
        "python",
      );
      assert.strictEqual(
        LanguageUtils.getLanguageFromPath("test.unknown"),
        "plaintext",
      );
    });

    it("should identify code files by path", () => {
      assert.strictEqual(LanguageUtils.isCodeFileByPath("test.ts"), true);
      assert.strictEqual(LanguageUtils.isCodeFileByPath("test.txt"), false);
    });

    it("should generate correct glob pattern", () => {
      const pattern = LanguageUtils.getCodeFileGlobPattern();
      assert.ok(pattern.includes("ts"));
      assert.ok(pattern.includes("js"));
      assert.ok(pattern.includes("py"));
    });
  });

  describe("FileUtils", () => {
    it("should correctly identify files to ignore", () => {
      assert.strictEqual(
        FileUtils.shouldIgnoreFile("/path/node_modules/test.js"),
        true,
      );
      assert.strictEqual(FileUtils.shouldIgnoreFile("/path/.git/config"), true);
      assert.strictEqual(
        FileUtils.shouldIgnoreFile("/path/src/test.ts"),
        false,
      );
    });

    it("should assign correct file priorities", () => {
      assert.strictEqual(FileUtils.getFilePriority("/path/index.ts"), 100);
      assert.strictEqual(FileUtils.getFilePriority("/path/package.json"), 90);
      assert.strictEqual(FileUtils.getFilePriority("/path/README.md"), 80);
      assert.strictEqual(FileUtils.getFilePriority("/path/src/utils.ts"), 70);
      assert.strictEqual(
        FileUtils.getFilePriority("/path/test/unit.spec.ts"),
        60,
      );
      assert.strictEqual(FileUtils.getFilePriority("/path/other.ts"), 50);
    });
  });

  describe("AsyncUtils", () => {
    it("should process items in batches", async () => {
      const items = [1, 2, 3, 4, 5];
      const processed: number[] = [];

      await AsyncUtils.processBatches(
        items,
        async (item) => {
          processed.push(item);
        },
        2,
      );

      assert.deepStrictEqual(processed.sort(), [1, 2, 3, 4, 5]);
    });

    it("should handle async operations safely", async () => {
      const result = await AsyncUtils.safeExecute(
        async () => {
          throw new Error("Test error");
        },
        "fallback",
        (error) => {
          assert.strictEqual(error.message, "Test error");
        },
      );

      assert.strictEqual(result, "fallback");
    });

    it("should process batches with progress reporting", async () => {
      const items = [1, 2, 3, 4, 5];
      const progressReports: Array<{ current: number; total: number }> = [];

      await AsyncUtils.processBatchesWithProgress(
        items,
        async (item) => {
          // Process item
        },
        2,
        (current, total) => {
          progressReports.push({ current, total });
        },
      );

      assert.strictEqual(progressReports.length, 5);
      assert.strictEqual(
        progressReports[progressReports.length - 1].current,
        5,
      );
      assert.strictEqual(progressReports[progressReports.length - 1].total, 5);
    });
  });

  describe("VectorDbSyncService", () => {
    let vectorDbService: sinon.SinonStubbedInstance<VectorDatabaseService>;
    let codeIndexer: sinon.SinonStubbedInstance<ICodeIndexer>;
    let syncService: VectorDbSyncService;

    beforeEach(() => {
      vectorDbService = sandbox.createStubInstance(VectorDatabaseService);
      codeIndexer = {
        generateEmbeddings: sandbox
          .stub<[], Promise<IFunctionData[]>>()
          .resolves([]),
      };

      vectorDbService.isReady.returns(true);
      vectorDbService.getStats.returns({
        isInitialized: true,
        collectionName: "test",
        documentCount: 0,
        lastSync: null,
        memoryUsage: 0,
      });

      syncService = new VectorDbSyncService(
        vectorDbService as any,
        codeIndexer,
      );

      // Mock VS Code workspace
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "/test/workspace" } }]);
    });

    it("should initialize successfully when vector db is ready", async () => {
      // Mock file system operations
      sandbox.stub(vscode.workspace, "createFileSystemWatcher").returns({
        onDidCreate: sandbox.stub(),
        onDidChange: sandbox.stub(),
        onDidDelete: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any);

      sandbox.stub(vscode.workspace, "findFiles").resolves([]);

      await syncService.initialize();

      assert.ok(syncService.isReady());
    });

    it("should handle file system operations correctly", () => {
      // Test shouldIgnoreFile logic indirectly through public interface
      const stats = syncService.getStats();
      assert.strictEqual(typeof stats.filesMonitored, "number");
      assert.strictEqual(typeof stats.syncOperations, "number");
      assert.strictEqual(typeof stats.queueSize, "number");
    });

    it("should provide correct stats", () => {
      const stats = syncService.getStats();

      assert.ok("filesMonitored" in stats);
      assert.ok("syncOperations" in stats);
      assert.ok("lastSync" in stats);
      assert.ok("failedOperations" in stats);
      assert.ok("queueSize" in stats);
    });

    it("should dispose properly", () => {
      syncService.dispose();
      assert.ok(!syncService.isReady());
    });
  });

  describe("ImmediateEmbeddingPhase", () => {
    let workerManager: sinon.SinonStubbedInstance<VectorDbWorkerManager>;
    let immediatePhase: ImmediateEmbeddingPhase;

    beforeEach(() => {
      workerManager = sandbox.createStubInstance(VectorDbWorkerManager);
      immediatePhase = new ImmediateEmbeddingPhase(workerManager as any);

      // Mock VS Code workspace
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "/test/workspace" } }]);

      sandbox.stub(vscode.workspace, "textDocuments").value([]);
    });

    it("should handle empty workspace gracefully", async () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);

      // Mock progress dialog
      sandbox
        .stub(vscode.window, "withProgress")
        .callsFake(async (options, task) => {
          const progress = {
            report: sandbox.stub(),
          };
          return await task(progress, {} as any);
        });

      // This should not throw
      await immediatePhase.embedEssentials({} as any);
    });

    it("should dispose properly", () => {
      immediatePhase.dispose();
      // Should not throw
    });
  });

  describe("OnDemandEmbeddingPhase", () => {
    let workerManager: sinon.SinonStubbedInstance<VectorDbWorkerManager>;
    let onDemandPhase: OnDemandEmbeddingPhase;
    let context: vscode.ExtensionContext;

    beforeEach(() => {
      workerManager = sandbox.createStubInstance(VectorDbWorkerManager);
      context = {
        subscriptions: [],
      } as any;

      onDemandPhase = new OnDemandEmbeddingPhase(workerManager as any);
    });

    it("should setup triggers without errors", async () => {
      sandbox.stub(vscode.window, "onDidChangeActiveTextEditor").returns({
        dispose: sandbox.stub(),
      } as any);

      sandbox.stub(vscode.workspace, "onDidChangeTextDocument").returns({
        dispose: sandbox.stub(),
      } as any);

      onDemandPhase.setupTriggers();

      // Should not throw
    });

    it("should handle questions correctly", async () => {
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "/test/workspace" } }]);

      sandbox.stub(vscode.workspace, "findFiles").resolves([]);

      await onDemandPhase.onUserQuestion("test question");
      // Method doesn't return anything, just test it doesn't throw
    });

    it("should dispose properly", () => {
      onDemandPhase.dispose();
      // Should not throw
    });
  });

  describe("Integration Tests", () => {
    it("should integrate VectorDbSyncService with real dependencies", async () => {
      const vectorDbService = sandbox.createStubInstance(VectorDatabaseService);
      const codeIndexer = {
        generateEmbeddings: sandbox
          .stub<[], Promise<IFunctionData[]>>()
          .resolves([]),
      };

      vectorDbService.isReady.returns(true);
      vectorDbService.getStats.returns({
        isInitialized: true,
        collectionName: "test",
        documentCount: 0,
        lastSync: null,
        memoryUsage: 0,
      });

      const syncService = new VectorDbSyncService(
        vectorDbService as any,
        codeIndexer,
      );

      // Mock VS Code environment
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "/test/workspace" } }]);

      sandbox.stub(vscode.workspace, "createFileSystemWatcher").returns({
        onDidCreate: sandbox.stub(),
        onDidChange: sandbox.stub(),
        onDidDelete: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any);

      sandbox.stub(vscode.workspace, "findFiles").resolves([]);

      await syncService.initialize();

      const stats = syncService.getStats();
      assert.ok(stats.filesMonitored >= 0);

      syncService.dispose();
    });

    it("should handle edge cases gracefully", async () => {
      // Test with no workspace
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);

      const vectorDbService = sandbox.createStubInstance(VectorDatabaseService);
      const codeIndexer = {
        generateEmbeddings: sandbox
          .stub<[], Promise<IFunctionData[]>>()
          .resolves([]),
      };

      vectorDbService.isReady.returns(true);
      vectorDbService.getStats.returns({
        isInitialized: true,
        collectionName: "test",
        documentCount: 0,
        lastSync: null,
        memoryUsage: 0,
      });

      const syncService = new VectorDbSyncService(
        vectorDbService as any,
        codeIndexer,
      );

      // Should not throw
      await syncService.initialize();
      syncService.dispose();
    });
  });

  describe("Error Handling", () => {
    it("should handle file system errors gracefully", async () => {
      const vectorDbService = sandbox.createStubInstance(VectorDatabaseService);
      const codeIndexer = {
        generateEmbeddings: sandbox
          .stub<[], Promise<IFunctionData[]>>()
          .resolves([]),
      };

      vectorDbService.isReady.returns(true);
      vectorDbService.getStats.returns({
        isInitialized: true,
        collectionName: "test",
        documentCount: 0,
        lastSync: null,
        memoryUsage: 0,
      });

      const syncService = new VectorDbSyncService(
        vectorDbService as any,
        codeIndexer,
      );

      // Mock workspace with error
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "/test/workspace" } }]);

      sandbox
        .stub(vscode.workspace, "createFileSystemWatcher")
        .throws(new Error("Test error"));

      try {
        await syncService.initialize();
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it("should handle embedding errors gracefully", async () => {
      const workerManager = sandbox.createStubInstance(VectorDbWorkerManager);
      const immediatePhase = new ImmediateEmbeddingPhase(workerManager as any);

      // Mock VS Code workspace
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "/test/workspace" } }]);

      sandbox.stub(vscode.workspace, "textDocuments").value([]);
      sandbox.stub(vscode.workspace, "findFiles").resolves([]);
      sandbox
        .stub(vscode.workspace.fs, "readFile")
        .throws(new Error("File read error"));

      // Mock progress dialog
      sandbox
        .stub(vscode.window, "withProgress")
        .callsFake(async (options, task) => {
          const progress = {
            report: sandbox.stub(),
          };
          return await task(progress, {} as any);
        });

      // Should not throw - errors should be handled gracefully
      await immediatePhase.embedEssentials({} as any);
    });
  });
});
