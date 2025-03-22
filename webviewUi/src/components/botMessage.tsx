/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";
import React from "react";
import { BotIcon } from "./botIcon";

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
          <span style={{ display: "flex", alignItems: "center" }}>
            <small>{action}</small> <BotIcon isBlinking={true} />
          </span>
        </div>
      ) : (
        <div className="code-block">
          <div className="code-header">
            <span className="language-label">{language}</span>
          </div>
          <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </div>
      )}
    </>
  );
};
