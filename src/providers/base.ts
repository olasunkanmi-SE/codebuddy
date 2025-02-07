import * as vscode from "vscode";
import { CodeBuddyAgent } from "../agents/agent";
import { Orchestrator } from "../agents/orchestrator";
import { Logger } from "../infrastructure/logger/logger";
import { FileUploader } from "../services/file-uploader";
import { formatText } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import { IEventPayload } from "../emitter/interface";
import { ProcessInputResult } from "../application/interfaces/agent.interface";

let _view: vscode.WebviewView | undefined;
export abstract class BaseWebViewProvider {
  private readonly orchestrator: Orchestrator;
  protected readonly agent: CodeBuddyAgent;
  public static readonly viewId = "chatView";
  static webView: vscode.WebviewView | undefined;
  public currentWebView: vscode.WebviewView | undefined = _view;
  _context: vscode.ExtensionContext;
  protected readonly logger: Logger;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    this._context = context;
    this.agent = new CodeBuddyAgent();
    this.orchestrator = Orchestrator.getInstance(this.agent);
    this.logger = new Logger("BaseWebViewProvider");
    this.agent.onUpdate(this.subscribeToUpdate.bind(this));
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
        let response;
        if (message.command === "user-input") {
          if (message.tags?.length > 0) {
            this.publishEvent(message);
          } else {
            response = await this.generateResponse(
              message.message,
              apiKey,
              modelName,
            );
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

  public subscribeToUpdate(event: IEventPayload) {
    this.sendResponse(JSON.stringify(event));
    console.error(
      `Error: ${event.message} (Code: ${JSON.stringify(event.data)})`,
    );
  }

  public async publishEvent(message: any) {
    try {
      const response = await this.generateContent(message.message);
      if (response) {
        this.agent.emitEvent("onQuery", JSON.stringify(response));
      }
    } catch (error) {
      this.logger.error("Unable to publish generateContentEvent", error);
      throw error;
    }
  }

  abstract generateResponse(
    message?: string,
    apiKey?: string,
    name?: string,
  ): Promise<string | undefined>;

  abstract sendResponse(
    response: string,
    currentChat?: string,
  ): Promise<boolean | undefined>;

  abstract generateContent(userInput: string): any;
}
