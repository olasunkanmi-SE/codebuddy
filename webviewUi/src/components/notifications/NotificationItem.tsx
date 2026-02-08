import React from "react";
import styled from "styled-components";
import { INotificationItem } from "./types";

// Simple time ago utility
const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
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
}

export const NotificationItem: React.FC<Props> = ({ notification, onClick }) => {
  const timeDisplay = timeAgo(notification.timestamp);

  return (
    <ItemContainer
      read={notification.read}
      type={notification.type}
      onClick={onClick}
    >
      <Header>
        <Title>{notification.title}</Title>
        <Time>{timeDisplay}</Time>
      </Header>
      <Message>{notification.message}</Message>
      {notification.source && <Source>{notification.source}</Source>}
    </ItemContainer>
  );
};
