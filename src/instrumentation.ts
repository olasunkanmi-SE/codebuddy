import * as traceloop from "@traceloop/node-server-sdk";
import { trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  BasicTracerProvider,
} from "@opentelemetry/sdk-trace-base";

/**
 * Early instrumentation setup to ensure all modules are correctly patched.
 */
export function setupInstrumentation() {
  console.log("[INSTRUMENTATION] Initializing Traceloop early...");

  traceloop.initialize({
    appName: "codebuddy-agent",
    disableBatch: true,
    baseUrl: "http://localhost:4318",
    traceContent: true,
    traceloopSyncEnabled: false,
    instrumentModules: {
      langchain: false,
      openAI: false,
      anthropic: false,
      google_generative_ai: false,
      chromadb: false,
      pinecone: false,
      qdrant: false,
    } as any,
  });

  // Ensure we have a valid provider
  let provider = trace.getTracerProvider() as any;
  const isNoop =
    !provider ||
    provider.constructor.name === "NoopTracerProvider" ||
    (provider as any)._delegate?.constructor.name === "NoopTracerProvider";

  if (isNoop) {
    console.log("[INSTRUMENTATION] Registering BasicTracerProvider...");
    const newProvider = new BasicTracerProvider();
    trace.setGlobalTracerProvider(newProvider);
    provider = newProvider;
  }

  console.log("[INSTRUMENTATION] Instrumentation setup complete.");
}

// The initialization is now called explicitly from extension.ts
// setupInstrumentation();
