import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "../services/telemetry";

type Ttopic = "bot" | "user-input";

interface IPostMessage {
  // Note. Change to topic instead
  type: Ttopic;
  payload: Record<string, any> | string;
}

export class WebViewEventsProvider {
  private readonly logger: Logger;
  constructor(private readonly webView: vscode.WebviewView) {
    // Note: Use factory method for the logger
    this.logger = Logger.initialize("WebViewEventsProvider", {
      minLevel: LogLevel.DEBUG,
    });
  }

  public async postMessage(message: IPostMessage) {
    const { type, payload } = message;
    try {
      await this.webView.webview.postMessage({ type, payload });
    } catch (error: any) {
      this.logger.error(`Unable to emit ${type}`, error);
      throw new Error(error);
    }
  }
}
