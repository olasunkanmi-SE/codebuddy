import { WebviewMessageHandler, HandlerContext } from "./types";
import { ObservabilityService } from "../../services/observability.service";
import { LocalObservabilityService } from "../../infrastructure/observability/telemetry";
import { MCPService } from "../../MCP/service";

export class ObservabilityHandler implements WebviewMessageHandler {
  readonly commands = [
    "observability-get-logs",
    "observability-get-metrics",
    "observability-get-traces",
    "observability-clear-traces",
    "observability-send-test-trace",
    "get-dependency-graph",
  ];

  private sanitizeTraces(traces: any[]) {
    return traces.map((span) => ({
      name: span.name,
      context: span.spanContext(),
      parentSpanId: (span as any).parentSpanId,
      startTime: span.startTime,
      endTime: span.endTime,
      attributes: span.attributes,
      status: span.status,
      events: span.events,
      links: span.links,
      kind: span.kind,
      duration: [
        span.endTime[0] - span.startTime[0],
        span.endTime[1] - span.startTime[1],
      ],
    }));
  }

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    switch (message.command) {
      case "observability-get-logs": {
        const logs = ObservabilityService.getInstance().getRecentLogs();
        await ctx.webview.webview.postMessage({
          type: "observability-logs",
          logs,
        });
        break;
      }

      case "observability-get-metrics": {
        const metrics = ObservabilityService.getInstance().getMetrics();
        const mcpStats = MCPService.getInstance().getStat();
        await ctx.webview.webview.postMessage({
          type: "observability-metrics",
          metrics: metrics ? { ...metrics, mcpStats } : { mcpStats },
        });
        break;
      }

      case "observability-get-traces": {
        const traces = ObservabilityService.getInstance().getTraces();
        ctx.logger.debug(
          `[WEBVIEW] Sending ${traces.length} traces to webview`,
        );
        await ctx.webview.webview.postMessage({
          type: "observability-traces",
          traces: this.sanitizeTraces(traces),
        });
        break;
      }

      case "observability-clear-traces": {
        ObservabilityService.getInstance().clearTraces();
        await ctx.webview.webview.postMessage({
          type: "observability-traces",
          traces: [],
        });
        break;
      }

      case "observability-send-test-trace": {
        ctx.logger.info("Received observability-send-test-trace command");
        LocalObservabilityService.getInstance().createTestSpan(
          "manual_webview_test_span",
        );
        setTimeout(async () => {
          const traces = ObservabilityService.getInstance().getTraces();
          ctx.logger.info(
            `[WEBVIEW] Sending ${traces.length} traces after test span`,
          );
          await ctx.webview.webview.postMessage({
            type: "observability-traces",
            traces: traces.map((span) => ({
              name: span.name,
              context: span.spanContext(),
              parentSpanId: (span as any).parentSpanId,
              startTime: span.startTime,
              endTime: span.endTime,
              attributes: span.attributes,
              status: span.status,
              events: span.events,
              links: span.links,
              kind: span.kind,
            })),
          });
        }, 500);
        break;
      }

      case "get-dependency-graph": {
        const { DependencyGraphService } =
          await import("../../services/dependency-graph.service");
        const graph = await DependencyGraphService.getInstance().generateGraph(
          message.force,
        );
        await ctx.webview.webview.postMessage({
          type: "dependency-graph",
          graph,
        });
        break;
      }
    }
  }
}
