import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "es2020", // Modern target for better performance
    minify: "esbuild", // Faster minification
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
        // Enable code splitting for faster loading
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  // Optimize development server
  server: {
    hmr: {
      overlay: false, // Disable error overlay for faster development
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["@vscode/webview-ui-toolkit"],
  },
});
