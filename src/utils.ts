import * as markdownit from "markdown-it";
import { MemoryCache } from "./services/memory";
import { COMMON, generativeAiModel } from "./constant";
import { workspace, window, Webview, Uri } from "vscode";

type GetConfigValueType<T> = (key: string) => T | undefined;

export const formatText = (text?: string): string => {
  if (text) {
    const md = markdownit();
    return md.render(text);
  }
  return "";
};

export const getConfigValue: GetConfigValueType<any> = <T>(
  key: string
): T | undefined => {
  return workspace.getConfiguration().get<T>(key);
};

export const vscodeErrorMessage = (error: string, metaData?: any) => {
  return window.showErrorMessage(error, metaData);
};

export const getLatestChatHistory = (key: string) => {
  let chatHistory = MemoryCache.has(key) ? MemoryCache.get(key) : [];
  if (chatHistory?.length > 3) {
    chatHistory = chatHistory.slice(-3);
  }
  return chatHistory;
};

export const resetChatHistory = (model: string) => {
  switch (model) {
    case generativeAiModel.ANTHROPIC:
      MemoryCache.set(COMMON.ANTHROPIC_CHAT_HISTORY, []);
      break;
    case generativeAiModel.GEMINI:
      MemoryCache.set(COMMON.GEMINI_CHAT_HISTORY, []);
      break;
    case generativeAiModel.GROQ:
      MemoryCache.set(COMMON.GROQ_CHAT_HISTORY, []);
      break;
    default:
      break;
  }
};

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(
  webview: Webview,
  extensionUri: Uri,
  pathList: string[]
) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

/**
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 *
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 *
 * @returns A nonce
 */
export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
