export function getWebviewContent() {
  return `
  <html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css" />
    <style>
    #chat-container {
        width: 100%;
        max-width: 600px;

        display: flex;
        flex-direction: column;
        border-radius: 10px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    #chat-title {
        padding: 10px;
        font-weight: bold;
        background-color: #000000;
    }

    #chat-messages {
        height: 200px;
        overflow-y: scroll;
        padding: 10px;
        max-width: 100%;
    }

    .chat-message-container {
        margin-bottom: 10px;
    }

    .chat-message-header {
        font-weight: bold;
        color: rgb(97, 175, 239);
    }

    .chat-message-body {
        margin-top: 5px;
    }

    #chat-input-container {
        display: flex;
        align-items: center;
        padding-top: 10px;
        width: 100%;
    }

    #chat-input {
        flex: 1;
        padding: 35px;
        background-color: #0b0b0b;
        color: #fff;
        border: none;
        font-size: 14px;
    }

    #chat-send {
        margin-top: 10px;
        padding: 15px;
        border: none;
        background-color: #000;
        color: #fff;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
    }

    #loading {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
    }


    .message {
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        color: #666;
    }


    @keyframes loading {
        100% {
            transform: translateX(100%);
        }
    }

    body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        padding: 0;
        font-family: SF Mono;
    }
    </style>
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
        const cache = {};

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
            messageBody.textContent = message;
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
