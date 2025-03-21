/* eslint-disable @typescript-eslint/no-explicit-any */

import { HLJSApi } from "highlight.js";

export interface Message {
  type: "user" | "bot";
  content: string;
  language?: string;
  alias?: string;
}

export const highlightCodeBlocks = (hljsApi: HLJSApi, messages: any) => {
  if (!hljsApi || messages?.length <= 0) return;

  document.querySelectorAll("pre code").forEach((block) => {
    const detected = hljsApi.highlightAuto(block.textContent ?? "").language;
    if (detected != undefined) {
      block.setHTMLUnsafe(hljsApi.highlight(block.getHTML(), { language: detected }).value);

      const copyButton = document.createElement("button");
      copyButton.innerHTML = "Copy";
      copyButton.classList.add("copy-button");

      copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(block.textContent ?? "");
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 2000);
      });

      block.parentNode?.insertBefore(copyButton, block);
    }
  });
};
