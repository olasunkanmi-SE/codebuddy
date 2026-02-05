import React, { useState } from "react";
import { usePendingChanges, FileChange } from "../hooks/usePendingChanges";
import "./PendingChangesPanel.css";

interface FileChangeItemProps {
  change: FileChange;
  onApply?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDiff: (id: string, filePath: string) => void;
  showActions: boolean;
}

const FileChangeItem: React.FC<FileChangeItemProps> = ({
  change,
  onApply,
  onReject,
  onViewDiff,
  showActions,
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
                title="Apply change"
              >
                ✓
              </button>
            )}
            {onReject && (
              <button
                className="action-btn reject-btn"
                onClick={() => onReject(change.id)}
                title="Reject change"
              >
                ✗
              </button>
            )}
          </>
        )}
      </div>
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
    applyChange,
    rejectChange,
    viewDiff,
    refreshChanges,
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
