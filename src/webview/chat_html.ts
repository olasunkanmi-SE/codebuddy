import { chatCss } from "./chat_css";
import { chatJs } from "./chat_js";
import * as path from "path";

export const chartComponent = (docs: string[]) => `
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
${chatCss}
</style>
<title>AI</title>
</head>

<body>
<div id="chat-container">
    <div id="chat-title">ChatBuddy (Ola)</div>
    <div id="chat-messages"></div>
    <div id="knowledge-base-title" title="Select a knowledge base document">KnowledgeBase</div>
    <div id="knowledge-base">
         <select id="chat-options">
           ${docs.map((doc) => `<option value="${doc}">${path.basename(doc)}</option>`)}
        </select>
    </div>
    <div id="chat-input-container">
        <input id="chat-input" type="text" placeholder="The text area is diabled for now, type in your vscode window" />
    </div>
    <button id="chat-send">Send</button>
    <div id="loading">
    <div class="loader"></div>
    <div class="loader"></div>
</div>
</div>
<script>
    ${chatJs()}
</script>
</body>

</html>
`;
