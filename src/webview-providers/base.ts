import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import {
  FolderEntry,
  IContextInfo,
} from "../application/interfaces/workspace.interface";
import { IEventPayload } from "../emitter/interface";
import { Logger } from "../infrastructure/logger/logger";
import { AgentService } from "../services/agent-state";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { CodebaseUnderstandingService } from "../services/codebase-understanding.service";
import { FileManager } from "../services/file-manager";
import { FileService } from "../services/file-system";
import { InputValidator } from "../services/input-validator";
import { QuestionClassifierService } from "../services/question-classifier.service";
import { LogLevel } from "../services/telemetry";
import { WorkspaceService } from "../services/workspace-service";
import { formatText } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";

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
  private readonly agentService: AgentService;
  protected readonly chatHistoryManager: ChatHistoryManager;
  private readonly questionClassifier: QuestionClassifierService;
  private readonly codebaseUnderstanding: CodebaseUnderstandingService;
  private readonly inputValidator: InputValidator;

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
    this.logger = Logger.initialize("BaseWebViewProvider", {
      minLevel: LogLevel.DEBUG,
    });
    this.workspaceService = WorkspaceService.getInstance();
    this.agentService = AgentService.getInstance();
    this.chatHistoryManager = ChatHistoryManager.getInstance();
    this.questionClassifier = QuestionClassifierService.getInstance();
    this.codebaseUnderstanding = CodebaseUnderstandingService.getInstance();
    this.inputValidator = InputValidator.getInstance();
    // Don't register disposables here - do it lazily when webview is resolved
  }

  registerDisposables() {
    // Only register once per instance
    if (this.disposables.length > 0) {
      return;
    }

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
      this.orchestrator.onConfigurationChange(
        this.handleGenericEvents.bind(this),
      ),
      this.orchestrator.onUserPrompt(this.handleUserPrompt.bind(this)),
      this.orchestrator.onGetUserPreferences(
        this.handleUserPreferences.bind(this),
      ),
    );
  }

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    _view = webviewView;
    BaseWebViewProvider.webView = webviewView;
    this.currentWebView = webviewView;

    // Register disposables only when webview is actually resolved
    this.registerDisposables();

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
    // Get the current workspace files from DB.
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

  // public async handleWorkspaceUpdate({ type, message }: IEventPayload) {
  //   return this.publishWorkSpace();
  // }

  public async handleUserPreferences({ type, message }: IEventPayload) {
    try {
      return await this.currentWebView?.webview.postMessage({
        type: "user-preferences",
        message,
      });
    } catch (error: any) {
      this.logger.info(error);
    }
  }

  public async handleUserPrompt({ type, message }: IEventPayload) {
    return await this.currentWebView?.webview.postMessage({
      type: "user-prompt",
      message,
    });
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

  private UserMessageCounter = 0;

  private async setupMessageHandler(_view: vscode.WebviewView): Promise<void> {
    try {
      this.disposables.push(
        _view.webview.onDidReceiveMessage(async (message) => {
          let response: any;
          switch (message.command) {
            case "user-input": {
              this.UserMessageCounter += 1;

              // Validate user input for security
              const validation = this.inputValidator.validateInput(
                message.message,
                "chat",
              );

              if (validation.blocked) {
                this.logger.warn(
                  "User input blocked due to security concerns",
                  {
                    originalLength: message.message.length,
                    warnings: validation.warnings,
                  },
                );

                await this.sendResponse(
                  "⚠️ Your message contains potentially unsafe content and has been blocked. Please rephrase your question in a more direct way.",
                  "bot",
                );
                break;
              }

              if (validation.warnings.length > 0) {
                this.logger.info("User input sanitized", {
                  warnings: validation.warnings,
                  originalLength: message.message.length,
                  sanitizedLength: validation.sanitizedInput.length,
                });

                // Optionally notify user about sanitization
                if (validation.warnings.length > 2) {
                  await this.sendResponse(
                    "ℹ️ Your message has been modified for security. Some content was filtered.",
                    "bot",
                  );
                }
              }

              // Use sanitized input
              const sanitizedMessage = validation.sanitizedInput;

              // Check if we should prune history for performance
              if (this.UserMessageCounter % 10 === 0) {
                const stats = await this.getChatHistoryStats("agentId");
                if (
                  stats.totalMessages > 100 ||
                  stats.estimatedTokens > 16000
                ) {
                  this.logger.info(
                    `High chat history usage detected: ${stats.totalMessages} messages, ${stats.estimatedTokens} tokens`,
                  );
                  // Optionally trigger manual pruning here
                  // await this.pruneHistoryManually("agentId", { maxMessages: 50, maxTokens: 8000 });
                }
              }

              response = await this.generateResponse(
                await this.enhanceMessageWithCodebaseContext(sanitizedMessage),
                message.metaData,
              );
              if (this.UserMessageCounter === 1) {
                await this.publishWorkSpace();
              }
              if (response) {
                console.log(
                  `[DEBUG] Response from generateResponse: ${response.length} characters`,
                );
                const formattedResponse = formatText(response);
                console.log(
                  `[DEBUG] Formatted response: ${formattedResponse.length} characters`,
                );
                console.log(
                  `[DEBUG] Original response ends with: "${response.slice(-100)}"`,
                );

                await this.sendResponse(formattedResponse, "bot");
              } else {
                console.log(
                  `[DEBUG] No response received from generateResponse`,
                );
              }
              break;
            }
            // case "webview-ready":
            //   await this.publishWorkSpace();
            //   break;
            case "upload-file":
              await this.fileManager.uploadFileHandler();
              break;
            case "update-model-event":
              await this.orchestrator.publish("onModelChange", message);
              break;
            // Publish an event instead to prevent cyclic dependendency
            // case "messages-updated":
            //   this.orchestrator.publish("onHistoryUpdated", message);
            //   break;
            case "clear-history":
              await this.chatHistoryManager.clearHistory("agentId");
              this.orchestrator.publish("onClearHistory", message);
              break;
            case "update-user-info":
              // In the future update to updateUserPreferences
              this.orchestrator.publish("onUpdateUserPreferences", message);
              break;
            default:
              throw new Error("Unknown command");
          }
        }),
      );
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

  /**
   * Enhances user messages with codebase context if the question is codebase-related
   */
  private async enhanceMessageWithCodebaseContext(
    message: string,
  ): Promise<string> {
    try {
      const questionAnalysis =
        this.questionClassifier.categorizeQuestion(message);

      if (!questionAnalysis.isCodebaseRelated) {
        this.logger.debug(
          "Question not codebase-related, returning original message",
        );
        return message;
      }

      this.logger.info(
        `Detected codebase question with confidence: ${questionAnalysis.confidence}, categories: ${questionAnalysis.categories.join(", ")}`,
      );

      // Get comprehensive codebase context
      const codebaseContext =
        await this.codebaseUnderstanding.getCodebaseContext();

      // Create enhanced prompt with codebase context
      const enhancedMessage = `
**User Question**: ${message}

**Codebase Context** (Automatically included because your question is related to understanding this codebase):

${codebaseContext}

**Instructions for AI**: Use the codebase context above to provide accurate, specific answers about this project. Reference actual files, patterns, and implementations found in the codebase analysis. Use the provided clickable file references (e.g., [[1]], [[2]]) so users can navigate directly to the source code.

IMPORTANT: Please provide a complete response. Do not truncate your answer mid-sentence or mid-word. Ensure your response is fully finished before ending.
`.trim();

      this.logger.debug("Enhanced message with codebase context");
      return enhancedMessage;
    } catch (error) {
      this.logger.error("Error enhancing message with codebase context", error);
      // Return original message if enhancement fails
      return message;
    }
  }

  public dispose(): void {
    this.logger.debug(
      `Disposing BaseWebViewProvider with ${this.disposables.length} disposables`,
    );
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0; // Clear the array
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

  async modelChatHistory(
    role: string,
    message: string,
    model: string,
    key: string,
    pruneConfig?: Partial<{
      maxMessages: number;
      maxTokens: number;
      maxAgeHours: number;
      preserveSystemMessages: boolean;
    }>,
  ): Promise<any[]> {
    return this.chatHistoryManager.formatChatHistory(
      role,
      message,
      model,
      key,
      pruneConfig,
    );
  }

  // Get chat history stats for monitoring
  async getChatHistoryStats(key: string): Promise<{
    totalMessages: number;
    estimatedTokens: number;
    oldestMessageAge: number;
    newestMessageAge: number;
  }> {
    return this.chatHistoryManager.getPruningStats(key);
  }

  // Manual pruning for performance optimization
  async pruneHistoryManually(
    key: string,
    config?: {
      maxMessages?: number;
      maxTokens?: number;
      maxAgeHours?: number;
    },
  ): Promise<void> {
    await this.chatHistoryManager.pruneHistoryForKey(key, config);
  }

  // Initialize chat history with proper sync
  async initializeChatHistory(key: string): Promise<any[]> {
    return this.chatHistoryManager.initializeHistory(key);
  }
}
