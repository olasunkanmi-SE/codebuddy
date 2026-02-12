
const path = require('path');
const fs = require('fs');

// Mock onnxruntime-node
const mockPath = path.resolve(__dirname, 'src/utils/ort-mock.js');
require.cache[require.resolve('onnxruntime-node')] = {
    id: require.resolve('onnxruntime-node'),
    filename: require.resolve('onnxruntime-node'),
    loaded: true,
    exports: require(mockPath)
};

async function test() {
    console.log("Starting Transformers.js test with mock...");
    try {
        const { pipeline, env } = require('@huggingface/transformers');
        
        // Configure env to use local models and disable node backend
        env.allowLocalModels = true;
        env.allowRemoteModels = true;
        env.useWasmCache = false; // Disable WASM cache to avoid blob: URL issues in Node.js
        
        if (env.backends && env.backends.onnx) {
            env.backends.onnx.node = false;
            if (env.backends.onnx.wasm) {
                env.backends.onnx.wasm.proxy = false;
                
                // Point to local WASM files
                const wasmDir = path.resolve(__dirname, 'dist', 'wasm');
                env.backends.onnx.wasm.wasmPaths = {
                    'ort-wasm-simd-threaded.wasm': `file://${path.join(wasmDir, 'ort-wasm-simd-threaded.wasm')}`,
                    'ort-wasm-simd-threaded.mjs': `file://${path.join(wasmDir, 'ort-wasm-simd-threaded.mjs')}`,
                    'ort-wasm-simd-threaded.asyncify.wasm': `file://${path.join(wasmDir, 'ort-wasm-simd-threaded.asyncify.wasm')}`,
                    'ort-wasm-simd-threaded.asyncify.mjs': `file://${path.join(wasmDir, 'ort-wasm-simd-threaded.asyncify.mjs')}`,
                };
            }
        }

        console.log("Initializing pipeline...");
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        
        console.log("Generating embedding...");
        const output = await extractor('This is a test sentence', {
            pooling: 'mean',
            normalize: true,
        });

        console.log("Success! Embedding length:", output.data.length);
        console.log("First 5 values:", Array.from(output.data).slice(0, 5));
    } catch (error) {
        console.error("Test failed!");
        console.error("Error message:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

test();
