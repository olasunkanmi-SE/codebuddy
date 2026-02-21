import * as vscode from "vscode";
import { Logger, ILogEvent } from "../infrastructure/logger/logger";
import { PerformanceProfiler } from "./performance-profiler.service";
import { LocalObservabilityService } from "../infrastructure/observability/telemetry";

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

  getTraces() {
    const spans = LocalObservabilityService.getInstance().getSpans();
    return spans;
  }

  clearTraces() {
    LocalObservabilityService.getInstance().clearSpans();
  }

  onLog(
    listener: (e: ILogEvent) => any,
    thisArgs?: any,
    disposables?: vscode.Disposable[],
  ) {
    return Logger.onDidLog(listener, thisArgs, disposables);
  }
}
