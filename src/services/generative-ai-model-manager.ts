import * as vscode from "vscode";
import { getConfigValue } from "../application/utils";
import { ChatManager } from "./chat-manager";

export const setUpGenerativeAiModel = (
  context: vscode.ExtensionContext,
  model: string,
  key: string,
  webViewProviderClass: any,
  subscriptions: vscode.Disposable[],
  quickFixCodeAction: vscode.Disposable
) => {
  try {
    const apiKey = getConfigValue(key);
    const apiModel = getConfigValue(model);
    const webViewProvider = new webViewProviderClass(
      context.extensionUri,
      apiKey,
      apiModel,
      context
    );

    const registerWebViewProvider: vscode.Disposable =
      vscode.window.registerWebviewViewProvider(
        webViewProviderClass.viewId,
        webViewProvider
      );

    const chatManager = new ChatManager(context);
    const chatWithCodeBuddy = chatManager.registerChatCommand();

    context.subscriptions.push(
      ...subscriptions,
      quickFixCodeAction,
      registerWebViewProvider,
      chatWithCodeBuddy
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      "An Error occured while registering event subscriptions"
    );
    console.log(error);
  }
};
