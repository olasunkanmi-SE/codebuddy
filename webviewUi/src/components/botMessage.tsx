/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";
import React from "react";
import { BotIcon } from "./botIcon";
import { DownloadIcon } from "./downloadIcon";
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

  const handleCopyMarkdown = async () => {
    try {
      // Use the original content directly since it's already in markdown format
      const markdownContent = content || sanitizedContent;

      // If content is HTML, we need to convert it back to markdown
      // But if it's already markdown, use it as-is
      let contentToCopy = markdownContent;

      // Check if the content contains HTML tags (indicating it's been processed)
      if (markdownContent.includes("<") && markdownContent.includes(">")) {
        // Create a temporary div to extract text content while preserving line breaks
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = markdownContent;

        // Get the text content and preserve markdown-like structure
        contentToCopy = tempDiv.textContent || tempDiv.innerText || "";

        // Clean up the text to maintain markdown formatting
        contentToCopy = contentToCopy
          .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
          .replace(/(^\s+)|(\s+$)/g, "") // Trim whitespace
          .trim();
      } else {
        // Content is already in markdown format, use it directly
        contentToCopy = markdownContent.trim();
      }

      await navigator.clipboard.writeText(contentToCopy);
      console.log("Markdown content copied to clipboard successfully");
    } catch (error) {
      console.error("Failed to copy markdown to clipboard:", error);

      // Fallback method
      try {
        const markdownContent = content || sanitizedContent;
        let contentToCopy = markdownContent;

        if (markdownContent.includes("<") && markdownContent.includes(">")) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = markdownContent;
          contentToCopy = tempDiv.textContent || tempDiv.innerText || "";
          contentToCopy = contentToCopy
            .replace(/\n\s*\n\s*\n/g, "\n\n")
            .replace(/(^\s+)|(\s+$)/g, "")
            .trim();
        } else {
          contentToCopy = markdownContent.trim();
        }

        // Create a temporary textarea for fallback copy
        const textarea = document.createElement("textarea");
        textarea.value = contentToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        // Use the modern approach with fallback
        try {
          document.execCommand("copy");
        } catch (execError) {
          console.error("execCommand failed:", execError);
        }

        document.body.removeChild(textarea);

        console.log("Markdown content copied to clipboard using fallback method");
      } catch (fallbackError) {
        console.error("Both clipboard methods failed:", fallbackError);
      }
    }
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
              <DownloadIcon onClick={handleCopyMarkdown} />
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
