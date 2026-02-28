import React from "react";
import styled from "styled-components";
import { INotificationItem } from "./types";

// Simple time ago utility
const timeAgo = (dateStr: string) => {
  // SQLite timestamps may lack a timezone indicator — treat as UTC
  let normalized = dateStr;
  if (normalized && !normalized.endsWith("Z") && !normalized.includes("+")) {
    normalized = normalized.replace(" ", "T") + "Z";
  }
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const ItemContainer = styled.div<{ read: boolean; type: string }>`
  padding: 12px;
  border-bottom: 1px solid var(--vscode-widget-border);
  background: ${(props) =>
    props.read ? "transparent" : "var(--vscode-list-hoverBackground)"};
  border-left: 3px solid
    ${(props) => {
      switch (props.type) {
        case "error":
          return "var(--vscode-errorForeground)";
        case "warning":
          return "var(--vscode-editorWarning-foreground)";
        case "success":
          return "var(--vscode-testing-iconPassed)";
        default:
          return "var(--vscode-textLink-foreground)";
      }
    }};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--vscode-list-hoverBackground);
  }
`;

const Header = styled.div`
  display: flex;
  justify_content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: var(--vscode-foreground);
`;

const Time = styled.div`
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  white-space: nowrap;
  margin-left: 8px;
`;

const Message = styled.div`
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
  margin-bottom: 4px;
`;

const Source = styled.div`
  font-size: 10px;
  color: var(--vscode-textLink-foreground);
  opacity: 0.8;
`;

interface Props {
  notification: INotificationItem;
  onClick: () => void;
  onDelete: () => void;
}

export const NotificationItem: React.FC<Props> = ({ notification, onClick, onDelete }) => {
  const timeDisplay = timeAgo(notification.timestamp);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <ItemContainer
      read={notification.read}
      type={notification.type}
      onClick={onClick}
    >
      <Header>
        <Title>{notification.title}</Title>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Time>{timeDisplay}</Time>
          <button
            onClick={handleDelete}
            title="Delete notification"
            aria-label="Delete notification"
            style={{
              background: "none",
              border: "none",
              color: "var(--vscode-descriptionForeground)",
              cursor: "pointer",
              padding: "2px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
              transition: "opacity 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.color = "var(--vscode-errorForeground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.6";
              e.currentTarget.style.color = "var(--vscode-descriptionForeground)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path d="M12 4L4 12M4 4l8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </Header>
      <Message>{notification.message}</Message>
      {notification.source && <Source>{notification.source}</Source>}
    </ItemContainer>
  );
};
