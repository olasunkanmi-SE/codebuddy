import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import { IEventPayload } from "../emitter/interface";
import { Logger } from "../infrastructure/logger/logger";
import { FileUploader } from "../services/file-uploader";
import { formatText, getConfigValue } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import { getChatCss } from "../webview/chat_css";

let _view: vscode.WebviewView | undefined;
export abstract class BaseWebViewProvider implements vscode.Disposable {
  protected readonly orchestrator: Orchestrator;
  public static readonly viewId = "chatView";
  static webView: vscode.WebviewView | undefined;
  public currentWebView: vscode.WebviewView | undefined = _view;
  _context: vscode.ExtensionContext;
  protected readonly logger: Logger;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    this._context = context;
    this.orchestrator = Orchestrator.getInstance();
    this.logger = new Logger("BaseWebViewProvider");
    this.disposables.push(
      this.orchestrator.onResponse(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onThinking(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onUpdate(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onError(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onSecretChange(
        this.handleModelResponseEvent.bind(this),
      ),
    );
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    _view = webviewView;
    BaseWebViewProvider.webView = webviewView;
    this.currentWebView = webviewView;

    const webviewOptions: vscode.WebviewOptions = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
        vscode.Uri.joinPath(this._extensionUri, "out"),
        vscode.Uri.joinPath(this._extensionUri, "webviewUi/dist"),
      ],
    };
    webviewView.webview.options = webviewOptions;

    if (!this.apiKey) {
      vscode.window.showErrorMessage(
        "API key not configured. Check your settings.",
      );
      return;
    }
    this.setWebviewHtml(this.currentWebView);
    this.setupMessageHandler(
      this.apiKey,
      this.generativeAiModel,
      this.currentWebView,
    );

    setTimeout(() => {
      this.currentWebView?.webview.postMessage({ type: "updateStyles", payload: getChatCss()});
      this.currentWebView?.webview.postMessage({ type: "modelUpdate", payload: { model: getConfigValue("generativeAi.option")} });
    }, 500);

    vscode.workspace.onDidChangeConfiguration((event) => {
      console.log("onDidChangeConfiguration event details is: ");
      console.dir(event);

      let chatViewThemeChange = event.affectsConfiguration("chatview.theme");
      let chatViewFontSizeChange = event.affectsConfiguration("chatview.font.size");
      let fontFamilyChange = event.affectsConfiguration("font.family");
      console.log("Checking if extension config changes are made to chatview.theme: ", chatViewThemeChange);
      console.log("Checking if extension config changes are made to chatview.font.size: ", chatViewFontSizeChange);
      console.log("Checking if extension config changes are made to font.family: ", fontFamilyChange);

      if(chatViewThemeChange || chatViewFontSizeChange || fontFamilyChange) {
        this.currentWebView?.webview.postMessage({type: "updateStyles", payload: getChatCss()});
      }

      let selectedGenerativeAiModelChange = event.affectsConfiguration("generativeAi.option");
      console.log("Checking if extension config changes are made to chatview.theme: ", selectedGenerativeAiModelChange);

      if(selectedGenerativeAiModelChange) {
        this.currentWebView?.webview.postMessage({ type: "modelUpdate", payload: { model: getConfigValue("generativeAi.option")} });
      }
    })
  }

  private async setWebviewHtml(view: vscode.WebviewView): Promise<void> {
    const codepatterns: FileUploader = new FileUploader(this._context);
    // const knowledgeBaseDocs: string[] = await codepatterns.getFiles();
    view.webview.html = getWebviewContent(
      this.currentWebView?.webview!,
      this._extensionUri,
    );
  }

  private async setupMessageHandler(
    apiKey: string,
    modelName: string,
    _view: vscode.WebviewView,
  ): Promise<void> {
    try {
      _view.webview.onDidReceiveMessage(async (message) => {
        let response: any;
        if (message.command === "user-input") {
          if (message.tags?.length > 0) {
            response = await this.generateResponse(
              message.message,
              message.tags,
            );
          } else {
            response = await this.generateResponse(message.message);
          }

          if (response) {
            this.sendResponse(formatText(response), "bot");
          }
        }
      });
    } catch (error) {
      this.logger.error("Message handler failed", error);
      console.error(error);
    }
  }

  public handleModelResponseEvent(event: IEventPayload) {
    this.sendResponse(formatText(event.message), "bot");
  }
  abstract generateResponse(
    message?: string,
    metaData?: Record<string, any>,
  ): Promise<string | undefined>;

  abstract sendResponse(
    response: string,
    currentChat?: string,
  ): Promise<boolean | undefined>;

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
