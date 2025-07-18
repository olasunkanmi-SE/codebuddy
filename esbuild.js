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
        // Also copy jsdom xhr-sync-worker.js to dist and to dist/node_modules/jsdom/lib/jsdom/living/xhr so require.resolve works
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
        const workerDestDist = path.join(__dirname, "dist", "xhr-sync-worker.js");
        const workerDestNodeModules = path.join(
          __dirname,
          "dist",
          "node_modules",
          "jsdom",
          "lib",
          "jsdom",
          "living",
          "xhr",
          "xhr-sync-worker.js"
        );
        if (fs.existsSync(workerSrc)) {
          fs.copyFileSync(workerSrc, workerDestDist);
          // Ensure the directory exists for the node_modules path
          fs.mkdirSync(path.dirname(workerDestNodeModules), { recursive: true });
          fs.copyFileSync(workerSrc, workerDestNodeModules);
        }
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
  // "punycode", // bundled by esbuild
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
    // Handle Node.js built-ins
    build.onResolve({ filter: new RegExp(`^(${nodeBuiltins.join("|")})$`) }, () => ({ external: true }));
    build.onResolve({ filter: new RegExp(`^(${nodeBuiltins.join("|")})/`) }, () => ({ external: true }));

    // Keep these as external (native modules that cannot be bundled)
    build.onResolve({ filter: /better-sqlite3|electron/ }, () => ({ external: true }));

    build.onResolve({ filter: /xhr-sync-worker\.js$/ }, (args) => {
      return { path: require.resolve("jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js") };
    });

    // Treat punycode imports as external so runtime uses node_modules/punycode
    build.onResolve({ filter: /^punycode(\/.*)?$/ }, () => ({ external: true }));
  },
};

const workerPlugin = {
  name: "worker-plugin",
  setup(build) {
    build.onResolve({ filter: /xhr-sync-worker\.js$/ }, (args) => {
      return { path: require.resolve("jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js") };
    });
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
      // Keep jsdom worker external
      "jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js",
      // Mark punycode imports as external so the NPM package in node_modules/punycode is used
      "punycode",
      "punycode/",
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
    // Additional optimization for production
    ...(production && {
      drop: ["console", "debugger"],
      legalComments: "none",
    }),
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
      const [,] = await Promise.all([mainCtx.rebuild(), webviewCtx.rebuild()]);
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
