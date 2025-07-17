/**
 * Converts HTML content to markdown format
 * @param htmlContent - The HTML content to convert
 * @returns Markdown formatted string
 */
export function htmlToMarkdown(htmlContent: string): string {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  let markdown = "";

  // Process each node
  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      const textContent = element.textContent || "";

      switch (tagName) {
        case "h1":
          return `# ${textContent}\n\n`;
        case "h2":
          return `## ${textContent}\n\n`;
        case "h3":
          return `### ${textContent}\n\n`;
        case "h4":
          return `#### ${textContent}\n\n`;
        case "h5":
          return `##### ${textContent}\n\n`;
        case "h6":
          return `###### ${textContent}\n\n`;
        case "p":
          return `${Array.from(element.childNodes).map(processNode).join("")}\n\n`;
        case "br":
          return "\n";
        case "strong":
        case "b":
          return `**${textContent}**`;
        case "em":
        case "i":
          return `*${textContent}*`;
        case "code":
          // Check if it's inline code or code block
          if (element.parentElement?.tagName.toLowerCase() === "pre") {
            const language = element.className.replace("language-", "") || "";
            return `\`\`\`${language}\n${textContent}\n\`\`\`\n\n`;
          }
          return `\`${textContent}\``;
        case "pre": {
          // Handle pre blocks
          const codeElement = element.querySelector("code");
          if (codeElement) {
            const language =
              codeElement.className.replace("language-", "") || "";
            return `\`\`\`${language}\n${codeElement.textContent || ""}\n\`\`\`\n\n`;
          }
          return `\`\`\`\n${textContent}\n\`\`\`\n\n`;
        }
        case "ul":
          return (
            Array.from(element.children)
              .map((li) => `- ${li.textContent}`)
              .join("\n") + "\n\n"
          );
        case "ol":
          return (
            Array.from(element.children)
              .map((li, index) => `${index + 1}. ${li.textContent}`)
              .join("\n") + "\n\n"
          );
        case "li":
          return textContent;
        case "a": {
          const href = element.getAttribute("href");
          return href ? `[${textContent}](${href})` : textContent;
        }
        case "blockquote":
          return `> ${textContent}\n\n`;
        case "hr":
          return "---\n\n";
        default:
          return Array.from(element.childNodes).map(processNode).join("");
      }
    }

    return "";
  }

  // Process all child nodes
  Array.from(tempDiv.childNodes).forEach((node) => {
    markdown += processNode(node);
  });

  return markdown.trim();
}

/**
 * Downloads content as a markdown file
 * @param content - The content to download (can be HTML or plain text)
 * @param filename - The filename for the download (without extension)
 */
export function downloadAsMarkdown(
  content: string,
  filename: string = "bot-response",
): void {
  try {
    console.log("Starting download with content length:", content.length);

    // Convert HTML to markdown if needed
    const markdownContent = content.includes("<")
      ? htmlToMarkdown(content)
      : content;
    console.log("Converted to markdown, length:", markdownContent.length);

    // Add a header with timestamp
    const timestamp = new Date().toLocaleString();
    const finalContent = `# CodeBuddy Response\n\n*Generated on: ${timestamp}*\n\n---\n\n${markdownContent}`;

    console.log("Final content prepared, length:", finalContent.length);

    // Try multiple download methods
    const success = tryDownloadMethods(finalContent, filename);

    if (!success) {
      console.warn("All download methods failed");
      // Final fallback: copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(finalContent)
          .then(() => {
            alert(
              "Download not supported in this environment, but content has been copied to clipboard! You can paste it into a .md file.",
            );
          })
          .catch(() => {
            alert(
              "Download failed and clipboard access denied. Please check browser console for content.",
            );
            console.log("Content for manual copying:", finalContent);
          });
      } else {
        alert("Download failed. Content is available in the browser console.");
        console.log("Content for manual copying:", finalContent);
      }
    }
  } catch (error) {
    console.error("Failed to download markdown:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    alert(`Failed to download file: ${errorMessage}`);
  }
}

/**
 * Try multiple download methods
 */
function tryDownloadMethods(content: string, filename: string): boolean {
  const methods = [
    () => downloadWithBlob(content, filename),
    () => downloadWithDataUri(content, filename),
    () => downloadWithWindow(content, filename),
  ];

  for (const method of methods) {
    try {
      method();
      console.log("Download method succeeded");
      return true;
    } catch (error) {
      console.log("Download method failed:", error);
      continue;
    }
  }

  return false;
}

/**
 * Download using Blob API
 */
function downloadWithBlob(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.md`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Download using Data URI
 */
function downloadWithDataUri(content: string, filename: string): void {
  const dataUri = `data:text/markdown;charset=utf-8,${encodeURIComponent(content)}`;
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = `${filename}.md`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Download using window.open
 */
function downloadWithWindow(content: string, filename: string): void {
  const dataUri = `data:text/markdown;charset=utf-8,${encodeURIComponent(content)}`;
  const newWindow = window.open(dataUri, "_blank");
  if (newWindow) {
    newWindow.document.title = `${filename}.md`;
  } else {
    throw new Error("Popup blocked");
  }
}
