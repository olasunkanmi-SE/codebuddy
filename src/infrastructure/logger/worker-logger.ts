/**
 * Worker-compatible Logger for use in Worker threads
 *
 * Worker threads cannot use VS Code APIs directly, so this logger
 * sends messages to the parent thread via postMessage. The parent
 * thread service (e.g., CodebaseAnalysisWorker) receives these and
 * forwards them to the main Logger.
 *
 * Usage in worker thread:
 *   import { WorkerLogger } from "../infrastructure/logger/worker-logger";
 *   const logger = new WorkerLogger("MyWorkerModule");
 *   logger.info("Processing started");
 */

import { parentPort } from "worker_threads";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface IWorkerLoggerConfig {
  minLevel?: LogLevel;
  enableConsole?: boolean;
}

/**
 * Logger implementation for Worker threads
 * Sends log messages to parent thread via postMessage
 */
export class WorkerLogger {
  private readonly module: string;
  private readonly config: Required<IWorkerLoggerConfig>;

  private static readonly LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(module: string, config: IWorkerLoggerConfig = {}) {
    this.module = module;
    this.config = {
      minLevel: config.minLevel ?? LogLevel.DEBUG,
      enableConsole: config.enableConsole ?? false,
    };
  }

  /**
   * Factory method matching Logger.initialize pattern
   */
  static initialize(
    module: string,
    config: IWorkerLoggerConfig = {},
  ): WorkerLogger {
    return new WorkerLogger(module, config);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      WorkerLogger.LOG_LEVEL_PRIORITY[level] >=
      WorkerLogger.LOG_LEVEL_PRIORITY[this.config.minLevel]
    );
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = `[${this.module}] ${message}`;
    const timestamp = new Date().toISOString();

    if (parentPort) {
      // In worker thread - send to parent with timestamp for ordering
      parentPort.postMessage({
        type: "LOG",
        level,
        message: formattedMessage,
        data,
        timestamp,
      });
    } else if (this.config.enableConsole) {
      // Fallback for standalone/test usage
      const consoleFn =
        level === LogLevel.ERROR
          ? console.error
          : level === LogLevel.WARN
            ? console.warn
            : console.log;
      consoleFn(`${timestamp} [${level}] ${formattedMessage}`, data ?? "");
    }
  }
}
