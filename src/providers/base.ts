import * as vscode from "vscode";
import { getWebviewContent } from "../webview/chat";
import { formatText } from "../utils/utils";
import { FileUploader } from "../services/file-uploader";
import { Orchestrator } from "../agents/orchestrator";
import { CodeBuddy } from "../agents/agent";

let _view: vscode.WebviewView | undefined;
export abstract class BaseWebViewProvider {
  private readonly orchestrator: Orchestrator;
  protected readonly agent: CodeBuddy;
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
    this.agent = new CodeBuddy();
    this.orchestrator = Orchestrator.getInstance(this.agent);
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
      vscode.window.showErrorMessage("API key not configured. Check your settings.");
      return;
    }
    this.setWebviewHtml(this.currentWebView);
    this.setupMessageHandler(this.apiKey, this.generativeAiModel, this.currentWebView);
  }

  private async setWebviewHtml(view: vscode.WebviewView): Promise<void> {
    const codepatterns: FileUploader = new FileUploader(this._context);
    // const knowledgeBaseDocs: string[] = await codepatterns.getFiles();
    view.webview.html = getWebviewContent(this.currentWebView?.webview!, this._extensionUri);
  }

  private async setupMessageHandler(apiKey: string, modelName: string, _view: vscode.WebviewView): Promise<void> {
    try {
      _view.webview.onDidReceiveMessage(async (message) => {
        // await this.textAgent.analyzeText("hello tue tue");
        let response;
        if (message.command === "user-input") {
          if (message.tags?.length > 0) {
            this.processInput(message.message, message.tags);
          } else {
            response = await this.generateResponse(message.message, apiKey, modelName);
          }

          if (response) {
            this.sendResponse(formatText(response), "bot");
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  abstract generateResponse(message?: string, apiKey?: string, name?: string): Promise<string | undefined>;

  abstract sendResponse(response: string, currentChat?: string): Promise<boolean | undefined>;

  abstract processInput(query: string, metaData?: Record<string, any>): any;
}
