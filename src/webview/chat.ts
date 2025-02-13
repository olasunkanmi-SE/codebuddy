import { chartComponent } from "./chat_html";
import { Webview, Uri } from "vscode";

export function getWebviewContent(webview: Webview, extensionUri: Uri): string {
  return chartComponent(webview, extensionUri);
}
