// import { useEffect, useState } from "react";
// import * as path from "path";
import { useState } from "react";
import { useWebviewMessages } from "../hooks/useWebviewMessages";
import hljs from "highlight.js";

const scrollButtonClickHandler = () => {
  const chatMessages = document.getElementById("chat-messages")!;

  chatMessages.scroll({
    top: chatMessages!.scrollHeight,
    left: 0,
    behavior: "smooth",
  });
};

const chatMessagesScrollHandler = () => {
  const chatMessages = document.getElementById("chat-messages")!;
  const scrollButton = document.getElementById("scroll-button")!;

  if (
    chatMessages.scrollHeight - chatMessages.scrollTop <=
    chatMessages.clientHeight + 10
  ) {
    scrollButton.style.display = "none";
  } else {
    scrollButton.style.display = "flex";
  }
};

function addCodeWrappers() {
  document.querySelectorAll("pre code").forEach((block) => {
    const preElement = block.parentElement!;
    const existingWrapper = preElement.closest(".code-wrapper");
    if (!existingWrapper) {
      // const codeText = block.textContent;
      const assistant = "";
      const wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";
      const header = document.createElement("div");
      header.className = "code-header";
      header.innerHTML = `<span class="code-language">${assistant}</span><button class="copy-code-button">Copy</button>`;
      preElement.parentNode!.insertBefore(wrapper, preElement);
      wrapper.appendChild(header);
      wrapper.appendChild(preElement);
      header
        .querySelector(".copy-code-button")!
        .addEventListener("click", () => {
          navigator.clipboard
            .writeText(block.textContent as string)
            .then(() => {
              header.querySelector(".copy-code-button")!.textContent =
                "Copied!";
              setTimeout(() => {
                header.querySelector(".copy-code-button")!.textContent = "Copy";
              }, 2000);
            });
        });
    }
  });
}

// function detectLanguage(code: string) {
//   const result = hljs.highlightAuto(code);
//   return result.language || "plaintext";
// }

// const knowledgeBaseDropDownOnChangeHandler = (event: React.ChangeEvent) => {
//   const selectedDoc = event.target.textContent;
//   if (selectedDoc) {
//     vscode.postMessage({
//       command: "knowledge-base",
//       doc: selectedDoc,
//     });
//   }
// }

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "bot-response") {
    addChatMessage("bot", message.message);
  } else if (message.type === "user-input") {
    addChatMessage("You", message.message);
  }

  //call code higlighter function here
  hljs.highlightAll();
});

function addChatMessage(sender: string, message: string) {
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("chat-message-container");

  const messageHeader = document.createElement("div");
  messageHeader.classList.add("chat-message-header");
  messageHeader.textContent = sender + ":";

  const messageBody = document.createElement("div");
  messageBody.classList.add("chat-message-body");
  messageBody.innerHTML = message;

  messageContainer.appendChild(messageHeader);
  messageContainer.appendChild(messageBody);

  const chatMessages = document.getElementById("chat-messages")!;

  chatMessages.appendChild(messageContainer);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  addCodeWrappers();
}

function sendChatMessage(message: string) {
  const vscode = acquireVsCodeApi();
  vscode.postMessage({ type: "user-input", message: message });
}

const chatInputKeydownHandler = (event: React.KeyboardEvent) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const chatInput = document.getElementById(
      "chat-input"
    )! as HTMLInputElement;

    const userInput = chatInput.value.trim();
    if (userInput) {
      addChatMessage("You", userInput);
      sendChatMessage(userInput);
      chatInput.value = "";
    }
  }
};

const ChatWindow = () => {
  // const [bodyFontFamily, setBodyFontFamily] = useState(selectedFontFamily);
  // const [chatMessagesFontSize, setChatMessagesFontSize] = useState(
  //   selectedChatMessagesFontSize
  // );
  // const [theme, setTheme] = useState(selectedTheme);

  // useEffect(() => {
  //   document.getElementById("chat-messages")!.style.fontSize =
  //     chatMessagesFontSize;
  //   document.body.style.fontFamily = bodyFontFamily;

  //   const currentBodyFontFamily = selectedFontFamily;
  //   const currentChatMessagesFontSize = selectedChatMessagesFontSize;
  //   const currentTheme = selectedTheme;

  //   if (currentBodyFontFamily != bodyFontFamily) {
  //     setBodyFontFamily(currentBodyFontFamily);
  //     document.getElementById("chat-messages")!.style.fontSize =
  //       chatMessagesFontSize;
  //   }

  //   if (currentChatMessagesFontSize != chatMessagesFontSize) {
  //     setChatMessagesFontSize(currentChatMessagesFontSize);
  //   }

  //   if (currentTheme != theme) {
  //     setTheme(currentTheme);
  //   }
  // }, [bodyFontFamily, chatMessagesFontSize, theme]);

  useWebviewMessages();
  const [count, setCount] = useState(0);

  const clickCountHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const newCount = count + 1;
    setCount(newCount);
  };

  return (
    <>
      {/* <style>${theme}</style> */}
      <div id="chat-container">
        <div id="chat-title">ChatBuddy (Ola)</div>
        <div
          id="chat-messages"
          onScroll={(e) => {
            e.preventDefault();
            chatMessagesScrollHandler();
          }}
        ></div>
        {/* <div id="knowledge-base-title" title="Select a knowledge base document">
          KnowledgeBase
        </div>
        <div id="knowledge-base">
          <select id="chat-options">
            $
            {docs.map(
              (doc) => `<option value="${doc}">${path.basename(doc)}</option>`
            )}
          </select>
        </div> */}
        <div id="chat-input-container">
          <input
            id="chat-input"
            type="text"
            placeholder="The text area is diabled. Type in vscode window or highlight code and right click"
            disabled
            onKeyDown={chatInputKeydownHandler}
          />
        </div>
        <button id="chat-send" disabled>
          Send
        </button>
        <button onClick={clickCountHandler}>Click Me!</button>
        <p>Count is now {count}</p>
        <div id="loading">
          <div className="loader"></div>
          <div className="loader"></div>
        </div>
        <button
          className="scroll-button"
          id="scroll-button"
          onClick={(e) => {
            e.preventDefault();
            scrollButtonClickHandler();
          }}
        >
          &#x2193;
        </button>
      </div>
    </>
  );
};

export default ChatWindow;
