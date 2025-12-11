/* eslint-disable @typescript-eslint/no-explicit-any */

import { HLJSApi } from "highlight.js";

function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export const highlightCodeBlocks = (hljsApi: HLJSApi, messages: any) => {
  if (!hljsApi || messages?.length <= 0) return;
  document
    .querySelectorAll("pre code:not(.hljs-done):not(.mermaid-processed)")
    .forEach((block) => {
      let language = null;
      const languageClass = Array.from(block.classList).find((className) =>
        className.startsWith("language-"),
      );
      if (languageClass) {
        language = languageClass.substring("language-".length);
      }

      // Skip mermaid code blocks - they will be handled by the MermaidDiagram component
      if (language === "mermaid") {
        block.classList.add("mermaid-processed");
        return;
      }

      try {
        const decodedCode = decodeHtml(block.textContent ?? "");
        const detectedLanguage =
          language ?? hljsApi.highlightAuto(decodedCode).language;
        if (detectedLanguage != undefined) {
          const highlightedCode = hljsApi.highlight(decodedCode, {
            language: detectedLanguage,
          }).value;
          block.setHTMLUnsafe(highlightedCode);
          block.classList.add("hljs-done");

          const copyButton = document.createElement("button");
          copyButton.innerHTML = "Copy";
          copyButton.classList.add("copy-button");
          copyButton.setAttribute("aria-label", "Copy code to clipboard");

          copyButton.addEventListener("click", () => {
            try {
              navigator.clipboard.writeText(block.textContent ?? "");
              copyButton.textContent = "Copied!";
              setTimeout(() => {
                copyButton.textContent = "Copy";
              }, 2000);
            } catch (err) {
              console.error("Failed to copy text: ", err);
              copyButton.textContent = "Error";
            }
          });

          // Create a wrapper for the code block with its own copy button
          const preElement = block.closest("pre");
          if (preElement && !preElement.querySelector(".code-block-wrapper")) {
            // Create a wrapper div for this specific code block
            const wrapper = document.createElement("div");
            wrapper.classList.add("code-block-wrapper");
            wrapper.style.position = "relative";
            wrapper.style.marginBottom = "1rem";

            // Create a header for this code block
            const codeHeader = document.createElement("div");
            codeHeader.classList.add("individual-code-header");
            codeHeader.style.display = "flex";
            codeHeader.style.justifyContent = "space-between";
            codeHeader.style.alignItems = "center";
            codeHeader.style.padding = "0.5rem 1rem";
            codeHeader.style.backgroundColor =
              "var(--vscode-editor-background)";
            codeHeader.style.borderBottom =
              "1px solid var(--vscode-panel-border)";
            codeHeader.style.fontSize = "0.875rem";

            // Add language label
            const languageLabel = document.createElement("span");
            languageLabel.textContent = detectedLanguage || "code";
            languageLabel.style.color = "var(--vscode-editor-foreground)";
            languageLabel.style.opacity = "0.8";

            // Add copy button to the header
            copyButton.style.position = "static";
            copyButton.style.margin = "0";

            codeHeader.appendChild(languageLabel);
            codeHeader.appendChild(copyButton);

            // Wrap the pre element
            preElement.parentNode?.insertBefore(wrapper, preElement);
            wrapper.appendChild(codeHeader);
            wrapper.appendChild(preElement);
          }
        }
      } catch (error) {
        console.error("Highlighting failed:", error);
        block.classList.add("hljs-error");
      }
    });
};
