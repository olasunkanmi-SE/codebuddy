import { create } from "zustand";
import { vscode } from "../utils/vscode";
import type { ChatSession } from "../components/sessions";

interface SessionsState {
  sessions: ChatSession[];
  currentSessionId: string | null;

  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;

  handleNewSession: () => void;
  handleSwitchSession: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => void;
  handleRenameSession: (sessionId: string, newTitle: string) => void;
  handleOpenSessions: () => void;
}

export const useSessionsStore = create<SessionsState>()((set) => ({
  sessions: [],
  currentSessionId: null,

  setSessions: (sessions) => set({ sessions }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  handleNewSession: () => {
    vscode.postMessage({ command: "create-session", message: {} });
  },
  handleSwitchSession: (sessionId) => {
    vscode.postMessage({ command: "switch-session", message: { sessionId } });
  },
  handleDeleteSession: (sessionId) => {
    vscode.postMessage({ command: "delete-session", message: { sessionId } });
  },
  handleRenameSession: (sessionId, newTitle) => {
    vscode.postMessage({
      command: "update-session-title",
      message: { sessionId, title: newTitle },
    });
  },
  handleOpenSessions: () => {
    vscode.postMessage({ command: "get-sessions" });
    set({ sessions: [] }); // will be populated by response
  },
}));
