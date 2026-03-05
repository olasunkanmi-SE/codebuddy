import { create } from "zustand";
import { vscode } from "../utils/vscode";
import type { INotificationItem } from "../components/notifications";

interface NotificationsState {
  notifications: INotificationItem[];
  unreadNotificationCount: number;

  setNotifications: (items: INotificationItem[]) => void;
  setUnreadCount: (count: number) => void;

  handleMarkAsRead: (id: number) => void;
  handleMarkAllAsRead: () => void;
  handleClearAll: () => void;
  handleDelete: (id: number) => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  notifications: [],
  unreadNotificationCount: 0,

  setNotifications: (items) => set({ notifications: items }),
  setUnreadCount: (count) => set({ unreadNotificationCount: count }),

  handleMarkAsRead: (id) => {
    vscode.postMessage({ command: "notifications-mark-read", id });
  },
  handleMarkAllAsRead: () => {
    vscode.postMessage({ command: "notifications-mark-all-read" });
  },
  handleClearAll: () => {
    vscode.postMessage({ command: "notifications-clear-all" });
  },
  handleDelete: (id) => {
    vscode.postMessage({ command: "notifications-delete", id });
  },
}));
