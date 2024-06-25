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

  default:
    break;
}

console.log(`${fontSize}px`);

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

    .chat-header {
        background-color: #444;
        color: #fff;
        padding: 10px 20px;
        font-weight: bold;
        text-align: center;
    }

#chat-messages {
    height:700px;
    overflow-y: scroll;
    padding: 10px;
    max-width: 100%;
    font-size: ${fontSize}px;
}

    .chat-message {
        margin-bottom: 20px;
    }

    .chat-message.sender .message-body {
        background-color: #636363;
        color: #fff;
        float: right;
        margin-bottom: 20px;
    }

    .chat-message.bot .message-body {
        background-color: #3b3b3b;
        color: #eee;
    }

    .chat-message .message-body {
        padding: 10px;
        border-radius: 5px;
        display: inline-block;
        max-width: 90%;
        overflow-x: auto;
        position: relative;
    }

    .code-container-wrapper {
        margin-top: 10px;
    }

    .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #333;
        padding: 5px 10px;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        border-bottom: 1px solid #666;
        position: sticky;
        top: 0;
        margin-bottom: -30px;
        z-index: 1;
    }

    .code-header span {
        font-weight: bold;
        color: #fff;
    }

    .code-container {
        overflow-x: auto;
        white-space: pre;
        background-color: #222;
        border-radius: 0 0 5px 5px;
        position: relative;
        margin: 0; 
        padding: 0;
    }

    .copy-button {
        background-color: #636363;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
    }

    .chat-input-container {
        position: sticky;
        top: 500px;
        background-color: #444;
        padding: 10px;
        border-top: 1px solid #666;
        display: flex;
    }

    .chat-input {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 5px;
        margin-right: 10px;
        font-size: 14px;
        background-color: #333;
        color: #eee;
    }

body {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    padding: 0;
    font-family: ${selectedFontFamily};
}

   .scroll-button {
        position: absolute;
        bottom: 50px;
        right: 50%;
        transform: translate(-50%, -50%);
        background-color: #333;
        color: #fff;
        border-style: solid;
        boder-color: white;
        border-radius: 50%;
        font-family: FontAwesome;
        content: "\f078"; 
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-left: auto;
        display: none;
        padding: 13px;
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
}

div.code {
    white-space: pre;
}
${selectedTheme}
`;
