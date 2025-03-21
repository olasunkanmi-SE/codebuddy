import { getUri } from "../utils/utils";
import { Uri, Webview } from "vscode";

// This function generates a random 32-character string (nonce) using alphanumeric characters
// A nonce is a unique, random value used for security purposes, typically to prevent replay attacks
// and ensure script integrity when using Content Security Policy (CSP)
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const nonce = getNonce();

export const chartComponent = (webview: Webview, extensionUri: Uri) => {
  const stylesUri = getUri(webview, extensionUri, ["webviewUi", "dist", "assets", "index.css"]);
  const scriptUri = getUri(webview, extensionUri, ["webviewUi", "dist", "assets", "index.js"]);
  return `
    <html lang="en">
    <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" integrity="sha512-EBLzUL8XLl+va/zAsmXwS7Z2B1F9HUHkZwyS/VKwh3S7T/U0nF4BaU29EP/ZSf6zgiIxYAnKLu6bJ8dqpmX5uw==" crossorigin="anonymous" referrerpolicy="no-referrer" charset="utf-8"></script>
    <script>hljs.highlightAll();</script>
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
    </head>

    <body>
    <div id="root"></div>
    <script enable=true type="module" nonce="${nonce}" src="${scriptUri}">
    </script>
    </body>
    </html>
`;
};
