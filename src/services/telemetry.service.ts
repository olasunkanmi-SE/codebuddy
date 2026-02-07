import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { ITelemetry, ISpan, Logger } from "../infrastructure/logger/logger";

export class TelemetryService implements ITelemetry {
  private static instance: TelemetryService;
  private telemetryFilePath: string;
  private initialized = false;
  private queue: string[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    const baseDir = path.join(os.homedir(), ".codebuddy");
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (e) {
        // Ignore if fails, we just won't write
      }
    }
    this.telemetryFilePath = path.join(baseDir, "telemetry.jsonl");
    this.initialized = true;

    // Start flush loop
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public recordEvent(name: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    const entry = {
      type: "event",
      name,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: Logger.sessionId,
      traceId: Logger.getTraceId(),
    };

    this.queue.push(JSON.stringify(entry));
  }

  public recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    if (!this.initialized) return;

    const entry = {
      type: "metric",
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
      sessionId: Logger.sessionId,
      traceId: Logger.getTraceId(),
    };

    this.queue.push(JSON.stringify(entry));
  }

  public startSpan(name: string): ISpan {
    const startTime = Date.now();
    const spanId = Logger.generateId();

    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.recordMetric(`${name}.duration`, duration, { spanId });
      },
      setStatus: (status: "success" | "error", message?: string) => {
        this.recordEvent(`${name}.status`, { status, message, spanId });
      },
      addEvent: (eventName: string, attributes?: Record<string, any>) => {
        this.recordEvent(`${name}.${eventName}`, { ...attributes, spanId });
      },
    };
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    const content = batch.join("\n") + "\n";

    try {
      await fs.promises.appendFile(this.telemetryFilePath, content, "utf8");
    } catch (error) {
      console.error("Failed to write telemetry", error);
      // Put back in queue if ephemeral error? No, just drop to avoid memory leak
    }
  }

  public dispose() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flush(); // Final flush
    }
  }
}
