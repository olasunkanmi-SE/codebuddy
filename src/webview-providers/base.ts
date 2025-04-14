import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import {
  FolderEntry,
  IContextInfo,
} from "../application/interfaces/workspace.interface";
import { IEventPayload } from "../emitter/interface";
import { Logger } from "../infrastructure/logger/logger";
import { FileService } from "../services/file-system";
import { formatText } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import { WorkspaceService } from "../services/workspace-service";
import { FileManager } from "../services/file-manager";

let _view: vscode.WebviewView | undefined;
export abstract class BaseWebViewProvider implements vscode.Disposable {
  protected readonly orchestrator: Orchestrator;
  public static readonly viewId = "chatView";
  public static webView: vscode.WebviewView | undefined;
  public currentWebView: vscode.WebviewView | undefined = _view;
  _context: vscode.ExtensionContext;
  protected logger: Logger;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly workspaceService: WorkspaceService;
  private readonly fileService: FileService;
  private readonly fileManager: FileManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext,
  ) {
    this.fileManager = FileManager.initialize(context, "files");
    this.fileService = FileService.getInstance();
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
      this.orchestrator.onActiveworkspaceUpdate(
        this.handleGenericEvents.bind(this),
      ),
      this.orchestrator.onFileUpload(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onStrategizing(
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
    }, 2000);
    await this.getFiles();
  }

  private async setWebviewHtml(view: vscode.WebviewView): Promise<void> {
    view.webview.html = getWebviewContent(
      this.currentWebView?.webview!,
      this._extensionUri,
    );
  }

  private async getFiles() {
    const files: string[] = await this.fileManager.getFileNames();
    if (files?.length) {
      await this.currentWebView?.webview.postMessage({
        type: "onFilesRetrieved",
        message: JSON.stringify(files),
      });
    }
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
              response = await this.generateResponse(
                message.message,
                message.metaData,
              );
            }
            if (response) {
              await this.sendResponse(formatText(response), "bot");
            }
            break;
          case "webview-ready":
            await this.publishWorkSpace();
            break;
          case "upload-file":
            await this.fileManager.uploadFileHandler();
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

  public async handleGenericEvents({ type, message }: IEventPayload) {
    return await this.currentWebView?.webview.postMessage({
      type,
      message,
    });
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

  async getContext(files: string[]) {
    try {
      const filesContent: Map<string, string> | undefined =
        await this.fileService.getFilesContent(files);
      if (filesContent && filesContent.size > 0) {
        return Array.from(filesContent.values()).join("\n");
      }
    } catch (error: any) {
      console.log(error);
      throw new Error(error.message);
    }
  }
}
