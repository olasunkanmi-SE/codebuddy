import * as path from "path";
import * as crypto from "crypto";
import { OutputManager } from "../../services/output-manager";
import * as os from "os";
import * as fs from "fs";
import { FileUtils } from "../../utils/common-utils";

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
  private static initializationPromise: Promise<void> | null = null;
  constructor(private readonly module: string) {}

  public static initialize(
    module: string,
    config: Partial<ILoggerConfig>,
    telemetry?: ITelemetry,
  ): Logger {
    Logger.config = { ...Logger.config, ...config };

    // Force disable file logging if environment variable is set
    if (process.env.CODEBUDDY_DISABLE_FILE_LOGGING === "true") {
      Logger.config.enableFile = false;
    }

    // Force disable console logging if running as MCP Server to protect stdio transport
    if (process.env.CODEBUDDY_MCP_SERVER === "true") {
      Logger.config.enableConsole = false;
    }

    if (Logger.config.enableFile && !Logger.config.filePath) {
      const baseDir = path.join(os.homedir(), ".codebuddy", "logs");

      const date = new Date().toISOString();
      const safeDate = date.replace(/[:.]/g, "-");
      Logger.config.filePath = path.join(baseDir, `codebuddy-${safeDate}.log`);
    }
    if (Logger.config.enableFile && Logger.config.filePath) {
      if (!Logger.initializationPromise) {
        Logger.initializationPromise = Logger.ensureLogDir();
      }
      // console.error(Logger.config.filePath);
    }
    if (telemetry) {
      Logger.telemetry = telemetry;
    }
    Logger.setTraceId(Logger.generateId());

    // Always return a new instance to ensure correct module name mapping
    // The configuration is shared statically
    return new Logger(module);
  }

  private static async ensureLogDir(): Promise<void> {
    if (!Logger.config.filePath) return;
    const logDir = path.dirname(Logger.config.filePath);
    try {
      if (!fs.existsSync(logDir)) {
        await fs.promises.mkdir(logDir, { recursive: true });
      }
    } catch (err) {
      console.error("Failed to create log directory", err);
    }
  }

  public static setTraceId(id: string) {
    Logger.traceId = id;
  }

  public static getTraceId() {
    return Logger.traceId;
  }

  public static generateId(): string {
    return crypto.randomUUID();
  }

  public log(level: LogLevel, message: string, data?: any) {
    if (this.shouldLog(level)) {
      const event: ILogEvent = {
        timestamp: new Date().toISOString(),
        level,
        module: this.module,
        message,
        data,
        sessionId: Logger.sessionId,
        traceId: Logger.traceId,
      };

      if (Logger.config.enableConsole) {
        this.logToConsole(event);
      }

      if (Logger.config.enableFile) {
        this.logToFile(event);
      }

      if (Logger.config.enableTelemetry && Logger.telemetry) {
        Logger.telemetry.recordEvent("log", event as any);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    return levels.indexOf(level) >= levels.indexOf(Logger.config.minLevel);
  }

  private logToConsole(event: ILogEvent) {
    const color = this.getColor(event.level);
    const message = `[${event.timestamp}] [${event.level}] [${event.module}] ${event.message}`;

    // Use OutputManager instead of direct console
    this.outputManager.appendLine(message);
    if (event.data) {
      this.outputManager.appendLine(JSON.stringify(event.data, null, 2));
    }
  }

  private async logToFile(event: ILogEvent) {
    if (Logger.config.filePath) {
      if (Logger.initializationPromise) {
        await Logger.initializationPromise;
      }
      const logLine = JSON.stringify(event) + "\n";
      const encoder = new TextEncoder();
      const content = encoder.encode(logLine);
      try {
        await fs.promises.appendFile(Logger.config.filePath, content);
      } catch (err) {
        console.error("Failed to write to log file", err);
      }
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "\x1b[34m"; // Blue
      case LogLevel.INFO:
        return "\x1b[32m"; // Green
      case LogLevel.WARN:
        return "\x1b[33m"; // Yellow
      case LogLevel.ERROR:
        return "\x1b[31m"; // Red
      default:
        return "\x1b[0m"; // Reset
    }
  }

  public debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, error?: any) {
    this.log(LogLevel.ERROR, message, {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
  }
}
