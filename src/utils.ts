import * as markdownit from "markdown-it";
import * as vscode from "vscode";
import { MemoryCache } from "./services/memory";

type GetConfigValueType<T> = (key: string) => T | undefined;

export const formatText = (text?: string): string => {
  if (text) {
    const md = markdownit();
    return md.render(text);
  }
  return "";
};

export const getConfigValue: GetConfigValueType<any> = <T>(
  key: string,
): T | undefined => {
  return vscode.workspace.getConfiguration().get<T>(key);
};

export const vscodeErrorMessage = (error: string, metaData?: any) => {
  return vscode.window.showErrorMessage(error);
};

export const getLatestChatHistory = (key: string) => {
  let chatHistory = MemoryCache.has(key) ? MemoryCache.get(key) : [];
  if (chatHistory?.length > 3) {
    chatHistory = chatHistory.slice(-3);
  }
  return chatHistory;
};
