import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

export interface NewsItem {
  id?: number;
  title: string;
  url: string;
  summary?: string;
  source: string;
  published_at?: string;
  fetched_at?: string;
  read_status?: number;
}

interface NewsProps {
  newsItems: NewsItem[];
  onMarkAsRead: (id: number) => void;
  onRefresh?: () => void;
  onOpenUrl: (url: string) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--vscode-foreground);
  opacity: 0.9;
  letter-spacing: 0.5px;
`;

const Subtitle = styled.p`
  margin: 2px 0 0 0;
  color: var(--vscode-descriptionForeground);
  font-size: 0.85rem;
  opacity: 0.8;
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  animation: ${fadeIn} 0.3s ease-out;
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--vscode-list-hoverBackground);
    
    .action-btn {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0; /* Ensures text truncation works */
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--vscode-descriptionForeground);
`;

const Source = styled.span`
  font-weight: 600;
  color: var(--vscode-textLink-foreground);
  text-transform: uppercase;
  font-size: 0.7rem;
  opacity: 0.9;
`;

const NewsTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--vscode-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  
  a {
    color: inherit;
    text-decoration: none;
    display: block;
    
    &:hover {
      color: var(--vscode-textLink-foreground);
    }
  }
`;

const Summary = styled.p`
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--vscode-descriptionForeground);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.8;
`;

const ActionColumn = styled.div`
  display: flex;
  align-items: center;
  padding-left: 12px;
  height: 100%;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
  color: var(--vscode-descriptionForeground);

  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
  }

  &.read-btn:hover {
    color: var(--vscode-textLink-foreground);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--vscode-descriptionForeground);
  text-align: center;
  
  svg {
    width: 32px;
    height: 32px;
    margin-bottom: 12px;
    opacity: 0.3;
  }
  
  p {
    margin-bottom: 16px;
    font-size: 0.9rem;
  }
`;

interface RefreshButtonProps {
  rotating: boolean;
}

const RefreshIcon = styled.div<RefreshButtonProps>`
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vscode-descriptionForeground);
  transition: all 0.2s;
  
  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
  }

  svg {
    transition: transform 1s ease;
    transform: ${props => props.rotating ? 'rotate(360deg)' : 'rotate(0deg)'};
  }
`;

export const News: React.FC<NewsProps> = ({ newsItems, onMarkAsRead, onRefresh, onOpenUrl }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setRefreshing(true);
      onRefresh();
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff > 86400000) return date.toLocaleDateString();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  const sortedItems = [...newsItems].sort((a, b) => {
    const da = new Date(a.published_at || 0).getTime();
    const db = new Date(b.published_at || 0).getTime();
    return db - da; // Newest first
  });

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <Title>Briefing</Title>
          <Subtitle>{sortedItems.length} available updates</Subtitle>
        </div>
        {onRefresh && (
          <RefreshIcon onClick={handleRefresh} rotating={refreshing} title="Refresh News">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.65 2.35A7.96 7.96 0 0 0 8 0a8 8 0 1 0 8 8c0-2.15-.85-4.1-2.25-5.55l-1.45 1.45A5.96 5.96 0 0 1 14 8a6 6 0 1 1-6-6c1.6 0 3.05.65 4.15 1.75l-1.9 1.9h5.1v-5.1l-1.7 1.8z"/>
            </svg>
          </RefreshIcon>
        )}
      </div>

      {sortedItems.length === 0 ? (
        <EmptyState>
          <svg fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
            <path d="M4 4h8v1H4V4zm0 3h8v1H4V7zm0 3h6v1H4v-1z"/>
          </svg>
          <p>You're all caught up</p>
          <VSCodeButton appearance="secondary" onClick={handleRefresh}>Check for Updates</VSCodeButton>
        </EmptyState>
      ) : (
        <ListContainer>
          {sortedItems.map((item) => (
            // Entire card is clickable to open article
            <ListItem 
              key={item.id || item.url}
              onClick={() => onOpenUrl(item.url)}
            >
              <ContentColumn>
                <MetaRow>
                  <Source>{item.source}</Source>
                  <span>•</span>
                  <span>{formatDate(item.published_at)}</span>
                </MetaRow>
                
                <NewsTitle>
                  {item.title}
                </NewsTitle>
                
                {item.summary && <Summary>{item.summary}</Summary>}
              </ContentColumn>
              
              <ActionColumn>
                <ActionButton 
                  className="action-btn read-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenUrl(item.url);
                  }}
                  title="Read Article"
                  aria-label="Read Article"
                >
                  <span className="codicon codicon-link-external"></span>
                </ActionButton>
                
                <ActionButton 
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.id && onMarkAsRead(item.id);
                  }}
                  title="Mark as Read"
                  aria-label="Mark as Read"
                >
                  <span className="codicon codicon-check"></span>
                </ActionButton>
              </ActionColumn>
            </ListItem>
          ))}
        </ListContainer>
      )}
    </Container>
  );
};
