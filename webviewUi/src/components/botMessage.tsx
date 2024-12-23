import hljs from "highlight.js";
// import "highlight.js/styles/tokyo-night-dark.min.css";
import React, { useEffect, useRef } from "react";

interface CodeBlockProps {
  language?: string;
  content: string;
}

export const BotMessage: React.FC<CodeBlockProps> = ({ language, content }) => {
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightBlock(codeRef.current);
    }
  }, [content, language]);

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="language-label">{language}</span>
        <button className="copy-button" onClick={handleCopy}>
          <span className="copy-icon">⎘</span> Copy
        </button>
      </div>
      <pre ref={codeRef} className="code-content">
        <code
          className="language-typescript"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </pre>
    </div>
  );
};
