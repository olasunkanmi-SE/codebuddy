import * as markdownit from "markdown-it";
import * as vscode from "vscode";
import { MemoryCache } from "./services/memory";
import { COMMON, generativeAiModel } from "./constant";

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
