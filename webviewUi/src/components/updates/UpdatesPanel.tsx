import React from "react";
import styled from "styled-components";
import { News, NewsItem } from "../news/News";

export interface KnowledgeData {
    topics: { topic: string; proficiency_score: number; article_count: number }[];
    history: { title: string; read_at: string; url: string }[];
}

interface UpdatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  newsItems: NewsItem[];
  onMarkAsRead: (id: number) => void;
  onRefresh: () => void;
  onOpenUrl: (url: string) => void;
  onDiscuss: (item: NewsItem) => void;
  onQuiz: (topic: string) => void;
  userName: string;
  knowledge?: KnowledgeData;
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
  width: 450px;
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

const SectionTitle = styled.h3`
  padding: 16px 16px 8px;
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground);
  border-bottom: 1px solid var(--vscode-widget-border);
  background: var(--vscode-editor-background);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const KnowledgeSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--vscode-widget-border);
`;

const TopicPill = styled.span`
  display: inline-flex;
  align-items: center;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-right: 6px;
  margin-bottom: 6px;
  border: 1px solid var(--vscode-widget-border);
  gap: 4px;
`;

const QuizIcon = styled.span`
  cursor: pointer;
  opacity: 0.7;
  display: flex;
  align-items: center;
  &:hover {
    opacity: 1;
    color: var(--vscode-textLink-foreground);
  }
`;

export const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  isOpen,
  onClose,
  newsItems,
  onMarkAsRead,
  onRefresh,
  onOpenUrl,
  onDiscuss,
  onQuiz,
  userName,
  knowledge,
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
           {knowledge && knowledge.topics.length > 0 && (
              <>
                <SectionTitle>Your Knowledge Profile</SectionTitle>
                <KnowledgeSection>
                    <div style={{marginBottom: '12px'}}>
                        {knowledge.topics.slice(0, 10).map(t => (
                            <TopicPill key={t.topic} title={`Score: ${t.proficiency_score}`}>
                                {t.topic} <span style={{opacity: 0.7, fontSize: '9px'}}>({t.article_count})</span>
                                <QuizIcon 
                                    className="codicon codicon-beaker" 
                                    title="Take a quick quiz"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuiz(t.topic);
                                    }}
                                />
                            </TopicPill>
                        ))}
                    </div>
                     <div style={{fontSize: '11px', color: 'var(--vscode-descriptionForeground)', marginTop: '8px'}}>
                        <strong>Recent Activity:</strong>
                        <ul style={{margin: '4px 0 0 0', paddingLeft: '16px'}}>
                            {knowledge.history.slice(0, 5).map((h, i) => (
                                <li key={i} style={{marginBottom: '4px'}}>
                                    <span style={{color: 'var(--vscode-textLink-foreground)', cursor: 'pointer'}} onClick={() => onOpenUrl(h.url)}>
                                        {h.title || 'Untitled Article'}
                                    </span>
                                    <span style={{opacity: 0.6, marginLeft: '6px'}}>
                                        {new Date(h.read_at).toLocaleDateString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                     </div>
                </KnowledgeSection>
              </>
          )}

          <SectionTitle>News Feed</SectionTitle>
          <News 
            newsItems={newsItems} 
            onMarkAsRead={onMarkAsRead}
            onRefresh={onRefresh}
            onOpenUrl={onOpenUrl}
            onDiscuss={onDiscuss}
            userName={userName}
          />
        </Content>
      </PanelContainer>
    </PanelOverlay>
  );
};
