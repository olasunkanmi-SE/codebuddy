export const chatJs: string = `
const chatContainer = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSendButton = document.getElementById("chat-send");
const scrollButton = document.getElementById("scroll-button");

const textArea = document.getElementById("chat-input-container");
textArea.setAttribute('disabled', 'true')

chatSendButton.disabled = true;

let chatVisible = false;

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

chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const userInput = chatInput.value.trim();
        if (userInput) {
            addChatMessage("You", userInput);
            sendChatMessage(userInput);
            chatInput.value = "";
        }
    }
});

chatSendButton.addEventListener("click", () => {
    const userInput = chatInput.value.trim();
    if (userInput) {
        addChatMessage("You", userInput);
        sendChatMessage(userInput);
        chatInput.value = "";
    }
});

function addChatMessage(sender, message) {
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
    chatMessages.appendChild(messageContainer);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    addCodeWrappers();
}

function sendChatMessage(message) {
    const vscode = acquireVsCodeApi()
    vscode.postMessage({ type: 'user-input', message: message })
}

function addCodeWrappers() {
    document.querySelectorAll('pre code').forEach((block) => {
        const preElement = block.parentElement;
        if (!preElement.parentElement.querySelector('.code-header')) {
            const codeText = block.textContent;
            const language = detectLanguage(codeText);
            const wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = \`<span class="code-language">\${language}</span><button class="copy-code-button">Copy</button>\`;
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(header);
            wrapper.appendChild(preElement);
            header.querySelector('.copy-code-button').addEventListener('click', () => {
                navigator.clipboard.writeText(block.innerText).then(() => {
                    header.querySelector('.copy-code-button').innerText = 'Copied!';
                    setTimeout(() => {
                        header.querySelector('.copy-code-button').innerText = 'Copy';
                    }, 2000);
                });
            });
        }
    });
}

function detectLanguage(code) {
  const result = hljs.highlightAuto(code);
  return result.language || "plaintext";
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
    addCodeWrappers();
});

document.addEventListener('DOMContentLoaded', () => {
    addCodeWrappers();
});
`;
