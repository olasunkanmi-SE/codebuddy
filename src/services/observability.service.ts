import * as vscode from "vscode";
import { Logger, ILogEvent } from "../infrastructure/logger/logger";
import { PerformanceProfiler } from "./performance-profiler.service";
import { LocalObservabilityService } from "../infrastructure/observability/telemetry";
import { TelemetryPersistenceService } from "../infrastructure/observability/telemetry-persistence.service";

export class ObservabilityService {
  private static instance: ObservabilityService;
  private profiler: PerformanceProfiler | undefined;

  private constructor() {
    // Singleton
  }

  static getInstance(): ObservabilityService {
    return (ObservabilityService.instance ??= new ObservabilityService());
  }

  registerProfiler(profiler: PerformanceProfiler) {
    this.profiler = profiler;
  }

  getMetrics() {
    if (!this.profiler) return null;
    return this.profiler.getPerformanceReport();
  }

  getRecentLogs() {
    return Logger.getRecentLogs();
  }

  /**
   * Returns current in-memory spans (live session).
   * Use `getPersistedTraces()` for historical data.
   */
  getTraces() {
    const spans = LocalObservabilityService.getInstance().getSpans();
    return spans;
  }

  /**
   * Returns spans from the SQLite persistence layer (all sessions within retention).
   */
  getPersistedTraces(days?: number, limit?: number): any[] {
    try {
      return TelemetryPersistenceService.getInstance().querySpans(days, limit);
    } catch {
      return [];
    }
  }

  /**
   * Returns distinct session metadata for the session picker UI.
   */
  getSessions() {
    try {
      return TelemetryPersistenceService.getInstance().querySessions();
    } catch {
      return [];
    }
  }

  clearTraces() {
    LocalObservabilityService.getInstance().clearSpans();
  }

  clearPersistedTraces() {
    try {
      TelemetryPersistenceService.getInstance().clearAll();
    } catch {
      // non-fatal
    }
  }

  onLog(
    listener: (e: ILogEvent) => any,
    thisArgs?: any,
    disposables?: vscode.Disposable[],
  ) {
    return Logger.onDidLog(listener, thisArgs, disposables);
  }
}
