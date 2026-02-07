import { getUri } from "../utils/webview-utils";
import { IWebview } from "../interfaces/editor-host";

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

export const chartComponent = (webview: IWebview, extensionUri: any) => {
  const stylesUri = getUri(webview, extensionUri, [
    "dist",
    "webview",
    "assets",
    "index.css",
  ]);
  const scriptUri = getUri(webview, extensionUri, [
    "dist",
    "webview",
    "assets",
    "index.js",
  ]);
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
      style-src 'unsafe-inline' 'self' ${webview.cspSource} https://fonts.googleapis.com; 
      script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com; 
      font-src 'self' ${webview.cspSource} https://fonts.gstatic.com data:; 
      connect-src https:; 
      img-src 'self' ${webview.cspSource} vscode-resource: https: data:;">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300..700&family=Space+Mono:wght@400;700&family=Fira+Code:wght@300..700&family=Source+Code+Pro:wght@300..700&family=JetBrains+Mono:wght@300..700&family=Roboto+Mono:wght@300..700&family=Ubuntu+Mono:wght@400;700&family=IBM+Plex+Mono:wght@300..700&family=Inconsolata:wght@300..700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
    </head>

    <body style="background-color: rgb(22, 22, 30);">
    <div id="root"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" integrity="sha512-EBLzUL8XLl+va/zAsmXwS7Z2B1F9HUHkZwyS/VKwh3S7T/U0nF4BaU29EP/ZSf6zgiIxYAnKLu6bJ8dqpmX5uw==" crossorigin="anonymous" referrerpolicy="no-referrer" charset="utf-8"></script>
    <script enable=true type="module" nonce="${nonce}" src="${scriptUri}">
    </script>
    </body>
    </html>
`;
};
