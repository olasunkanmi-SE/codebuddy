/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";
import React from "react";
import { DownloadIcon } from "./downloadIcon";
import { IParseURL, parseUrl } from "../utils/parseUrl";
import UrlCardList from "./urlCardList";
import { ThinkingComponent } from "./thinkingComponent";

const SpeakIcon = ({ onClick, speaking }: { onClick: () => void, speaking: boolean }) => (
  <svg
    onClick={onClick}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ cursor: "pointer", marginLeft: "8px", color: speaking ? "var(--vscode-textLink-activeForeground)" : "inherit" }}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

interface BotMessageProps {
  content: string;
  language?: string;
  isStreaming?: boolean;
}

export const BotMessage: React.FC<BotMessageProps> = ({ 
  content, 
}) => {
  const [speaking, setSpeaking] = React.useState(false);
  const sanitizedContent = DOMPurify.sanitize(content);
  // const action = "Researching...";
  let parsedUrls: IParseURL[] = [];
  
  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Clean content for speech (remove thinking tags and html)
    const textToSpeak = content
      .replace(/<think>[\s\S]*?<\/think>/gi, "") // Remove think blocks
      .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi, "")
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/```[\s\S]*?```/g, "Code block skipped.") // Skip code blocks for brevity? Or read them.
      .trim();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  if (sanitizedContent.includes("favicon")) {
    parsedUrls = parseUrl(sanitizedContent);
  }

  const handleCopyMarkdown = async () => {
    try {
      // Use the original content directly since it's already in markdown format
      let markdownContent = content;

      // Remove thinking tags from the content when copying
      // Handle both regular and HTML-encoded tags
      markdownContent = markdownContent
        .replace(/<think>([\s\S]*?)<\/think>/gi, "")
        .replace(/&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/gi, "");

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
        let markdownContent = content;

        // Remove thinking tags from the content when copying
        // Handle both regular and HTML-encoded tags
        markdownContent = markdownContent
          .replace(/<think>([\s\S]*?)<\/think>/gi, "")
          .replace(/&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/gi, "");

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

  // Show streaming indicator
  // if (isStreaming && !content) {
  //   return (
  //     <div className="doc-content">
  //       <span style={{ display: "flex", alignItems: "center" }}>
  //         <small>Generating response...</small> <BotIcon isBlinking={true} />
  //       </span>
  //     </div>
  //   );
  // }
  
  // Show normal message with streaming cursor if applicable
  return (
    <div className="bot-message">
      <div className="bot-message-actions">
        <div className="action-buttons">
          <DownloadIcon onClick={handleCopyMarkdown} />
          <SpeakIcon onClick={handleSpeak} speaking={speaking} />
        </div>
      </div>
      
      {parsedUrls.length > 0 ? (
        <div className="doc-content">
          <UrlCardList metadatas={parsedUrls} />
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <ThinkingComponent content={content} />
        </div>
      )}
    </div>
  );
};