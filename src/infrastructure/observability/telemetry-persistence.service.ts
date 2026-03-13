import * as path from "path";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as os from "os";
import type { Database, SqlJsStatic, ParamsObject } from "sql.js";
import { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { Logger, LogLevel } from "../logger/logger";

/** Seconds in one day — avoids magic number `86_400`. */
const SECONDS_IN_DAY = 86_400;

/** Access `parentSpanId` which exists on the concrete Span but not on ReadableSpan. */
interface SpanWithParent extends ReadableSpan {
  readonly parentSpanId?: string;
}

/**
 * Configuration injected at initialization time so the service
 * is decoupled from the VS Code settings API.
 */
export interface TelemetryPersistenceConfig {
  retentionDays: number;
}

/**
 * Serialized span row stored in SQLite.
 * Matches the `spans` table schema.
 */
export interface PersistedSpan {
  span_id: string;
  trace_id: string;
  parent_id: string | null;
  name: string;
  kind: number;
  start_time_s: number;
  start_time_ns: number;
  end_time_s: number;
  end_time_ns: number;
  status_code: number;
  status_message: string | null;
  attributes: string; // JSON
  events: string; // JSON
  links: string; // JSON
  session_id: string;
  created_at: number; // epoch seconds
}

/**
 * Shape returned by `querySpans()` — matches what ObservabilityPanel expects.
 */
export interface QueriedSpan {
  name: string;
  kind: number;
  context: { spanId: string; traceId: string };
  parentSpanId?: string;
  startTime: [number, number];
  endTime: [number, number];
  status: { code: number; message?: string };
  attributes: Record<string, unknown>;
  events: Array<{
    name: string;
    time?: [number, number];
    attributes?: Record<string, unknown>;
  }>;
  links: Array<{
    context: { spanId: string; traceId: string };
    attributes?: Record<string, unknown>;
  }>;
  duration: [number, number];
  _sessionId: string;
  _persisted: boolean;
}

/**
 * Persists OTel spans to a local SQLite database so telemetry survives
 * across VS Code sessions.
 *
 * Architecture:
 *  - Uses sql.js (WASM SQLite) — same dependency already used by the project.
 *  - DB stored at `~/.codebuddy/telemetry/traces.db`.
 *  - Batches inserts for performance (flush every 5s or on 50 spans).
 *  - Auto-prunes spans older than `retentionDays` on startup.
 *  - Exposes query methods used by the ObservabilityPanel handler.
 */
export class TelemetryPersistenceService {
  private static instance: TelemetryPersistenceService;
  private readonly logger: Logger;
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private dbPath = "";
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private pendingSpans: PersistedSpan[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private needsVacuum = false;
  private sessionId: string;
  private config: TelemetryPersistenceConfig | null = null;

  /** Maximum spans buffered before auto-flush. */
  private static readonly FLUSH_THRESHOLD = 50;
  /** Interval between periodic flushes (ms). */
  private static readonly FLUSH_INTERVAL_MS = 5_000;

  private constructor() {
    this.logger = Logger.initialize("TelemetryPersistence", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: false, // avoid infinite recursion
    });
    this.sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  static getInstance(): TelemetryPersistenceService {
    return (TelemetryPersistenceService.instance ??=
      new TelemetryPersistenceService());
  }

  // ── Lifecycle ──────────────────────────────────────────

  async initialize(config: TelemetryPersistenceConfig): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.config = config;
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      this.logger.info("Initializing telemetry persistence...");

      const initSqlJs = (await import("sql.js")).default;
      const wasmPath = path.join(__dirname, "grammars", "sql-wasm.wasm");
      this.SQL = await initSqlJs({
        locateFile: (file: string) =>
          file.endsWith(".wasm") ? wasmPath : file,
      });

      // Store in ~/.codebuddy/telemetry/
      const telemetryDir = path.join(os.homedir(), ".codebuddy", "telemetry");
      if (!fs.existsSync(telemetryDir)) {
        fs.mkdirSync(telemetryDir, { recursive: true });
      }
      this.dbPath = path.join(telemetryDir, "traces.db");

      // Load existing DB or create new (async read to avoid blocking)
      let data: Uint8Array | undefined;
      try {
        if (fs.existsSync(this.dbPath)) {
          this.logger.info("Loading existing telemetry database...");
          data = new Uint8Array(await fsPromises.readFile(this.dbPath));
        }
      } catch (readError) {
        this.logger.error(
          `Failed to read existing telemetry database at ${this.dbPath}`,
          readError,
        );
        data = undefined;
      }

      this.db = new this.SQL.Database(data);
      this.createSchema();

      // Prune old data using injected config
      const retentionDays = this.config!.retentionDays;
      this.pruneOldSpans(retentionDays);

      // Start periodic flush (fire-and-forget — errors handled inside flush)
      this.flushTimer = setInterval(
        () => void this.flush(),
        TelemetryPersistenceService.FLUSH_INTERVAL_MS,
      );

      this.initialized = true;
      await this.saveToDisk();
      this.logger.info(
        `✓ Telemetry persistence initialized (session ${this.sessionId}, retention ${retentionDays}d)`,
      );
    } catch (error) {
      this.initPromise = null;
      this.logger.error("Failed to initialize telemetry persistence", error);
    }
  }

  private createSchema(): void {
    this.db!.run(`
      CREATE TABLE IF NOT EXISTS spans (
        span_id      TEXT PRIMARY KEY,
        trace_id     TEXT NOT NULL,
        parent_id    TEXT,
        name         TEXT NOT NULL,
        kind         INTEGER NOT NULL DEFAULT 0,
        start_time_s INTEGER NOT NULL,
        start_time_ns INTEGER NOT NULL,
        end_time_s   INTEGER NOT NULL,
        end_time_ns  INTEGER NOT NULL,
        status_code  INTEGER NOT NULL DEFAULT 0,
        status_message TEXT,
        attributes   TEXT,
        events       TEXT,
        links        TEXT,
        session_id   TEXT NOT NULL,
        created_at   INTEGER NOT NULL
      )
    `);

    // Create indexes for common query patterns
    this.db!.run(
      `CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans(trace_id)`,
    );
    this.db!.run(
      `CREATE INDEX IF NOT EXISTS idx_spans_created ON spans(created_at)`,
    );
    this.db!.run(
      `CREATE INDEX IF NOT EXISTS idx_spans_session ON spans(session_id)`,
    );
    this.db!.run(`CREATE INDEX IF NOT EXISTS idx_spans_name ON spans(name)`);
  }

  // ── Write path ─────────────────────────────────────────

  /**
   * Record a completed OTel span. This is called from the custom
   * SpanProcessor's `onEnd` handler.
   */
  recordSpan(span: ReadableSpan): void {
    if (!this.initialized) return;

    const ctx = span.spanContext();
    const row: PersistedSpan = {
      span_id: ctx.spanId,
      trace_id: ctx.traceId,
      parent_id: (span as SpanWithParent).parentSpanId || null,
      name: span.name,
      kind: span.kind,
      start_time_s: span.startTime[0],
      start_time_ns: span.startTime[1],
      end_time_s: span.endTime[0],
      end_time_ns: span.endTime[1],
      status_code: span.status.code,
      status_message: span.status.message ?? null,
      attributes: JSON.stringify(span.attributes ?? {}),
      events: JSON.stringify(
        (span.events ?? []).map((e) => ({
          name: e.name,
          time: e.time,
          attributes: e.attributes,
        })),
      ),
      links: JSON.stringify(
        (span.links ?? []).map((l) => ({
          context: l.context,
          attributes: l.attributes,
        })),
      ),
      session_id: this.sessionId,
      created_at: Math.floor(Date.now() / 1000),
    };

    this.pendingSpans.push(row);

    if (
      this.pendingSpans.length >= TelemetryPersistenceService.FLUSH_THRESHOLD
    ) {
      void this.flush();
    }
  }

  /**
   * Write all buffered spans to SQLite and persist to disk.
   */
  async flush(): Promise<void> {
    if (!this.db || this.pendingSpans.length === 0) return;

    const batch = this.pendingSpans.splice(0);
    try {
      this.db.run("BEGIN TRANSACTION");
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO spans (
          span_id, trace_id, parent_id, name, kind,
          start_time_s, start_time_ns, end_time_s, end_time_ns,
          status_code, status_message, attributes, events, links,
          session_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of batch) {
        stmt.run([
          r.span_id,
          r.trace_id,
          r.parent_id,
          r.name,
          r.kind,
          r.start_time_s,
          r.start_time_ns,
          r.end_time_s,
          r.end_time_ns,
          r.status_code,
          r.status_message,
          r.attributes,
          r.events,
          r.links,
          r.session_id,
          r.created_at,
        ]);
      }

      stmt.free();
      this.db.run("COMMIT");
      await this.saveToDisk();

      this.logger.debug(`Flushed ${batch.length} spans to telemetry database`);
    } catch (error) {
      try {
        this.db.run("ROLLBACK");
      } catch {
        // suppress
      }
      this.logger.error("Failed to flush spans to database", error);
      // Re-queue failed spans (at the front) for next attempt
      this.pendingSpans.unshift(...batch);
    }
  }

  // ── Read path ──────────────────────────────────────────

  /**
   * Query persisted spans, returning them in the same serialized shape
   * that ObservabilityPanel expects.
   *
   * @param days  Number of days of history to load (default: from settings)
   * @param limit Maximum number of spans to return
   */
  querySpans(days?: number, limit = 10_000): QueriedSpan[] {
    if (!this.db) return [];

    const retentionDays = days ?? this.config?.retentionDays ?? 7;
    const cutoff =
      Math.floor(Date.now() / 1000) - retentionDays * SECONDS_IN_DAY;

    const stmt = this.db.prepare(`
      SELECT span_id, trace_id, parent_id, name, kind,
             start_time_s, start_time_ns, end_time_s, end_time_ns,
             status_code, status_message, attributes, events, links,
             session_id
      FROM spans
      WHERE created_at >= :cutoff
      ORDER BY start_time_s DESC, start_time_ns DESC
      LIMIT :limit
    `);
    stmt.bind({ ":cutoff": cutoff, ":limit": limit });

    const results: QueriedSpan[] = [];
    while (stmt.step()) {
      const obj = stmt.getAsObject() as ParamsObject;

      results.push({
        name: obj.name as string,
        kind: obj.kind as number,
        context: {
          spanId: obj.span_id as string,
          traceId: obj.trace_id as string,
        },
        parentSpanId: (obj.parent_id as string) || undefined,
        startTime: [obj.start_time_s as number, obj.start_time_ns as number],
        endTime: [obj.end_time_s as number, obj.end_time_ns as number],
        status: {
          code: obj.status_code as number,
          message: (obj.status_message as string) || undefined,
        },
        attributes: JSON.parse((obj.attributes as string) || "{}"),
        events: JSON.parse((obj.events as string) || "[]"),
        links: JSON.parse((obj.links as string) || "[]"),
        duration: [
          (obj.end_time_s as number) - (obj.start_time_s as number),
          (obj.end_time_ns as number) - (obj.start_time_ns as number),
        ],
        _sessionId: obj.session_id as string,
        _persisted: true,
      });
    }
    stmt.free();

    return results;
  }

  /**
   * Return distinct session IDs with their date ranges.
   */
  querySessions(): Array<{
    sessionId: string;
    spanCount: number;
    firstSeen: number;
    lastSeen: number;
  }> {
    if (!this.db) return [];

    const rows = this.db.exec(`
      SELECT session_id,
             COUNT(*) as span_count,
             MIN(created_at) as first_seen,
             MAX(created_at) as last_seen
      FROM spans
      GROUP BY session_id
      ORDER BY last_seen DESC
    `);

    if (!rows.length) return [];
    return rows[0].values.map((row: any[]) => ({
      sessionId: row[0] as string,
      spanCount: row[1] as number,
      firstSeen: row[2] as number,
      lastSeen: row[3] as number,
    }));
  }

  /**
   * Delete spans older than the given number of days.
   */
  pruneOldSpans(days: number): number {
    if (!this.db) return 0;

    const cutoff = Math.floor(Date.now() / 1000) - days * SECONDS_IN_DAY;

    // Get count before deletion for logging
    const countStmt = this.db.prepare(
      `SELECT COUNT(*) as cnt FROM spans WHERE created_at < :cutoff`,
    );
    countStmt.bind({ ":cutoff": cutoff });
    let count = 0;
    if (countStmt.step()) {
      count = countStmt.getAsObject().cnt as number;
    }
    countStmt.free();

    if (count > 0) {
      const delStmt = this.db.prepare(
        `DELETE FROM spans WHERE created_at < :cutoff`,
      );
      delStmt.bind({ ":cutoff": cutoff });
      delStmt.step();
      delStmt.free();
      this.needsVacuum = true;
      this.logger.info(
        `Pruned ${count} spans older than ${days} days from telemetry database`,
      );
    }

    return count;
  }

  /**
   * Delete all persisted spans.
   */
  async clearAll(): Promise<void> {
    if (!this.db) return;

    this.db.run(`DELETE FROM spans`);
    this.pendingSpans = [];
    this.needsVacuum = true;
    await this.saveToDisk();
    this.logger.info("Cleared all persisted telemetry spans");
  }

  // ── Shutdown ───────────────────────────────────────────

  /**
   * Flush remaining spans and close the database.
   * Call from extension deactivate().
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down telemetry persistence...");

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush of any buffered spans
    await this.flush();

    if (this.db) {
      try {
        // Execute deferred VACUUM before closing
        if (this.needsVacuum) {
          this.db.run("VACUUM");
          this.needsVacuum = false;
          await this.saveToDisk();
        }
        this.db.close();
      } catch {
        // suppress
      }
      this.db = null;
    }

    this.initialized = false;
    this.initPromise = null;
    this.logger.info("✓ Telemetry persistence shut down");
  }

  // ── Helpers ────────────────────────────────────────────

  private async saveToDisk(): Promise<void> {
    if (!this.db || !this.dbPath) return;

    try {
      const data = this.db.export();
      await fsPromises.writeFile(this.dbPath, data);
    } catch (error) {
      this.logger.error("Failed to save telemetry database to disk", error);
    }
  }
}
