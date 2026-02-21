
const { trace } = require("@opentelemetry/api");
const { InMemorySpanExporter, SimpleSpanProcessor, BasicTracerProvider } = require("@opentelemetry/sdk-trace-base");

// Mocking some OTel 2.x behavior
async function testTrace() {
    console.log("Starting OTel 2.x Trace Test...");
    
    const exporter = new InMemorySpanExporter();
    const processor = new SimpleSpanProcessor(exporter);
    
    // Create provider
    const provider = new BasicTracerProvider();
    
    console.log("Provider class:", provider.constructor.name);
    
    // Check for addSpanProcessor
    if (typeof provider.addSpanProcessor === 'function') {
        console.log("Found addSpanProcessor");
        provider.addSpanProcessor(processor);
    } else {
        console.log("addSpanProcessor NOT found. Checking _activeSpanProcessor...");
        if (provider._activeSpanProcessor) {
            console.log("Found _activeSpanProcessor");
            if (provider._activeSpanProcessor._spanProcessors) {
                provider._activeSpanProcessor._spanProcessors.push(processor);
                console.log("Attached to _spanProcessors array");
            } else {
                console.log("_spanProcessors array NOT found on _activeSpanProcessor");
            }
        }
    }

    // Register provider (OTel 2.x way if register exists, or just set global)
    if (typeof provider.register === 'function') {
        console.log("Calling provider.register()");
        provider.register();
    } else {
        console.log("provider.register NOT found. Setting global tracer provider manually...");
        trace.setGlobalTracerProvider(provider);
    }

    const tracer = trace.getTracer("test-tracer");
    const span = tracer.startSpan("test-span");
    
    console.log("Span started:", span.spanContext().spanId);
    
    // Add some attributes
    span.setAttribute("test.attribute", "value");
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    span.end();
    console.log("Span ended");

    // Wait for processor to flush
    await new Promise(resolve => setTimeout(resolve, 200));

    const spans = exporter.getFinishedSpans();
    console.log(`Captured spans: ${spans.length}`);
    
    if (spans.length > 0) {
        const capturedSpan = spans[0];
        console.log("Captured span name:", capturedSpan.name);
        console.log("Captured span attributes:", JSON.stringify(capturedSpan.attributes));
        
        // Test sanitization (mimic base.ts)
        const sanitized = {
            name: capturedSpan.name,
            context: capturedSpan.spanContext(),
            startTime: capturedSpan.startTime,
            endTime: capturedSpan.endTime,
            attributes: capturedSpan.attributes,
        };
        console.log("Sanitized span (serializable):", JSON.stringify(sanitized, null, 2));
    } else {
        console.error("FAILED: No spans captured!");
    }
}

testTrace().catch(console.error);
