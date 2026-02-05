import React, { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import styled from "styled-components";
import { marked } from "marked";
import { MermaidDiagram } from "./MermaidDiagram";

interface ThinkingComponentProps {
  content: string;
}

const ThinkingContainer = styled.div`
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const ThinkingHeader = styled.button`
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const ThinkingHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ThinkingIcon = styled.span`
  font-size: 14px;
  opacity: 0.7;
`;

const ThinkingTitle = styled.span`
  font-weight: 500;
  font-size: 13px;
  color: var(--vscode-foreground);
  opacity: 0.8;
`;

const ThinkingHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ThinkingChevron = styled.span<{ $isExpanded: boolean }>`
  font-size: 10px;
  color: var(--vscode-foreground);
  opacity: 0.5;
  transition: transform 0.2s ease;
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ThinkingContent = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.1);
`;

const ThinkingContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const ThinkingExpandText = styled.div`
  font-size: 11px;
  color: var(--vscode-foreground);
  opacity: 0.6;
  font-weight: 500;
`;

const ThinkingCopyButton = styled.button<{ $copied: boolean }>`
  padding: 4px 8px;
  background: transparent;
  color: var(--vscode-foreground);
  opacity: 0.6;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ThinkingText = styled.div`
  padding: 14px;
  color: var(--vscode-foreground);
  opacity: 0.8;
  font-size: 12px;
  line-height: 1.6;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Courier New', monospace;
  white-space: pre-wrap;
  
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

export const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>("");

  // Parse content to extract thinking blocks
  const parseContent = (rawContent: string) => {
    let decodedContent = rawContent;
    if (rawContent.includes("&lt;think&gt;")) {
      decodedContent = rawContent.replace(/&lt;think&gt;/g, "<think>").replace(/&lt;\/think&gt;/g, "</think>");
    }

    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const matches = [...decodedContent.matchAll(thinkRegex)];

    let thinkingContent = "";
    let regularContent = decodedContent;

    if (matches.length > 0) {
      thinkingContent = matches.map((match) => match[1]).join("\n\n");
      regularContent = decodedContent.replace(thinkRegex, "").trim();
    }

    return {
      thinkingContent: thinkingContent.trim(),
      regularContent: regularContent.trim(),
      hasThinking: thinkingContent.length > 0,
    };
  };

  // Parse content to extract and render Mermaid diagrams
  const parseMermaidContent = useMemo(() => {
    return (htmlContent: string): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      
      // Check for new-style mermaid containers (base64 encoded, from formatText)
      const hasNewStyleMermaid = htmlContent.includes('mermaid-container') && htmlContent.includes('data-mermaid');
      
      // Check for old-style mermaid code blocks (for backwards compatibility)
      const hasOldStyleMermaid = 
        htmlContent.includes('language-mermaid') || 
        htmlContent.includes('```mermaid');
      
      if (!hasNewStyleMermaid && !hasOldStyleMermaid) {
        // No mermaid content, return as regular HTML
        return [<div key="content" className="doc-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />];
      }
      
      // Pattern for new-style mermaid containers with base64-encoded data
      // More flexible patterns to handle attribute order variations
      const newStylePatterns = [
        /<div[^>]*class="mermaid-container"[^>]*data-mermaid="([^"]+)"[^>]*>(?:<\/div>)?/gi,
        /<div[^>]*data-mermaid="([^"]+)"[^>]*class="mermaid-container"[^>]*>(?:<\/div>)?/gi,
      ];
      
      // Pattern for old-style code blocks (fallback)
      const oldStylePatterns = [
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi,
        /```mermaid\n?([\s\S]*?)```/gi,
      ];
      
      let lastIndex = 0;
      
      interface MermaidMatch {
        fullMatch: string;
        code: string;
        startIndex: number;
        endIndex: number;
        isBase64: boolean;
      }
      
      const mermaidMatches: MermaidMatch[] = [];
      
      // First, find new-style (base64) mermaid blocks
      let match;
      for (const newStylePattern of newStylePatterns) {
        newStylePattern.lastIndex = 0;
        while ((match = newStylePattern.exec(htmlContent)) !== null) {
          try {
            // Decode base64 to get the original mermaid code
            const decodedCode = atob(match[1]);
            mermaidMatches.push({
              fullMatch: match[0],
              code: decodedCode,
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              isBase64: true,
            });
          } catch (e) {
            console.error('Failed to decode mermaid base64:', e);
          }
        }
      }
      
      // If no new-style matches, try old-style patterns
      if (mermaidMatches.length === 0) {
        for (const pattern of oldStylePatterns) {
          pattern.lastIndex = 0;
          while ((match = pattern.exec(htmlContent)) !== null) {
            let mermaidCode = match[1];
            
            // Decode HTML entities
            mermaidCode = mermaidCode
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, ' ')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .trim();
            
            mermaidMatches.push({
              fullMatch: match[0],
              code: mermaidCode,
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              isBase64: false,
            });
          }
        }
      }
      
      if (mermaidMatches.length === 0) {
        // No mermaid matches found, return as regular HTML
        return [<div key="content" className="doc-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />];
      }
      
      // Sort matches by start index
      mermaidMatches.sort((a, b) => a.startIndex - b.startIndex);
      
      // Remove overlapping matches (keep the first one)
      const uniqueMatches: MermaidMatch[] = [];
      for (const m of mermaidMatches) {
        const overlaps = uniqueMatches.some(
          (existing) => m.startIndex < existing.endIndex && m.endIndex > existing.startIndex
        );
        if (!overlaps) {
          uniqueMatches.push(m);
        }
      }
      
      if (uniqueMatches.length === 0) {
        // No mermaid content, return as regular HTML
        return [<div key="content" className="doc-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />];
      }
      
      // Process content with mermaid diagrams
      for (const match of uniqueMatches) {
        // Add content before this mermaid block
        if (match.startIndex > lastIndex) {
          const beforeContent = htmlContent.substring(lastIndex, match.startIndex);
          if (beforeContent.trim()) {
            elements.push(
              <div 
                key={`content-${lastIndex}`} 
                className="doc-content" 
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(beforeContent) }} 
              />
            );
          }
        }
        
        // Add the mermaid diagram
        elements.push(
          <MermaidDiagram 
            key={`mermaid-${match.startIndex}`} 
            chart={match.code} 
          />
        );
        
        lastIndex = match.endIndex;
      }
      
      // Add any remaining content after the last mermaid block
      if (lastIndex < htmlContent.length) {
        const afterContent = htmlContent.substring(lastIndex);
        if (afterContent.trim()) {
          elements.push(
            <div 
              key={`content-${lastIndex}`} 
              className="doc-content" 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(afterContent) }} 
            />
          );
        }
      }
      
      return elements;
    };
  }, []);

  const { thinkingContent, regularContent, hasThinking } = parseContent(content);

  const sanitizedThinkingContent = DOMPurify.sanitize(thinkingContent);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const copyThinkingContent = async () => {
    try {
      await navigator.clipboard.writeText(thinkingContent);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (error) {
      console.error("Failed to copy thinking content:", error);
      setCopyStatus("Failed");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  // Render regular content with Mermaid support
  const renderedRegularContent = useMemo(() => {
    // Parse markdown to HTML before processing Mermaid diagrams
    // marked.parse is synchronous by default
    const htmlContent = marked.parse(regularContent) as string;
    return parseMermaidContent(htmlContent);
  }, [regularContent, parseMermaidContent]);

  if (!hasThinking) {
    return <>{renderedRegularContent}</>;
  }

  return (
    <>
      <ThinkingContainer>
        <ThinkingHeader
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="thinking-content"
        >
          <ThinkingHeaderLeft>
            <ThinkingIcon>🧠</ThinkingIcon>
            <ThinkingTitle>Thought Process</ThinkingTitle>
          </ThinkingHeaderLeft>
          <ThinkingHeaderRight>
            <ThinkingChevron $isExpanded={isExpanded}>▼</ThinkingChevron>
          </ThinkingHeaderRight>
        </ThinkingHeader>

        {isExpanded && (
          <ThinkingContent id="thinking-content">
            <ThinkingContentHeader>
              <ThinkingExpandText>Reasoning trace</ThinkingExpandText>
              <ThinkingCopyButton 
                onClick={copyThinkingContent} 
                title="Copy thinking content"
                $copied={copyStatus === "Copied!"}
              >
                <span>{copyStatus || "Copy"}</span>
              </ThinkingCopyButton>
            </ThinkingContentHeader>
            <ThinkingText dangerouslySetInnerHTML={{ __html: sanitizedThinkingContent }} />
          </ThinkingContent>
        )}
      </ThinkingContainer>

      {regularContent && renderedRegularContent}
    </>
  );
};
