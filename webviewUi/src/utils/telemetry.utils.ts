/** Shared telemetry / span helpers used by ObservabilityPanel & AgentTimeline */

export interface SpanData {
  startTime?: [number, number];
  endTime?: [number, number];
  context?: { spanId?: string; traceId?: string };
  parentSpanId?: string;
  name?: string;
  status?: { code?: number; message?: string };
  attributes?: Record<string, any>;
  events?: any[];
}

/** Convert OTel hrtime [seconds, nanoseconds] to epoch milliseconds */
export const hrTimeToMs = (t?: [number, number]): number =>
  (t?.[0] ?? 0) * 1000 + (t?.[1] ?? 0) / 1e6;

export const spanStartMs = (s: SpanData): number => hrTimeToMs(s.startTime);
export const spanEndMs = (s: SpanData): number => hrTimeToMs(s.endTime);

export const fmtDuration = (ms: number): string => {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m${((ms % 60000) / 1000).toFixed(0)}s`;
};

export const fmtCost = (usd: number): string =>
  usd < 0.01 ? `$${usd.toFixed(6)}` : `$${usd.toFixed(4)}`;

export const fmtTokens = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
