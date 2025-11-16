import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * Resource usage monitoring
 */
export interface ResourceUsage {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  timestamp: Date;
}

/**
 * Resource limits configuration
 */
export interface ResourceLimits {
  maxMemoryMB: number;
  maxHeapMB: number;
  maxCpuPercent: number;
  gcThresholdMB: number;
  alertThresholdMB: number;
}

/**
 * Recovery action types
 */
export type RecoveryAction =
  | "CLEAR_CACHE"
  | "FORCE_GC"
  | "REDUCE_BATCH_SIZE"
  | "PAUSE_INDEXING"
  | "RESTART_WORKER"
  | "EMERGENCY_STOP";

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  action: RecoveryAction;
  condition: (usage: ResourceUsage, limits: ResourceLimits) => boolean;
  cooldownMs: number;
  maxRetries: number;
  priority: number; // Lower number = higher priority
}

/**
 * Service status checker interface for smarter recovery decisions
 */
export interface ServiceStatusChecker {
  isIndexingInProgress(): boolean;
  getIndexingStats?(): { isIndexing: boolean; indexingPhase: string };
}

/**
 * Production safeguards for vector database operations
 */
export class ProductionSafeguards implements vscode.Disposable {
  private logger: Logger;
  private resourceLimits: ResourceLimits;
  private recoveryStrategies: RecoveryStrategy[];
  private lastRecoveryAttempts: Map<RecoveryAction, number> = new Map();
  private retryCounters: Map<RecoveryAction, number> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private emergencyStopActive: boolean = false;
  private readonly disposables: vscode.Disposable[] = [];
  private serviceStatusChecker?: ServiceStatusChecker;

  // Circuit breaker state
  private circuitBreaker: {
    failures: number;
    lastFailure: number;
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    openUntil: number;
  } = {
    failures: 0,
    lastFailure: 0,
    state: "CLOSED",
    openUntil: 0,
  };

  constructor(
    customLimits?: Partial<ResourceLimits>,
    serviceStatusChecker?: ServiceStatusChecker,
  ) {
    this.logger = Logger.initialize("ProductionSafeguards", {
      minLevel: LogLevel.INFO,
    });

    this.serviceStatusChecker = serviceStatusChecker;

    this.resourceLimits = {
      maxMemoryMB: 1024,
      maxHeapMB: 512,
      maxCpuPercent: 80,
      gcThresholdMB: 256,
      alertThresholdMB: 400,
      ...customLimits,
    };

    this.recoveryStrategies = this.initializeRecoveryStrategies();
    this.startResourceMonitoring();
  }

  /**
   * Initialize recovery strategies in order of priority
   */
  private initializeRecoveryStrategies(): RecoveryStrategy[] {
    return [
      {
        action: "CLEAR_CACHE",
        condition: (usage, limits) => {
          const highMemory =
            usage.memoryUsage.heapUsed / 1024 / 1024 > limits.alertThresholdMB;

          // Clear cache when memory is high regardless of indexing status
          // Cache clearing is always beneficial and safe
          return highMemory;
        },
        cooldownMs: 30000, // 30 seconds
        maxRetries: 3,
        priority: 1,
      },
      {
        action: "FORCE_GC",
        condition: (usage, limits) =>
          usage.memoryUsage.heapUsed / 1024 / 1024 > limits.gcThresholdMB,
        cooldownMs: 15000, // 15 seconds
        maxRetries: 5,
        priority: 2,
      },
      {
        action: "REDUCE_BATCH_SIZE",
        condition: (usage, limits) => {
          const moderateMemory =
            usage.memoryUsage.heapUsed / 1024 / 1024 >
            limits.alertThresholdMB * 0.8;
          const isIndexing =
            this.serviceStatusChecker?.isIndexingInProgress() ?? false;

          // Only reduce batch size if indexing is running and memory is moderately high
          return moderateMemory && isIndexing;
        },
        cooldownMs: 60000, // 1 minute
        maxRetries: 2,
        priority: 3,
      },
      {
        action: "PAUSE_INDEXING",
        condition: (usage, limits) => {
          const highMemory =
            usage.memoryUsage.heapUsed / 1024 / 1024 > limits.maxHeapMB * 0.9;
          const isIndexing =
            this.serviceStatusChecker?.isIndexingInProgress() ?? false;

          // Only trigger if memory is high AND indexing is actually running
          return highMemory && isIndexing;
        },
        cooldownMs: 120000, // 2 minutes
        maxRetries: 1,
        priority: 4,
      },
      {
        action: "RESTART_WORKER",
        condition: (usage, limits) => {
          const veryHighMemory =
            usage.memoryUsage.heapUsed / 1024 / 1024 > limits.maxHeapMB;
          const isIndexing =
            this.serviceStatusChecker?.isIndexingInProgress() ?? false;

          // Only restart worker if memory is very high AND vector operations are running
          // Worker restart is disruptive, so be conservative
          return veryHighMemory && isIndexing;
        },
        cooldownMs: 300000, // 5 minutes
        maxRetries: 1,
        priority: 5,
      },
      {
        action: "EMERGENCY_STOP",
        condition: (usage, limits) =>
          usage.memoryUsage.rss / 1024 / 1024 > limits.maxMemoryMB,
        cooldownMs: 0,
        maxRetries: 1,
        priority: 6,
      },
    ];
  }

  /**
   * Execute an operation with safeguards
   */
  async executeWithSafeguards<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: {
      timeoutMs?: number;
      retries?: number;
      skipCircuitBreaker?: boolean;
    },
  ): Promise<T> {
    const {
      timeoutMs = 30000,
      retries = 2,
      skipCircuitBreaker = false,
    } = options || {};

    // Check if emergency stop is active
    if (this.emergencyStopActive) {
      throw new Error("Emergency stop is active - operation blocked");
    }

    // Check circuit breaker
    if (!skipCircuitBreaker && !this.isCircuitBreakerClosed()) {
      throw new Error(
        `Circuit breaker is ${this.circuitBreaker.state} - operation blocked`,
      );
    }

    // Check resource limits before operation
    const preUsage = this.getCurrentResourceUsage();
    if (this.isResourceLimitExceeded(preUsage)) {
      await this.executeRecoveryStrategies(preUsage);

      // Recheck after recovery
      const postRecoveryUsage = this.getCurrentResourceUsage();
      if (this.isResourceLimitExceeded(postRecoveryUsage)) {
        throw new Error("Resource limits exceeded - operation blocked");
      }
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Execute with timeout
        const result = await this.withTimeout(fn(), timeoutMs);

        // Success - reset circuit breaker failures
        this.circuitBreaker.failures = 0;

        return result;
      } catch (error: any) {
        lastError = error as Error;

        this.logger.error(
          `Operation ${operation} failed (attempt ${attempt + 1}/${retries + 1}):`,
          error,
        );

        // Update circuit breaker
        this.recordCircuitBreakerFailure();

        // Check if we should retry
        if (attempt < retries && !this.shouldStopRetrying(error as Error)) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        break;
      }
    }

    throw (
      lastError ||
      new Error(`Operation ${operation} failed after ${retries + 1} attempts`)
    );
  }

  /**
   * Check if circuit breaker allows operations
   */
  private isCircuitBreakerClosed(): boolean {
    const now = Date.now();

    switch (this.circuitBreaker.state) {
      case "CLOSED":
        return true;

      case "OPEN":
        if (now >= this.circuitBreaker.openUntil) {
          this.circuitBreaker.state = "HALF_OPEN";
          this.logger.info("Circuit breaker moved to HALF_OPEN state");
          return true;
        }
        return false;

      case "HALF_OPEN":
        return true;

      default:
        return false;
    }
  }

  /**
   * Record a circuit breaker failure
   */
  private recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= 5) {
      this.circuitBreaker.state = "OPEN";
      this.circuitBreaker.openUntil = Date.now() + 60000; // Open for 1 minute

      this.logger.warn(
        `Circuit breaker opened due to ${this.circuitBreaker.failures} failures`,
      );

      vscode.window
        .showWarningMessage(
          "CodeBuddy Vector Database temporarily disabled due to repeated failures. Will retry automatically.",
          "View Logs",
        )
        .then((action) => {
          if (action === "View Logs") {
            vscode.commands.executeCommand("workbench.action.toggleDevTools");
          }
        });
    }
  }

  /**
   * Execute operation with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Get current resource usage
   */
  private getCurrentResourceUsage(): ResourceUsage {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memoryUsage,
      cpuUsage,
      timestamp: new Date(),
    };
  }

  /**
   * Check if resource limits are exceeded
   */
  private isResourceLimitExceeded(usage: ResourceUsage): boolean {
    const heapUsedMB = usage.memoryUsage.heapUsed / 1024 / 1024;
    const rssMB = usage.memoryUsage.rss / 1024 / 1024;

    return (
      heapUsedMB > this.resourceLimits.maxHeapMB ||
      rssMB > this.resourceLimits.maxMemoryMB
    );
  }

  /**
   * Execute recovery strategies in priority order
   */
  private async executeRecoveryStrategies(usage: ResourceUsage): Promise<void> {
    const now = Date.now();
    const applicableStrategies = this.recoveryStrategies
      .filter((strategy) => {
        // Check if condition is met
        if (!strategy.condition(usage, this.resourceLimits)) {
          return false;
        }

        // Check cooldown
        const lastAttempt = this.lastRecoveryAttempts.get(strategy.action) || 0;
        if (now - lastAttempt < strategy.cooldownMs) {
          return false;
        }

        // Check retry limit
        const retryCount = this.retryCounters.get(strategy.action) || 0;
        if (retryCount >= strategy.maxRetries) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.priority - b.priority);

    if (applicableStrategies.length === 0) {
      this.logger.warn(
        "No applicable recovery strategies for current resource usage",
      );
      return;
    }

    for (const strategy of applicableStrategies) {
      try {
        this.logger.info(`Executing recovery strategy: ${strategy.action}`);

        await this.executeRecoveryAction(strategy.action);

        this.lastRecoveryAttempts.set(strategy.action, now);
        const currentRetries = this.retryCounters.get(strategy.action) || 0;
        this.retryCounters.set(strategy.action, currentRetries + 1);

        // Check if recovery was effective
        const newUsage = this.getCurrentResourceUsage();
        if (!this.isResourceLimitExceeded(newUsage)) {
          this.logger.info(`Recovery strategy ${strategy.action} successful`);
          // Reset retry counter on success
          this.retryCounters.delete(strategy.action);
          break;
        }
      } catch (error: any) {
        this.logger.error(
          `Recovery strategy ${strategy.action} failed:`,
          error,
        );
      }
    }
  }

  /**
   * Execute a specific recovery action
   */
  private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
    switch (action) {
      case "CLEAR_CACHE":
        // Signal cache clearing to relevant services
        vscode.commands.executeCommand("codebuddy.clearVectorCache");
        break;

      case "FORCE_GC":
        if (global.gc) {
          global.gc();
        } else {
          this.logger.warn(
            "Garbage collection not available (start with --expose-gc)",
          );
        }
        break;

      case "REDUCE_BATCH_SIZE":
        // Signal batch size reduction
        vscode.commands.executeCommand("codebuddy.reduceBatchSize");
        break;

      case "PAUSE_INDEXING":
        // Log current indexing status for debugging
        const indexingStats = this.serviceStatusChecker?.getIndexingStats?.();
        this.logger.info("PAUSE_INDEXING recovery action triggered", {
          isIndexing: indexingStats?.isIndexing ?? "unknown",
          indexingPhase: indexingStats?.indexingPhase ?? "unknown",
        });

        // Signal indexing pause
        vscode.commands.executeCommand("codebuddy.pauseIndexing");
        vscode.window
          .showWarningMessage(
            "CodeBuddy indexing paused due to high memory usage. Will resume automatically.",
            "Resume Now",
          )
          .then((action) => {
            if (action === "Resume Now") {
              vscode.commands.executeCommand("codebuddy.resumeIndexing");
            }
          });
        break;

      case "RESTART_WORKER":
        // Signal worker restart
        vscode.commands.executeCommand("codebuddy.restartVectorWorker");
        break;

      case "EMERGENCY_STOP":
        this.emergencyStopActive = true;
        vscode.commands.executeCommand("codebuddy.emergencyStop");

        vscode.window
          .showErrorMessage(
            "CodeBuddy Emergency Stop: Critical resource usage detected. All vector operations stopped.",
            "View Status",
            "Force Resume",
          )
          .then((action) => {
            if (action === "View Status") {
              this.showResourceStatus();
            } else if (action === "Force Resume") {
              this.resumeFromEmergencyStop();
            }
          });
        break;
    }
  }

  /**
   * Check if we should stop retrying based on error type
   */
  private shouldStopRetrying(error: Error): boolean {
    // Stop retrying for certain types of errors
    const stopRetryPatterns = [
      /ENOENT/,
      /permission denied/i,
      /access denied/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
    ];

    return stopRetryPatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Start continuous resource monitoring
   */
  private startResourceMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      try {
        const usage = this.getCurrentResourceUsage();

        if (this.isResourceLimitExceeded(usage)) {
          this.executeRecoveryStrategies(usage).catch((error) => {
            this.logger.error("Failed to execute recovery strategies:", error);
          });
        }

        // Reset retry counters periodically
        if (Date.now() % 300000 < 5000) {
          // Every 5 minutes
          this.retryCounters.clear();
        }
      } catch (error: any) {
        this.logger.error("Resource monitoring error:", error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Show resource status to user
   */
  private async showResourceStatus(): Promise<void> {
    const usage = this.getCurrentResourceUsage();
    const heapUsedMB = usage.memoryUsage.heapUsed / 1024 / 1024;
    const rssMB = usage.memoryUsage.rss / 1024 / 1024;

    const statusMessage = `
**CodeBuddy Resource Status**

• Heap Memory: ${heapUsedMB.toFixed(0)}MB / ${this.resourceLimits.maxHeapMB}MB
• RSS Memory: ${rssMB.toFixed(0)}MB / ${this.resourceLimits.maxMemoryMB}MB
• Circuit Breaker: ${this.circuitBreaker.state}
• Emergency Stop: ${this.emergencyStopActive ? "ACTIVE" : "Normal"}

**Recent Recovery Actions**: ${Array.from(this.retryCounters.keys()).join(", ") || "None"}
    `.trim();

    await vscode.window.showInformationMessage(statusMessage);
  }

  /**
   * Resume from emergency stop
   */
  private async resumeFromEmergencyStop(): Promise<void> {
    const usage = this.getCurrentResourceUsage();

    if (this.isResourceLimitExceeded(usage)) {
      vscode.window.showWarningMessage(
        "Cannot resume - resource usage still too high. Please close other applications or restart VS Code.",
      );
      return;
    }

    this.emergencyStopActive = false;
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = "CLOSED";
    this.retryCounters.clear();

    vscode.commands.executeCommand("codebuddy.resumeFromEmergencyStop");
    vscode.window.showInformationMessage(
      "CodeBuddy resumed from emergency stop",
    );
  }

  /**
   * Update resource limits
   */
  updateResourceLimits(limits: Partial<ResourceLimits>): void {
    this.resourceLimits = { ...this.resourceLimits, ...limits };
    this.logger.info("Resource limits updated:", this.resourceLimits);
  }

  /**
   * Set or update the service status checker
   */
  setServiceStatusChecker(checker: ServiceStatusChecker): void {
    this.serviceStatusChecker = checker;
    this.logger.info("Service status checker updated");
  }

  /**
   * Get current safeguards status
   */
  getStatus(): {
    emergencyStopActive: boolean;
    circuitBreakerState: string;
    resourceLimits: ResourceLimits;
    currentUsage: ResourceUsage;
    recentRecoveryActions: string[];
  } {
    return {
      emergencyStopActive: this.emergencyStopActive,
      circuitBreakerState: this.circuitBreaker.state,
      resourceLimits: this.resourceLimits,
      currentUsage: this.getCurrentResourceUsage(),
      recentRecoveryActions: Array.from(this.retryCounters.keys()),
    };
  }

  /**
   * Manually trigger recovery action
   */
  async triggerRecoveryAction(action: RecoveryAction): Promise<void> {
    try {
      await this.executeRecoveryAction(action);
      vscode.window.showInformationMessage(
        `Recovery action ${action} executed successfully`,
      );
    } catch (error: any) {
      this.logger.error(`Manual recovery action ${action} failed:`, error);

      // Provide specific guidance for common vector database issues
      if (
        error instanceof Error &&
        error.message.includes("DefaultEmbeddingFunction")
      ) {
        vscode.window
          .showErrorMessage(
            "Vector database initialization failed. Try restarting VS Code after ensuring ChromaDB dependencies are installed.",
            "Restart VS Code",
            "View Logs",
          )
          .then((action) => {
            if (action === "Restart VS Code") {
              vscode.commands.executeCommand("workbench.action.reloadWindow");
            } else if (action === "View Logs") {
              vscode.commands.executeCommand("workbench.action.toggleDevTools");
            }
          });
      } else {
        vscode.window.showErrorMessage(`Recovery action failed: ${error}`);
      }
    }
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

    this.logger.info("Production safeguards disposed");
  }
}
