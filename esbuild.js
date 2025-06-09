const { build } = require("esbuild");

const production = process.argv.includes("--production");

build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  minify: production,
  sourcemap: production ? false : "inline",
  plugins: [
    {
      name: "mark-xhr-sync-worker-external",
      setup(build) {
        build.onResolve({ filter: /xhr-sync-worker\.js$/ }, (args) => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
}).catch(() => process.exit(1));
