/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { vscode } from "../utils/vscode";
import { useSettingsStore } from "./settings.store";

interface ContentState {
  newsItems: any[];
  logs: any[];
  metrics: any;
  traces: any[];
  browsingHistory: Array<{ url: string; title: string; timestamp: number }>;

  setNewsItems: (items: any[]) => void;
  setLogs: (logs: any[]) => void;
  addLog: (entry: any) => void;
  setMetrics: (metrics: any) => void;
  setTraces: (traces: any[]) => void;
  setBrowsingHistory: (
    history: Array<{ url: string; title: string; timestamp: number }>,
  ) => void;

  handleMarkNewsAsRead: (id: number) => void;
  handleRefreshNews: () => void;
  handleOpenUrl: (url: string) => void;
  handleOpenInReader: (url: string) => void;
  handleToggleSaved: (id: number) => void;
  handleDeleteNews: (id: number) => void;
  handleOpenBrowser: () => void;
  handleOpenFromHistory: (url: string) => void;
  handleShowBrowsingHistory: () => void;
}

export const useContentStore = create<ContentState>()((set) => ({
  newsItems: [],
  logs: [],
  metrics: null,
  traces: [],
  browsingHistory: [],

  setNewsItems: (items) => set({ newsItems: items }),
  setLogs: (logs) => set({ logs }),
  addLog: (entry) => set((s) => ({ logs: [...s.logs, entry].slice(-1000) })),
  setMetrics: (metrics) => set({ metrics }),
  setTraces: (traces) => set({ traces }),
  setBrowsingHistory: (history) => set({ browsingHistory: history }),

  handleMarkNewsAsRead: (id) => {
    vscode.postMessage({ command: "news-mark-read", ids: [id] });
    set((s) => ({ newsItems: s.newsItems.filter((item) => item.id !== id) }));
  },
  handleRefreshNews: () => {
    vscode.postMessage({ command: "news-refresh" });
  },
  handleOpenUrl: (url) => {
    const browserType = useSettingsStore.getState().browserType;
    vscode.postMessage({ command: "openExternal", text: url, browserType });
  },
  handleOpenInReader: (url) => {
    vscode.postMessage({ command: "openInReader", text: url });
  },
  handleToggleSaved: (id) => {
    vscode.postMessage({ command: "news-toggle-saved", id });
  },
  handleDeleteNews: (id) => {
    vscode.postMessage({ command: "news-delete", id });
  },
  handleOpenBrowser: () => {
    const browserType = useSettingsStore.getState().browserType;
    vscode.postMessage({ command: "promptOpenBrowser", browserType });
  },
  handleOpenFromHistory: (url) => {
    const browserType = useSettingsStore.getState().browserType;
    vscode.postMessage({ command: "openBrowser", text: url, browserType });
  },
  handleShowBrowsingHistory: () => {
    vscode.postMessage({ command: "get-browsing-history" });
  },
}));
