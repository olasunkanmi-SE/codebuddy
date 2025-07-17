import React, { useState } from "react";
import DOMPurify from "dompurify";

interface ThinkingComponentProps {
  content: string;
}

export const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>("");

  // Parse the content to extract thinking and regular content
  const parseContent = (rawContent: string) => {
    // First decode HTML entities if they exist
    let decodedContent = rawContent;
    if (rawContent.includes("&lt;think&gt;")) {
      decodedContent = rawContent.replace(/&lt;think&gt;/g, "<think>").replace(/&lt;\/think&gt;/g, "</think>");
    }

    // Look for <think>...</think> tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const matches = [...decodedContent.matchAll(thinkRegex)];

    let thinkingContent = "";
    let regularContent = decodedContent;

    if (matches.length > 0) {
      // Extract all thinking content
      thinkingContent = matches.map((match) => match[1]).join("\n\n");

      // Remove thinking tags and content from regular content
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
      setCopyStatus("Error");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  if (!hasThinking) {
    // If no thinking content, just return the regular content
    return <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedRegularContent }} />;
  }

  return (
    <>
      {/* Thinking section */}
      <div className="thinking-container">
        <button
          className="thinking-header"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="thinking-content"
        >
          <div className="thinking-header-left">
            <span className="thinking-icon">💭</span>
            <span className="thinking-title">Thinking</span>
          </div>
          <div className="thinking-header-right">
            <span className="thinking-status">Hidden</span>
            <span className={`thinking-chevron ${isExpanded ? "expanded" : ""}`}>▼</span>
          </div>
        </button>

        {isExpanded && (
          <div className="thinking-content" id="thinking-content">
            <div className="thinking-content-header">
              <div className="thinking-expand-text">Model reasoning process</div>
              <button className="thinking-copy-button" onClick={copyThinkingContent} title="Copy thinking content">
                {copyStatus || "Copy"}
              </button>
            </div>
            <div className="thinking-text" dangerouslySetInnerHTML={{ __html: sanitizedThinkingContent }} />
          </div>
        )}
      </div>

      {/* Regular content */}
      {regularContent && <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedRegularContent }} />}
    </>
  );
};
