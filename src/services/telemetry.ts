import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { handleWarning, showInfoMessage } from "../utils/utils";

// TODO Log data in MongoDB Atlas

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

  private static outputChannel: vscode.OutputChannel | undefined;
  private static telemetry: ITelemetry | undefined;
  private static sessionId: string;
  private static traceId: string;
  constructor(private readonly module: string) {}

  public initialize(
    config: Partial<ILoggerConfig>,
    telemetry?: ITelemetry,
  ): void {
    Logger.config = { ...Logger.config, ...config };
    if (Logger.config.enableFile && !Logger.config.filePath) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        const logDir = path.join(
          workspaceFolder.uri.fsPath,
          ".codebuddy",
          "logs",
        );
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        const date = new Date().toISOString();
        Logger.config.filePath = path.join(logDir, `codebuddy-${date}.log`);
      }
    }
    Logger.outputChannel ??= vscode.window.createOutputChannel("CodeBuddy");
    Logger.telemetry = telemetry;
    Logger.setTraceId(Logger.generateId());
  }

  public static setTraceId(traceId: string): void {
    Logger.traceId = traceId;
  }

  private static generateId(): string {
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

    if (Logger.outputChannel) {
      Logger.outputChannel.appendLine(formattedMessage);

      if (event.data) {
        Logger.outputChannel.appendLine(JSON.stringify(event.data, null, 2));
      }
    } else {
      console.log(formattedMessage, event.data ?? "");
    }
  }

  private logToFile(event: ILogEvent): void {
    if (!Logger.config.enableFile || !Logger.config.filePath) return;

    try {
      const logEntry = JSON.stringify(event) + "\n";
      fs.appendFileSync(Logger.config.filePath, logEntry);
    } catch (error: any) {
      console.error("Failed to write to log file:", error);
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
    }
  }

  public log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const event = this.formatLogEvent(level, message, data);
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
    showInfoMessage(message);
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    handleWarning(message);
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
