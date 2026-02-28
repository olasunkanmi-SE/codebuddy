import * as vscode from "vscode";
import { MessageHandler } from "../agents/handlers/message-handler";
import { CodeBuddyAgentService } from "../agents/services/codebuddy-agent.service";
import {
  FolderEntry,
  IContextInfo,
} from "../application/interfaces/workspace.interface";
import { VectorDbConfigurationManager } from "../config/vector-db.config";
import { IEventPayload } from "../emitter/interface";
import { Logger } from "../infrastructure/logger/logger";
import { GroqLLM } from "../llms/groq/groq";
import { Orchestrator } from "../orchestrator";
import { AgentService } from "../services/agent-state";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { CodebaseUnderstandingService } from "../services/codebase-understanding.service";
import { ContextRetriever } from "../services/context-retriever";
import { EnhancedCacheManager } from "../services/enhanced-cache-manager.service";
import { EnhancedPromptBuilderService } from "../services/enhanced-prompt-builder.service";
import { FileManager } from "../services/file-manager";
import { FileService } from "../services/file-system";
import { InputValidator } from "../services/input-validator";
import { PerformanceProfiler } from "../services/performance-profiler.service";
import { ProductionSafeguards } from "../services/production-safeguards.service";
import { QuestionClassifierService } from "../services/question-classifier.service";
import { LogLevel } from "../services/telemetry";
import { UserFeedbackService } from "../services/user-feedback.service";
import { WorkspaceService } from "../services/workspace-service";
import {
  formatText,
  generateUUID,
  getAPIKeyAndModel,
  getConfigValue,
} from "../utils/utils";
import { getWebviewContent } from "../webview/chat";

import { NewsService } from "../services/news.service";

import {
  NotificationService,
  NotificationSource,
} from "../services/notification.service";
import { ObservabilityService } from "../services/observability.service";

import { ChatHistoryPruningService } from "../services/chat-history-pruning.service";
import { ContextEnhancementService } from "../services/context-enhancement.service";
import {
  BrowserHandler,
  ConnectorHandler,
  DiffReviewHandler,
  DockerHandler,
  MCPHandler,
  NewsHandler,
  NotificationHandler,
  ObservabilityHandler,
  PerformanceHandler,
  RulesHandler,
  SessionHandler,
  SettingsHandler,
} from "./handlers";
import { HandlerContext, MessageHandlerRegistry } from "./handlers/types";

export interface ImessageAndSystemInstruction {
  systemInstruction: string;
  userMessage: string;
}

export type LLMMessage = ImessageAndSystemInstruction | string;

export abstract class BaseWebViewProvider implements vscode.Disposable {
  protected readonly orchestrator: Orchestrator;
  public static readonly viewId = "chatView";
  public static webView: vscode.WebviewView | undefined;
  public currentWebView: vscode.WebviewView | undefined;
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
  protected readonly MAX_HISTORY_MESSAGES = 3;
  private currentSessionId: string | null = null;

  // Vector database services
  protected vectorConfigManager?: VectorDbConfigurationManager;
  protected configManager?: VectorDbConfigurationManager; // Alias for compatibility
  protected userFeedbackService?: UserFeedbackService;
  protected contextRetriever?: ContextRetriever;

  // Phase 5: Performance & Production services
  protected performanceProfiler?: PerformanceProfiler;
  protected productionSafeguards?: ProductionSafeguards;
  protected enhancedCacheManager?: EnhancedCacheManager;

  // Prompt enhancement service
  protected promptBuilderService: EnhancedPromptBuilderService;
  private readonly groqLLM: GroqLLM | null;
  private readonly codeBuddyAgent: MessageHandler;
  protected readonly notificationService: NotificationService;
  private readonly handlerRegistry: MessageHandlerRegistry;
  private sessionHandler!: SessionHandler;
  private readonly contextEnhancementService: ContextEnhancementService;
  private readonly chatHistoryPruningService: ChatHistoryPruningService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext,
    notificationService?: NotificationService,
  ) {
    const { apiKey: modelKey, model } = getAPIKeyAndModel("groq");
    const config = {
      apiKey: modelKey,
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    };
    this.groqLLM = GroqLLM.getInstance(config);
    this.fileManager = FileManager.initialize(context, "files");
    this.fileService = FileService.getInstance();
    this._context = context;
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize("BaseWebViewProvider", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.workspaceService = WorkspaceService.getInstance();
    this.agentService = AgentService.getInstance();
    this.chatHistoryManager = ChatHistoryManager.getInstance();
    this.questionClassifier = QuestionClassifierService.getInstance();
    this.codebaseUnderstanding = CodebaseUnderstandingService.getInstance();
    this.inputValidator = InputValidator.getInstance();

    // Initialize configuration manager first
    this.configManager = new VectorDbConfigurationManager();
    this.vectorConfigManager = this.configManager; // Alias

    // Initialize Phase 5 services
    this.performanceProfiler = new PerformanceProfiler(this.configManager);
    ObservabilityService.getInstance().registerProfiler(
      this.performanceProfiler,
    );
    this.productionSafeguards = new ProductionSafeguards({
      maxMemoryMB: 1024,
      maxHeapMB: 512,
      maxCpuPercent: 80,
      gcThresholdMB: 256,
      alertThresholdMB: 400,
    });
    this.enhancedCacheManager = new EnhancedCacheManager(
      {
        maxSize: 10000,
        defaultTtl: 3600000, // 1 hour
        maxMemoryMB: 100,
        cleanupInterval: 300000, // 5 minutes
        evictionPolicy: "LRU",
      },
      this.performanceProfiler,
    );

    this.userFeedbackService = new UserFeedbackService();

    this.contextRetriever = new ContextRetriever();

    this.promptBuilderService = new EnhancedPromptBuilderService(context);
    this.codeBuddyAgent = MessageHandler.getInstance();
    this.notificationService =
      notificationService ?? NotificationService.getInstance();

    // Initialize extracted services
    this.contextEnhancementService = new ContextEnhancementService(
      this.groqLLM,
      this.promptBuilderService,
    );
    this.chatHistoryPruningService = new ChatHistoryPruningService(
      this.chatHistoryManager,
      this.groqLLM,
      this.getTokenCounts.bind(this),
    );

    // Initialize handler registry
    this.handlerRegistry = new MessageHandlerRegistry();
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    this.handlerRegistry.register(
      new SettingsHandler(this.orchestrator as any, this._extensionUri),
    );
    this.handlerRegistry.register(new DockerHandler());
    this.handlerRegistry.register(new MCPHandler());
    this.handlerRegistry.register(new ConnectorHandler());
    this.handlerRegistry.register(
      new NewsHandler(() => this.synchronizeNews()),
    );
    this.handlerRegistry.register(
      new BrowserHandler(this.agentService, () => this.currentSessionId),
    );
    this.handlerRegistry.register(
      new NotificationHandler(this.notificationService, () =>
        this.synchronizeNotifications(),
      ),
    );
    this.sessionHandler = new SessionHandler(
      this.agentService,
      this.chatHistoryManager,
      () => this.currentSessionId,
      (id) => {
        this.currentSessionId = id;
      },
      this.orchestrator as any,
    );
    this.handlerRegistry.register(this.sessionHandler);
    this.handlerRegistry.register(new DiffReviewHandler());
    this.handlerRegistry.register(new ObservabilityHandler());
    this.handlerRegistry.register(new RulesHandler());
    this.handlerRegistry.register(
      new PerformanceHandler(
        () => this.performanceProfiler,
        () => this.productionSafeguards,
        () => this.enhancedCacheManager,
        () => this.vectorConfigManager,
      ),
    );
  }

  registerDisposables() {
    if (this.disposables.length > 0) {
      return;
    }

    this.disposables.push(
      this.notificationService.onDidNotificationChange(() => {
        this.synchronizeNotifications();
      }),
    );

    this.disposables.push(
      ObservabilityService.getInstance().onLog((event) => {
        this.currentWebView?.webview.postMessage({
          type: "log-entry",
          event,
        });
      }),
    );

    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("codebuddy")) {
          this.synchronizeConfiguration();
        }
      }),
    );

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
      this.orchestrator.onUpdateThemePreferences(
        this.handleThemePreferences.bind(this),
      ),
      // Listen for diff review events
      this.orchestrator.onPendingChange(this.handleDiffChangeEvent.bind(this)),
      this.orchestrator.onChangeApplied(this.handleDiffChangeEvent.bind(this)),
      this.orchestrator.onChangeRejected(this.handleDiffChangeEvent.bind(this)),
      // Listen for workspace folder changes and update active workspace
      vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        this.logger.info(
          "Workspace folders changed, publishing updated workspace",
        );
        await this.publishActiveWorkspace();
        await this.publishWorkSpace();
      }),
      // Listen for active editor changes to update the current file display
      vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (editor) {
          this.logger.info(
            "Active editor changed, publishing updated active file",
          );
          await this.publishActiveWorkspace();
        }
      }),
    );
  }

  /**
   * Gets the current model name for token budget calculation
   */
  public getCurrentModelName(): string {
    return this.generativeAiModel || "default";
  }

  async *streamResponse(
    message: LLMMessage,
    metaData?: any,
  ): AsyncGenerator<string, void, unknown> {
    const response = await this.generateResponse(message, metaData);
    if (response) {
      yield response;
    }
  }

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
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
    setImmediate(() => this.getFiles());

    // Note: publishWorkSpace is called when webview signals "webview-ready"
  }

  /** Return the current session ID so it can be transferred during a model switch. */
  public getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Lightweight attach for model switches: re-use the existing webview HTML
   * and only wire up the message handler + transfer session state.
   * This avoids a full React remount which the user perceives as a "new session".
   */
  async attachToExistingWebview(
    webviewView: vscode.WebviewView,
    sessionId: string | null,
  ): Promise<void> {
    BaseWebViewProvider.webView = webviewView;
    this.currentWebView = webviewView;
    this.currentSessionId = sessionId;

    this.registerDisposables();
    this.setupMessageHandler(this.currentWebView);
  }

  private async setWebviewHtml(view: vscode.WebviewView): Promise<void> {
    view.webview.html = getWebviewContent(view.webview, this._extensionUri);
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

  public async handleUserPreferences({ type, message }: IEventPayload) {
    try {
      return await this.currentWebView?.webview.postMessage({
        type: "onGetUserPreferences",
        message,
      });
    } catch (error: any) {
      this.logger.info(error);
    }
  }

  public async handleThemePreferences({ type, message }: IEventPayload) {
    try {
      return await this.currentWebView?.webview.postMessage({
        type: "theme-settings",
        message,
      });
    } catch (error: any) {
      this.logger.info(error);
    }
  }

  /**
   * Handles diff change events (pending, applied, rejected) and forwards to webview
   */
  public async handleDiffChangeEvent({ type, message }: IEventPayload) {
    try {
      return await this.currentWebView?.webview.postMessage({
        type: "diff-change-event",
        eventType: message?.type,
        change: message?.change,
      });
    } catch (error: any) {
      this.logger.error("Error forwarding diff change event", error);
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

      // Also publish the active workspace name
      await this.publishActiveWorkspace();
    } catch (error: any) {
      this.logger.error("Error while getting workspace", error.message);
    }
  }

  /**
   * Publishes the active file/workspace info to the webview
   * Shows the current active file name, or workspace name if no file is open
   * Untitled files show as empty string
   */
  private async publishActiveWorkspace(): Promise<void> {
    try {
      const activeEditor = vscode.window.activeTextEditor;
      let displayName = "";

      // Reset the tracked active file path
      this.currentActiveFilePath = undefined;

      if (activeEditor) {
        // Check if it's an untitled (unsaved) file
        if (activeEditor.document.isUntitled) {
          displayName = "";
          this.currentActiveFilePath = undefined;
        } else {
          // Show the current file name with relative path from workspace
          const filePath = activeEditor.document.uri.fsPath;
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(
            activeEditor.document.uri,
          );
          if (workspaceFolder) {
            // Get relative path from workspace root
            const relativePath = vscode.workspace.asRelativePath(
              activeEditor.document.uri,
              false,
            );
            displayName = relativePath;
            // Store the full path for context inclusion
            this.currentActiveFilePath = filePath;
          } else {
            // Fallback to just the file name
            displayName =
              activeEditor.document.fileName.split(/[\\/]/).pop() || "";
            this.currentActiveFilePath = filePath;
          }
        }
      } else {
        // No active editor, show workspace name
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          displayName = workspaceFolders[0].name;
        } else {
          displayName = "";
        }
      }

      await this.currentWebView?.webview.postMessage({
        type: "onActiveworkspaceUpdate",
        message: displayName,
      });
      this.logger.info(
        `Active workspace/file published: ${displayName || "(empty)"}`,
      );
    } catch (error: any) {
      this.logger.error("Error publishing active workspace", error.message);
    }
  }

  private UserMessageCounter = 0;

  // Track the current active file path for context inclusion
  private currentActiveFilePath: string | undefined;

  private async synchronizeNews(): Promise<void> {
    try {
      // Use getNews() instead of getUnreadNews() to include saved items
      const news = await NewsService.getInstance().getNews();
      this.logger.info(
        `synchronizeNews: Found ${news.length} items. Sending update to webview.`,
      );

      // ALWAYS send the update, even if empty, so the UI can clear the list if needed
      const success = await this.currentWebView?.webview.postMessage({
        type: "news-update",
        payload: { news },
      });

      if (success) {
        this.logger.info(
          `synchronizeNews: Successfully posted ${news.length} items to webview.`,
        );
      } else {
        this.logger.warn(
          "synchronizeNews: Failed to post message to webview (postMessage returned false).",
        );
      }
    } catch (error: any) {
      this.logger.error("Failed to synchronize news", error);
    }
  }

  protected async synchronizeConfiguration(): Promise<void> {
    if (!this.currentWebView) return;

    const config = vscode.workspace.getConfiguration("codebuddy");
    const configData = {
      enableStreaming: config.get<boolean>("enableStreaming", true),
      "codebuddy.compactMode": config.get<boolean>("compactMode", false),
      "codebuddy.automations.dailyStandup.enabled": config.get<boolean>(
        "automations.dailyStandup.enabled",
        true,
      ),
      "codebuddy.automations.codeHealth.enabled": config.get<boolean>(
        "automations.codeHealth.enabled",
        true,
      ),
      "codebuddy.automations.dependencyCheck.enabled": config.get<boolean>(
        "automations.dependencyCheck.enabled",
        true,
      ),
      "codebuddy.automations.gitWatchdog.enabled": config.get<boolean>(
        "automations.gitWatchdog.enabled",
        true,
      ),
      "codebuddy.automations.endOfDaySummary.enabled": config.get<boolean>(
        "automations.endOfDaySummary.enabled",
        true,
      ),
      "codebuddy.browserType": config.get<string>("browserType", "system"),
      "codebuddy.verboseLogging": config.get<boolean>("verboseLogging", false),
    };

    await this.currentWebView.webview.postMessage({
      type: "onConfigurationChange",
      message: JSON.stringify(configData),
    });
  }

  private async setupMessageHandler(_view: vscode.WebviewView): Promise<void> {
    try {
      this.disposables.push(
        _view.webview.onDidReceiveMessage(async (message) => {
          // Delegate to registered domain handlers first
          const ctx: HandlerContext = {
            webview: _view,
            logger: this.logger,
            extensionUri: this._extensionUri,
            sendResponse: this.sendResponse.bind(this),
          };
          if (await this.handlerRegistry.dispatch(message, ctx)) {
            return;
          }

          // Core commands handled inline
          switch (message.command) {
            case "user-consent": {
              CodeBuddyAgentService.getInstance().setUserConsent(
                message.message === "granted",
              );
              break;
            }
            case "cancel-request": {
              try {
                this.codeBuddyAgent.cancelRequest(
                  message.requestId,
                  message.threadId,
                );
                await this.currentWebView?.webview.postMessage({
                  type: "onStreamError",
                  payload: {
                    requestId: message.requestId,
                    error: "Stopped by user",
                  },
                });
              } catch (error: any) {
                this.logger.error("Failed to cancel request", error);
              }
              break;
            }
            case "index-workspace": {
              vscode.commands.executeCommand("codebuddy.indexWorkspace");
              break;
            }
            case "execute-command": {
              if (message.commandId) {
                vscode.commands.executeCommand(message.commandId);
              }
              break;
            }
            case "user-input": {
              this.UserMessageCounter += 1;
              const selectedGenerativeAiModel = getConfigValue(
                "generativeAi.option",
              );
              this.logger.info(
                `Selected Generative AI Model: ${selectedGenerativeAiModel}`,
              );

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
                const stats =
                  await this.chatHistoryManager.getPruningStats("agentId");
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

              // Inject News Reader context if available
              const { NewsReaderService } =
                await import("../services/news-reader.service");
              const currentArticle =
                NewsReaderService.getInstance().currentArticle;
              let articleContext = "";
              if (currentArticle) {
                articleContext = `\n\n[Currently Reading Article]\nTitle: ${currentArticle.title}\nURL: ${currentArticle.url}\nContent: ${currentArticle.content.substring(0, 5000)}...`;
              }

              if (message.metaData?.mode === "Agent") {
                // Ensure we have a session for saving messages
                if (!this.currentSessionId) {
                  const title =
                    message.message.length > 50
                      ? message.message.substring(0, 47) + "..."
                      : message.message;
                  this.currentSessionId = await this.agentService.createSession(
                    "agentId",
                    title,
                  );
                  // Notify webview about the new session
                  const sessions =
                    await this.agentService.getSessions("agentId");
                  await this.currentWebView?.webview.postMessage({
                    type: "session-created",
                    sessionId: this.currentSessionId,
                    sessions,
                  });
                }

                // Save user message to history
                await this.agentService.addChatMessage("agentId", {
                  content: message.message,
                  type: "user",
                  sessionId: this.currentSessionId,
                  metadata: { threadId: message.metaData?.threadId },
                });

                let context: string | undefined;
                if (message.metaData?.context?.length > 0) {
                  context = await this.getContext(message.metaData.context);
                }

                if (articleContext) {
                  context = context ? context + articleContext : articleContext;
                }

                const payload = context
                  ? JSON.stringify(
                      `${message.message} \n context: ${context ?? ""}`,
                    )
                  : JSON.stringify(message.message);

                try {
                  const fullResponse =
                    await this.codeBuddyAgent.handleUserMessage(
                      payload,
                      message.metaData,
                    );

                  // Save agent response to history
                  if (fullResponse) {
                    await this.agentService.addChatMessage("agentId", {
                      content: fullResponse,
                      type: "model",
                      sessionId: this.currentSessionId,
                      metadata: { threadId: message.metaData?.threadId },
                    });
                  }
                } catch (agentError: unknown) {
                  let errorMessage = "An unknown error occurred in Agent mode";
                  if (agentError instanceof Error) {
                    errorMessage = agentError.message;
                  } else if (typeof agentError === "string") {
                    errorMessage = agentError;
                  }
                  this.logger.error("Agent mode error", agentError);
                  try {
                    this.notificationService.addNotification(
                      "error",
                      "Agent Error",
                      errorMessage,
                      NotificationSource.Agent,
                    );
                  } catch (notificationError: unknown) {
                    this.logger.error(
                      "Failed to display agent error notification",
                      notificationError,
                    );
                  }
                }
                return;
              }

              // Extract user-selected files from @ mentions and model name for smart context selection
              let userSelectedFiles =
                message.metaData?.context?.filter(
                  (f: string) => f && f.trim().length > 0,
                ) || [];

              // Include the current active file as context if it exists and not already in the list
              if (this.currentActiveFilePath) {
                const activeFileAlreadyIncluded = userSelectedFiles.some(
                  (f: string) =>
                    f === this.currentActiveFilePath ||
                    f.endsWith(
                      this.currentActiveFilePath!.split(/[\\/]/).pop() || "",
                    ),
                );
                if (!activeFileAlreadyIncluded) {
                  userSelectedFiles = [
                    this.currentActiveFilePath,
                    ...userSelectedFiles,
                  ];
                  this.logger.info(
                    `Including active file in context: ${this.currentActiveFilePath}`,
                  );
                }
              }

              const modelName = this.getCurrentModelName();

              // Inject news context into sanitizedMessage for non-Agent flow
              if (articleContext) {
                // Append context to message or use it in enhancement
                // Since enhanceMessageWithCodebaseContext takes message string, we append it.
                // But wait, sanitizedMessage is used for RAG too?
                // Let's append it to sanitizedMessage.
                // Actually, sanitizedMessage is a const (line 725).
                // We can't reassign it.
                // We need to pass it to enhanceMessageWithCodebaseContext.
              }

              const messageWithContext = articleContext
                ? `${sanitizedMessage}\n\n${articleContext}`
                : sanitizedMessage;

              const messageAndSystemInstruction =
                await this.enhanceMessageWithCodebaseContext(
                  messageWithContext,
                  userSelectedFiles,
                  modelName,
                );

              const requestId = generateUUID();

              // Send Stream Start
              await this.currentWebView?.webview.postMessage({
                type: "onStreamStart",
                payload: { requestId },
              });

              let fullResponse = "";
              try {
                for await (const chunk of this.streamResponse(
                  messageAndSystemInstruction,
                  message.metaData,
                )) {
                  fullResponse += chunk;
                  await this.currentWebView?.webview.postMessage({
                    type: "onStreamChunk",
                    payload: { requestId, content: chunk },
                  });
                }

                // Ensure we have a session for saving messages
                if (!this.currentSessionId) {
                  // Auto-generate a title from the first user message
                  const title =
                    sanitizedMessage.length > 50
                      ? sanitizedMessage.substring(0, 47) + "..."
                      : sanitizedMessage;
                  this.currentSessionId = await this.agentService.createSession(
                    "agentId",
                    title,
                  );
                  // Notify webview about the new session
                  const sessions =
                    await this.agentService.getSessions("agentId");
                  await this.currentWebView?.webview.postMessage({
                    type: "session-created",
                    sessionId: this.currentSessionId,
                    sessions,
                  });
                }

                // Save chat history to database with current session
                await this.agentService.addChatMessage("agentId", {
                  content: sanitizedMessage,
                  type: "user",
                  sessionId: this.currentSessionId,
                });

                await this.agentService.addChatMessage("agentId", {
                  content: fullResponse,
                  type: "model",
                  sessionId: this.currentSessionId,
                });
              } catch (error: unknown) {
                let streamErrorMessage =
                  "An error occurred while generating a response";
                if (error instanceof Error) {
                  streamErrorMessage = error.message;
                } else if (typeof error === "string") {
                  streamErrorMessage = error;
                }
                this.logger.error("Error during streaming", error);
                await this.currentWebView?.webview.postMessage({
                  type: "onStreamError",
                  payload: { requestId, error: streamErrorMessage },
                });

                try {
                  this.notificationService.addNotification(
                    "error",
                    "Response Failed",
                    streamErrorMessage,
                    NotificationSource.Chat,
                  );
                } catch (notificationError: unknown) {
                  this.logger.error(
                    "Failed to display stream error notification",
                    notificationError,
                  );
                }
                return; // Stop processing
              }

              if (fullResponse) {
                this.logger.info(
                  `[DEBUG] Response from streamResponse: ${fullResponse.length} characters`,
                );
                const formattedResponse = formatText(fullResponse);
                this.logger.info(
                  `[DEBUG] Formatted response: ${formattedResponse.length} characters`,
                );

                // Send Bot Response (Legacy/History update) - Ignored by UI if streaming is active
                await this.sendResponse(formattedResponse, "bot");

                // Send Stream End
                await this.currentWebView?.webview.postMessage({
                  type: "onStreamEnd",
                  payload: { requestId, content: formattedResponse },
                });
              } else {
                this.logger.info(
                  `[DEBUG] No response received from streamResponse`,
                );
              }
              if (this.UserMessageCounter === 1) {
                await this.publishWorkSpace();
              }
              break;
            }
            case "webview-ready":
              await this.publishWorkSpace();
              // Initialize current session
              this.currentSessionId =
                await this.agentService.getCurrentSession("agentId");
              if (this.currentSessionId) {
                // Sync history for the current session
                await this.sessionHandler.synchronizeSessionHistory(
                  this.currentSessionId,
                  ctx,
                );
              }
              await this.synchronizeNews();
              await this.synchronizeNotifications();
              await this.synchronizeConfiguration();
              // Send current session info to webview
              await this.currentWebView?.webview.postMessage({
                type: "current-session",
                sessionId: this.currentSessionId,
              });
              break;
            case "upload-file":
              await this.fileManager.uploadFileHandler();
              break;
            case "insertCode":
              {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                  editor.edit((editBuilder) => {
                    editBuilder.insert(editor.selection.active, message.text);
                  });
                } else {
                  vscode.window.showErrorMessage(
                    "No active editor to insert code into.",
                  );
                }
              }
              break;
            case "runInTerminal":
              {
                let terminal = vscode.window.activeTerminal;
                if (!terminal) {
                  terminal = vscode.window.createTerminal("CodeBuddy");
                }
                terminal.show();
                terminal.sendText(message.text);
              }
              break;

            default:
              this.logger.warn(`Unhandled webview command: ${message.command}`);
          }
        }),
      );
    } catch (error: any) {
      this.logger.error("Message handler failed", error);
      this.logger.error(error);
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
    message?: LLMMessage,
    metaData?: Record<string, any>,
  ): Promise<string | undefined>;

  abstract sendResponse(
    response: string,
    currentChat?: string,
  ): Promise<boolean | undefined>;

  async categorizeQuestion(userQuestion: string) {
    return this.contextEnhancementService.categorizeQuestion(userQuestion);
  }

  /**
   * Enhances user messages with codebase context if the question is codebase-related
   * @param message - The user's message
   * @param userSelectedFiles - Optional array of file paths from @ mentions
   * @param modelName - Optional model name for token budget calculation
   */
  private async enhanceMessageWithCodebaseContext(
    message: string,
    userSelectedFiles?: string[],
    modelName?: string,
  ): Promise<LLMMessage> {
    return this.contextEnhancementService.enhanceMessageWithCodebaseContext(
      message,
      userSelectedFiles,
      modelName,
    );
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
      this.logger.info(error);
      throw new Error(error.message);
    }
  }

  /**
   * A more advanced pruning strategy that summarizes the oldest part of the chat history
   * once the token count exceeds a threshold, instead of just deleting it.
   *
   * @param history The current chat history.
   * @param maxTokens The maximum number of tokens allowed for the context window.
   * @param systemInstruction The system instruction, which also counts towards the token limit.
   * @param agentId The agent ID to save the summary for.
   * @returns A promise that resolves to the new, potentially summarized and pruned, chat history.
   */
  async pruneChatHistoryWithSummary(
    history: any[],
    maxTokens: number,
    systemInstruction: string,
    agentId?: string,
  ): Promise<any[]> {
    return this.chatHistoryPruningService.pruneChatHistoryWithSummary(
      history,
      maxTokens,
      systemInstruction,
      agentId,
    );
  }

  protected async synchronizeNotifications(): Promise<void> {
    if (!this.currentWebView) {
      this.logger.warn("synchronizeNotifications: No currentWebView");
      return;
    }
    try {
      const notifications = await this.notificationService.getNotifications();
      const unreadCount = await this.notificationService.getUnreadCount();

      this.logger.info(
        `synchronizeNotifications: Sending ${notifications.length} notifications, unread: ${unreadCount}`,
      );

      await this.currentWebView.webview.postMessage({
        type: "notifications-update",
        notifications,
        unreadCount,
      });
    } catch (error) {
      this.logger.error("synchronizeNotifications failed", error);
    }
  }

  abstract getTokenCounts(input: string): Promise<number>;
}
