import { useState, useEffect, useCallback } from "react";

declare const vscodeApi: {
  postMessage: (message: any) => void;
};

export interface ComposerSessionInfo {
  id: string;
  label: string;
  changeCount: number;
  status: "active" | "applied" | "rejected" | "partial";
  timestamp: number;
}

export interface ComposerSessionChange {
  id: string;
  filePath: string;
  timestamp: number;
  status: "pending" | "applied" | "rejected";
  isNewFile: boolean;
}

export function useComposerSessions() {
  const [sessions, setSessions] = useState<ComposerSessionInfo[]>([]);
  const [sessionChanges, setSessionChanges] = useState<
    Map<string, ComposerSessionChange[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const refreshSessions = useCallback(() => {
    setIsLoading(true);
    try {
      vscodeApi.postMessage({ command: "get-composer-sessions" });
    } catch (error) {
      console.error("Failed to refresh composer sessions:", error);
      setIsLoading(false);
    }
  }, []);

  const requestSessionChanges = useCallback((sessionId: string) => {
    try {
      vscodeApi.postMessage({
        command: "get-session-changes",
        sessionId,
      });
    } catch (error) {
      console.error("Failed to request session changes:", error);
    }
  }, []);

  const applySession = useCallback((sessionId: string) => {
    try {
      vscodeApi.postMessage({
        command: "apply-composer-session",
        sessionId,
      });
    } catch (error) {
      console.error("Failed to apply composer session:", error);
    }
  }, []);

  const rejectSession = useCallback((sessionId: string) => {
    try {
      vscodeApi.postMessage({
        command: "reject-composer-session",
        sessionId,
      });
    } catch (error) {
      console.error("Failed to reject composer session:", error);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "composer-sessions":
          setSessions(message.sessions || []);
          setIsLoading(false);
          break;

        case "session-changes":
          if (message.sessionId && message.changes) {
            setSessionChanges((prev) => {
              const next = new Map(prev);
              next.set(message.sessionId, message.changes);
              return next;
            });
          }
          break;

        case "composer-session-applied":
          setSessions((prev) =>
            prev.map((s) =>
              s.id === message.sessionId
                ? {
                    ...s,
                    status:
                      message.failed === 0
                        ? ("applied" as const)
                        : ("partial" as const),
                  }
                : s,
            ),
          );
          break;

        case "composer-session-rejected":
          setSessions((prev) =>
            prev.map((s) =>
              s.id === message.sessionId
                ? { ...s, status: "rejected" as const }
                : s,
            ),
          );
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    refreshSessions();

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [refreshSessions]);

  return {
    sessions,
    sessionChanges,
    isLoading,
    refreshSessions,
    requestSessionChanges,
    applySession,
    rejectSession,
  };
}
