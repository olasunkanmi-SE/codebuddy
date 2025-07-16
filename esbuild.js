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
      const builtAssetsDir = path.join(__dirname, "webviewUi", "dist", "assets");
      const destDir = path.join(__dirname, "dist", "webview", "assets");
      if (fs.existsSync(builtAssetsDir)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.readdirSync(builtAssetsDir).forEach((file) => {
          fs.copyFileSync(path.join(builtAssetsDir, file), path.join(destDir, file));
        });
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
    build.onResolve({ filter: new RegExp(`^(${filteredBuiltins.join("|")})$`) }, () => ({ external: true }));
    build.onResolve({ filter: new RegExp(`^(${filteredBuiltins.join("|")})/`) }, () => ({ external: true }));
    build.onResolve({ filter: /better-sqlite3|electron/ }, () => ({ external: true })); // jsdom removed
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
  // Extension bundle
  const mainCtx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    external: [
      "vscode",
      "better-sqlite3",
      "electron",
      "./node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js",
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
    plugins: [nodeModulesPlugin, treeShakingPlugin],
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
            const scopedCss = css.replace(/(\.[a-zA-Z][a-zA-Z0-9-_]*)/g, `$1-${Date.now()}`);
            return { loader: "css", contents: scopedCss };
          });
        },
      },
      copyAssetsPlugin,
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
      await webviewCtx.watch();
    } else {
      console.log("🚀 Building...");
      const startTime = Date.now();
      const [mainResult, webviewResult] = await Promise.all([mainCtx.rebuild(), webviewCtx.rebuild()]);
      const duration = Date.now() - startTime;
      console.log(`\n✨ Build completed in ${duration}ms`);
      if (production) {
        const mainSize = fs.statSync("dist/extension.js").size / 1024;
        const webviewSize = fs
          .readdirSync("dist/webview")
          .filter((f) => f.endsWith(".js"))
          .reduce((acc, file) => acc + fs.statSync(path.join("dist/webview", file)).size / 1024, 0);
        console.log("\n📦 Bundle sizes:");
        console.log(`   Extension: ${mainSize.toFixed(2)}KB`);
        console.log(`   Webview:   ${webviewSize.toFixed(2)}KB`);
      }
      await mainCtx.dispose();
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
