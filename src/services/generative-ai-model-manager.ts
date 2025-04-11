import * as vscode from "vscode";
import { getConfigValue } from "../utils/utils";
import { EventEmitter } from "../emitter/publisher";

export const initializeGenerativeAiEnvironment = async (
  context: vscode.ExtensionContext,
  model: string,
  key: string,
  webViewProviderClass: any,
  subscriptions: vscode.Disposable[],
  quickFixCodeAction: vscode.Disposable,
  agentEventEmmitter: EventEmitter
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

    context.subscriptions.push(
      ...subscriptions,
      quickFixCodeAction,
      registerWebViewProvider,
      agentEventEmmitter
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      "An Error occured while registering event subscriptions"
    );
    console.log(error);
  }
};
