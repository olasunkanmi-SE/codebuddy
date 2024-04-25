import * as vscode from "vscode";
import { getWebviewContent } from "../webview/chat";
import { formatText } from "../utils";

let _view: vscode.WebviewView | undefined;
export abstract class BaseWebViewProvider {
  public static readonly viewId = "chatView";
  static webView: vscode.WebviewView | undefined;
  public currentWebView: vscode.WebviewView | undefined = _view;
  _context: vscode.ExtensionContext;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext
  ) {
    this._context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    _view = webviewView;
    BaseWebViewProvider.webView = webviewView;
    this.currentWebView = webviewView;

    const webviewOptions: vscode.WebviewOptions = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.options = webviewOptions;

    if (!this.apiKey) {
      vscode.window.showErrorMessage(
        "API key not configured. Check your settings."
      );
      return;
    }
    this.setWebviewHtml(this.currentWebView);
    this.setupMessageHandler(
      this.apiKey,
      this.generativeAiModel,
      this.currentWebView
    );
  }

  private setWebviewHtml(view: vscode.WebviewView): void {
    view.webview.html = getWebviewContent();
  }

  private setupMessageHandler(
    apiKey: string,
    modelName: string,
    _view: vscode.WebviewView
  ): void {
    _view.webview.onDidReceiveMessage(async (message) => {
      if (message.type === "user-input") {
        const response = await this.generateResponse(
          apiKey,
          modelName,
          formatText(message.message)
        );
        if (response) {
          this.sendResponse(formatText(response), "bot");
        }
      }
    });
  }

  abstract generateResponse(
    apiKey?: string,
    name?: string,
    message?: string
  ): Promise<string | undefined>;

  abstract sendResponse(
    response: string,
    currentChat?: string
  ): Promise<boolean | undefined>;
}
