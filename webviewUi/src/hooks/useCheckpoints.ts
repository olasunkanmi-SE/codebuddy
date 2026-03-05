import { useState, useEffect, useCallback } from "react";
import { vscode } from "../utils/vscode";

export interface CheckpointSummary {
  id: string;
  label: string;
  timestamp: number;
  conversationId: string;
  fileCount: number;
}

export interface CheckpointRevertResult {
  checkpointId: string;
  reverted: string[];
  deleted: string[];
  errors: string[];
}

export interface CheckpointState {
  checkpoints: CheckpointSummary[];
  isReverting: boolean;
  lastRevertResult: CheckpointRevertResult | null;
}

export interface CheckpointActions {
  refreshCheckpoints: (conversationId?: string) => void;
  createCheckpoint: (label: string, conversationId?: string) => void;
  revertToCheckpoint: (checkpointId: string) => void;
  deleteCheckpoint: (checkpointId: string) => void;
}

export function useCheckpoints(): CheckpointState & CheckpointActions {
  const [checkpoints, setCheckpoints] = useState<CheckpointSummary[]>([]);
  const [isReverting, setIsReverting] = useState(false);
  const [lastRevertResult, setLastRevertResult] =
    useState<CheckpointRevertResult | null>(null);

  const refreshCheckpoints = useCallback((conversationId?: string) => {
    vscode.postMessage({
      command: "get-checkpoints",
      conversationId,
    });
  }, []);

  const createCheckpoint = useCallback(
    (label: string, conversationId?: string) => {
      vscode.postMessage({
        command: "create-checkpoint",
        label,
        conversationId,
      });
    },
    [],
  );

  const revertToCheckpoint = useCallback((checkpointId: string) => {
    setIsReverting(true);
    vscode.postMessage({
      command: "revert-checkpoint",
      checkpointId,
    });
  }, []);

  const deleteCheckpoint = useCallback((checkpointId: string) => {
    setCheckpoints((prev) => prev.filter((c) => c.id !== checkpointId));
    vscode.postMessage({
      command: "delete-checkpoint",
      checkpointId,
    });
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;

      switch (msg.type) {
        case "checkpoints":
          setCheckpoints(msg.checkpoints ?? []);
          break;

        case "checkpoint-created":
          if (msg.checkpoint) {
            setCheckpoints((prev) => [msg.checkpoint, ...prev]);
          }
          break;

        case "checkpoint-reverted":
          setIsReverting(false);
          setLastRevertResult({
            checkpointId: msg.checkpointId,
            reverted: msg.reverted ?? [],
            deleted: msg.deleted ?? [],
            errors: msg.errors ?? [],
          });
          // Refresh list since later checkpoints are removed on revert
          refreshCheckpoints();
          break;

        case "checkpoint-deleted":
          if (msg.success) {
            setCheckpoints((prev) =>
              prev.filter((c) => c.id !== msg.checkpointId),
            );
          }
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refreshCheckpoints]);

  // Initial fetch
  useEffect(() => {
    refreshCheckpoints();
  }, [refreshCheckpoints]);

  return {
    checkpoints,
    isReverting,
    lastRevertResult,
    refreshCheckpoints,
    createCheckpoint,
    revertToCheckpoint,
    deleteCheckpoint,
  };
}
