import React, { useState } from "react";
import DOMPurify from "dompurify";
import styled, { keyframes } from "styled-components";

interface ThinkingComponentProps {
  content: string;
}

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(138, 43, 226, 0.3), 0 0 10px rgba(138, 43, 226, 0.2);
  }
  50% {
    box-shadow: 0 0 10px rgba(138, 43, 226, 0.5), 0 0 20px rgba(138, 43, 226, 0.3);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ThinkingContainer = styled.div`
  margin: 16px 0;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.05) 0%, rgba(75, 0, 130, 0.05) 100%);
  border: 1px solid rgba(138, 43, 226, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(138, 43, 226, 0.4);
    animation: ${glow} 2s ease-in-out infinite;
  }
`;

const ThinkingHeader = styled.button`
  width: 100%;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(75, 0, 130, 0.1) 100%);
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -200%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(138, 43, 226, 0.1) 50%,
      transparent 100%
    );
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 200%;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(75, 0, 130, 0.15) 100%);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ThinkingHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1;
`;

const ThinkingIcon = styled.span`
  font-size: 20px;
  animation: ${pulse} 2s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(138, 43, 226, 0.6));
`;

const ThinkingTitle = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: #a855f7;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #a855f7, #8b5cf6, #a855f7);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ThinkingHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
`;

const ThinkingStatus = styled.span`
  font-size: 11px;
  color: rgba(168, 85, 247, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  background: rgba(138, 43, 226, 0.15);
  border-radius: 12px;
  border: 1px solid rgba(138, 43, 226, 0.3);
`;

const ThinkingChevron = styled.span<{ $isExpanded: boolean }>`
  font-size: 12px;
  color: #a855f7;
  transition: transform 0.3s ease;
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ThinkingContent = styled.div`
  animation: ${slideDown} 0.3s ease-out;
  border-top: 1px solid rgba(138, 43, 226, 0.2);
  background: rgba(20, 20, 30, 0.3);
`;

const ThinkingContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid rgba(138, 43, 226, 0.15);
`;

const ThinkingExpandText = styled.div`
  font-size: 12px;
  color: rgba(168, 85, 247, 0.8);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '⚡';
    font-size: 14px;
    animation: ${pulse} 1.5s ease-in-out infinite;
  }
`;

const ThinkingCopyButton = styled.button<{ $copied: boolean }>`
  padding: 6px 14px;
  background: ${props => props.$copied 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(75, 0, 130, 0.2) 100%)'
  };
  color: ${props => props.$copied ? '#fff' : '#a855f7'};
  border: 1px solid ${props => props.$copied 
    ? 'rgba(16, 185, 129, 0.5)'
    : 'rgba(138, 43, 226, 0.3)'
  };
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }

  &:hover::before {
    width: 200px;
    height: 200px;
  }

  &:hover {
    background: ${props => props.$copied 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'linear-gradient(135deg, rgba(138, 43, 226, 0.3) 0%, rgba(75, 0, 130, 0.3) 100%)'
    };
    border-color: ${props => props.$copied 
      ? 'rgba(16, 185, 129, 0.7)'
      : 'rgba(138, 43, 226, 0.5)'
    };
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.$copied 
      ? 'rgba(16, 185, 129, 0.3)'
      : 'rgba(138, 43, 226, 0.3)'
    };
  }

  &:active {
    transform: translateY(0);
  }

  span {
    position: relative;
    z-index: 1;
  }
`;

const ThinkingText = styled.div`
  padding: 18px;
  color: rgba(200, 200, 220, 0.9);
  font-size: 13px;
  line-height: 1.7;
  font-family: 'Segoe UI', system-ui, sans-serif;
  text-align: left;
  
  /* Styling for code blocks within thinking */
  code {
    background: rgba(138, 43, 226, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid rgba(138, 43, 226, 0.2);
  }

  /* Styling for paragraphs */
  p {
    margin: 8px 0;
  }

  /* Styling for lists */
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }

  /* Add a subtle gradient overlay at the bottom */
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: linear-gradient(to bottom, transparent, rgba(20, 20, 30, 0.3));
    pointer-events: none;
  }
`;

export const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>("");

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

  const { thinkingContent, regularContent, hasThinking } = parseContent(content);

  const sanitizedThinkingContent = DOMPurify.sanitize(thinkingContent);
  const sanitizedRegularContent = DOMPurify.sanitize(regularContent);

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

  if (!hasThinking) {
    return <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedRegularContent }} />;
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
            <ThinkingIcon>💭</ThinkingIcon>
            <ThinkingTitle>Thoughts</ThinkingTitle>
          </ThinkingHeaderLeft>
          <ThinkingHeaderRight>
            <ThinkingStatus>{isExpanded ? 'Visible' : 'Hidden'}</ThinkingStatus>
            <ThinkingChevron $isExpanded={isExpanded}>▼</ThinkingChevron>
          </ThinkingHeaderRight>
        </ThinkingHeader>

        {isExpanded && (
          <ThinkingContent id="thinking-content">
            <ThinkingContentHeader>
              <ThinkingExpandText>Model reasoning process</ThinkingExpandText>
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

      {regularContent && <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedRegularContent }} />}
    </>
  );
};