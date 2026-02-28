import React from "react";
import styled from "styled-components";
import { NotificationPanelProps } from "./types";
import { NotificationItem } from "./NotificationItem";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

const PanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const PanelContainer = styled.div`
  width: 350px;
  height: 100%;
  background: var(--vscode-editor-background);
  border-left: 1px solid var(--vscode-widget-border);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  transform: translateX(0);
  animation: slideIn 0.2s ease-in-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--vscode-widget-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--vscode-editor-background);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;

  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 5px;
    border: 2px solid var(--vscode-editor-background);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-hoverBackground);
  }
`;

const Footer = styled.div`
  padding: 12px;
  border-top: 1px solid var(--vscode-widget-border);
  display: flex;
  justify-content: space-between;
  background: var(--vscode-editor-background);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vscode-descriptionForeground);
  padding: 20px;
  text-align: center;
`;

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDelete,
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PanelOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <PanelContainer>
        <Header>
          <Title>
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  background: "var(--vscode-badge-background)",
                  color: "var(--vscode-badge-foreground)",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </Title>
          <CloseButton onClick={onClose}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 4L4 12M4 4l8 8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CloseButton>
        </Header>
        <Content>
          {notifications.length === 0 ? (
            <EmptyState>
              <div style={{ marginBottom: 12, opacity: 0.5 }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                    strokeWidth="1.5"
                  />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.5" />
                </svg>
              </div>
              <div>No notifications</div>
            </EmptyState>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => onMarkAsRead(notification.id)}
                onDelete={() => onDelete(notification.id)}
              />
            ))
          )}
        </Content>
        {notifications.length > 0 && (
          <Footer>
            <VSCodeButton
              appearance="secondary"
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </VSCodeButton>
            <VSCodeButton appearance="icon" onClick={onClearAll}>
              Clear all
            </VSCodeButton>
          </Footer>
        )}
      </PanelContainer>
    </PanelOverlay>
  );
};
