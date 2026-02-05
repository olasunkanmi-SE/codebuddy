import { useState, useEffect, useCallback } from "react";

declare const vscodeApi: {
  postMessage: (message: any) => void;
};

export interface FileChange {
  id: string;
  filePath: string;
  timestamp: number;
  status: "pending" | "applied" | "rejected";
  isNewFile: boolean;
}

export interface PendingChangesState {
  pendingChanges: FileChange[];
  recentChanges: FileChange[];
  isLoading: boolean;
}

export interface PendingChangesActions {
  applyChange: (id: string) => void;
  rejectChange: (id: string) => void;
  viewDiff: (id: string, filePath: string) => void;
  refreshChanges: () => void;
}

export function usePendingChanges(): PendingChangesState &
  PendingChangesActions {
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([]);
  const [recentChanges, setRecentChanges] = useState<FileChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Request pending and recent changes from extension
  const refreshChanges = useCallback(() => {
    setIsLoading(true);
    try {
      vscodeApi.postMessage({ command: "get-pending-changes" });
      vscodeApi.postMessage({ command: "get-recent-changes" });
    } catch (error) {
      console.error("Failed to refresh changes:", error);
      setIsLoading(false);
    }
  }, []);

  // Apply a pending change
  const applyChange = useCallback((id: string) => {
    try {
      vscodeApi.postMessage({ command: "apply-change", id });
    } catch (error) {
      console.error("Failed to apply change:", error);
    }
  }, []);

  // Reject a pending change
  const rejectChange = useCallback((id: string) => {
    try {
      vscodeApi.postMessage({ command: "reject-change", id });
    } catch (error) {
      console.error("Failed to reject change:", error);
    }
  }, []);

  // Open diff view for a change
  const viewDiff = useCallback((id: string, filePath: string) => {
    try {
      vscodeApi.postMessage({ command: "view-change-diff", id, filePath });
    } catch (error) {
      console.error("Failed to view diff:", error);
    }
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "pending-changes":
          setPendingChanges(message.changes || []);
          setIsLoading(false);
          break;

        case "recent-changes":
          setRecentChanges(message.changes || []);
          setIsLoading(false);
          break;

        case "diff-change-event":
          // Handle real-time updates from the extension
          if (message.eventType === "added") {
            setPendingChanges((prev) => {
              // Add if not already present
              if (!prev.find((c) => c.id === message.change.id)) {
                return [message.change, ...prev];
              }
              return prev;
            });
          } else if (message.eventType === "applied") {
            // Remove from pending, add to recent
            setPendingChanges((prev) =>
              prev.filter((c) => c.id !== message.change.id),
            );
            setRecentChanges((prev) => {
              const updated = [message.change, ...prev];
              // Keep only last 10 in UI
              return updated.slice(0, 10);
            });
          } else if (message.eventType === "rejected") {
            // Remove from pending, add to recent
            setPendingChanges((prev) =>
              prev.filter((c) => c.id !== message.change.id),
            );
            setRecentChanges((prev) => {
              const updated = [message.change, ...prev];
              return updated.slice(0, 10);
            });
          }
          break;

        case "change-applied":
          // Confirmation that a change was applied
          if (message.success) {
            setPendingChanges((prev) =>
              prev.filter((c) => c.id !== message.id),
            );
          }
          break;

        case "change-rejected":
          // Confirmation that a change was rejected
          setPendingChanges((prev) => prev.filter((c) => c.id !== message.id));
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial fetch
    refreshChanges();

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [refreshChanges]);

  return {
    pendingChanges,
    recentChanges,
    isLoading,
    applyChange,
    rejectChange,
    viewDiff,
    refreshChanges,
  };
}
