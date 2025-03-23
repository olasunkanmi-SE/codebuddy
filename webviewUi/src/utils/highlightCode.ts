/* eslint-disable @typescript-eslint/no-explicit-any */

import { HLJSApi } from "highlight.js";

function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export const highlightCodeBlocks = (hljsApi: HLJSApi, messages: any) => {
  if (!hljsApi || messages?.length <= 0) return;
  document.querySelectorAll("pre code:not(.hljs-done)").forEach((block) => {
    let language = null;
    const languageClass = Array.from(block.classList).find((className) =>
      className.startsWith("language-"),
    );
    if (languageClass) {
      language = languageClass.substring("language-".length);
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

        block.parentNode?.insertBefore(copyButton, block);
      }
    } catch (error) {
      console.error("Highlighting failed:", error);
      block.classList.add("hljs-error");
    }
  });
};
