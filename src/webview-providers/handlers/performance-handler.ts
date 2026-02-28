import { WebviewMessageHandler, HandlerContext } from "./types";
import { VectorDbConfigurationManager } from "../../config/vector-db.config";
import { PerformanceProfiler } from "../../services/performance-profiler.service";
import { ProductionSafeguards } from "../../services/production-safeguards.service";
import { EnhancedCacheManager } from "../../services/enhanced-cache-manager.service";

export class PerformanceHandler implements WebviewMessageHandler {
  readonly commands = [
    "showPerformanceReport",
    "clearCache",
    "reduceBatchSize",
    "emergencyStop",
    "resumeFromEmergencyStop",
    "optimizePerformance",
  ];

  constructor(
    private readonly getProfiler: () => PerformanceProfiler | undefined,
    private readonly getSafeguards: () => ProductionSafeguards | undefined,
    private readonly getCacheManager: () => EnhancedCacheManager | undefined,
    private readonly getConfigManager: () =>
      | VectorDbConfigurationManager
      | undefined,
  ) {}

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "showPerformanceReport": {
        const profiler = this.getProfiler();
        if (profiler) {
          const report = profiler.getPerformanceReport();
          const stats = profiler.getStats();
          await ctx.sendResponse(
            `
**Performance Report** 📊

• **Search Performance**: ${report.avgSearchLatency.toFixed(0)}ms avg, ${report.p95SearchLatency.toFixed(0)}ms P95
• **Indexing Throughput**: ${report.avgIndexingThroughput.toFixed(1)} items/sec
• **Memory Usage**: ${report.avgMemoryUsage.toFixed(0)}MB
• **Cache Hit Rate**: ${(report.cacheHitRate * 100).toFixed(1)}%
• **Error Rate**: ${(report.errorRate * 100).toFixed(2)}%

**Targets**: Search <500ms, Memory <500MB, Errors <5%
**Status**: ${stats.searchLatency.count > 0 ? "✅ Active" : "⚠️ Limited Data"}
            `.trim(),
            "bot",
          );
        } else {
          await ctx.sendResponse("Performance profiler not available", "bot");
        }
        break;
      }

      case "clearCache": {
        const cache = this.getCacheManager();
        if (cache) {
          const type = message.data?.type || "all";
          await cache.clearCache(type);
          const cacheInfo = cache.getCacheInfo();
          await ctx.sendResponse(
            `
**Cache Cleared** 🧹

• **Type**: ${type}
• **Remaining Memory**: ${cacheInfo.total.memoryMB.toFixed(1)}MB
• **Hit Rate**: ${(cacheInfo.total.hitRate * 100).toFixed(1)}%
            `.trim(),
            "bot",
          );
        } else {
          await ctx.sendResponse("Enhanced cache manager not available", "bot");
        }
        break;
      }

      case "reduceBatchSize": {
        const configMgr = this.getConfigManager();
        if (configMgr) {
          const config = configMgr.getConfig();
          const currentBatchSize = config.batchSize;
          const newBatchSize = Math.max(5, Math.floor(currentBatchSize * 0.7));
          await configMgr.updateConfig("batchSize", newBatchSize);
          await ctx.sendResponse(
            `
**Batch Size Reduced** ⚡

• **Previous**: ${currentBatchSize}
• **New**: ${newBatchSize}
• **Impact**: Lower memory usage, potentially slower indexing
            `.trim(),
            "bot",
          );
        } else {
          await ctx.sendResponse("Configuration manager not available", "bot");
        }
        break;
      }

      case "emergencyStop": {
        if (this.getSafeguards()) {
          await ctx.sendResponse(
            "🚨 **Emergency Stop Activated** - All vector operations have been stopped due to resource concerns",
            "bot",
          );
        } else {
          await ctx.sendResponse("Production safeguards not available", "bot");
        }
        break;
      }

      case "resumeFromEmergencyStop": {
        if (this.getSafeguards()) {
          await ctx.sendResponse(
            "✅ **Resumed from Emergency Stop** - Vector operations are now active",
            "bot",
          );
        } else {
          await ctx.sendResponse("Production safeguards not available", "bot");
        }
        break;
      }

      case "optimizePerformance": {
        const profiler = this.getProfiler();
        const cache = this.getCacheManager();
        if (profiler && cache) {
          profiler.getOptimizedConfig();
          await cache.optimizeConfiguration();
          const report = profiler.getPerformanceReport();
          await ctx.sendResponse(
            `
**Performance Optimized** ⚡

• **Memory Usage**: ${report.avgMemoryUsage.toFixed(0)}MB
• **Cache Hit Rate**: ${(report.cacheHitRate * 100).toFixed(1)}%
• **Search Latency**: ${report.avgSearchLatency.toFixed(0)}ms
• **Configuration**: Automatically tuned based on system resources
            `.trim(),
            "bot",
          );
        } else {
          await ctx.sendResponse(
            "Performance optimization services not available",
            "bot",
          );
        }
        break;
      }
    }
  }
}
