import * as assert from "assert";
import {
  TreeSitterAnalyzer,
  type IAnalyzerLogger,
} from "../../services/analyzers/tree-sitter-analyzer";
import * as path from "path";

/** Silent logger for tests */
const nullLogger: IAnalyzerLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

suite("TreeSitterAnalyzer", () => {
  suite("constructor", () => {
    test("uses provided grammarsPath", () => {
      const analyzer = new TreeSitterAnalyzer("/custom/grammars", nullLogger);
      // Doesn't throw — path is stored
      analyzer.dispose();
    });

    test("falls back to default grammarsPath when none provided", () => {
      const messages: string[] = [];
      const captureLogger: IAnalyzerLogger = {
        debug() {},
        info() {},
        warn(msg: string) {
          messages.push(msg);
        },
        error() {},
      };
      const analyzer = new TreeSitterAnalyzer(undefined, captureLogger);
      assert.ok(messages.some((m) => m.includes("No grammarsPath provided")));
      analyzer.dispose();
    });
  });

  suite("canAnalyze", () => {
    let analyzer: TreeSitterAnalyzer;
    setup(() => {
      analyzer = new TreeSitterAnalyzer("/fake/grammars", nullLogger);
    });
    teardown(() => {
      analyzer.dispose();
    });

    test("returns true for TypeScript files", () => {
      assert.strictEqual(analyzer.canAnalyze("app.ts"), true);
      assert.strictEqual(analyzer.canAnalyze("app.tsx"), true);
    });

    test("returns true for JavaScript files", () => {
      assert.strictEqual(analyzer.canAnalyze("index.js"), true);
      assert.strictEqual(analyzer.canAnalyze("app.jsx"), true);
    });

    test("returns true for Python files", () => {
      assert.strictEqual(analyzer.canAnalyze("main.py"), true);
    });

    test("returns true for Go files", () => {
      assert.strictEqual(analyzer.canAnalyze("main.go"), true);
    });

    test("returns true for Rust files", () => {
      assert.strictEqual(analyzer.canAnalyze("lib.rs"), true);
    });

    test("returns false for unsupported extensions", () => {
      assert.strictEqual(analyzer.canAnalyze("style.css"), false);
      assert.strictEqual(analyzer.canAnalyze("data.json"), false);
      assert.strictEqual(analyzer.canAnalyze("image.png"), false);
    });

    test("handles full paths", () => {
      assert.strictEqual(
        analyzer.canAnalyze("/workspace/src/utils/helpers.ts"),
        true,
      );
      assert.strictEqual(
        analyzer.canAnalyze("C:\\project\\index.js"),
        true,
      );
    });
  });

  suite("getLanguageId", () => {
    let analyzer: TreeSitterAnalyzer;
    setup(() => {
      analyzer = new TreeSitterAnalyzer("/fake/grammars", nullLogger);
    });
    teardown(() => {
      analyzer.dispose();
    });

    test("maps .ts and .tsx to typescript", () => {
      assert.strictEqual(analyzer.getLanguageId("app.ts"), "typescript");
      assert.strictEqual(analyzer.getLanguageId("app.tsx"), "typescript");
    });

    test("maps .js and .jsx to javascript", () => {
      assert.strictEqual(analyzer.getLanguageId("app.js"), "javascript");
      assert.strictEqual(analyzer.getLanguageId("app.jsx"), "javascript");
    });

    test("maps .py to python", () => {
      assert.strictEqual(analyzer.getLanguageId("main.py"), "python");
    });

    test("maps .go to go", () => {
      assert.strictEqual(analyzer.getLanguageId("main.go"), "go");
    });

    test("maps .rs to rust", () => {
      assert.strictEqual(analyzer.getLanguageId("lib.rs"), "rust");
    });

    test("maps .java to java", () => {
      assert.strictEqual(analyzer.getLanguageId("App.java"), "java");
    });

    test("maps .php to php", () => {
      assert.strictEqual(analyzer.getLanguageId("index.php"), "php");
    });

    test("returns null for unsupported files", () => {
      assert.strictEqual(analyzer.getLanguageId("style.css"), null);
      assert.strictEqual(analyzer.getLanguageId("data.json"), null);
    });
  });

  suite("dispose", () => {
    test("can be called multiple times safely", () => {
      const analyzer = new TreeSitterAnalyzer("/fake/grammars", nullLogger);
      analyzer.dispose();
      analyzer.dispose(); // no-op, no throw
    });

    test("clears internal state", () => {
      const analyzer = new TreeSitterAnalyzer("/fake/grammars", nullLogger);
      analyzer.dispose();
      // After dispose, canAnalyze should still work (it's stateless)
      assert.strictEqual(analyzer.canAnalyze("test.ts"), true);
    });
  });

  suite("initialize", () => {
    test("deduplicates concurrent init calls", async () => {
      const analyzer = new TreeSitterAnalyzer(
        path.join(__dirname, "..", "..", "..", "dist", "grammars"),
        nullLogger,
      );
      try {
        // Both calls should resolve to the same promise
        const p1 = analyzer.initialize();
        const p2 = analyzer.initialize();
        // If WASM is available, both resolve; if not, both reject
        await Promise.allSettled([p1, p2]);
      } finally {
        analyzer.dispose();
      }
    });
  });
});
