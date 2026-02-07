import { chartComponent } from "./chat_html";
import { IWebview } from "../interfaces/editor-host";

export function getWebviewContent(
  webview: IWebview,
  extensionUri: any,
): string {
  return chartComponent(webview, extensionUri);
}
