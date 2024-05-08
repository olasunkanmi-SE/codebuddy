export function getWebviewContent() {
  return `
  <html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css" />
    <link rel="stylesheet" href="chat.css">

    <title>AI</title>
</head>

<body>
    <div id="chat-container">
        <div id="chat-title">ChatBuddy (Ola)</div>
        <div id="chat-messages"></div>
        <div id="chat-input-container">
            <input id="chat-input" type="text" placeholder="Ask me to explain, debug, or optimize your code" />
        </div>
        <button id="chat-send">Send</button>
        <div id="loading">
        <div class="loader"></div>
        <div class="loader"></div>
    </div>
    </div>
    <script>
        const chatContainer = document.getElementById("chat-container");
        const chatMessages = document.getElementById("chat-messages");
        const chatInput = document.getElementById("chat-input");
        const chatSendButton = document.getElementById("chat-send");

        let chatVisible = false;

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
        }

        function sendChatMessage(message) {
            const vscode = acquireVsCodeApi()
            vscode.postMessage({ type: 'user-input', message: message })
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'bot-response') {
                addChatMessage("bot", message.message)
            }else if (message.type === 'user-input'){
                addChatMessage("You", message.message)
            }
        })
        
    </script>
</body>

</html>
  `;
}
