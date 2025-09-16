import * as vscode from "vscode";
import * as os from "os";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { VectorDbConfigurationManager } from "../config/vector-db.config";

/**
 * Performance metrics collection and analysis
 */
export interface PerformanceMetrics {
  searchLatency: RollingAverage;
  indexingThroughput: RollingAverage;
  memoryUsage: RollingAverage;
  cacheHitRate: RollingAverage;
  errorRate: RollingAverage;
}

/**
 * Performance report summary
 */
export interface PerformanceReport {
  avgSearchLatency: number;
  p95SearchLatency: number;
  avgIndexingThroughput: number;
  avgMemoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: Date;
}

/**
 * Performance alert types
 */
export interface PerformanceAlert {
  type: "HIGH_SEARCH_LATENCY" | "HIGH_MEMORY_USAGE" | "HIGH_ERROR_RATE" | "LOW_THROUGHPUT";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: Date;
  metrics?: Record<string, number>;
}

/**
 * Performance configuration based on system capabilities
 */
export interface OptimizedPerformanceConfig {
  embeddings: {
    batchSize: number;
    maxCacheSize: number;
    rateLimitDelay: number;
    concurrency: number;
  };
  search: {
    maxResults: number;
    cacheSize: number;
    timeoutMs: number;
  };
  indexing: {
    chunkSize: number;
    concurrency: number;
    gcInterval: number;
  };
  memory: {
    maxHeapMB: number;
    gcThresholdMB: number;
    bufferPoolSize: number;
  };
}

/**
 * Rolling average calculation for performance metrics
 */
export class RollingAverage {
  private values: number[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  add(value: number): void {
    this.values.push(value);
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((sum, val) => sum + val, 0) / this.values.length;
  }

  getPercentile(percentile: number): number {
    if (this.values.length === 0) return 0;

    const sorted = [...this.values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  getMax(): number {
    return Math.max(...this.values, 0);
  }

  getMin(): number {
    return Math.min(...this.values, 0);
  }

  getCount(): number {
    return this.values.length;
  }

  clear(): void {
    this.values = [];
  }
}

/**
 * Performance profiler for measuring and analyzing system performance
 */
export class PerformanceProfiler implements vscode.Disposable {
  private logger: Logger;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private configManager?: VectorDbConfigurationManager;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(configManager?: VectorDbConfigurationManager) {
    this.logger = Logger.initialize("PerformanceProfiler", {
      minLevel: LogLevel.INFO,
    });

    this.configManager = configManager;

    this.metrics = {
      searchLatency: new RollingAverage(100),
      indexingThroughput: new RollingAverage(50),
      memoryUsage: new RollingAverage(20),
      cacheHitRate: new RollingAverage(100),
      errorRate: new RollingAverage(100),
    };

    this.startPerformanceMonitoring();
  }

  /**
   * Measure the performance of an async operation
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const memBefore = process.memoryUsage();

    try {
      const result = await fn();
      const duration = performance.now() - start;
      const memAfter = process.memoryUsage();

      this.recordMeasurement(operation, {
        duration,
        memoryDelta: memAfter.heapUsed - memBefore.heapUsed,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      this.recordMeasurement(operation, {
        duration,
        memoryDelta: 0,
        success: false,
      });

      this.logger.error(`Performance measurement failed for ${operation}:`, error);
      throw error;
    }
  }

  /**
   * Record a specific measurement
   */
  private recordMeasurement(
    operation: string,
    measurement: { duration: number; memoryDelta: number; success: boolean }
  ): void {
    // Record operation-specific metrics
    switch (operation) {
      case "search":
        this.metrics.searchLatency.add(measurement.duration);
        break;
      case "indexing":
        // Calculate throughput (items per second, assume 1 item for simplicity)
        const throughput = 1000 / measurement.duration; // items per second
        this.metrics.indexingThroughput.add(throughput);
        break;
    }

    // Record error rate
    this.metrics.errorRate.add(measurement.success ? 0 : 1);

    this.logger.debug(`${operation} performance:`, {
      duration: `${measurement.duration.toFixed(2)}ms`,
      memoryDelta: `${(measurement.memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      success: measurement.success,
    });
  }

  /**
   * Record search operation performance
   */
  recordSearchLatency(latency: number): void {
    this.metrics.searchLatency.add(latency);
  }

  /**
   * Record indexing operation performance
   */
  recordIndexingOperation(itemsProcessed: number, timeMs: number): void {
    const throughput = itemsProcessed / (timeMs / 1000); // items per second
    this.metrics.indexingThroughput.add(throughput);
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    const usage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.metrics.memoryUsage.add(usage);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(isHit: boolean): void {
    this.metrics.cacheHitRate.add(isHit ? 1 : 0);
  }

  /**
   * Get current performance report
   */
  getPerformanceReport(): PerformanceReport {
    return {
      avgSearchLatency: this.metrics.searchLatency.getAverage(),
      p95SearchLatency: this.metrics.searchLatency.getPercentile(0.95),
      avgIndexingThroughput: this.metrics.indexingThroughput.getAverage(),
      avgMemoryUsage: this.metrics.memoryUsage.getAverage(),
      cacheHitRate: this.metrics.cacheHitRate.getAverage(),
      errorRate: this.metrics.errorRate.getAverage(),
      timestamp: new Date(),
    };
  }

  /**
   * Check for performance alerts
   */
  checkPerformanceAlerts(): PerformanceAlert[] {
    const currentAlerts: PerformanceAlert[] = [];
    const report = this.getPerformanceReport();

    // High search latency alert
    if (report.avgSearchLatency > 500) {
      currentAlerts.push({
        type: "HIGH_SEARCH_LATENCY",
        severity: report.avgSearchLatency > 1000 ? "critical" : "warning",
        message: `Average search latency is ${report.avgSearchLatency.toFixed(0)}ms (target: <500ms)`,
        timestamp: new Date(),
        metrics: { avgLatency: report.avgSearchLatency, p95Latency: report.p95SearchLatency },
      });
    }

    // High memory usage alert
    if (report.avgMemoryUsage > 500) {
      currentAlerts.push({
        type: "HIGH_MEMORY_USAGE",
        severity: report.avgMemoryUsage > 1000 ? "critical" : "warning",
        message: `Memory usage is ${report.avgMemoryUsage.toFixed(0)}MB (target: <500MB)`,
        timestamp: new Date(),
        metrics: { memoryUsage: report.avgMemoryUsage },
      });
    }

    // High error rate alert
    if (report.errorRate > 0.05) {
      currentAlerts.push({
        type: "HIGH_ERROR_RATE",
        severity: report.errorRate > 0.1 ? "critical" : "warning",
        message: `Error rate is ${(report.errorRate * 100).toFixed(1)}% (target: <5%)`,
        timestamp: new Date(),
        metrics: { errorRate: report.errorRate },
      });
    }

    // Low throughput alert
    if (report.avgIndexingThroughput > 0 && report.avgIndexingThroughput < 10) {
      currentAlerts.push({
        type: "LOW_THROUGHPUT",
        severity: "warning",
        message: `Indexing throughput is ${report.avgIndexingThroughput.toFixed(1)} items/sec (target: >10 items/sec)`,
        timestamp: new Date(),
        metrics: { throughput: report.avgIndexingThroughput },
      });
    }

    // Store alerts for history
    this.alerts.push(...currentAlerts);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return currentAlerts;
  }

  /**
   * Get system-optimized performance configuration
   */
  getOptimizedConfig(): OptimizedPerformanceConfig {
    const isProduction = process.env.NODE_ENV === "production";
    const availableMemory = os.totalmem() / 1024 / 1024; // MB
    const cpuCount = os.cpus().length;

    if (isProduction) {
      return {
        embeddings: {
          batchSize: Math.min(50, Math.floor(availableMemory / 100)),
          maxCacheSize: Math.min(20000, Math.floor(availableMemory / 10)),
          rateLimitDelay: 100,
          concurrency: Math.min(6, cpuCount),
        },
        search: {
          maxResults: 15,
          cacheSize: 1000,
          timeoutMs: 5000,
        },
        indexing: {
          chunkSize: Math.min(100, Math.floor(availableMemory / 50)),
          concurrency: Math.min(6, cpuCount),
          gcInterval: 30000,
        },
        memory: {
          maxHeapMB: Math.floor(availableMemory * 0.6),
          gcThresholdMB: Math.floor(availableMemory * 0.4),
          bufferPoolSize: Math.min(20, Math.floor(availableMemory / 100)),
        },
      };
    } else {
      // Development settings - more conservative
      return {
        embeddings: {
          batchSize: 10,
          maxCacheSize: 1000,
          rateLimitDelay: 200,
          concurrency: 2,
        },
        search: {
          maxResults: 8,
          cacheSize: 100,
          timeoutMs: 3000,
        },
        indexing: {
          chunkSize: 25,
          concurrency: 2,
          gcInterval: 15000,
        },
        memory: {
          maxHeapMB: 512,
          gcThresholdMB: 256,
          bufferPoolSize: 5,
        },
      };
    }
  }

  /**
   * Start continuous performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();

      const alerts = this.checkPerformanceAlerts();
      if (alerts.length > 0) {
        this.handlePerformanceAlerts(alerts);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle performance alerts
   */
  private handlePerformanceAlerts(alerts: PerformanceAlert[]): void {
    for (const alert of alerts) {
      this.logger.warn(`Performance Alert [${alert.severity.toUpperCase()}]:`, alert.message);

      // Show user notification for critical alerts
      if (alert.severity === "critical") {
        vscode.window
          .showWarningMessage(`CodeBuddy Performance Alert: ${alert.message}`, "View Details", "Optimize Settings")
          .then((action) => {
            if (action === "View Details") {
              this.showPerformanceReport();
            } else if (action === "Optimize Settings") {
              this.optimizeConfiguration();
            }
          });
      }
    }
  }

  /**
   * Show performance report to user
   */
  private async showPerformanceReport(): Promise<void> {
    const report = this.getPerformanceReport();

    const reportMessage = `
**Vector Database Performance Report**

• Search Latency: ${report.avgSearchLatency.toFixed(0)}ms avg, ${report.p95SearchLatency.toFixed(0)}ms P95
• Indexing Throughput: ${report.avgIndexingThroughput.toFixed(1)} items/sec
• Memory Usage: ${report.avgMemoryUsage.toFixed(0)}MB
• Cache Hit Rate: ${(report.cacheHitRate * 100).toFixed(1)}%
• Error Rate: ${(report.errorRate * 100).toFixed(2)}%

**Targets**: Search <500ms, Memory <500MB, Errors <5%
    `.trim();

    await vscode.window.showInformationMessage(reportMessage);
  }

  /**
   * Optimize configuration based on current performance
   */
  private async optimizeConfiguration(): Promise<void> {
    if (!this.configManager) {
      vscode.window.showWarningMessage("Configuration manager not available");
      return;
    }

    try {
      const optimizedConfig = this.getOptimizedConfig();
      const report = this.getPerformanceReport();

      // Adjust batch size based on performance
      let newBatchSize = optimizedConfig.embeddings.batchSize;
      if (report.avgSearchLatency > 1000) {
        newBatchSize = Math.max(5, Math.floor(newBatchSize * 0.7));
      } else if (report.avgSearchLatency < 200) {
        newBatchSize = Math.min(50, Math.floor(newBatchSize * 1.3));
      }

      // Update configuration
      await this.configManager.updateConfig("batchSize", newBatchSize);

      // Adjust performance mode based on memory usage
      if (report.avgMemoryUsage > 800) {
        await this.configManager.updateConfig("performanceMode", "memory");
      } else if (report.avgMemoryUsage < 200 && report.avgSearchLatency > 500) {
        await this.configManager.updateConfig("performanceMode", "performance");
      }

      vscode.window.showInformationMessage(`Configuration optimized: Batch size set to ${newBatchSize}`);
    } catch (error) {
      this.logger.error("Failed to optimize configuration:", error);
      vscode.window.showErrorMessage("Failed to optimize configuration");
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    searchLatency: { avg: number; p95: number; count: number };
    indexingThroughput: { avg: number; count: number };
    memoryUsage: { avg: number; max: number; count: number };
    cacheHitRate: { avg: number; count: number };
    errorRate: { avg: number; count: number };
    alertCount: number;
  } {
    return {
      searchLatency: {
        avg: this.metrics.searchLatency.getAverage(),
        p95: this.metrics.searchLatency.getPercentile(0.95),
        count: this.metrics.searchLatency.getCount(),
      },
      indexingThroughput: {
        avg: this.metrics.indexingThroughput.getAverage(),
        count: this.metrics.indexingThroughput.getCount(),
      },
      memoryUsage: {
        avg: this.metrics.memoryUsage.getAverage(),
        max: this.metrics.memoryUsage.getMax(),
        count: this.metrics.memoryUsage.getCount(),
      },
      cacheHitRate: {
        avg: this.metrics.cacheHitRate.getAverage(),
        count: this.metrics.cacheHitRate.getCount(),
      },
      errorRate: {
        avg: this.metrics.errorRate.getAverage(),
        count: this.metrics.errorRate.getCount(),
      },
      alertCount: this.alerts.length,
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.searchLatency.clear();
    this.metrics.indexingThroughput.clear();
    this.metrics.memoryUsage.clear();
    this.metrics.cacheHitRate.clear();
    this.metrics.errorRate.clear();
    this.alerts = [];
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;

    this.logger.info("Performance profiler disposed");
  }
}
