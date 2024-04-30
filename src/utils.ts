import * as markdownit from "markdown-it";
import * as vscode from "vscode";

type GetConfigValueType<T> = (key: string) => T | undefined;

export const formatText = (text: string): string => {
  const md = markdownit();
  return md.render(text);
};

export const getConfigValue: GetConfigValueType<any> = <T>(key: string): T | undefined => {
  return vscode.workspace.getConfiguration().get<T>(key);
};

export const vscodeErrorMessage = (error: string, metaData?: any) => {
  return vscode.window.showErrorMessage(error);
};
