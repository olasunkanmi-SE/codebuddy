import { IWebview } from "../interfaces/editor-host";
import * as path from "path";

export function getUri(
  webview: IWebview,
  extensionUri: { fsPath: string } | string,
  pathList: string[],
) {
  const basePath =
    typeof extensionUri === "string" ? extensionUri : extensionUri.fsPath;
  const fullPath = path.join(basePath, ...pathList);
  return webview.asWebviewUri(fullPath);
}
