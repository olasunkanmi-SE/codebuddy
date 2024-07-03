import { chartComponent } from "./chat_html";

export function getWebviewContent(docs: string[]): string {
  return chartComponent(docs);
}
