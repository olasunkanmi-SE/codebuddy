/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";
import React from "react";
import { BotIcon } from "./botIcon";
import { DownloadIcon } from "./downloadIcon";
import { downloadAsMarkdown } from "../utils/downloadMarkdown";
import { IParseURL, parseUrl } from "../utils/parseUrl";
import UrlCardList from "./urlCardList";

interface CodeBlockProps {
  language?: string;
  content: string;
}

export const BotMessage: React.FC<CodeBlockProps> = ({ language, content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  const action = "Researching...";
  let parsedUrls: IParseURL[] = [];
  if (sanitizedContent.includes("favicon")) {
    parsedUrls = parseUrl(sanitizedContent);
  }

  const handleDownload = () => {
    console.log("Download button clicked");
    console.log("Content length:", sanitizedContent.length);
    console.log("Content preview:", sanitizedContent.substring(0, 100));

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `codebuddy-response-${timestamp}`;
    console.log("Filename:", filename);

    downloadAsMarkdown(sanitizedContent, filename);
  };

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
            <div className="header-buttons">
              <DownloadIcon onClick={handleDownload} />
            </div>
          </div>
          {parsedUrls.length > 0 ? (
            <div className="doc-content">
              <UrlCardList metadatas={parsedUrls} />
            </div>
          ) : (
            <div className="doc-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          )}
        </div>
      )}
    </>
  );
};
