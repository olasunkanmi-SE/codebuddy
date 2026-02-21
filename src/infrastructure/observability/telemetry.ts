import * as traceloop from "@traceloop/node-server-sdk";
import { trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { Logger, LogLevel } from "../logger/logger";

/**
 * LocalObservabilityService manages local-only telemetry for the AI Agent.
 * It uses OpenLLMetry (Traceloop) to capture LangGraph/LangChain traces
 * and exports them to a local OTLP endpoint (default: http://localhost:4318/v1/traces).
 * It also maintains an in-memory buffer of traces for the webview UI.
 */
export class LocalObservabilityService {
  private static instance: LocalObservabilityService;
  private readonly logger: Logger;
  private isInitialized: boolean = false;
  private inMemoryExporter: InMemorySpanExporter | undefined;

  private constructor() {
    this.logger = Logger.initialize("LocalObservabilityService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): LocalObservabilityService {
    if (!LocalObservabilityService.instance) {
      LocalObservabilityService.instance = new LocalObservabilityService();
    }
    return LocalObservabilityService.instance;
  }

  /**
   * Initializes the OpenLLMetry SDK for local tracing.
   * This should be called during extension activation.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info("Initializing LocalObservabilityService...");

    try {
      // Register in-memory exporter
      this.inMemoryExporter = new InMemorySpanExporter();

      // Create a custom processor that logs spans for debugging
      const processor = new SimpleSpanProcessor(this.inMemoryExporter);
      const originalOnEnd = processor.onEnd.bind(processor);
      processor.onEnd = (span: ReadableSpan) => {
        this.logger.debug(
          `[TELEMETRY] Span finished: ${span.name} (${span.kind}) TraceId: ${span.spanContext().traceId}`,
        );
        if (span.attributes) {
          this.logger.debug(
            `[TELEMETRY] Attributes: ${JSON.stringify(span.attributes)}`,
          );
        }
        return originalOnEnd(span);
      };

      // 1. setupInstrumentation() should already have run and registered a provider.
      // Check and create a fallback provider if needed.
      let provider = trace.getTracerProvider() as any;
      let unwrapped = provider?._delegate || provider;
      const isNoop =
        !provider ||
        provider.constructor.name === "NoopTracerProvider" ||
        unwrapped?.constructor.name === "NoopTracerProvider";

      if (isNoop) {
        this.logger.info(
          "No tracer provider found, creating BasicTracerProvider with processor...",
        );
        const { BasicTracerProvider } =
          await import("@opentelemetry/sdk-trace-base");
        const newProvider = new BasicTracerProvider();

        // Attach processor directly before setting global (OTel 2.x: push to internal MultiSpanProcessor)
        const asp = (newProvider as any)._activeSpanProcessor;
        if (asp?._spanProcessors) {
          asp._spanProcessors.push(processor);
          this.logger.info(
            "✓ Pre-attached processor to new BasicTracerProvider",
          );
        }

        if (trace.setGlobalTracerProvider) {
          trace.setGlobalTracerProvider(newProvider);
          this.logger.info("✓ Set global tracer provider");
        }

        this.isInitialized = true;
        this.createTestSpan("initialization_test_span");
        this.logger.info(
          "✓ Local observability initialized with in-memory exporter",
        );
        return;
      }

      // 2. Attach our in-memory processor to the existing provider
      const attachProcessor = (targetProvider: any): boolean => {
        if (!targetProvider) {
          this.logger.warn("attachProcessor called with null provider");
          return false;
        }

        this.logger.info(
          `Attempting to attach processor to: ${targetProvider.constructor?.name}`,
        );

        // Handle ProxyTracerProvider
        if (targetProvider._delegate) {
          this.logger.info(
            `Unwrapping proxy to: ${targetProvider._delegate.constructor?.name}`,
          );
          targetProvider = targetProvider._delegate;
        }

        // Standard OTel attachment (e.g. BasicTracerProvider or OTel 1.x)
        if (typeof targetProvider.addSpanProcessor === "function") {
          targetProvider.addSpanProcessor(processor);
          this.logger.info("✓ Attached via addSpanProcessor");
          return true;
        }

        // OTel 2.x fallback / Internal OTel SDK structure
        const activeProcessor =
          targetProvider._activeSpanProcessor ||
          targetProvider.activeSpanProcessor;
        if (activeProcessor) {
          this.logger.info(
            `Found active processor: ${activeProcessor.constructor?.name}`,
          );
          // If it's a MultiSpanProcessor, we can push to its internal array
          if (Array.isArray(activeProcessor._spanProcessors)) {
            activeProcessor._spanProcessors.push(processor);
            this.logger.info("✓ Attached via MultiSpanProcessor push");
            return true;
          }
          // If it's just a single processor, we might be out of luck unless we can wrap it,
          // but usually BasicTracerProvider has addSpanProcessor.
        }

        // Final attempt: Check for sharedState (common in newer OTel JS SDKs)
        if (
          targetProvider._sharedState &&
          targetProvider._sharedState.activeSpanProcessor
        ) {
          const sp = targetProvider._sharedState.activeSpanProcessor;
          if (Array.isArray(sp._spanProcessors)) {
            sp._spanProcessors.push(processor);
            this.logger.info(
              "✓ Attached via sharedState.activeSpanProcessor push",
            );
            return true;
          }
        }

        return false;
      };

      if (!attachProcessor(provider)) {
        this.logger.warn(
          "Could not attach processor immediately, retrying with global provider...",
        );
        // One last try with the latest global provider
        const finalProvider = trace.getTracerProvider();
        if (!attachProcessor(finalProvider)) {
          this.logger.error(
            "❌ FAILED to attach span processor to ANY provider. Traces will not be captured.",
          );
        } else {
          this.createTestSpan("post_init_retry_span");
        }
      } else {
        this.createTestSpan("initialization_test_span");
      }

      this.isInitialized = true;
      this.logger.info(
        "✓ Local observability initialized with in-memory exporter",
      );
    } catch (error) {
      this.logger.error("Failed to initialize local observability", error);
    }
  }

  /**
   * Returns the captured spans from the in-memory exporter.
   */
  public getSpans(): ReadableSpan[] {
    if (!this.inMemoryExporter) {
      this.logger.warn(
        "getSpans called but inMemoryExporter is not initialized",
      );
      return [];
    }
    const spans = this.inMemoryExporter.getFinishedSpans();
    this.logger.debug(
      `getSpans returning ${spans.length} spans. First few names: ${spans
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ")}`,
    );
    return spans;
  }

  /**
   * Clears the captured spans.
   */
  public clearSpans(): void {
    if (this.inMemoryExporter) {
      this.inMemoryExporter.reset();
    }
  }

  /**
   * Creates a test span to verify the telemetry pipeline.
   */
  public createTestSpan(name: string = "telemetry_test_span"): void {
    try {
      this.logger.info(`Creating manual test span: ${name}`);
      const tracer = trace.getTracer("telemetry-test");
      const span = tracer.startSpan(name);
      span.setAttribute("test.status", "ok");
      span.setAttribute("timestamp", new Date().toISOString());

      setTimeout(() => {
        span.end();
        this.logger.debug(`Finished manual test span: ${name}`);
        // Log the current number of spans
        if (this.inMemoryExporter) {
          const spans = this.inMemoryExporter.getFinishedSpans();
          this.logger.debug(
            `Total spans in exporter after test: ${spans.length}`,
          );
        }
      }, 100);
    } catch (error) {
      this.logger.error("Failed to create test span", error);
    }
  }
}
