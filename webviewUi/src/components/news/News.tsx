import React, { useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';

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
  userName?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--vscode-editor-foreground);
`;

const HeaderSection = styled.div`
  margin-bottom: 32px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Greeting = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
`;

const IntroText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: var(--vscode-descriptionForeground);
  margin: 0 0 16px 0;
  max-width: 90%;
`;

const SummaryCard = styled.div`
  border: 1px solid var(--vscode-widget-border);
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 32px;
  background: var(--vscode-editor-background);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: ${fadeIn} 0.5s ease-out;
`;

const SummaryHeader = styled.div`
  border-bottom: 1px solid var(--vscode-widget-border);
  padding-bottom: 12px;
  margin-bottom: 16px;
`;

const SummaryTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--vscode-editor-foreground);
`;

const ReadTime = styled.div`
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  margin-top: 8px;
  font-feature-settings: "tnum";
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: var(--vscode-textLink-foreground);
  text-underline-offset: 4px;
  margin-bottom: 12px;
  color: var(--vscode-editor-foreground);
  display: inline-block;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledNewsItem = styled.div`
  display: flex;
  gap: 8px;
  font-size: 14px;
  line-height: 1.6;
  align-items: flex-start;
`;

const Bullet = styled.span`
  color: var(--vscode-editor-foreground);
  font-size: 10px;
  margin-top: 6px;
`;

const ItemContent = styled.div`
  flex: 1;
`;

const ItemLink = styled.a`
  color: #9cdcfe; /* Light Blue */
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

const ItemSource = styled.span`
  font-weight: 600;
  color: var(--vscode-editor-foreground);
  margin-right: 4px;
`;

const ItemText = styled.span`
  color: var(--vscode-descriptionForeground);
`;

// Footer removed as Refresh button moved to header
// const Footer = styled.div`...`;

const RefreshButton = styled.button<{ $refreshing: boolean }>`
  background: transparent;
  border: none;
  color: var(--vscode-descriptionForeground);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
  }

  ${props => props.$refreshing && css`
    opacity: 0.7;
    cursor: wait;
  `}
`;

export const News: React.FC<NewsProps> = ({ newsItems, onRefresh, onOpenUrl, userName = "Ola" }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setRefreshing(true);
      onRefresh();
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const sortedItems = useMemo(() => {
    return [...newsItems].sort((a, b) => {
      // Sort primarily by date
      const dateA = new Date(a.published_at || 0).getTime();
      const dateB = new Date(b.published_at || 0).getTime();
      return dateB - dateA;
    });
  }, [newsItems]);

  // Group items: First 3 as "Top News", others by Source
  const topNews = sortedItems.slice(0, 3);
  const otherNews = sortedItems.slice(3);

  const groupedOthers = useMemo(() => {
    const groups: Record<string, NewsItem[]> = {};
    otherNews.forEach(item => {
      if (!groups[item.source]) {
        groups[item.source] = [];
      }
      groups[item.source].push(item);
    });
    return groups;
  }, [otherNews]);

  // Calculate read time (approx 200 wpm)
  const totalWords = newsItems.reduce((acc, item) => {
    return acc + (item.summary?.split(/\s+/).length || 0) + (item.title.split(/\s+/).length || 0);
  }, 0);
  const readTimeMinutes = Math.floor(totalWords / 200);
  const readTimeSeconds = Math.floor(((totalWords % 200) / 200) * 60);

  const introContent = useMemo(() => {
    if (newsItems.length === 0) {
      return (
        <>
          <IntroText>
            Your daily briefing is ready. You can finally take a break from the AI firehose.
          </IntroText>
          <IntroText>
            Our algos are currently fetching the latest updates. Click refresh to get started.
          </IntroText>
        </>
      );
    }

    // Get unique sources
    const sources = Array.from(new Set(newsItems.map(i => i.source)));
    const displaySources = sources.slice(0, 3);
    const sourceText = displaySources.join(', ') + (sources.length > 3 ? ', and more' : '');

    // Get top 2 titles for highlights
    const topTitles = newsItems.slice(0, 2).map(i => i.title);

    return (
      <>
        <IntroText>
          Your daily briefing is ready. Today we've curated {newsItems.length} updates from <strong>{sourceText}</strong>.
        </IntroText>
        <IntroText>
          Highlights include {topTitles.map((t, i) => (
            <span key={i}>
              <strong>"{t}"</strong>{i < topTitles.length - 1 ? ' and ' : ''}
            </span>
          ))}.
        </IntroText>
        <IntroText>
          Here's the must-read:
        </IntroText>
      </>
    );
  }, [newsItems]);

  return (
    <Container>
      <HeaderSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <Greeting style={{ marginBottom: 0 }}>Hey {userName},</Greeting>
          <RefreshButton onClick={handleRefresh} $refreshing={refreshing} disabled={refreshing}>
            <span className={`codicon codicon-refresh ${refreshing ? 'codicon-modifier-spin' : ''}`}></span>
            {refreshing ? 'Updating...' : 'Refresh'}
          </RefreshButton>
        </div>
        {introContent}
      </HeaderSection>

      <SummaryCard>
        <SummaryHeader>
          <SummaryTitle>Summary</SummaryTitle>
          <ReadTime>Read time: {readTimeMinutes} min {readTimeSeconds} sec</ReadTime>
        </SummaryHeader>

        <Section>
          <SectionLabel>Top News</SectionLabel>
          <ItemList>
            {topNews.map(item => (
              <StyledNewsItem key={item.id || item.url}>
                <Bullet>▶</Bullet>
                <ItemContent>
                  <ItemSource>{item.source}:</ItemSource>
                  <ItemLink 
                    href={item.url}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenUrl(item.url);
                    }}
                  >
                     {item.title}
                  </ItemLink>
                  {item.summary && (
                    <ItemText> — {item.summary.substring(0, 120)}...</ItemText>
                  )}
                </ItemContent>
              </StyledNewsItem>
            ))}
          </ItemList>
        </Section>

        {Object.entries(groupedOthers).map(([source, items]) => (
          <Section key={source}>
            <SectionLabel>{source}</SectionLabel>
            <ItemList>
              {items.map(item => (
                <StyledNewsItem key={item.id || item.url}>
                  <Bullet>▶</Bullet>
                  <ItemContent>
                    <ItemLink onClick={() => onOpenUrl(item.url)}>
                      {item.title}
                    </ItemLink>
                  </ItemContent>
                </StyledNewsItem>
              ))}
            </ItemList>
          </Section>
        ))}

        {newsItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>
            No news items available. Try refreshing.
          </div>
        )}
      </SummaryCard>
    </Container>
  );
};
