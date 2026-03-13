/** Shared telemetry / span helpers used by ObservabilityPanel & AgentTimeline */

export interface SpanData {
  startTime?: [number, number];
  endTime?: [number, number];
  context?: { spanId?: string; traceId?: string };
  parentSpanId?: string;
  name?: string;
  status?: { code?: number; message?: string };
  attributes?: Record<string, unknown>;
  events?: SpanEvent[];
}

export interface SpanEvent {
  name?: string;
  attributes?: Record<string, unknown>;
}

/** Convert OTel hrtime [seconds, nanoseconds] to epoch milliseconds */
export const hrTimeToMs = (t?: [number, number]): number =>
  (t?.[0] ?? 0) * 1000 + (t?.[1] ?? 0) / 1e6;

export const spanStartMs = (s: SpanData): number => hrTimeToMs(s.startTime);
export const spanEndMs = (s: SpanData): number => hrTimeToMs(s.endTime);

export const fmtDuration = (ms: number): string => {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.floor(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m${s}s`;
};

export const fmtCost = (usd: number): string =>
  usd < 0.01 ? `$${usd.toFixed(6)}` : `$${usd.toFixed(4)}`;

export const fmtTokens = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
