import { getConfigValue } from "../utils";
import { oneDarkCss } from "./themes/atom-one-dark";
import { oneDarkReasonableCss } from "./themes/code-highlight_atom-one-dark-reasonable";
import { codePenCss } from "./themes/code-pen";
import { felipecCss } from "./themes/felipec";
import { githubDarkDimmed } from "./themes/gitbub-dark";
import { irBlack } from "./themes/ir-black";
import { nightOwlCss } from "./themes/night-owl";
import { stackOverFlowCss } from "./themes/stackoverflow";
import { tokyoNightCss } from "./themes/tokyo-night";

const fontFamily = getConfigValue("font.family");
const theme = getConfigValue("chatview.theme");
const fontSize = getConfigValue("chatview.font.size");

let selectedTheme = "";

switch (theme) {
  case "Atom One Dark":
    selectedTheme = oneDarkCss;
    break;
  case "Atom One Dark Reasonable":
    selectedTheme = oneDarkReasonableCss;
    break;
  case "Code Pen":
    selectedTheme = codePenCss;
    break;
  case "felipec":
    selectedTheme = felipecCss;
    break;
  case "github dark":
    selectedTheme = githubDarkDimmed;
    break;
  case "ir black":
    selectedTheme = irBlack;
    break;
  case "night owl":
    selectedTheme = nightOwlCss;
    break;
  case "stackoverflow":
    selectedTheme = stackOverFlowCss;
    break;
  case "tokyo night":
    selectedTheme = tokyoNightCss;
    break;
  default:
    break;
}

let selectedFontFamily = "";

switch (fontFamily) {
  case "SF Mono":
    selectedFontFamily = '"SF Mono"';
    break;
  case "Montserrat":
    selectedFontFamily = `'Montserrat', sans-serif`;
    break;
  case "Space Mono":
    selectedFontFamily = "Space Mono";
    break;
  case "Fira Code":
    selectedFontFamily = "Fira Code";
    break;
  case "Source Code Pro":
    selectedFontFamily = "Source Code Pro";
    break;
  case "JetBrains Mono":
    selectedFontFamily = "JetBrains Mono";
    break;
  case "Roboto Mono":
    selectedFontFamily = "Roboto Mono";
    break;
  case "Ubuntu Mono":
    selectedFontFamily = "Ubuntu Mono";
    break;
  case "IBM Plex Mono":
    selectedFontFamily = "IBM Plex Mono";
    break;
  case "Inconsolata":
    selectedFontFamily = "Inconsolata";
    break;
  case "JetBrains Mono":
    selectedFontFamily = "JetBrains Mono";
    break;
  default:
    break;
}

export const chatCss: string = `
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
    height:650px;
    overflow-y: scroll;
    padding: 10px;
    max-width: 100%;
    font-size: ${fontSize}px;
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
    font-size:17px;
    font-weight: 400;
}

#chat-send {
    margin-top: 10px;
    padding: 15px;
    border: none;
    background-color:rgb(0, 0, 0);
    color: #fff;
    border-radius: 6px;
    cursor: pointer;
    width: 100%;
    font-size:17px;
    font-weight: 400;
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
    font-size: 17px;
    color: #666;
}



h1 {
    color: #569cd6;
    font-size: 24px;
    margin-bottom: 20px;
}

p {
    margin-bottom: 15px;
}

ol {
    margin-left: 20px;
    margin-bottom: 20px;
}

li {
    margin-bottom: 10px;
}

pre {
    border-radius: 4px;
    padding: 10px;
    overflow-x: auto;
    background-color: #000;
    font-family: JetBrains Mono
}

div.code {
    white-space: pre;
}

#knowledge-base-title {
    position: relative;
    margin-bottom: 5px;
  }
  
  #knowledge-base-title::after {
    content: "Upload your knowledge base or code pattern (txt)";
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
    font-size:17px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
    white-space: nowrap;
  }
  
  #knowledge-base-title:hover::after {
    opacity: 1;
    visibility: visible;
  }
.scroll-button {
    position: absolute;
    bottom: 150px;
    right: 50%;
    transform: translate(-50%, -50%);
    background-color: #333;
    color: #fff;
    border-style: solid;
    boder-color: white;
    border-radius: 50%;
    font-family: selectedFontFamily;
    content: "\f0d7"; 
    width: 40px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    margin-left: auto;
    display: none;
    padding: 13px;
}

.chat-container:hover .scroll-button {
    display: flex;
}

.code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: -15px;
    padding: 5px 10px;
    background-color: #222;
    color: #fff;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}

.code-language {
    font-size: 14px;
    font-weight: bold;
}

.copy-code-button {
    background-color: #444;
    color: #fff;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
}

.copy-code-button:hover {
    background-color: #666;
}

${selectedTheme}
`;
