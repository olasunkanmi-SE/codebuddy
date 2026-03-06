import React, { useState } from "react";
import {
  useComposerSessions,
  ComposerSessionInfo,
  ComposerSessionChange,
} from "../hooks/useComposerSessions";
import "./ComposerPanel.css";

interface SessionItemProps {
  session: ComposerSessionInfo;
  changes?: ComposerSessionChange[];
  onExpand: (sessionId: string) => void;
  onApply: (sessionId: string) => void;
  onReject: (sessionId: string) => void;
  onViewDiff: (changeId: string, filePath: string) => void;
}

declare const vscodeApi: {
  postMessage: (message: any) => void;
};

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  changes,
  onExpand,
  onApply,
  onReject,
  onViewDiff,
}) => {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    session.status === "applied"
      ? "✓"
      : session.status === "rejected"
        ? "✗"
        : session.status === "partial"
          ? "⚠"
          : "⏳";

  const handleExpand = () => {
    if (!expanded) {
      onExpand(session.id);
    }
    setExpanded(!expanded);
  };

  return (
    <div className={`composer-session-item session-${session.status}`}>
      <div className="session-header" onClick={handleExpand}>
        <span className={`session-status session-status-${session.status}`}>
          {statusIcon}
        </span>
        <div className="session-info">
          <span className="session-label">{session.label}</span>
          <span className="session-meta">
            {session.changeCount} file{session.changeCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="session-actions">
          {session.status === "active" && (
            <>
              <button
                className="action-btn apply-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(session.id);
                }}
                title="Apply all changes"
              >
                ✓ All
              </button>
              <button
                className="action-btn reject-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(session.id);
                }}
                title="Reject all changes"
              >
                ✗ All
              </button>
            </>
          )}
          <span className="expand-icon">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && changes && (
        <div className="session-changes">
          {changes.map((change) => {
            const fileName =
              change.filePath.split("/").pop() || change.filePath;
            const changeStatusIcon =
              change.status === "applied"
                ? "✓"
                : change.status === "rejected"
                  ? "✗"
                  : "⏳";

            return (
              <div
                key={change.id}
                className={`session-change-item change-${change.status}`}
              >
                <span
                  className={`change-status-icon change-status-${change.status}`}
                >
                  {changeStatusIcon}
                </span>
                <span className="change-filename" title={change.filePath}>
                  {change.isNewFile && (
                    <span className="new-badge">NEW</span>
                  )}
                  {fileName}
                </span>
                <button
                  className="action-btn view-btn"
                  onClick={() => onViewDiff(change.id, change.filePath)}
                  title="View diff"
                >
                  👁️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ComposerPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const ComposerPanel: React.FC<ComposerPanelProps> = ({
  collapsed = true,
  onToggle,
}) => {
  const {
    sessions,
    sessionChanges,
    isLoading,
    refreshSessions,
    requestSessionChanges,
    applySession,
    rejectSession,
  } = useComposerSessions();

  const activeSessions = sessions.filter((s) => s.status === "active");

  const handleViewDiff = (changeId: string, filePath: string) => {
    vscodeApi.postMessage({
      command: "view-change-diff",
      id: changeId,
      filePath,
    });
  };

  if (sessions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`composer-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-header" onClick={onToggle}>
        <span className="panel-title">
          Composer Sessions
          {activeSessions.length > 0 && (
            <span className="active-badge">{activeSessions.length}</span>
          )}
        </span>
        <div className="panel-actions">
          <button
            className="refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              refreshSessions();
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
          {isLoading ? (
            <div className="loading">Loading sessions...</div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                changes={sessionChanges.get(session.id)}
                onExpand={requestSessionChanges}
                onApply={applySession}
                onReject={rejectSession}
                onViewDiff={handleViewDiff}
              />
            ))
          ) : (
            <div className="empty-state">No composer sessions</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComposerPanel;
