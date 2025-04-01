import { WorkspaceService } from "./../services/workspace-service";
import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import { IEventPayload } from "../emitter/interface";
import { Logger } from "../infrastructure/logger/logger";
import { FileUploader } from "../services/file-uploader";
import { formatText } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import {
  FolderEntry,
  IContextInfo,
} from "../application/interfaces/workspace.interface";

let _view: vscode.WebviewView | undefined;
export abstract class BaseWebViewProvider implements vscode.Disposable {
  protected readonly orchestrator: Orchestrator;
  public static readonly viewId = "chatView";
  public static webView: vscode.WebviewView | undefined;
  public currentWebView: vscode.WebviewView | undefined = _view;
  _context: vscode.ExtensionContext;
  protected readonly logger: Logger;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly workspaceService: WorkspaceService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    this._context = context;
    this.orchestrator = Orchestrator.getInstance();
    this.logger = new Logger("BaseWebViewProvider");
    this.workspaceService = WorkspaceService.getInstance();
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

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
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
    this.setupMessageHandler(this.currentWebView);
    setTimeout(async () => {
      await this.publishWorkSpace();
    }, 6000);
  }

  private async setWebviewHtml(view: vscode.WebviewView): Promise<void> {
    const codepatterns: FileUploader = new FileUploader(this._context);
    view.webview.html = getWebviewContent(
      this.currentWebView?.webview!,
      this._extensionUri,
    );
  }

  private async publishWorkSpace(): Promise<void> {
    try {
      const filesAndDirs: IContextInfo =
        await this.workspaceService.getContextInfo(true);
      const workspaceFiles: Map<string, FolderEntry[]> | undefined =
        filesAndDirs.workspaceFiles;
      if (!workspaceFiles) {
        this.logger.warn("There no files within the workspace");
        return;
      }
      const files: FolderEntry[] = Array.from(workspaceFiles.values()).flat();
      await this.currentWebView?.webview.postMessage({
        type: "bootstrap",
        message: JSON.stringify(files[0].children),
      });
    } catch (error: any) {
      this.logger.error("Error while getting workspace", error.message);
    }
  }

  private async setupMessageHandler(_view: vscode.WebviewView): Promise<void> {
    try {
      _view.webview.onDidReceiveMessage(async (message) => {
        let response: any;
        switch (message.command) {
          case "user-input":
            if (message.metaData.mode === "Agent") {
              response = await this.generateResponse(
                message.message,
                message.metaData,
              );
            } else {
              response = await this.generateResponse(message.message);
            }
            if (response) {
              await this.sendResponse(formatText(response), "bot");
            }
            break;
          case "webview-ready":
            await this.publishWorkSpace();
            break;
          default:
            throw new Error("Unknown command");
        }
      });
    } catch (error) {
      this.logger.error("Message handler failed", error);
      console.error(error);
    }
  }

  public handleModelResponseEvent(event: IEventPayload) {
    this.sendResponse(
      formatText(event.message),
      event.message === "folders" ? "bootstrap" : "bot",
    );
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
