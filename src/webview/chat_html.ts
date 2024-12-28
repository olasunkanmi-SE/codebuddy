import { getUri } from "../application/utils";
import { chatCss } from "./chat_css";
import { chatJs } from "./chat_js";
import * as path from "path";
import { Webview, Uri } from "vscode";

// This function generates a random 32-character string (nonce) using alphanumeric characters
// A nonce is a unique, random value used for security purposes, typically to prevent replay attacks
// and ensure script integrity when using Content Security Policy (CSP)
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const nonce = getNonce();

export const chartComponent = (webview: Webview, extensionUri: Uri) => {
  const stylesUri = getUri(webview, extensionUri, [
    "webviewUi",
    "dist",
    "assets",
    "index.css",
  ]);
  const scriptUri = getUri(webview, extensionUri, [
    "webviewUi",
    "dist",
    "assets",
    "index.js",
  ]);
  return `
<html lang="en">
<head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
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
