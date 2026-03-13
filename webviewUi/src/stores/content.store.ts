/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { vscode } from "../utils/vscode";
import { useSettingsStore } from "./settings.store";

interface Bookmark {
  url: string;
  title: string;
  created_at: string;
}

interface SavedArticle {
  id: number;
  url: string;
  title: string;
  author: string | null;
  site_name: string | null;
  excerpt: string | null;
  saved_at: string;
}

interface ContentState {
  newsItems: any[];
  logs: any[];
  metrics: any;
  traces: any[];
  browsingHistory: Array<{ url: string; title: string; timestamp: number }>;
  bookmarks: Bookmark[];
  savedArticles: SavedArticle[];
  scrapeStatus: { status: string; url: string; error?: string } | null;

  setNewsItems: (items: any[]) => void;
  setLogs: (logs: any[]) => void;
  addLog: (entry: any) => void;
  setMetrics: (metrics: any) => void;
  setTraces: (traces: any[]) => void;
  setBrowsingHistory: (
    history: Array<{ url: string; title: string; timestamp: number }>,
  ) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setSavedArticles: (articles: SavedArticle[]) => void;
  setScrapeStatus: (
    status: { status: string; url: string; error?: string } | null,
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
  handleAddHistoryToChat: (url: string, title: string) => void;
  handleAddBookmark: (url: string, title: string) => void;
  handleRemoveBookmark: (url: string) => void;
  handleGetBookmarks: () => void;
  handleScrapeAndSave: (url: string) => void;
  handleGetSavedArticles: () => void;
  handleDeleteSavedArticle: (id: number) => void;
  handleOpenSavedArticle: (id: number) => void;
}

export const useContentStore = create<ContentState>()((set) => ({
  newsItems: [],
  logs: [],
  metrics: null,
  traces: [],
  browsingHistory: [],
  bookmarks: [],
  savedArticles: [],
  scrapeStatus: null,

  setNewsItems: (items) => set({ newsItems: items }),
  setLogs: (logs) => set({ logs }),
  addLog: (entry) => set((s) => ({ logs: [...s.logs, entry].slice(-1000) })),
  setMetrics: (metrics) => set({ metrics }),
  setTraces: (traces) => set({ traces }),
  setBrowsingHistory: (history) => set({ browsingHistory: history }),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setSavedArticles: (articles) => set({ savedArticles: articles }),
  setScrapeStatus: (status) => set({ scrapeStatus: status }),

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
  handleAddHistoryToChat: (url, title) => {
    vscode.postMessage({ command: "add-history-to-chat", text: url, title });
  },
  handleAddBookmark: (url, title) => {
    vscode.postMessage({ command: "add-bookmark", url, title });
  },
  handleRemoveBookmark: (url) => {
    vscode.postMessage({ command: "remove-bookmark", url });
  },
  handleGetBookmarks: () => {
    vscode.postMessage({ command: "get-bookmarks" });
  },
  handleScrapeAndSave: (url) => {
    vscode.postMessage({ command: "scrape-and-save-article", url });
  },
  handleGetSavedArticles: () => {
    vscode.postMessage({ command: "get-saved-articles" });
  },
  handleDeleteSavedArticle: (id) => {
    vscode.postMessage({ command: "delete-saved-article", id });
  },
  handleOpenSavedArticle: (id) => {
    vscode.postMessage({ command: "open-saved-article", id });
  },
}));
