import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

interface Source {
  title: string;
  url?: string;
  snippet?: string;
  relevance?: number;
}

interface SearchResultCardProps {
  query: string;
  answer?: string;
  sources: Source[];
  isLoading?: boolean;
  timestamp?: number;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const CardContainer = styled.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  animation: ${fadeIn} 0.3s ease-out;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const SearchIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6px;
  height: 6px;
  background: var(--vscode-button-background);
  border-radius: 50%;
`;

const QueryText = styled.span`
  color: var(--vscode-foreground);
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
`;

const AnswerSection = styled.div`
  background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.1));
  border-left: 3px solid var(--vscode-button-background);
  padding: 12px 14px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground);
`;

const SourcesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SourcesTitle = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SourceCount = styled.span`
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  background: var(--vscode-badge-background);
  padding: 2px 8px;
  border-radius: 10px;
`;

const SourcesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SourceItem = styled.a`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.08));
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover {
    background: var(--vscode-list-activeSelectionBackground, rgba(128, 128, 128, 0.15));
    transform: translateX(2px);
  }
`;

const SourceTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-textLink-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SourceUrl = styled.span`
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SourceSnippet = styled.span`
  font-size: 12px;
  color: var(--vscode-foreground);
  opacity: 0.8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RelevanceBadge = styled.span<{ $relevance: number }>`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(props) =>
    props.$relevance >= 70
      ? "var(--vscode-testing-iconPassed, #4caf50)"
      : props.$relevance >= 40
        ? "var(--vscode-editorWarning-foreground, #ff9800)"
        : "var(--vscode-descriptionForeground)"};
  color: white;
  margin-left: auto;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: var(--vscode-textLink-foreground);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--vscode-list-hoverBackground);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const LoadingSkeleton = styled.div`
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--vscode-editor-background) 0px,
    var(--vscode-list-hoverBackground) 40px,
    var(--vscode-editor-background) 80px
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;

  &:last-child {
    width: 60%;
  }
`;

const ExternalLinkIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  query,
  answer,
  sources,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayedSources = expanded ? sources : sources.slice(0, 3);

  const handleSourceClick = (url?: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const truncateUrl = (url: string, maxLength: number = 50): string => {
    try {
      const parsedUrl = new URL(url);
      const displayUrl = parsedUrl.hostname + parsedUrl.pathname;
      return displayUrl.length > maxLength
        ? displayUrl.slice(0, maxLength) + "..."
        : displayUrl;
    } catch {
      return url.slice(0, maxLength);
    }
  };

  if (isLoading) {
    return (
      <CardContainer>
        <CardHeader>
          <SearchIcon />
          <QueryText>Searching...</QueryText>
        </CardHeader>
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </CardContainer>
    );
  }

  return (
    <CardContainer>
      <CardHeader>
        <SearchIcon />
        <QueryText>{query}</QueryText>
      </CardHeader>

      {answer && <AnswerSection>{answer}</AnswerSection>}

      {sources.length > 0 && (
        <>
          <SourcesHeader>
            <SourcesTitle>Sources</SourcesTitle>
            <SourceCount>{sources.length} found</SourceCount>
          </SourcesHeader>

          <SourcesList>
            {displayedSources.map((source, index) => (
              <SourceItem
                key={index}
                onClick={() => handleSourceClick(source.url)}
                as={source.url ? "a" : "div"}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SourceTitle>
                  {source.title || "Untitled Source"}
                  {source.url && <ExternalLinkIcon />}
                  {source.relevance !== undefined && (
                    <RelevanceBadge $relevance={source.relevance}>
                      {source.relevance}%
                    </RelevanceBadge>
                  )}
                </SourceTitle>
                {source.url && <SourceUrl>{truncateUrl(source.url)}</SourceUrl>}
                {source.snippet && <SourceSnippet>{source.snippet}</SourceSnippet>}
              </SourceItem>
            ))}
          </SourcesList>

          {sources.length > 3 && (
            <ExpandButton onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : `Show ${sources.length - 3} more`}
            </ExpandButton>
          )}
        </>
      )}

      {sources.length === 0 && !answer && (
        <AnswerSection>No relevant results found for this query.</AnswerSection>
      )}
    </CardContainer>
  );
};

export default SearchResultCard;
