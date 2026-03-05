import { useState, useEffect, useCallback } from "react";

declare const vscodeApi: {
  postMessage: (message: any) => void;
};

export interface DiffLine {
  type: "context" | "add" | "remove";
  content: string;
}

export interface DiffHunk {
  index: number;
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  status: "pending" | "accepted" | "rejected";
  lines: DiffLine[];
}

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
  /** Hunks for a specific change, keyed by change id */
  changeHunks: Map<string, DiffHunk[]>;
}

export interface PendingChangesActions {
  applyChange: (id: string) => void;
  rejectChange: (id: string) => void;
  viewDiff: (id: string, filePath: string) => void;
  refreshChanges: () => void;
  /** Request hunks for a specific change */
  requestHunks: (id: string) => void;
  /** Accept a single hunk */
  acceptHunk: (changeId: string, hunkIndex: number) => void;
  /** Reject a single hunk */
  rejectHunk: (changeId: string, hunkIndex: number) => void;
  /** Finalize hunk review (apply accepted, discard rejected) */
  finalizeHunkReview: (changeId: string) => void;
}

export function usePendingChanges(): PendingChangesState &
  PendingChangesActions {
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([]);
  const [recentChanges, setRecentChanges] = useState<FileChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [changeHunks, setChangeHunks] = useState<Map<string, DiffHunk[]>>(
    new Map(),
  );

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

  // Request hunks for a specific change
  const requestHunks = useCallback((id: string) => {
    try {
      vscodeApi.postMessage({ command: "get-change-hunks", id });
    } catch (error) {
      console.error("Failed to request hunks:", error);
    }
  }, []);

  // Accept a single hunk
  const acceptHunk = useCallback((changeId: string, hunkIndex: number) => {
    try {
      vscodeApi.postMessage({
        command: "accept-hunk",
        id: changeId,
        hunkIndex,
      });
      // Optimistic update
      setChangeHunks((prev) => {
        const next = new Map(prev);
        const hunks = next.get(changeId);
        if (hunks) {
          next.set(
            changeId,
            hunks.map((h) =>
              h.index === hunkIndex ? { ...h, status: "accepted" as const } : h,
            ),
          );
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to accept hunk:", error);
    }
  }, []);

  // Reject a single hunk
  const rejectHunk = useCallback((changeId: string, hunkIndex: number) => {
    try {
      vscodeApi.postMessage({
        command: "reject-hunk",
        id: changeId,
        hunkIndex,
      });
      // Optimistic update
      setChangeHunks((prev) => {
        const next = new Map(prev);
        const hunks = next.get(changeId);
        if (hunks) {
          next.set(
            changeId,
            hunks.map((h) =>
              h.index === hunkIndex ? { ...h, status: "rejected" as const } : h,
            ),
          );
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to reject hunk:", error);
    }
  }, []);

  // Finalize hunk review
  const finalizeHunkReview = useCallback((changeId: string) => {
    try {
      vscodeApi.postMessage({ command: "finalize-hunk-review", id: changeId });
    } catch (error) {
      console.error("Failed to finalize hunk review:", error);
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

        case "change-hunks":
          // Received hunks for a specific change
          if (message.hunks) {
            setChangeHunks((prev) => {
              const next = new Map(prev);
              next.set(message.id, message.hunks);
              return next;
            });
          }
          break;

        case "hunk-status-changed":
          // Server confirmed hunk status update
          if (message.status !== "error") {
            setChangeHunks((prev) => {
              const next = new Map(prev);
              const hunks = next.get(message.id);
              if (hunks) {
                next.set(
                  message.id,
                  hunks.map((h) =>
                    h.index === message.hunkIndex
                      ? { ...h, status: message.status }
                      : h,
                  ),
                );
              }
              return next;
            });
          }
          break;

        case "hunk-review-finalized":
          if (message.success) {
            setPendingChanges((prev) =>
              prev.filter((c) => c.id !== message.id),
            );
            setChangeHunks((prev) => {
              const next = new Map(prev);
              next.delete(message.id);
              return next;
            });
          }
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
    changeHunks,
    applyChange,
    rejectChange,
    viewDiff,
    refreshChanges,
    requestHunks,
    acceptHunk,
    rejectHunk,
    finalizeHunkReview,
  };
}
