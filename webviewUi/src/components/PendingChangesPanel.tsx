import React, { useState } from "react";
import {
  usePendingChanges,
  FileChange,
  DiffHunk,
} from "../hooks/usePendingChanges";
import "./PendingChangesPanel.css";

interface FileChangeItemProps {
  change: FileChange;
  onApply?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDiff: (id: string, filePath: string) => void;
  showActions: boolean;
  hunks?: DiffHunk[];
  onExpandHunks?: (id: string) => void;
  onAcceptHunk?: (changeId: string, hunkIndex: number) => void;
  onRejectHunk?: (changeId: string, hunkIndex: number) => void;
  onFinalizeHunks?: (changeId: string) => void;
}

const HunkView: React.FC<{
  hunk: DiffHunk;
  changeId: string;
  onAccept?: (changeId: string, hunkIndex: number) => void;
  onReject?: (changeId: string, hunkIndex: number) => void;
}> = ({ hunk, changeId, onAccept, onReject }) => {
  const statusClass = `hunk-status-${hunk.status}`;
  return (
    <div className={`hunk-item ${statusClass}`}>
      <div className="hunk-header">
        <span className="hunk-range">{hunk.header}</span>
        {hunk.status === "pending" && (
          <div className="hunk-actions">
            {onAccept && (
              <button
                className="action-btn hunk-accept-btn"
                onClick={() => onAccept(changeId, hunk.index)}
                title="Accept this hunk"
              >
                ✓
              </button>
            )}
            {onReject && (
              <button
                className="action-btn hunk-reject-btn"
                onClick={() => onReject(changeId, hunk.index)}
                title="Reject this hunk"
              >
                ✗
              </button>
            )}
          </div>
        )}
        {hunk.status !== "pending" && (
          <span className={`hunk-badge hunk-badge-${hunk.status}`}>
            {hunk.status}
          </span>
        )}
      </div>
      <pre className="hunk-diff">
        {hunk.lines.map((line, i) => (
          <div key={i} className={`diff-line diff-line-${line.type}`}>
            <span className="diff-prefix">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            <span className="diff-content">{line.content}</span>
          </div>
        ))}
      </pre>
    </div>
  );
};

const FileChangeItem: React.FC<FileChangeItemProps> = ({
  change,
  onApply,
  onReject,
  onViewDiff,
  showActions,
  hunks,
  onExpandHunks,
  onAcceptHunk,
  onRejectHunk,
  onFinalizeHunks,
}) => {
  const fileName = change.filePath.split("/").pop() || change.filePath;
  const relativePath = change.filePath.replace(/.*\/codebuddy\//, "");
  const timeAgo = getTimeAgo(change.timestamp);

  const statusIcon =
    change.status === "applied"
      ? "✓"
      : change.status === "rejected"
        ? "✗"
        : "⏳";

  const statusClass = `change-status change-status-${change.status}`;

  return (
    <div className="file-change-item">
      <div className="change-info">
        <span className={statusClass}>{statusIcon}</span>
        <div className="change-details">
          <span className="file-name" title={relativePath}>
            {change.isNewFile && <span className="new-badge">NEW</span>}
            {fileName}
          </span>
          <span className="file-path">{relativePath}</span>
          <span className="change-time">{timeAgo}</span>
        </div>
      </div>
      <div className="change-actions">
        {showActions && change.status === "pending" && onExpandHunks && (
          <button
            className="action-btn hunks-btn"
            onClick={() => onExpandHunks(change.id)}
            title="Review individual hunks"
          >
            ⊞
          </button>
        )}
        <button
          className="action-btn view-btn"
          onClick={() => onViewDiff(change.id, change.filePath)}
          title="View diff"
        >
          👁️
        </button>
        {showActions && change.status === "pending" && (
          <>
            {onApply && (
              <button
                className="action-btn apply-btn"
                onClick={() => onApply(change.id)}
                title="Apply all changes"
              >
                ✓
              </button>
            )}
            {onReject && (
              <button
                className="action-btn reject-btn"
                onClick={() => onReject(change.id)}
                title="Reject all changes"
              >
                ✗
              </button>
            )}
          </>
        )}
      </div>
      {hunks && hunks.length > 0 && (
        <div className="hunks-container">
          <div className="hunks-summary">
            {hunks.length} hunk{hunks.length !== 1 ? "s" : ""} —{" "}
            {hunks.filter((h) => h.status === "accepted").length} accepted,{" "}
            {hunks.filter((h) => h.status === "rejected").length} rejected,{" "}
            {hunks.filter((h) => h.status === "pending").length} pending
          </div>
          {hunks.map((hunk) => (
            <HunkView
              key={hunk.index}
              hunk={hunk}
              changeId={change.id}
              onAccept={onAcceptHunk}
              onReject={onRejectHunk}
            />
          ))}
          {hunks.some((h) => h.status !== "pending") && onFinalizeHunks && (
            <button
              className="finalize-btn"
              onClick={() => onFinalizeHunks(change.id)}
              title="Apply accepted hunks and discard rejected ones"
            >
              Finalize Review
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface PendingChangesPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const PendingChangesPanel: React.FC<PendingChangesPanelProps> = ({
  collapsed = true,
  onToggle,
}) => {
  const {
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
  } = usePendingChanges();

  const [activeTab, setActiveTab] = useState<"pending" | "recent">("recent");

  const hasPending = pendingChanges.length > 0;
  const hasRecent = recentChanges.length > 0;

  // Don't render if no changes at all
  if (!hasPending && !hasRecent && !isLoading) {
    return null;
  }

  return (
    <div className={`pending-changes-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-header" onClick={onToggle}>
        <span className="panel-title">
          File Changes
          {hasPending && (
            <span className="pending-badge">{pendingChanges.length}</span>
          )}
        </span>
        <div className="panel-actions">
          <button
            className="refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              refreshChanges();
            }}
            title="Refresh"
          >
            ↻
          </button>
          <span className="collapse-icon">{collapsed ? "▼" : "▲"}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="panel-content">
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === "recent" ? "active" : ""}`}
              onClick={() => setActiveTab("recent")}
            >
              Recent ({recentChanges.length})
            </button>
            {hasPending && (
              <button
                className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                Pending ({pendingChanges.length})
              </button>
            )}
          </div>

          <div className="changes-list">
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : activeTab === "pending" ? (
              pendingChanges.length > 0 ? (
                pendingChanges.map((change) => (
                  <FileChangeItem
                    key={change.id}
                    change={change}
                    onApply={applyChange}
                    onReject={rejectChange}
                    onViewDiff={viewDiff}
                    showActions={true}
                    hunks={changeHunks.get(change.id)}
                    onExpandHunks={requestHunks}
                    onAcceptHunk={acceptHunk}
                    onRejectHunk={rejectHunk}
                    onFinalizeHunks={finalizeHunkReview}
                  />
                ))
              ) : (
                <div className="empty-state">No pending changes</div>
              )
            ) : recentChanges.length > 0 ? (
              recentChanges.map((change) => (
                <FileChangeItem
                  key={change.id}
                  change={change}
                  onViewDiff={viewDiff}
                  showActions={false}
                />
              ))
            ) : (
              <div className="empty-state">No recent changes</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingChangesPanel;
