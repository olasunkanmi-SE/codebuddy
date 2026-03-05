import { create } from "zustand";

interface PanelState {
  isSettingsOpen: boolean;
  isSessionsOpen: boolean;
  isNotificationPanelOpen: boolean;
  isUpdatesPanelOpen: boolean;
  isObservabilityOpen: boolean;
  isCoWorkerOpen: boolean;
  isHistoryOpen: boolean;

  openSettings: () => void;
  closeSettings: () => void;
  openSessions: () => void;
  closeSessions: () => void;
  toggleNotifications: () => void;
  closeNotifications: () => void;
  openUpdates: () => void;
  closeUpdates: () => void;
  openObservability: () => void;
  closeObservability: () => void;
  openCoWorker: () => void;
  closeCoWorker: () => void;
  openHistory: () => void;
  closeHistory: () => void;
}

export const usePanelStore = create<PanelState>()((set) => ({
  isSettingsOpen: false,
  isSessionsOpen: false,
  isNotificationPanelOpen: false,
  isUpdatesPanelOpen: false,
  isObservabilityOpen: false,
  isCoWorkerOpen: false,
  isHistoryOpen: false,

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openSessions: () => set({ isSessionsOpen: true }),
  closeSessions: () => set({ isSessionsOpen: false }),
  toggleNotifications: () =>
    set((s) => ({ isNotificationPanelOpen: !s.isNotificationPanelOpen })),
  closeNotifications: () => set({ isNotificationPanelOpen: false }),
  openUpdates: () => set({ isUpdatesPanelOpen: true }),
  closeUpdates: () => set({ isUpdatesPanelOpen: false }),
  openObservability: () => set({ isObservabilityOpen: true }),
  closeObservability: () => set({ isObservabilityOpen: false }),
  openCoWorker: () => set({ isCoWorkerOpen: true }),
  closeCoWorker: () => set({ isCoWorkerOpen: false }),
  openHistory: () => set({ isHistoryOpen: true }),
  closeHistory: () => set({ isHistoryOpen: false }),
}));
