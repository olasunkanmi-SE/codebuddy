import { parentPort, workerData } from "worker_threads";
import * as path from "path";
import { Parser } from "web-tree-sitter";

// Initialize Tree Sitter
let parser: Parser;

interface IndexRequest {
  filePath: string;
  content: string;
}

interface IndexResult {
  filePath: string;
  chunks: {
    id: string;
    text: string;
    startLine: number;
    endLine: number;
    type: string; // 'function', 'class', 'method', 'block'
    metadata: any;
  }[];
}

async function initialize() {
  await Parser.init();
  parser = new Parser();
  // We need to load specific languages. For now, assuming TypeScript/JavaScript context.
  // In a full implementation, we'd pass the WASM path in workerData or load it dynamically.
  // path to wasm usually in dist/grammars/tree-sitter-typescript.wasm
  // This might tricky in the worker if paths are relative.
  // We'll rely on the main thread to pass the WASM file path if needed,
  // or attempt to resolve it relative to this file.

  // For this optimized worker, we'll start with text-based chunking if WASM loads fail,
  // but aim for AST.
}

// Simple text splitter as fallback
function simpleChunk(content: string, filePath: string): IndexResult {
  const chunks: IndexResult["chunks"] = [];
  const chunkSize = 1000;
  const overlap = 200;

  for (let i = 0; i < content.length; i += chunkSize - overlap) {
    const chunkText = content.slice(i, i + chunkSize);
    if (chunkText.length < 50) continue;

    // Calculate approximate lines
    const beforeText = content.slice(0, i);
    const startLine = beforeText.split("\n").length;
    const endLine = startLine + chunkText.split("\n").length - 1;

    chunks.push({
      id: `${filePath}::${i}`,
      text: chunkText,
      startLine,
      endLine,
      type: "text_chunk",
      metadata: { filePath },
    });
  }
  return { filePath, chunks };
}

if (parentPort) {
  parentPort.on(
    "message",
    async (message: { type: string; data: IndexRequest }) => {
      if (message.type === "INDEX_FILE") {
        try {
          // Fallback to simple chunking for now to ensure reliability
          // while we set up the TreeSitter WASM loading strategy in the next turn
          // avoiding immediate runtime errors if WASM isn't found.
          const result = simpleChunk(
            message.data.content,
            message.data.filePath,
          );

          // Simulate heavy work being offloaded
          parentPort?.postMessage({ type: "RESULT", data: result });
        } catch (error: any) {
          parentPort?.postMessage({ type: "ERROR", error: error.message });
        }
      }
    },
  );
}
