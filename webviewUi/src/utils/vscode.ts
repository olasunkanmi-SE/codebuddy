/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Singleton wrapper for VS Code Webview API
 * Ensures acquireVsCodeApi is called only once
 */

let vsCodeApi: any;

if (typeof window !== "undefined" && "acquireVsCodeApi" in window) {
  try {
    // Attempt to acquire the API
    // If it has already been acquired, this might return the existing instance
    // or throw depending on the implementation.
    // However, in VS Code webviews, acquireVsCodeApi() can usually only be called once.
    // If we are in a hot-reload environment, we might lose the reference but the browser context remains.
    // Ideally, we should attach it to window if we want to persist it across HMR,
    // but for production, this module-level singleton is sufficient.

    // Check if we already stashed it on window (for HMR support)
    if ((window as any)._vsCodeApi) {
      vsCodeApi = (window as any)._vsCodeApi;
    } else {
      vsCodeApi = (window as any).acquireVsCodeApi();
      (window as any)._vsCodeApi = vsCodeApi;
    }
  } catch (e) {
    console.warn("Failed to acquire VS Code API:", e);
  }
}

// Fallback for development outside VS Code or if acquisition failed
if (!vsCodeApi) {
  vsCodeApi = {
    postMessage: (message: any) => {
      console.log("Message to VS Code (Mock):", message);
    },
    getState: () => ({}),
    setState: () => {},
  };
}

export const vscode = vsCodeApi;
