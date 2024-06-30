import * as markdownit from "markdown-it";
import * as vscode from "vscode";

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
