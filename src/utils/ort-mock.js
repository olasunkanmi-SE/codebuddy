// Dummy module to bypass onnxruntime-node native binding issues in VS Code/Electron
// This module redirects to onnxruntime-web to force WASM usage even in Node.js environments.

try {
  // Try to use onnxruntime-web if available
  module.exports = require("onnxruntime-web");
} catch (e) {
  // Fallback to a basic mock that throws on session creation
  const ONNX_ENV = {
    logLevel: "error",
    wasm: {
      numThreads: 1,
      proxy: false,
    },
    backends: {
      onnx: {
        node: false,
      },
    },
  };

  class InferenceSession {
    static async create() {
      throw new Error(
        "ONNX Runtime Node is disabled and onnxruntime-web is not available. Falling back to WASM.",
      );
    }
  }

  module.exports = {
    env: ONNX_ENV,
    InferenceSession,
    Tensor: class {},
    TypedTensor: class {},
  };
}
