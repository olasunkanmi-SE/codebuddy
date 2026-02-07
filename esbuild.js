// esbuild.js - Bundles VS Code extension and React webview for production
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Ensure dist directory exists
if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist", { recursive: true });
}

// Plugin to handle asset copying
const copyAssetsPlugin = {
  name: "copy-assets",
  setup(build) {
    build.onEnd(async () => {
      // Copy built webview assets to dist/webview/assets
      const builtAssetsDir = path.join(
        __dirname,
        "webviewUi",
        "dist",
        "assets"
      );
      const destDir = path.join(__dirname, "dist", "webview", "assets");
      if (fs.existsSync(builtAssetsDir)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.readdirSync(builtAssetsDir).forEach((file) => {
          fs.copyFileSync(
            path.join(builtAssetsDir, file),
            path.join(destDir, file)
          );
        });
      }
    });
  },
};

// Copy TreeSitter WASM files (core + grammar)
const copyTreeSitterPlugin = {
  name: "copy-tree-sitter",
  setup(build) {
    build.onEnd(async () => {
      const grammarsSrcDir = path.join(__dirname, "src", "grammars");
      const grammarDestDir = path.join(__dirname, "dist", "grammars");
      if (fs.existsSync(grammarsSrcDir)) {
        if (!fs.existsSync(grammarDestDir)) {
          fs.mkdirSync(grammarDestDir, { recursive: true });
        }
        fs.readdirSync(grammarsSrcDir).forEach((file) => {
          if (file.endsWith(".wasm")) {
            fs.copyFileSync(
              path.join(grammarsSrcDir, file),
              path.join(grammarDestDir, file)
            );
          }
        });
      }

      const treeSitterWasmSrc = path.join(
        __dirname,
        "node_modules",
        "web-tree-sitter",
        "tree-sitter.wasm"
      );
      const treeSitterWasmDest = path.join(
        __dirname,
        "dist",
        "grammars",
        "tree-sitter.wasm"
      );
      if (fs.existsSync(treeSitterWasmSrc)) {
        fs.copyFileSync(treeSitterWasmSrc, treeSitterWasmDest);
      } else {
        console.warn(
          "Warning: tree-sitter.wasm not found in node_modules/web-tree-sitter"
        );
      }
    });
  },
};

// Plugin to copy JSDOM worker file and mark it as external
const copyJsdomWorkerPlugin = {
  name: "copy-jsdom-worker",
  setup(build) {
    // Intercept resolution of xhr-sync-worker.js
    build.onResolve({ filter: /xhr-sync-worker\.js$/ }, (args) => {
      // Mark as external and rewrite path to be relative to the bundle
      return { path: "./xhr-sync-worker.js", external: true };
    });

    build.onEnd(async () => {
      const workerSrc = path.join(
        __dirname,
        "node_modules",
        "jsdom",
        "lib",
        "jsdom",
        "living",
        "xhr",
        "xhr-sync-worker.js"
      );
      
      if (fs.existsSync(workerSrc)) {
        // Copy for extension
        const workerDestExt = path.join(__dirname, "dist", "xhr-sync-worker.js");
        fs.copyFileSync(workerSrc, workerDestExt);
        
        // Copy for MCP server
        const workerDestMCP = path.join(__dirname, "dist", "MCP", "xhr-sync-worker.js");
        if (!fs.existsSync(path.dirname(workerDestMCP))) {
          fs.mkdirSync(path.dirname(workerDestMCP), { recursive: true });
        }
        fs.copyFileSync(workerSrc, workerDestMCP);
      }
    });
  },
};

// List of Node.js built-in modules to mark as external
const nodeBuiltins = [
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "https",
  "net",
  "os",
  "path",
  // "punycode", // removed so it is bundled
  "querystring",
  "readline",
  "stream",
  "string_decoder",
  "tls",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib",
  "worker_threads",
];

const nodeModulesPlugin = {
  name: "node-modules",
  setup(build) {
    // Remove punycode from externals so it is bundled
    const filteredBuiltins = nodeBuiltins.filter((m) => m !== "punycode");
    build.onResolve(
      { filter: new RegExp(`^(${filteredBuiltins.join("|")})$`) },
      () => ({ external: true })
    );
    build.onResolve(
      { filter: new RegExp(`^(${filteredBuiltins.join("|")})/`) },
      () => ({ external: true })
    );
    build.onResolve({ filter: /better-sqlite3|electron|apache-arrow/ }, () => ({
      external: true,
    })); // jsdom removed
  },
};

const treeShakingPlugin = {
  name: "tree-shaking",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === "import-statement") {
        return { sideEffects: false };
      }
    });
  },
};

const reactPlugin = {
  name: "react-handling",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, "utf8");
      return {
        contents: `import * as React from 'react';\n${source}`,
        loader: args.path.endsWith("tsx") ? "tsx" : "jsx",
      };
    });
  },
};

async function main() {
  // Main extension bundle
  const mainCtx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    external: [
      "vscode",
      "better-sqlite3",
      "electron",
      "@lancedb/lancedb",
      "apache-arrow",
      // "./xhr-sync-worker.js", // Handled by copyJsdomWorkerPlugin
      "web-tree-sitter",
      "@vscode/ripgrep",
      // 'punycode' intentionally NOT external, so it is bundled
    ],
    format: "cjs",
    target: "node16",
    platform: "node",
    minify: production,
    sourcemap: !production,
    outfile: "dist/extension.js",
    metafile: true,
    logLevel: "info",
    logOverride: { "require-resolve-not-external": "silent" },
    plugins: [
      nodeModulesPlugin,
      copyTreeSitterPlugin,
      copyJsdomWorkerPlugin,
      treeShakingPlugin,
    ],
  });

  // Worker bundle
  const workerCtx = await esbuild.context({
    entryPoints: ["src/workers/ast-analyzer.worker.ts", "src/workers/codebase-analysis.worker.ts"],
    bundle: true,
    external: [
      "vscode",
      "better-sqlite3",
      "electron",
      "@lancedb/lancedb",
      "apache-arrow",
      // "./xhr-sync-worker.js", // Handled by copyJsdomWorkerPlugin
      "web-tree-sitter",
      "@vscode/ripgrep",
    ],
    format: "cjs",
    target: "node16",
    platform: "node",
    minify: production,
    sourcemap: !production,
    outdir: "dist/workers",
    metafile: true,
    logLevel: "info",
    logOverride: { "require-resolve-not-external": "silent" },
    plugins: [
      nodeModulesPlugin,
      copyJsdomWorkerPlugin,
      treeShakingPlugin,
    ],
  });

  // MCP Server bundle
  const mcpServerCtx = await esbuild.context({
    entryPoints: ["src/MCP/server.ts"],
    bundle: true,
    external: [
      "vscode",
      "web-tree-sitter",
      "@vscode/ripgrep",
    ],
    format: "cjs",
    target: "node16",
    platform: "node",
    minify: production,
    sourcemap: !production,
    outfile: "dist/MCP/server.js",
    metafile: true,
    logLevel: "info",
    plugins: [
      nodeModulesPlugin,
      copyJsdomWorkerPlugin,
      treeShakingPlugin,
    ],
  });

  // Webview bundle
  const webviewCtx = await esbuild.context({
    entryPoints: ["webviewUi/src/main.tsx"],
    bundle: true,
    minify: production,
    sourcemap: !production,
    format: "esm",
    platform: "browser",
    target: "es2020",
    outdir: "dist/webview",
    splitting: true,
    chunkNames: "chunks/[name]-[hash]",
    assetNames: "assets/[name]-[hash]",
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".png": "dataurl",
      ".svg": "dataurl",
      ".css": "css",
    },
    plugins: [
      reactPlugin,
      {
        name: "css-module",
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, async (args) => {
            const css = fs.readFileSync(args.path, "utf8");
            const scopedCss = css.replace(
              /(\.[a-zA-Z][a-zA-Z0-9-_]*)/g,
              `$1-${Date.now()}`
            );
            return { loader: "css", contents: scopedCss };
          });
        },
      },
      copyAssetsPlugin,
      copyTreeSitterPlugin,
      treeShakingPlugin,
    ],
    define: {
      "process.env.NODE_ENV": production ? '"production"' : '"development"',
      global: "window",
    },
    metafile: true,
  });

  try {
    if (watch) {
      console.log("👀 Watching for changes...");
      await mainCtx.watch();
      await workerCtx.watch();
      await mcpServerCtx.watch();
      await webviewCtx.watch();
    } else {
      console.log("🚀 Building...");
      const startTime = Date.now();
      const [mainResult, workerResult, mcpResult, webviewResult] = await Promise.all([
        mainCtx.rebuild(),
        workerCtx.rebuild(),
        mcpServerCtx.rebuild(),
        webviewCtx.rebuild(),
      ]);
      const duration = Date.now() - startTime;
      console.log(`\n✨ Build completed in ${duration}ms`);
      if (production) {
        const mainSize = fs.statSync("dist/extension.js").size / 1024;
        const workerSize = fs.statSync("dist/workers/ast-analyzer.worker.js").size / 1024;
        const mcpSize = fs.statSync("dist/MCP/server.js").size / 1024;
        const webviewSize = fs
          .readdirSync("dist/webview")
          .filter((f) => f.endsWith(".js"))
          .reduce(
            (acc, file) =>
              acc + fs.statSync(path.join("dist/webview", file)).size / 1024,
            0
          );
        console.log("\n📦 Bundle sizes:");
        console.log(`   Extension: ${mainSize.toFixed(2)}KB`);
        console.log(`   Worker:    ${workerSize.toFixed(2)}KB`);
        console.log(`   MCP Server: ${mcpSize.toFixed(2)}KB`);
        console.log(`   Webview:   ${webviewSize.toFixed(2)}KB`);
      }
      await mainCtx.dispose();
      await workerCtx.dispose();
      await mcpServerCtx.dispose();
      await webviewCtx.dispose();
    }
  } catch (error) {
    console.error("\n❌ Build failed:");
    console.error(error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
