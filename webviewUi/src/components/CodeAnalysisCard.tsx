import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

interface FileInfo {
  path: string;
  lineCount?: number;
  highlights?: string[];
}

interface CodeAnalysisCardProps {
  title: string;
  summary: string;
  files: FileInfo[];
  keyPoints?: string[];
  isLoading?: boolean;
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

const CodeIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6px;
  height: 6px;
  background: var(--vscode-symbolIcon-functionForeground, #b180d7);
  border-radius: 50%;
`;

const Title = styled.span`
  color: var(--vscode-foreground);
  font-size: 13px;
  font-weight: 500;
`;

const SummarySection = styled.div`
  background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.1));
  border-left: 3px solid var(--vscode-symbolIcon-functionForeground, #b180d7);
  padding: 12px 14px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground);
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.08));
  border-radius: 6px;
  font-size: 12px;
`;

const FileIcon = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--vscode-symbolIcon-fileForeground, #7c7c7c);
`;

const FileName = styled.span`
  color: var(--vscode-foreground);
  font-family: var(--vscode-editor-font-family, monospace);
  flex: 1;
`;

const LineCount = styled.span`
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
`;

const KeyPointsList = styled.ul`
  margin: 0;
  padding-left: 20px;
  list-style-type: none;
`;

const KeyPointItem = styled.li`
  position: relative;
  padding: 4px 0;
  font-size: 12px;
  color: var(--vscode-foreground);
  line-height: 1.4;

  &::before {
    content: "•";
    position: absolute;
    left: -16px;
    color: var(--vscode-symbolIcon-functionForeground, #b180d7);
    font-weight: bold;
  }
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

const CodeAnalysisCard: React.FC<CodeAnalysisCardProps> = ({
  title,
  summary,
  files,
  keyPoints,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayedFiles = expanded ? files : files.slice(0, 3);

  const getFileName = (path: string): string => {
    return path.split("/").pop() || path;
  };

  if (isLoading) {
    return (
      <CardContainer>
        <CardHeader>
          <CodeIcon />
          <Title>Analyzing...</Title>
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
        <CodeIcon />
        <Title>{title}</Title>
      </CardHeader>

      {summary && <SummarySection>{summary}</SummarySection>}

      {files.length > 0 && (
        <>
          <SectionTitle>Files Analyzed</SectionTitle>
          <FilesList>
            {displayedFiles.map((file, index) => (
              <FileItem key={index}>
                <FileIcon />
                <FileName>{getFileName(file.path)}</FileName>
                {file.lineCount && <LineCount>{file.lineCount} lines</LineCount>}
              </FileItem>
            ))}
          </FilesList>

          {files.length > 3 && (
            <ExpandButton onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : `Show ${files.length - 3} more files`}
            </ExpandButton>
          )}
        </>
      )}

      {keyPoints && keyPoints.length > 0 && (
        <>
          <SectionTitle>Key Findings</SectionTitle>
          <KeyPointsList>
            {keyPoints.slice(0, 5).map((point, index) => (
              <KeyPointItem key={index}>{point}</KeyPointItem>
            ))}
          </KeyPointsList>
        </>
      )}
    </CardContainer>
  );
};

export default CodeAnalysisCard;
