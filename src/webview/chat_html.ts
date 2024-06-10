import { chatCss } from "./chat_css";
import { chatJs } from "./chat_js";

export const chartComponent: string = `
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/danqing.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<!-- and it's easy to individually load additional languages -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/go.min.js"></script>

<script>hljs.highlightAll();</script>

<style>
${chatCss}
</style>
<title>AI</title>
</head>

<body>
<div class="chat-container">
        <div class="chat-header">ChatBuddy (Ola)</div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-container">
            <input class="chat-input" id="chat-input" type="text" placeholder="Ask me to explain, debug, or optimize your code" />
            <button class="chat-send" id="chat-send">Send</button>
        </div>
        <button class="scroll-button" id="scroll-button">&#x2193;</button>
    </div>
<script>
    ${chatJs}
</script>
</body>

</html>
`;
