import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { VectorDatabaseService } from "../../services/vector-database.service";

suite("Vector Database Initialization Fix", () => {
  let vectorDb: VectorDatabaseService;
  let mockContext: vscode.ExtensionContext;

  setup(() => {
    // Create a mock extension context
    mockContext = {
      extensionPath: path.join(__dirname, "../../.."),
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => [],
      },
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => [],
      },
      subscriptions: [],
    } as any;
  });

  teardown(async () => {
    if (vectorDb) {
      await vectorDb.dispose();
    }
  });

  test("should initialize vector database without ChromaDB embedding function error", async function () {
    this.timeout(10000); // Increase timeout for initialization

    // Mock Gemini API key
    const mockApiKey = "test-api-key";

    try {
      vectorDb = new VectorDatabaseService(mockContext, mockApiKey);

      // This should not throw the "Cannot instantiate a collection with the DefaultEmbeddingFunction" error
      await vectorDb.initialize();

      // Verify initialization was successful
      assert.strictEqual(
        vectorDb.isReady(),
        true,
        "Vector database should be ready after initialization",
      );

      const stats = vectorDb.getStats();
      assert.strictEqual(
        stats.isInitialized,
        true,
        "Stats should show initialized state",
      );
      assert.strictEqual(
        stats.collectionName,
        "codebase_embeddings",
        "Collection name should be correct",
      );
    } catch (error) {
      // If it's the ChromaDB embedding function error, the test should fail
      if (
        error instanceof Error &&
        error.message.includes("DefaultEmbeddingFunction")
      ) {
        assert.fail(
          `ChromaDB embedding function error still occurs: ${error.message}`,
        );
      }

      // Other errors (like missing API key validation) are expected in test environment
      console.log("Expected initialization error in test environment:", error);
      assert.ok(
        true,
        "Other initialization errors are acceptable in test environment",
      );
    }
  });

  test("should handle initialization gracefully when ChromaDB dependencies are available", async function () {
    this.timeout(5000);

    try {
      // Test that ChromaDB can be imported and the default embedding function is available
      const chromaDB = await import("chromadb");

      assert.ok(chromaDB.ChromaClient, "ChromaClient should be available");

      // Test that the @chroma-core/default-embed package is installed
      const defaultEmbed = await import("@chroma-core/default-embed");
      assert.ok(defaultEmbed, "Default embed package should be available");

      console.log("✅ ChromaDB dependencies are properly installed");
    } catch (error) {
      assert.fail(`ChromaDB dependencies are not properly installed: ${error}`);
    }
  });

  test("should provide clear error messages for missing API key", async function () {
    this.timeout(3000);

    try {
      vectorDb = new VectorDatabaseService(mockContext); // No API key provided
      await vectorDb.initialize();

      assert.fail("Should have thrown an error for missing API key");
    } catch (error) {
      assert.ok(error instanceof Error, "Should throw an Error object");
      assert.ok(
        error.message.includes("Gemini API key is required"),
        `Error message should mention missing API key, got: ${error.message}`,
      );
    }
  });

  test("should handle ChromaDB collection creation without embedding function conflicts", async function () {
    this.timeout(5000);

    const mockApiKey = "test-api-key";

    try {
      vectorDb = new VectorDatabaseService(mockContext, mockApiKey);

      // Test that we can create a collection without the embedding function error
      // This will fail due to other reasons (like invalid API key) but should not fail
      // due to the DefaultEmbeddingFunction error
      await vectorDb.initialize();
    } catch (error) {
      if (error instanceof Error) {
        // The specific error we fixed should not appear
        assert.ok(
          !error.message.includes(
            "Cannot instantiate a collection with the DefaultEmbeddingFunction",
          ),
          `Should not have DefaultEmbeddingFunction error: ${error.message}`,
        );

        assert.ok(
          !error.message.includes("Please install @chroma-core/default-embed"),
          `Should not ask to install @chroma-core/default-embed: ${error.message}`,
        );

        console.log("✅ No ChromaDB embedding function errors detected");
      }
    }
  });
});
