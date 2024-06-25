export const chatJs = `
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSendButton = document.getElementById("chat-send");

const textArea = document.getElementById("chat-input-container");
textArea.setAttribute('disabled', 'true')

chatSendButton.disabled = true;

let chatVisible = false;

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

chatSendButton.addEventListener("click", () => {
  sendMessage();
});

scrollButton.addEventListener("click", () => {
  chatMessages.scroll({
    top: chatMessages.scrollHeight,
    left: 0,
    behavior: "smooth",
  });
});

chatMessages.addEventListener("scroll", () => {
  if (chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 10) {
    scrollButton.style.display = "none";
  } else {
    scrollButton.style.display = "flex";
  }
});

function addChatMessage(sender, message, isBot) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", isBot ? "bot" : "sender");

  let messageBody = message;
  const detectedCode = detectAndWrapCode(message);
  if (detectedCode) {
    messageBody = detectedCode;
  }

  messageElement.innerHTML = \`<div class="message-body">\${messageBody}</div>\`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block);
  });

  document.querySelectorAll('.copy-button').forEach((button) => {
    button.addEventListener('click', () => {
      const codeBlock = button.closest('.message-body').querySelector('code');
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => button.textContent = 'Copy', 2000);
      });
    });
  });
}

function detectAndWrapCode(message) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = message;

  let codeDetected = false;
  tempDiv.querySelectorAll("pre code").forEach((codeBlock) => {
    const codeText = codeBlock.textContent;
    const language = detectLanguage(codeText);
    const preElement = document.createElement("div");
    preElement.innerHTML = \`
      <pre>
        <div class="code-header">
          <span class="code-language">\${language}</span>
          <button class="copy-button">Copy</button>
        </div>
        <code style="margin-bottom: -20px;" class="\${language}">\${codeText}</code>
      </pre>
    \`;
    codeBlock.parentNode.replaceWith(preElement);
    codeDetected = true;
  });

  return codeDetected ? tempDiv.innerHTML : null;
}

function sendMessage() {
  const userInput = chatInput.value.trim();
  if (userInput) {
    addChatMessage("You", userInput);
    chatInput.value = "";
    sendChatMessage(userInput);
  }
}

function sendChatMessage(message) {
  const vscode = acquireVsCodeApi();
  vscode.postMessage({ type: "user-input", message: message });
}

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'bot-response') {
        addChatMessage("bot", message.message)
    }else if (message.type === 'user-input'){
        addChatMessage("You", message.message)
    }
    
    //call code higlighter function here
    hljs.highlightAll();
})
`;
