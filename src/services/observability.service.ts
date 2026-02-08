import * as vscode from "vscode";
import { Logger, ILogEvent } from "../infrastructure/logger/logger";
import { PerformanceProfiler } from "./performance-profiler.service";

export class ObservabilityService {
  private static instance: ObservabilityService;
  private profiler: PerformanceProfiler | undefined;

  private constructor() {}

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

  onLog(
    listener: (e: ILogEvent) => any,
    thisArgs?: any,
    disposables?: vscode.Disposable[],
  ) {
    return Logger.onDidLog(listener, thisArgs, disposables);
  }
}
