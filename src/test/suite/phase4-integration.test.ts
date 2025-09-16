import * as assert from "assert";
import * as vscode from "vscode";
import { VectorDbConfigurationManager } from "../../config/vector-db.config";
import { UserFeedbackService } from "../../services/user-feedback.service";

suite("Phase 4 Integration Tests", () => {
  let configManager: VectorDbConfigurationManager;
  let userFeedback: UserFeedbackService;

  setup(() => {
    configManager = new VectorDbConfigurationManager();
    userFeedback = new UserFeedbackService();
  });

  teardown(() => {
    configManager?.dispose();
    userFeedback?.dispose();
  });

  suite("VectorDbConfigurationManager", () => {
    test("should initialize with default configuration", () => {
      const config = configManager.getConfig();

      assert.strictEqual(config.enabled, true);
      assert.strictEqual(config.embeddingModel, "gemini");
      assert.strictEqual(config.maxTokens, 6000);
      assert.strictEqual(config.batchSize, 10);
      assert.strictEqual(config.searchResultLimit, 8);
      assert.strictEqual(config.enableBackgroundProcessing, true);
      assert.strictEqual(config.enableProgressNotifications, true);
      assert.strictEqual(config.progressLocation, "notification");
      assert.strictEqual(config.debounceDelay, 1000);
      assert.strictEqual(config.performanceMode, "balanced");
      assert.strictEqual(config.fallbackToKeywordSearch, true);
      assert.strictEqual(config.cacheEnabled, true);
      assert.strictEqual(config.logLevel, "info");
    });

    test("should provide performance thresholds", () => {
      const thresholds = configManager.getPerformanceThresholds();

      assert.ok(thresholds.maxEmbeddingTime > 0);
      assert.ok(thresholds.maxSearchTime > 0);
      assert.ok(thresholds.maxMemoryUsage > 0);
      assert.ok(thresholds.maxFileSize > 0);
      assert.ok(thresholds.maxConcurrentOperations > 0);
    });

    test("should provide feature flags", () => {
      const flags = configManager.getFeatureFlags();

      assert.strictEqual(typeof flags.enableVectorSearch, "boolean");
      assert.strictEqual(typeof flags.enableSemanticSimilarity, "boolean");
      assert.strictEqual(typeof flags.enableSmartRanking, "boolean");
      assert.strictEqual(typeof flags.enableRealtimeSync, "boolean");
      assert.strictEqual(typeof flags.enableBulkOperations, "boolean");
      assert.strictEqual(typeof flags.enableAnalytics, "boolean");
    });

    test("should validate configuration", () => {
      const isValid = configManager.validateConfiguration();
      assert.strictEqual(typeof isValid, "boolean");
    });

    test("should handle configuration changes", async () => {
      let changeNotified = false;
      const disposable = configManager.onConfigChange(() => {
        changeNotified = true;
      });

      await configManager.updateConfig("batchSize", 15);
      const config = configManager.getConfig();

      assert.strictEqual(config.batchSize, 15);
      disposable.dispose();
    });

    test("should export and import configuration", async () => {
      const exported = configManager.exportConfiguration();
      assert.ok(exported.length > 0);

      const config = JSON.parse(exported);
      assert.strictEqual(typeof config, "object");
      assert.ok("enabled" in config);
      assert.ok("embeddingModel" in config);
    });

    test("should auto-tune configuration", async () => {
      // This will run auto-tune which analyzes the workspace
      // Since we're in test environment, it should handle empty workspace gracefully
      await configManager.autoTuneConfiguration();

      const config = configManager.getConfig();
      assert.ok(config);
    });
  });

  suite("UserFeedbackService", () => {
    test("should initialize properly", () => {
      assert.ok(userFeedback);
    });

    test("should handle status updates", () => {
      userFeedback.updateStatus({
        text: "$(sync~spin) Processing...",
        tooltip: "Vector database processing",
      });

      userFeedback.updateStatus({
        text: "$(check) Ready",
        tooltip: "Vector database ready",
      });

      // Test passed if no errors thrown
      assert.ok(true);
    });

    test("should handle notifications", async () => {
      await userFeedback.showSuccess("Test success message");
      await userFeedback.showWarning("Test warning message");
      await userFeedback.showError("Test error message");

      // Test passed if no errors thrown
      assert.ok(true);
    });

    test("should handle sync status", () => {
      userFeedback.showSyncStatus(5, true);
      userFeedback.showSyncStatus(0, false);

      // Test passed if no errors thrown
      assert.ok(true);
    });

    test("should handle search metrics", () => {
      userFeedback.showSearchMetrics(10, 250);

      // Test passed if no errors thrown
      assert.ok(true);
    });

    test("should handle configuration preferences", () => {
      const isEnabled = userFeedback.isVectorDbEnabled();
      assert.strictEqual(typeof isEnabled, "boolean");

      const progressLocation = userFeedback.getProgressNotificationPreference();
      assert.ok(progressLocation !== undefined);

      const batchSize = userFeedback.getEmbeddingBatchSize();
      assert.strictEqual(typeof batchSize, "number");
      assert.ok(batchSize > 0);

      const backgroundProcessing = userFeedback.isBackgroundProcessingEnabled();
      assert.strictEqual(typeof backgroundProcessing, "boolean");
    });
  });

  suite("Integration", () => {
    test("should integrate configuration manager with user feedback", async () => {
      // Test that configuration changes can trigger user feedback
      const config = configManager.getConfig();

      if (config.enableProgressNotifications) {
        userFeedback.showSyncStatus(1, true);
        userFeedback.showSyncStatus(0, false);
      }

      // Test passed if no errors thrown
      assert.ok(true);
    });

    test("should handle performance mode changes", async () => {
      const originalMode = configManager.getConfig().performanceMode;

      // Test switching performance modes
      const modes = ["balanced", "performance", "memory"] as const;
      for (const mode of modes) {
        await configManager.updateConfig("performanceMode", mode);
        const thresholds = configManager.getPerformanceThresholds();
        assert.ok(thresholds);

        const config = configManager.getConfig();
        assert.strictEqual(config.performanceMode, mode);
      }

      // Restore original mode
      await configManager.updateConfig("performanceMode", originalMode);
    });

    test("should handle error scenarios gracefully", async () => {
      // Test invalid configuration values
      try {
        await configManager.updateConfig("batchSize", -1);
        const isValid = configManager.validateConfiguration();
        // Should still work but report validation issues
        assert.strictEqual(typeof isValid, "boolean");
      } catch (error) {
        // Error handling is acceptable
        assert.ok(error instanceof Error);
      }
    });
  });
});
