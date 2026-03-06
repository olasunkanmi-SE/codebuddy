import React, { useState } from "react";
import { useCheckpoints, CheckpointSummary } from "../hooks/useCheckpoints";
import "./CheckpointPanel.css";

interface CheckpointItemProps {
  checkpoint: CheckpointSummary;
  onRevert: (id: string) => void;
  onDelete: (id: string) => void;
  isReverting: boolean;
}

const CheckpointItem: React.FC<CheckpointItemProps> = ({
  checkpoint,
  onRevert,
  onDelete,
  isReverting,
}) => {
  const [confirmRevert, setConfirmRevert] = useState(false);

  const timeAgo = formatTimeAgo(checkpoint.timestamp);

  return (
    <div className="checkpoint-item">
      <div className="checkpoint-info">
        <span className="checkpoint-label" title={checkpoint.label}>
          {checkpoint.label}
        </span>
        <span className="checkpoint-meta">
          {checkpoint.fileCount} file{checkpoint.fileCount !== 1 ? "s" : ""} •{" "}
          {timeAgo}
        </span>
      </div>
      <div className="checkpoint-actions">
        {confirmRevert ? (
          <>
            <button
              className="checkpoint-btn confirm-btn"
              onClick={() => {
                onRevert(checkpoint.id);
                setConfirmRevert(false);
              }}
              disabled={isReverting}
              title="Confirm revert"
            >
              ✓
            </button>
            <button
              className="checkpoint-btn cancel-btn"
              onClick={() => setConfirmRevert(false)}
              title="Cancel"
            >
              ✗
            </button>
          </>
        ) : (
          <>
            <button
              className="checkpoint-btn revert-btn"
              onClick={() => setConfirmRevert(true)}
              disabled={isReverting}
              title="Revert to this checkpoint"
            >
              ↶
            </button>
            <button
              className="checkpoint-btn delete-btn"
              onClick={() => onDelete(checkpoint.id)}
              title="Delete checkpoint"
            >
              ×
            </button>
          </>
        )}
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface CheckpointPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const CheckpointPanel: React.FC<CheckpointPanelProps> = ({
  collapsed = true,
  onToggle,
}) => {
  const {
    checkpoints,
    isReverting,
    lastRevertResult,
    revertToCheckpoint,
    deleteCheckpoint,
  } = useCheckpoints();

  if (checkpoints.length === 0) {
    return null;
  }

  return (
    <div className={`checkpoint-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-header" onClick={onToggle}>
        <span className="panel-title">
          Checkpoints
          <span className="checkpoint-badge">{checkpoints.length}</span>
        </span>
        <span className="collapse-icon">{collapsed ? "▼" : "▲"}</span>
      </div>

      {!collapsed && (
        <div className="panel-content">
          {isReverting && (
            <div className="revert-status">Reverting files…</div>
          )}

          {lastRevertResult && !isReverting && (
            <div
              className={`revert-result ${lastRevertResult.errors.length > 0 ? "has-errors" : "success"}`}
              role="alert"
            >
              {lastRevertResult.errors.length > 0 ? (
                <span>
                  Reverted with {lastRevertResult.errors.length} error(s)
                </span>
              ) : (
                <span>
                  Restored {lastRevertResult.reverted.length} file(s)
                  {lastRevertResult.deleted.length > 0 &&
                    `, removed ${lastRevertResult.deleted.length}`}
                </span>
              )}
            </div>
          )}

          <div className="checkpoint-list">
            {checkpoints.map((cp) => (
              <CheckpointItem
                key={cp.id}
                checkpoint={cp}
                onRevert={revertToCheckpoint}
                onDelete={deleteCheckpoint}
                isReverting={isReverting}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckpointPanel;
