/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";
import React from "react";

interface CodeBlockProps {
  language?: string;
  content: string;
  isLoading?: boolean;
}

export const BotMessage: React.FC<CodeBlockProps> = ({ language, content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  const action = "Researching...";
  return (
    <>
      {content.includes("thinking") ? (
        <div className="doc-content">
          <p>{action}</p>
        </div>
      ) : (
        <div className="code-block">
          <div className="code-header">
            <span className="language-label">{language}</span>
          </div>
          <div
            className="doc-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      )}
    </>
  );
};
