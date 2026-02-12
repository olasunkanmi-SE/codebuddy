import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { OutputManager } from "../../services/output-manager";
import * as os from "os";

// TODO Log data in MongoDB Atlas, take advantage of telemetery

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface ILogEvent {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId: string;
  traceId: string;
}

export interface ILoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableTelemetry: boolean;
}

export interface ITelemetry {
  recordEvent(name: string, properties?: Record<string, any>): void;
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void;
  startSpan(name: string): ISpan;
}

export interface ISpan {
  end(): void;
  setStatus(status: "success" | "error", message?: string): void;
  addEvent(name: string, attributes?: Record<string, any>): void;
}

export class Logger {
  private static config: ILoggerConfig = {
    minLevel: LogLevel.INFO,
    enableConsole: true,
    enableFile: false,
    enableTelemetry: false,
    filePath: undefined,
  };

  private readonly outputManager: OutputManager = OutputManager.getInstance(
    "CodeBuddy Extension Output",
  );
  private static telemetry: ITelemetry | undefined;
  static sessionId: string;
  private static traceId: string;
  static instance: Logger;

  // Observability features
  private static logEmitter = new vscode.EventEmitter<ILogEvent>();
  private static logBuffer: ILogEvent[] = [];
  private static readonly MAX_LOG_BUFFER = 1000;

  public static get onDidLog(): vscode.Event<ILogEvent> {
    return this.logEmitter.event;
  }

  public static getRecentLogs(): ILogEvent[] {
    return this.logBuffer;
  }

  constructor(private readonly module: string) {}

  public static initialize(
    module: string,
    config: Partial<ILoggerConfig>,
    telemetry?: ITelemetry,
  ): Logger {
    Logger.config = { ...Logger.config, ...config };
    if (Logger.config.enableFile && !Logger.config.filePath) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const baseDir = workspaceFolder
        ? path.join(workspaceFolder.uri.fsPath, ".codebuddy", "logs")
        : path.join(os.homedir(), ".codebuddy", "logs");

      const date = new Date().toISOString();
      const safeDate = date.replace(/[:.]/g, "-");
      Logger.config.filePath = path.join(baseDir, `codebuddy-${safeDate}.log`);
    }
    if (Logger.config.enableFile && Logger.config.filePath) {
      const logDir = path.dirname(Logger.config.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      console.log(Logger.config.filePath);
    }
    Logger.telemetry = telemetry;
    Logger.setTraceId(Logger.generateId());

    // Always return a new instance to ensure correct module name mapping
    // The configuration is shared statically
    return new Logger(module);
  }

  public static setTraceId(traceId: string): void {
    Logger.traceId = traceId;
  }

  static generateId(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  private shouldLog(logLevel: LogLevel) {
    const levels = Object.values(LogLevel) as string[];
    return levels.indexOf(logLevel) >= levels.indexOf(Logger.config.minLevel);
  }

  private formatLogEvent(level: LogLevel, message: string, data?: any) {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data,
      sessionId: Logger.sessionId,
      traceId: Logger.traceId,
    };
  }
  private logToConsole(event: ILogEvent): void {
    if (!Logger.config.enableConsole) return;

    const formattedMessage = `[${event.timestamp}] [${event.level}] [${event.module}] ${event.message}`;

    if (event.data) {
      this.outputManager.appendLine(JSON.stringify(event.data, null, 2));
    } else {
      this.outputManager.appendLine(formattedMessage);
    }
    console.log(formattedMessage, event.data || "");
  }

  private logToFile(event: ILogEvent): void {
    if (!Logger.config.enableFile || !Logger.config.filePath) return;

    try {
      const logEntry = JSON.stringify(event) + "\n";
      fs.appendFileSync(Logger.config.filePath, logEntry);
    } catch (error: any) {
      console.error("Failed to write to log file:", error);
      this.error("Log file write failed", { error: error.message });
    }
  }

  private logToTelemetry(event: ILogEvent): void {
    if (!Logger.config.enableTelemetry || !Logger.telemetry) return;

    if (event.level === LogLevel.ERROR) {
      Logger.telemetry.recordEvent("error", {
        message: event.message,
        module: event.module,
        ...event.data,
      });
    } else if (event.level === LogLevel.INFO || event.level === LogLevel.WARN) {
      // Allow recording interesting events
      // Use the log message as the event name
      Logger.telemetry.recordEvent(event.message, {
        module: event.module,
        ...event.data,
      });
    }
  }

  public log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const event = this.formatLogEvent(level, message, data);

    // Buffer logs
    Logger.logBuffer.push(event);
    if (Logger.logBuffer.length > Logger.MAX_LOG_BUFFER) {
      Logger.logBuffer.shift();
    }

    // Emit log event
    Logger.logEmitter.fire(event);

    this.logToConsole(event);
    this.logToFile(event);
    if (
      level === LogLevel.INFO ||
      level === LogLevel.WARN ||
      level === LogLevel.ERROR
    ) {
      this.logToTelemetry(event);
    }
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  public startTimer(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${operation} completed in ${duration}ms`);

      if (Logger.telemetry) {
        Logger.telemetry.recordMetric(
          `duration.${this.module}.${operation}`,
          duration,
        );
      }
    };
  }

  public traceOperation<T>(
    operation: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const span = Logger.telemetry?.startSpan(`${this.module}.${operation}`);
    const endTimer = this.startTimer(operation);

    return fn()
      .then((result) => {
        endTimer();
        span?.setStatus("success");
        return result;
      })
      .catch((error) => {
        endTimer();
        span?.setStatus("error", error.message);
        this.error(`Error in ${operation}`, error);
        throw error;
      })
      .finally(() => {
        span?.end();
      });
  }
}
