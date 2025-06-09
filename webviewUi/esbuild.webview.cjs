const { build } = require("esbuild");

const production = process.argv.includes("--production");

build({
  entryPoints: [
    "/Users/olasunkanmioyinlola/Documents/Apps/codebuddy/webviewUi/src/main.tsx",
  ],
  bundle: true,
  outfile: "webviewUi/dist/assets/index.js",
  loader: { ".tsx": "tsx" },
  minify: production,
  sourcemap: production ? false : "inline",
}).catch(() => process.exit(1));
