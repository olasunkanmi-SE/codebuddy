/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

interface ChatState {
  commandAction: string;
  isCommandExecuting: boolean;
  selectedContext: string;
  folders: any;
  activeEditor: string;
  fileChangesPanelCollapsed: boolean;
  checkpointPanelCollapsed: boolean;

  setCommandAction: (action: string) => void;
  setIsCommandExecuting: (executing: boolean) => void;
  setSelectedContext: (context: string) => void;
  setFolders: (folders: any) => void;
  setActiveEditor: (editor: string) => void;
  toggleFileChangesPanel: () => void;
  toggleCheckpointPanel: () => void;
  clearCommandState: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  commandAction: "",
  isCommandExecuting: false,
  selectedContext: "",
  folders: "",
  activeEditor: "",
  fileChangesPanelCollapsed: true,
  checkpointPanelCollapsed: true,

  setCommandAction: (action) => set({ commandAction: action }),
  setIsCommandExecuting: (executing) => set({ isCommandExecuting: executing }),
  setSelectedContext: (context) => set({ selectedContext: context }),
  setFolders: (folders) => set({ folders }),
  setActiveEditor: (editor) => set({ activeEditor: editor }),
  toggleFileChangesPanel: () =>
    set((s) => ({ fileChangesPanelCollapsed: !s.fileChangesPanelCollapsed })),
  toggleCheckpointPanel: () =>
    set((s) => ({ checkpointPanelCollapsed: !s.checkpointPanelCollapsed })),
  clearCommandState: () =>
    set({ isCommandExecuting: false, commandAction: "" }),
}));
