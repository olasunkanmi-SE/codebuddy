import DOMPurify from "dompurify";
import React from "react";

interface CodeBlockProps {
  language?: string;
  content: string;
  isLoading?: boolean;
}

export const BotMessage: React.FC<CodeBlockProps> = ({ language, content }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="language-label">{language}</span>
        <button className="copy-button" onClick={handleCopy}>
          <span className="copy-icon">⎘</span> Copy
        </button>
      </div>
      <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </div>
  );
};
