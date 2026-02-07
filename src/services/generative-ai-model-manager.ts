import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getConfigValue } from "../utils/utils";
import { EventEmitter } from "../emitter/publisher";
import { IExtensionContext, IDisposable } from "../interfaces/editor-host";
import { EditorHostService } from "./editor-host.service";

export const initializeGenerativeAiEnvironment = async (
  context: IExtensionContext,
  model: string,
  key: string,
  webViewProviderClass: any,
  subscriptions: IDisposable[],
  quickFixCodeAction: IDisposable,
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

    const registerWebViewProvider: IDisposable = EditorHostService.getInstance()
      .getHost()
      .window.registerWebviewViewProvider(
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
    EditorHostService.getInstance()
      .getHost()
      .window.showErrorMessage(
        "An Error occured while registering event subscriptions",
      );
    logger.error("Error registering subscriptions", error);
  }
};
