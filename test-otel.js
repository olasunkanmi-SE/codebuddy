const { trace } = require("@opentelemetry/api");
const { 
  BasicTracerProvider, 
  InMemorySpanExporter, 
  SimpleSpanProcessor 
} = require("@opentelemetry/sdk-trace-base");

// 1. Setup Provider
const provider = new BasicTracerProvider();
const exporter = new InMemorySpanExporter();
const processor = new SimpleSpanProcessor(exporter);

// Use the 2.x style if available, or fallback to addSpanProcessor
if (typeof provider.addSpanProcessor === 'function') {
  console.log("Using addSpanProcessor");
  provider.addSpanProcessor(processor);
} else {
  console.log("Using OTel 2.x _activeSpanProcessor fallback");
  const activeProcessor = provider._activeSpanProcessor || provider.activeSpanProcessor;
  if (activeProcessor && Array.isArray(activeProcessor._spanProcessors)) {
    activeProcessor._spanProcessors.push(processor);
  } else {
    console.error("Failed to find a way to attach span processor!");
  }
}

trace.setGlobalTracerProvider(provider);

// 2. Create a span
const tracer = trace.getTracer("test-tracer");
const span = tracer.startSpan("test-span");
span.setAttribute("test-attr", "value");
span.end();

// 3. Check results
setTimeout(() => {
  const spans = exporter.getFinishedSpans();
  console.log(`Captured ${spans.length} spans`);
  if (spans.length > 0) {
    console.log("Span name:", spans[0].name);
    console.log("Span attributes:", JSON.stringify(spans[0].attributes));
    
    // Test serialization (what we do in base.ts)
    try {
      const sanitized = spans.map(s => ({
        name: s.name,
        context: s.spanContext(),
        attributes: s.attributes,
        startTime: s.startTime,
        endTime: s.endTime
      }));
      console.log("Serialization successful!");
      console.log(JSON.stringify(sanitized, null, 2));
    } catch (e) {
      console.error("Serialization failed:", e.message);
    }
  }
}, 100);
