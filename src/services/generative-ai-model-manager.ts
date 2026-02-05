import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getConfigValue } from "../utils/utils";
import { EventEmitter } from "../emitter/publisher";

export const initializeGenerativeAiEnvironment = async (
  context: vscode.ExtensionContext,
  model: string,
  key: string,
  webViewProviderClass: any,
  subscriptions: vscode.Disposable[],
  quickFixCodeAction: vscode.Disposable,
  agentEventEmmitter: EventEmitter,
) => {
  const logger = Logger.initialize("GenerativeAIModelManager", {
    minLevel: LogLevel.DEBUG,
    enableConsole: true,
    enableFile: true,
    enableTelemetry: true,
  });
  try {
    const apiKey = getConfigValue(key);
    const apiModel = getConfigValue(model);
    const webViewProvider = new webViewProviderClass(
      context.extensionUri,
      apiKey,
      apiModel,
      context,
    );

    const registerWebViewProvider: vscode.Disposable =
      vscode.window.registerWebviewViewProvider(
        webViewProviderClass.viewId,
        webViewProvider,
      );

    context.subscriptions.push(
      ...subscriptions,
      quickFixCodeAction,
      registerWebViewProvider,
      agentEventEmmitter,
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(
      "An Error occured while registering event subscriptions",
    );
    logger.error("Error registering subscriptions", error);
  }
};
