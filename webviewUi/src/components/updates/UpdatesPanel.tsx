import React from "react";
import styled from "styled-components";
import { News, NewsItem } from "../news/News";

interface UpdatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  newsItems: NewsItem[];
  onMarkAsRead: (id: number) => void;
  onRefresh: () => void;
  onOpenUrl: (url: string) => void;
  userName: string;
}

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
  width: 450px; /* Slightly wider than notifications for news readability */
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
`;

export const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  isOpen,
  onClose,
  newsItems,
  onMarkAsRead,
  onRefresh,
  onOpenUrl,
  userName,
}) => {
  return (
    <PanelOverlay isOpen={isOpen} onClick={onClose}>
      <PanelContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <span className="codicon codicon-newspaper"></span>
            Updates
          </Title>
          <CloseButton onClick={onClose} aria-label="Close updates">
            <span className="codicon codicon-close"></span>
          </CloseButton>
        </Header>
        <Content>
            {/* 
                We reuse the News component but might need to adjust its internal container 
                styling via props or by overriding styles if it has too much padding.
                For now, let's just render it. The News component has its own header/greeting 
                which might be redundant, but we'll keep it for now.
            */}
            <News 
              newsItems={newsItems} 
              onMarkAsRead={onMarkAsRead}
              onRefresh={onRefresh}
              onOpenUrl={onOpenUrl}
              userName={userName}
            />
        </Content>
      </PanelContainer>
    </PanelOverlay>
  );
};
