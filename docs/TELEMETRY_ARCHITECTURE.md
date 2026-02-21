# Telemetry Architecture

End-to-end documentation of CodeBuddy's observability and telemetry pipeline — from span creation to the Observability Panel in the webview UI.

---

## Overview

CodeBuddy ships a fully local observability stack built on [OpenTelemetry](https://opentelemetry.io/) and [Traceloop (OpenLLMetry)](https://www.traceloop.com/). All telemetry data stays on the user's machine — nothing is sent to external services unless an OTLP collector is explicitly configured.

The stack provides three pillars:

| Pillar | What it captures | Storage |
|--------|-----------------|---------|
| **Traces** | Distributed spans from agent operations, LLM calls, tool invocations | In-memory (`InMemorySpanExporter`) |
| **Metrics** | Search latency, memory usage, indexing throughput, cache/error rates, MCP stats | Computed on-demand by `PerformanceProfiler` + `MCPService.getStat()` |
| **Logs** | Structured log events from every module | In-memory ring buffer (1000 entries) via `Logger` |

---

## End-to-End Flow

```mermaid
sequenceDiagram
    participant Ext as extension.ts<br/>(activate)
    participant SI as setupInstrumentation()
    participant TL as Traceloop SDK
    participant OTel as OpenTelemetry API<br/>(trace global)
    participant LOS as LocalObservabilityService
    participant IME as InMemorySpanExporter
    participant OS as ObservabilityService
    participant PP as PerformanceProfiler
    participant MCP as MCPService
    participant Base as BaseWebViewProvider
    participant WV as Webview (React)
    participant Panel as ObservabilityPanel

    Note over Ext: Extension activates

    Ext->>SI: 1. setupInstrumentation()
    SI->>TL: traceloop.initialize()
    TL->>OTel: Register NodeTracerProvider globally
    SI->>OTel: Verify provider (fallback to BasicTracerProvider)

    Ext->>LOS: 2. LocalObservabilityService.initialize()
    LOS->>LOS: Create InMemorySpanExporter
    LOS->>LOS: Create SimpleSpanProcessor (wraps exporter)
    LOS->>OTel: Get global TracerProvider
    alt Provider exists (NodeTracerProvider)
        LOS->>OTel: Unwrap ProxyTracerProvider → _delegate
        LOS->>OTel: Push processor into MultiSpanProcessor._spanProcessors
    else No provider (Noop)
        LOS->>OTel: Create BasicTracerProvider with processor
        LOS->>OTel: Set as global provider
    end
    LOS->>LOS: createTestSpan() to verify pipeline

    Note over Ext: Extension is running

    rect rgb(40, 40, 60)
        Note over WV,Panel: User opens Observability Panel
        WV->>Base: postMessage("observability-get-metrics")
        WV->>Base: postMessage("observability-get-logs")
        WV->>Base: postMessage("observability-get-traces")
    end

    Base->>OS: getMetrics()
    OS->>PP: getPerformanceReport()
    PP-->>OS: { avgSearchLatency, p95, memory, cache, errorRate }
    Base->>MCP: getStat()
    MCP-->>Base: { connectedServers, totalTools, invocations, ... }
    Base-->>WV: type: "observability-metrics" { ...metrics, mcpStats }

    Base->>OS: getRecentLogs()
    OS-->>Base: ILogEvent[]
    Base-->>WV: type: "observability-logs" { logs }

    Base->>OS: getTraces()
    OS->>LOS: getSpans()
    LOS->>IME: getFinishedSpans()
    IME-->>LOS: ReadableSpan[]
    LOS-->>OS: spans
    Base->>Base: Sanitize spans (remove circular refs)
    Base-->>WV: type: "observability-traces" { traces }

    WV->>Panel: setMetrics / setLogs / setTraces
    Panel->>Panel: Render Dashboard / Logs / Traces tabs
```

---

## Component Architecture

```mermaid
graph TB
    subgraph Extension Host
        EXT[extension.ts] --> SI[setupInstrumentation]
        EXT --> LOS[LocalObservabilityService]

        SI --> TL[Traceloop SDK]
        TL --> NTP[NodeTracerProvider]

        LOS --> IME[InMemorySpanExporter]
        LOS --> SSP[SimpleSpanProcessor]
        SSP --> IME

        NTP --> MSP[MultiSpanProcessor]
        MSP --> SSP
        MSP --> TLP[Traceloop's Processor]

        subgraph Services
            OS[ObservabilityService] --> LOS
            OS --> PP[PerformanceProfiler]
            LOG[Logger] --> BUF[Log Buffer<br/>1000 entries]
            OS --> LOG
        end

        subgraph MCP
            MCPS[MCPService] --> STATS[getStat]
        end

        BASE[BaseWebViewProvider] --> OS
        BASE --> MCPS
    end

    subgraph Webview React
        WVX[webview.tsx] --> OP[ObservabilityPanel]
        OP --> DASH[Dashboard Tab]
        OP --> LOGS[Logs Tab]
        OP --> TRACES[Traces Tab]

        DASH --> PERF[System Performance Cards]
        DASH --> MCPC[MCP Infrastructure Cards]
        LOGS --> FILT[Log Filter Toolbar]
        TRACES --> WATER[Waterfall View]
    end

    BASE <-->|postMessage| WVX

    style LOS fill:#2d5a27,stroke:#4a4,color:#fff
    style OS fill:#1a3a5c,stroke:#47a,color:#fff
    style OP fill:#5c2d1a,stroke:#a74,color:#fff
    style MSP fill:#4a2d5c,stroke:#74a,color:#fff
```

---

## Initialization Sequence

Initialization happens at the tail end of `extension.ts activate()`:

```typescript
// extension.ts — after all services are registered
try {
  setupInstrumentation();                                    // Step 1
  await LocalObservabilityService.getInstance().initialize(); // Step 2
} catch (obsError) {
  logger.error("Failed to initialize observability:", obsError);
}
```

### Step 1: `setupInstrumentation()` (`src/instrumentation.ts`)

Initializes the Traceloop (OpenLLMetry) SDK which:
- Registers a `NodeTracerProvider` as the global OTel provider
- Configures the OTLP export endpoint (`http://localhost:4318`)
- Disables auto-instrumentation for LLM libraries (manual tracing is used instead)

If Traceloop fails to register a provider, a fallback `BasicTracerProvider` is created.

### Step 2: `LocalObservabilityService.initialize()` (`src/infrastructure/observability/telemetry.ts`)

Attaches an in-memory span processor to the provider registered in Step 1:

1. Creates an `InMemorySpanExporter` to buffer spans locally
2. Wraps it in a `SimpleSpanProcessor` with debug logging
3. Gets the global `TracerProvider` (set by Traceloop)
4. Unwraps `ProxyTracerProvider` → `NodeTracerProvider`
5. Pushes the processor into `_activeSpanProcessor._spanProcessors[]` (OTel 2.x API)
6. Fires a test span to verify the pipeline

> **Critical:** `setupInstrumentation()` **must** run before `LocalObservabilityService.initialize()`. If the order is reversed, the in-memory processor gets attached to a temporary provider that Traceloop then replaces.

---

## Provider Attachment Strategy

The OTel 2.x SDK removed the public `addSpanProcessor()` method. `LocalObservabilityService` uses a multi-strategy approach:

```mermaid
flowchart TD
    A[Get Global TracerProvider] --> B{Is Noop?}
    B -->|Yes| C[Create BasicTracerProvider]
    C --> D[Push processor into<br/>_activeSpanProcessor._spanProcessors]
    D --> E[Set as global provider]
    E --> DONE[✓ Done]

    B -->|No| F{Has _delegate?}
    F -->|Yes| G[Unwrap ProxyTracerProvider]
    F -->|No| H[Use directly]
    G --> H

    H --> I{Has addSpanProcessor?}
    I -->|Yes| J[Call addSpanProcessor]
    J --> DONE

    I -->|No| K{Has _activeSpanProcessor?}
    K -->|Yes| L{_spanProcessors is Array?}
    L -->|Yes| M[Push to array]
    M --> DONE
    L -->|No| N{Has _sharedState?}
    K -->|No| N

    N -->|Yes| O[Push via sharedState]
    O --> DONE
    N -->|No| P[❌ Failed - retry with global]

    style DONE fill:#2d5a27,stroke:#4a4
    style P fill:#8b0000,stroke:#f44
```

---

## Data Flow: Three Pillars

### Traces

| Stage | Component | Description |
|-------|-----------|-------------|
| **Create** | Any service via `trace.getTracer().startSpan()` | Standard OTel span creation |
| **Process** | `SimpleSpanProcessor` | Logs span metadata, forwards to exporter |
| **Store** | `InMemorySpanExporter` | Buffers finished `ReadableSpan` objects |
| **Read** | `ObservabilityService.getTraces()` → `LocalObservabilityService.getSpans()` | Returns raw spans |
| **Sanitize** | `BaseWebViewProvider` handler | Strips circular refs, extracts `spanContext()`, computes duration |
| **Display** | `ObservabilityPanel` Traces tab | Grouped by `traceId`, waterfall view with span bars |

Trace message format sent to webview:
```typescript
{
  type: "observability-traces",
  traces: [{
    name: string,
    context: { traceId, spanId },
    parentSpanId?: string,
    startTime: [seconds, nanoseconds],
    endTime: [seconds, nanoseconds],
    attributes: Record<string, any>,
    status: { code: number },
    events: any[],
    links: any[],
    kind: number,
    duration: [diffSeconds, diffNanoseconds]
  }]
}
```

### Metrics

| Stage | Component | Description |
|-------|-----------|-------------|
| **Collect** | `PerformanceProfiler` | Rolling averages for latency, memory, throughput, cache, errors |
| **Collect** | `MCPService.getStat()` | Connected servers, tool counts, invocations, failure rate |
| **Aggregate** | `ObservabilityService.getMetrics()` | Returns `PerformanceReport` |
| **Merge** | `BaseWebViewProvider` handler | Spreads profiler report + `mcpStats` into single object |
| **Display** | `ObservabilityPanel` Dashboard tab | System Performance cards + MCP Infrastructure cards |

Metrics message format sent to webview:
```typescript
{
  type: "observability-metrics",
  metrics: {
    // PerformanceReport
    avgSearchLatency: number,
    p95SearchLatency: number,
    avgIndexingThroughput: number,
    avgMemoryUsage: number,
    cacheHitRate: number,    // 0.0 – 1.0
    errorRate: number,       // 0.0 – 1.0
    timestamp: Date,
    // MCP Stats
    mcpStats: {
      connectedServers: number,
      totalTools: number,
      uniqueTools: number,
      toolsByServer: Record<string, number>,
      totalInvocations: number,
      failedInvocations: number,
      isGatewayMode: boolean,
      lastRefresh: number    // epoch ms
    }
  }
}
```

### Logs

| Stage | Component | Description |
|-------|-----------|-------------|
| **Emit** | `Logger.log()` | Every module logs via `Logger` singleton |
| **Buffer** | `Logger.logBuffer` | Ring buffer, max 1000 entries |
| **Event** | `Logger.logEmitter` | `vscode.EventEmitter<ILogEvent>` for live streaming |
| **Read** | `ObservabilityService.getRecentLogs()` → `Logger.getRecentLogs()` | Returns buffer contents |
| **Display** | `ObservabilityPanel` Logs tab | Filterable by level (ERROR/WARN/INFO/DEBUG) |

Log entry structure:
```typescript
interface ILogEvent {
  timestamp: string,
  level: "ERROR" | "WARN" | "INFO" | "DEBUG",
  module: string,
  message: string,
  data?: any,
  sessionId: string,
  traceId: string
}
```

---

## Webview Communication Protocol

The Observability Panel uses VS Code's `postMessage` API for bidirectional communication:

```mermaid
sequenceDiagram
    participant Panel as ObservabilityPanel
    participant WV as webview.tsx
    participant Base as BaseWebViewProvider

    Note over Panel: Panel mounts (useEffect)

    Panel->>Base: { command: "observability-get-metrics" }
    Panel->>Base: { command: "observability-get-logs" }
    Panel->>Base: { command: "observability-get-traces" }

    Base-->>WV: { type: "observability-metrics", metrics }
    WV->>Panel: setMetrics(message.metrics)

    Base-->>WV: { type: "observability-logs", logs }
    WV->>Panel: setLogs(message.logs)

    Base-->>WV: { type: "observability-traces", traces }
    WV->>Panel: setTraces(message.traces)

    Note over Panel: Auto-refresh every 5s on Dashboard tab

    loop Every 5 seconds
        Panel->>Base: { command: "observability-get-metrics" }
        Base-->>WV: { type: "observability-metrics", metrics }
    end

    Note over Panel: User clicks "Send Test Trace"
    Panel->>Base: { command: "observability-send-test-trace" }
    Base->>Base: Creates test span (500ms delay)
    Base-->>WV: { type: "observability-traces", traces }

    Note over Panel: User clicks "Clear Traces"
    Panel->>Base: { command: "observability-clear-traces" }
    Base-->>WV: { type: "observability-traces", traces: [] }
```

### Message Commands (Webview → Extension)

| Command | Description |
|---------|-------------|
| `observability-get-metrics` | Fetch performance report + MCP stats |
| `observability-get-logs` | Fetch recent log buffer |
| `observability-get-traces` | Fetch all in-memory spans |
| `observability-clear-traces` | Reset the `InMemorySpanExporter` |
| `observability-send-test-trace` | Create a manual test span for debugging |

### Message Types (Extension → Webview)

| Type | Payload |
|------|---------|
| `observability-metrics` | `{ metrics: PerformanceReport & { mcpStats } }` |
| `observability-logs` | `{ logs: ILogEvent[] }` |
| `observability-traces` | `{ traces: SanitizedSpan[] }` |

---

## File Map

| File | Role |
|------|------|
| `src/instrumentation.ts` | Traceloop SDK init, global provider registration |
| `src/infrastructure/observability/telemetry.ts` | `LocalObservabilityService` — in-memory span capture |
| `src/services/observability.service.ts` | `ObservabilityService` — aggregation facade |
| `src/services/performance-profiler.service.ts` | `PerformanceProfiler` — rolling metric averages |
| `src/infrastructure/logger/logger.ts` | `Logger` — structured logging with buffer + event emitter |
| `src/MCP/service.ts` | `MCPService.getStat()` — MCP infrastructure metrics |
| `src/webview-providers/base.ts` | Message handlers for observability commands |
| `webviewUi/src/components/webview.tsx` | State management, message routing |
| `webviewUi/src/components/observability/ObservabilityPanel.tsx` | Dashboard / Logs / Traces UI |

---

## Troubleshooting

### "FAILED to attach span processor to ANY provider"

**Cause:** `LocalObservabilityService.initialize()` ran before `setupInstrumentation()`, or the OTel provider structure changed between SDK versions.

**Fix:** Ensure `setupInstrumentation()` is called first in `extension.ts`. The initialization order must be:
1. `setupInstrumentation()` — registers the `NodeTracerProvider` globally
2. `LocalObservabilityService.initialize()` — attaches the in-memory processor to the existing provider

### No traces appearing in the panel

1. Check the "System Logs" tab for `[TELEMETRY]` entries
2. Click "Send Test Trace" (beaker icon) — if the test span appears, the pipeline works
3. If no test span appears, the processor attachment failed (check logs for the attachment strategy used)

### Metrics show all zeros

The `PerformanceProfiler` must be registered with `ObservabilityService`:
```typescript
ObservabilityService.getInstance().registerProfiler(profiler);
```
This happens during extension activation. If no profiler is registered, `getMetrics()` returns `null` and the dashboard shows loading skeletons for the System Performance section (MCP stats still appear).

### MCP stats not showing

Verify `MCPService.getInstance().getStat()` is called in the `observability-get-metrics` handler in `base.ts`. The stats are merged into the metrics response:
```typescript
metrics: metrics ? { ...metrics, mcpStats } : { mcpStats }
```
