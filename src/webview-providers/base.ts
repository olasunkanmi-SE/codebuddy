import * as vscode from "vscode";
import { Orchestrator } from "../orchestrator";
import {
  FolderEntry,
  IContextInfo,
} from "../application/interfaces/workspace.interface";
import { VectorDbConfigurationManager } from "../config/vector-db.config";
import { IEventPayload } from "../emitter/interface";
import { Logger } from "../infrastructure/logger/logger";
import { AgentService } from "../services/agent-state";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { CodebaseUnderstandingService } from "../services/codebase-understanding.service";
import { ContextRetriever } from "../services/context-retriever";
import { EnhancedCacheManager } from "../services/enhanced-cache-manager.service";
import {
  EnhancedPromptBuilderService,
  PromptContext,
} from "../services/enhanced-prompt-builder.service";
import { FileManager } from "../services/file-manager";
import { FileService } from "../services/file-system";
import { InputValidator } from "../services/input-validator";
import { PerformanceProfiler } from "../services/performance-profiler.service";
import { ProductionSafeguards } from "../services/production-safeguards.service";
import { LogLevel } from "../services/telemetry";
import { UserFeedbackService } from "../services/user-feedback.service";
import { WorkspaceService } from "../services/workspace-service";
import {
  formatText,
  getAPIKeyAndModel,
  getConfigValue,
  generateUUID,
} from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import { QuestionClassifierService } from "../services/question-classifier.service";
import { GroqLLM } from "../llms/groq/groq";
import { Role } from "../llms/message";
import { MessageHandler } from "../agents/handlers/message-handler";
import { CodeBuddyAgentService } from "../agents/services/codebuddy-agent.service";
import { MCPService } from "../MCP/service";
import { MCPClientState } from "../MCP/types";
import { LocalModelService } from "../llms/local/service";
import { DockerModelService } from "../services/docker/DockerModelService";
import { ProjectRulesService } from "../services/project-rules.service";
import { NewsService } from "../services/news.service";

type SummaryGenerator = (historyToSummarize: any[]) => Promise<string>;

export interface ImessageAndSystemInstruction {
  systemInstruction: string;
  userMessage: string;
}

export type LLMMessage = ImessageAndSystemInstruction | string;

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
  protected readonly MAX_HISTORY_MESSAGES = 3;
  private chatHistorySyncPromise: Promise<void> | null = null;
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

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext,
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
  }

  registerDisposables() {
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
    setImmediate(() => this.getFiles());

    // Note: publishWorkSpace is called when webview signals "webview-ready"
  }

  /**
   * Synchronize provider's chatHistory array with database on startup
   * This ensures the provider has immediate access to persistent chat data
   */
  protected async synchronizeChatHistoryFromDatabase(): Promise<void> {
    if (this.chatHistorySyncPromise) {
      return this.chatHistorySyncPromise;
    }

    this.chatHistorySyncPromise = (async () => {
      const agentId = "agentId"; // Using the same hardcoded ID as WebViewProviderManager
      const maxAttempts = 2;
      const retryDelayMs = 150;

      this.logger.info("Starting chat history sync for webview");

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const persistentHistory =
            (await this.agentService.getChatHistory(agentId)) || [];
          const persistentSummary =
            await this.agentService.getChatSummary(agentId);

          this.logger.info(
            `Chat history fetch attempt ${attempt}: ${persistentHistory.length} messages${persistentSummary ? " + summary" : ""}`,
          );

          if (persistentHistory.length > 0 || persistentSummary) {
            // Convert database format to provider's IMessageInput format
            const providerHistory = persistentHistory.map((msg: any) => ({
              type: msg.type === "user" ? "user" : "bot",
              content: msg.content,
              timestamp: msg.timestamp || Date.now(),
              alias: msg.metadata?.alias || "O",
              language: msg.metadata?.language || "text",
              metadata: msg.metadata,
            }));

            // Prepend summary if it exists
            if (persistentSummary) {
              providerHistory.unshift({
                type: "user",
                content: `[System Note: This is a summary of our earlier conversation to preserve context]:\n${persistentSummary}`,
                timestamp: Date.now(),
                alias: "O",
                language: "text",
                metadata: { isSummary: true },
              });
            }

            this.logger.debug(
              `Synchronized ${persistentHistory.length} chat messages from database${persistentSummary ? " + summary" : ""}`,
            );

            // Send history to webview
            await this.currentWebView?.webview.postMessage({
              type: "chat-history",
              message: JSON.stringify(providerHistory),
            });
          } else {
            this.logger.debug(
              "No chat history found in database to synchronize",
            );
          }

          return; // Success path exits the loop
        } catch (error: any) {
          const isBusy =
            typeof error?.message === "string" &&
            error.message.includes("Worker is busy");

          if (isBusy && attempt < maxAttempts) {
            this.logger.debug(
              "Chat history worker busy, retrying synchronization",
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            continue;
          }

          this.logger.warn(
            "Failed to synchronize chat history from database:",
            error,
          );
          return;
        }
      }
    })();

    try {
      await this.chatHistorySyncPromise;
    } finally {
      this.chatHistorySyncPromise = null;
    }
  }

  /**
   * Synchronize a specific session's history to the webview
   */
  protected async synchronizeSessionHistory(sessionId: string): Promise<void> {
    try {
      const history = await this.agentService.getSessionHistory(
        "agentId",
        sessionId,
      );

      if (history.length > 0) {
        // Convert database format to webview format
        const formattedHistory = history.map((msg: any) => ({
          type: msg.type === "user" ? "user" : "bot",
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
          alias: msg.metadata?.alias || "O",
          language: msg.metadata?.language || "text",
          metadata: msg.metadata,
        }));

        this.logger.debug(
          `Synchronized ${history.length} messages for session ${sessionId}`,
        );

        // Send history to webview
        await this.currentWebView?.webview.postMessage({
          type: "chat-history",
          message: JSON.stringify(formattedHistory),
        });
      } else {
        this.logger.debug(`No messages found for session ${sessionId}`);
        // Send empty history to clear webview
        await this.currentWebView?.webview.postMessage({
          type: "chat-history",
          message: JSON.stringify([]),
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to synchronize session history for ${sessionId}:`,
        error,
      );
    }
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
      let displayName: string = "";

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
      const news = await NewsService.getInstance().getUnreadNews();
      if (news.length > 0) {
        await this.currentWebView?.webview.postMessage({
          type: "news-update",
          payload: { news },
        });
      }
    } catch (error: any) {
      this.logger.error("Failed to synchronize news", error);
    }
  }

  private async setupMessageHandler(_view: vscode.WebviewView): Promise<void> {
    try {
      this.disposables.push(
        _view.webview.onDidReceiveMessage(async (message) => {
          let response: any;
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

                const payload = context
                  ? JSON.stringify(
                      `${message.message} \n context: ${context ?? ""}`,
                    )
                  : JSON.stringify(message.message);

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

              const messageAndSystemInstruction =
                await this.enhanceMessageWithCodebaseContext(
                  sanitizedMessage,
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
              } catch (error: any) {
                this.logger.error("Error during streaming", error);
                await this.currentWebView?.webview.postMessage({
                  type: "onStreamError",
                  payload: { requestId, error: error.message },
                });
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
                await this.synchronizeSessionHistory(this.currentSessionId);
              } else {
                // Sync legacy chat history if no active session
                await this.synchronizeChatHistoryFromDatabase();
              }
              await this.synchronizeNews();
              // Send current session info to webview
              await this.currentWebView?.webview.postMessage({
                type: "current-session",
                sessionId: this.currentSessionId,
              });
              break;
            case "request-chat-history": {
              await this.synchronizeChatHistoryFromDatabase();
              break;
            }
            case "news-mark-read": {
              const { ids } = message;
              if (ids && Array.isArray(ids)) {
                await NewsService.getInstance().markAsRead(ids);
                await this.synchronizeNews();
              }
              break;
            }
            case "news-refresh":
              await this.synchronizeNews();
              break;
            case "upload-file":
              await this.fileManager.uploadFileHandler();
              break;
            case "openExternal":
              if (message.text) {
                vscode.env.openExternal(vscode.Uri.parse(message.text));
              }
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
              // Notify webview that history has been cleared
              this.currentWebView?.webview.postMessage({
                command: "history-cleared",
              });
              this.logger.info("Chat history cleared");
              break;

            // Session Management Handlers
            case "get-sessions": {
              try {
                const sessions = await this.agentService.getSessions("agentId");
                await this.currentWebView?.webview.postMessage({
                  type: "sessions-list",
                  sessions,
                });
              } catch (error: any) {
                this.logger.error("Failed to get sessions:", error);
                await this.currentWebView?.webview.postMessage({
                  type: "sessions-list",
                  sessions: [],
                  error: error.message,
                });
              }
              break;
            }

            case "create-session": {
              try {
                const title = message.message?.title || "New Chat";
                const sessionId = await this.agentService.createSession(
                  "agentId",
                  title,
                );
                // Update current session tracking
                this.currentSessionId = sessionId;
                const sessions = await this.agentService.getSessions("agentId");
                await this.currentWebView?.webview.postMessage({
                  type: "session-created",
                  sessionId,
                  sessions,
                });
                // Clear the current chat display for the new session
                await this.currentWebView?.webview.postMessage({
                  type: "session-switched",
                  sessionId,
                  history: [],
                });
                this.logger.info(`Created new session: ${sessionId}`);
              } catch (error: any) {
                this.logger.error("Failed to create session:", error);
              }
              break;
            }

            case "switch-session": {
              try {
                const sessionId = message.message?.sessionId;
                if (!sessionId) {
                  throw new Error("Session ID is required");
                }
                await this.agentService.switchSession("agentId", sessionId);
                // Update current session tracking
                this.currentSessionId = sessionId;
                // Get the history for this session
                const history = await this.agentService.getSessionHistory(
                  "agentId",
                  sessionId,
                );
                // Convert to webview format
                const formattedHistory = history.map((msg: any) => ({
                  type: msg.type === "user" ? "user" : "bot",
                  content: msg.content,
                  timestamp: msg.timestamp || Date.now(),
                  alias: msg.metadata?.alias || "O",
                  language: msg.metadata?.language || "text",
                  metadata: msg.metadata,
                }));
                await this.currentWebView?.webview.postMessage({
                  type: "session-switched",
                  sessionId,
                  history: formattedHistory,
                });
                this.logger.info(`Switched to session: ${sessionId}`);
              } catch (error: any) {
                this.logger.error("Failed to switch session:", error);
              }
              break;
            }

            case "delete-session": {
              try {
                const sessionId = message.message?.sessionId;
                this.logger.info(`Attempting to delete session: ${sessionId}`);
                if (!sessionId) {
                  throw new Error("Session ID is required");
                }
                await this.agentService.deleteSession("agentId", sessionId);
                this.logger.info(`Deleted session from database: ${sessionId}`);
                // If we deleted the current session, clear tracking
                if (this.currentSessionId === sessionId) {
                  this.currentSessionId = null;
                }
                const sessions = await this.agentService.getSessions("agentId");
                this.logger.info(
                  `Remaining sessions after delete: ${sessions.length}`,
                );
                await this.currentWebView?.webview.postMessage({
                  type: "session-deleted",
                  sessionId,
                  sessions,
                });
                this.logger.info(`Deleted session: ${sessionId}`);
              } catch (error: any) {
                this.logger.error("Failed to delete session:", error);
              }
              break;
            }

            case "update-session-title": {
              try {
                const { sessionId, title } = message.message || {};
                if (!sessionId || !title) {
                  throw new Error("Session ID and title are required");
                }
                await this.agentService.updateSessionTitle(
                  "agentId",
                  sessionId,
                  title,
                );
                const sessions = await this.agentService.getSessions("agentId");
                await this.currentWebView?.webview.postMessage({
                  type: "session-title-updated",
                  sessionId,
                  sessions,
                });
                this.logger.info(
                  `Updated session title: ${sessionId} -> ${title}`,
                );
              } catch (error: any) {
                this.logger.error("Failed to update session title:", error);
              }
              break;
            }

            case "get-current-session": {
              try {
                const sessionId =
                  await this.agentService.getCurrentSession("agentId");
                await this.currentWebView?.webview.postMessage({
                  type: "current-session",
                  sessionId,
                });
              } catch (error: any) {
                this.logger.error("Failed to get current session:", error);
              }
              break;
            }

            case "update-user-info":
              // In the future update to updateUserPreferences
              this.orchestrator.publish("onUpdateUserPreferences", message);
              break;
            case "theme-change-event":
              // Handle theme change and store in user preferences
              this.logger.info(`Theme changed to: ${message.message}`);
              this.orchestrator.publish(
                "onUpdateThemePreferences",
                message.message,
                {
                  theme: message.message,
                },
              );
              break;

            case "font-family-change-event":
              // Handle font family change and update VS Code settings
              this.logger.info(`Font family changed to: ${message.message}`);
              await vscode.workspace
                .getConfiguration()
                .update(
                  "font.family",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "font-size-change-event":
              // Handle font size change and update VS Code settings
              this.logger.info(`Font size changed to: ${message.message}`);
              await vscode.workspace
                .getConfiguration()
                .update(
                  "chatview.font.size",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "nickname-change-event":
              // Handle nickname change and store in secret storage
              this.logger.info(`Nickname changed to: ${message.message}`);
              this.orchestrator.publish("onUpdateUserPreferences", {
                message: JSON.stringify({ username: message.message }),
              });
              break;

            case "streaming-change-event":
              // Handle streaming preference change
              this.logger.info(
                `Streaming preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.enableStreaming",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "compact-mode-change-event":
              this.logger.info(
                `Compact mode preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.compactMode",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "auto-approve-change-event":
              this.logger.info(
                `Auto-approve preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.autoApprove",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "allow-file-edits-change-event":
              this.logger.info(
                `Allow file edits preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.allowFileEdits",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "allow-terminal-change-event":
              this.logger.info(
                `Allow terminal preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.allowTerminal",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "verbose-logging-change-event":
              this.logger.info(
                `Verbose logging preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.verboseLogging",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "index-codebase-change-event":
              this.logger.info(
                `Index codebase preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.indexCodebase",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "context-window-change-event":
              this.logger.info(
                `Context window preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.contextWindow",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "include-hidden-change-event":
              this.logger.info(
                `Include hidden preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.includeHidden",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "max-file-size-change-event":
              this.logger.info(
                `Max file size preference changed to: ${message.message}`,
              );
              await vscode.workspace
                .getConfiguration()
                .update(
                  "codebuddy.maxFileSize",
                  message.message,
                  vscode.ConfigurationTarget.Global,
                );
              break;

            case "reindex-workspace-event":
              this.logger.info("Reindexing workspace...");
              // Trigger workspace reindexing
              vscode.commands.executeCommand("codebuddy.indexWorkspace");
              break;

            // Diff Review Commands
            case "get-pending-changes": {
              const { DiffReviewService } =
                await import("../services/diff-review.service");
              const diffService = DiffReviewService.getInstance();
              const pendingChanges = diffService.getAllPendingChanges();
              await this.currentWebView?.webview.postMessage({
                type: "pending-changes",
                changes: pendingChanges.map((c) => ({
                  id: c.id,
                  filePath: c.filePath,
                  timestamp: c.timestamp,
                  status: c.status,
                  isNewFile: c.isNewFile,
                })),
              });
              break;
            }

            case "get-recent-changes": {
              const { DiffReviewService } =
                await import("../services/diff-review.service");
              const diffService = DiffReviewService.getInstance();
              const recentChanges = diffService.getRecentChanges();
              await this.currentWebView?.webview.postMessage({
                type: "recent-changes",
                changes: recentChanges.map((c) => ({
                  id: c.id,
                  filePath: c.filePath,
                  timestamp: c.timestamp,
                  status: c.status,
                  isNewFile: c.isNewFile,
                })),
              });
              break;
            }

            case "apply-change": {
              const { DiffReviewService } =
                await import("../services/diff-review.service");
              const diffService = DiffReviewService.getInstance();
              try {
                const success = await diffService.applyChange(message.id);
                await this.currentWebView?.webview.postMessage({
                  type: "change-applied",
                  id: message.id,
                  success,
                });
              } catch (error: any) {
                await this.currentWebView?.webview.postMessage({
                  type: "change-applied",
                  id: message.id,
                  success: false,
                  error: error.message,
                });
              }
              break;
            }

            case "reject-change": {
              const { DiffReviewService } =
                await import("../services/diff-review.service");
              const diffService = DiffReviewService.getInstance();
              diffService.removePendingChange(message.id);
              await this.currentWebView?.webview.postMessage({
                type: "change-rejected",
                id: message.id,
              });
              break;
            }

            case "view-change-diff": {
              // Open the VS Code diff view for a pending change
              vscode.commands.executeCommand(
                "codebuddy.reviewChange",
                message.id,
                message.filePath,
              );
              break;
            }

            case "open-codebuddy-settings":
              // Open VS Code settings filtered to CodeBuddy settings
              this.logger.info("Opening CodeBuddy settings...");
              vscode.commands.executeCommand(
                "workbench.action.openSettings",
                "@ext:fiatinnovations.ola-code-buddy",
              );
              break;

            // Docker Model Runner Commands
            case "docker-enable-runner":
              try {
                const service = DockerModelService.getInstance();
                const result = await service.enableModelRunner();
                await this.currentWebView?.webview.postMessage({
                  type: "docker-runner-enabled",
                  success: result.success,
                  error: result.error,
                });
              } catch (error) {
                this.logger.error(
                  "Failed to enable Docker Model Runner",
                  error,
                );
              }
              break;

            case "docker-start-compose":
              try {
                const service = DockerModelService.getInstance();
                const result = await service.startComposeOllama();
                await this.currentWebView?.webview.postMessage({
                  type: "docker-compose-started",
                  success: result.success,
                  error: result.error,
                });
              } catch (error) {
                this.logger.error("Failed to start Docker Compose", error);
              }
              break;

            case "docker-pull-ollama-model":
              try {
                const service = DockerModelService.getInstance();
                const success = await service.pullOllamaModel(message.message);
                await this.currentWebView?.webview.postMessage({
                  type: "docker-model-pulled",
                  model: message.message,
                  success: success.success,
                  error: success.error,
                });
              } catch (error) {
                this.logger.error("Failed to pull Ollama model", error);
              }
              break;

            case "docker-pull-model":
              try {
                const service = DockerModelService.getInstance();
                const result = await service.pullModel(message.message);
                await this.currentWebView?.webview.postMessage({
                  type: "docker-model-pulled",
                  model: message.message,
                  success: result.success,
                  error: result.error,
                });
              } catch (error) {
                this.logger.error("Failed to pull Docker model", error);
                await this.currentWebView?.webview.postMessage({
                  type: "docker-model-pulled",
                  model: message.message,
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
              break;

            case "docker-delete-model":
              try {
                const service = DockerModelService.getInstance();
                const result = await service.deleteModel(message.message);
                await this.currentWebView?.webview.postMessage({
                  type: "docker-model-deleted",
                  model: message.message,
                  success: result.success,
                  error: result.error,
                });
              } catch (error) {
                this.logger.error("Failed to delete Docker model", error);
              }
              break;

            case "docker-use-model":
              try {
                const config = vscode.workspace.getConfiguration("local");

                // Determine if this is a Docker Model Runner model (ai/...) or Ollama model
                const isDockerModelRunner = message.message.startsWith("ai/");

                // For Docker Model Runner, use port 12434 and strip "ai/" prefix
                // For Ollama, use port 11434
                let baseUrl = isDockerModelRunner
                  ? "http://localhost:12434/engines/llama.cpp/v1"
                  : "http://localhost:11434/v1";

                // Fallback mechanism: If Model Runner (12434) is unreachable, try Ollama (11434)
                if (isDockerModelRunner) {
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(
                      () => controller.abort(),
                      1000,
                    );
                    await fetch("http://localhost:12434", {
                      method: "HEAD",
                      signal: controller.signal,
                    }).catch(() => {
                      // Fetch failed (network error or timeout)
                      throw new Error("Connection failed");
                    });
                    clearTimeout(timeoutId);
                  } catch (error) {
                    this.logger.info(
                      "Docker Model Runner (12434) unreachable, falling back to Ollama (11434)",
                    );
                    baseUrl = "http://localhost:11434/v1";
                  }
                }

                // Strip "ai/" prefix for model name when using Docker Model Runner
                // Note: If we fell back to Ollama (11434), we should ALSO strip "ai/" prefix
                // because standard Ollama doesn't expect "ai/" prefixed model names usually,
                // BUT Docker Model Runner models are named "ai/user/model".
                // If the user has a local Ollama model that happens to be the same, fine.
                // However, often "ai/" models are specific to Docker Model Runner.
                // Let's assume stripping is correct for both if we are in this block.
                const modelName = isDockerModelRunner
                  ? message.message.replace(/^ai\//, "")
                  : message.message;

                // Update local.model setting
                await config.update(
                  "model",
                  modelName,
                  vscode.ConfigurationTarget.Global,
                );

                // Update baseUrl for Docker Model Runner
                await config.update(
                  "baseUrl",
                  baseUrl,
                  vscode.ConfigurationTarget.Global,
                );

                // Also ensure Primary Model is set to Local
                const mainConfig =
                  vscode.workspace.getConfiguration("generativeAi");
                await mainConfig.update(
                  "option",
                  "Local",
                  vscode.ConfigurationTarget.Global,
                );

                this.logger.info(
                  `Local model configured: ${modelName} at ${baseUrl}`,
                );

                await this.currentWebView?.webview.postMessage({
                  type: "docker-model-selected",
                  model: message.message,
                  success: true,
                });
              } catch (error) {
                this.logger.error("Failed to set local model", error);
                await this.currentWebView?.webview.postMessage({
                  type: "docker-model-selected",
                  model: message.message,
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
              break;

            case "docker-get-models":
              try {
                const service = DockerModelService.getInstance();
                const models = await service.getModels();
                await this.currentWebView?.webview.postMessage({
                  type: "docker-models-list",
                  models,
                });
              } catch (error) {
                this.logger.error("Failed to get Docker models", error);
              }
              break;

            case "docker-get-local-model":
              try {
                const config = vscode.workspace.getConfiguration("local");
                const model = config.get<string>("model");
                await this.currentWebView?.webview.postMessage({
                  type: "docker-local-model",
                  model,
                });
              } catch (error) {
                this.logger.error("Failed to get local model config", error);
              }
              break;

            case "docker-check-ollama-status":
              try {
                const service = DockerModelService.getInstance();
                const running = await service.checkOllamaRunning();
                await this.currentWebView?.webview.postMessage({
                  type: "docker-ollama-status",
                  running,
                });
              } catch (error) {
                this.logger.error("Failed to check Ollama status", error);
              }
              break;

            case "docker-check-status":
              try {
                const service = DockerModelService.getInstance();
                const available = await service.checkModelRunnerAvailable();
                await this.currentWebView?.webview.postMessage({
                  type: "docker-status",
                  available,
                });
              } catch (error) {
                this.logger.error("Failed to check Docker status", error);
              }
              break;

            // MCP Settings Commands
            case "mcp-get-servers":
              try {
                this.logger.info("Fetching MCP servers data...");
                const mcpService = MCPService.getInstance();
                const stats = mcpService.getStat();
                const allTools = await mcpService.getAllTools();

                // Get server configurations
                const serverConfigs = getConfigValue("mcp.servers") || {};

                // Build servers data with tools
                const servers = Object.entries(serverConfigs).map(
                  ([id, config]: [string, any]) => {
                    const serverTools = allTools.filter(
                      (t) => t.serverName === id,
                    );
                    const client = mcpService.getClient(id);

                    // Determine status
                    let status:
                      | "connected"
                      | "disconnected"
                      | "connecting"
                      | "error" = "disconnected";
                    if (client) {
                      const clientState =
                        client.getState?.() || MCPClientState.DISCONNECTED;
                      if (clientState === MCPClientState.CONNECTED)
                        status = "connected";
                      else if (clientState === MCPClientState.CONNECTING)
                        status = "connecting";
                      else if (clientState === MCPClientState.ERROR)
                        status = "error";
                    }

                    // Get disabled tools from config
                    const disabledTools =
                      getConfigValue(`mcp.disabledTools.${id}`) || [];

                    return {
                      id,
                      name: id
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                      description: config.description || `MCP Server: ${id}`,
                      status,
                      enabled: config.enabled !== false,
                      toolCount: serverTools.length,
                      tools: serverTools.map((t) => ({
                        name: t.name,
                        description: t.description,
                        serverName: t.serverName,
                        enabled: !disabledTools.includes(t.name),
                      })),
                    };
                  },
                );

                // If no custom config, show docker-gateway
                if (
                  Object.keys(serverConfigs).length === 0 &&
                  stats.isGatewayMode
                ) {
                  const gatewayTools = allTools.filter(
                    (t) => t.serverName === "docker-gateway",
                  );
                  const disabledTools =
                    getConfigValue("mcp.disabledTools.docker-gateway") || [];
                  servers.push({
                    id: "docker-gateway",
                    name: "Docker MCP Gateway",
                    description: "Docker MCP Gateway (unified catalog)",
                    status:
                      stats.connectedServers > 0 ? "connected" : "disconnected",
                    enabled: true,
                    toolCount: gatewayTools.length,
                    tools: gatewayTools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      serverName: t.serverName,
                      enabled: !disabledTools.includes(t.name),
                    })),
                  });
                }

                this.currentWebView?.webview.postMessage({
                  command: "mcp-servers-data",
                  data: { servers },
                });
              } catch (error: any) {
                this.logger.error("Failed to fetch MCP servers:", error);
                this.currentWebView?.webview.postMessage({
                  command: "mcp-servers-data",
                  data: { servers: [], error: error.message },
                });
              }
              break;

            case "mcp-toggle-server":
              try {
                const { serverName, enabled } = message.message || {};
                this.logger.info(
                  `Toggling MCP server ${serverName}: ${enabled}`,
                );

                // Update the server config
                const currentServers = getConfigValue("mcp.servers") || {};
                if (currentServers[serverName]) {
                  currentServers[serverName].enabled = enabled;
                  await vscode.workspace
                    .getConfiguration("ola-code-buddy")
                    .update(
                      "mcp.servers",
                      currentServers,
                      vscode.ConfigurationTarget.Global,
                    );
                }

                // Notify UI of the change
                this.currentWebView?.webview.postMessage({
                  command: "mcp-server-updated",
                  data: { serverName, enabled },
                });

                // Reload MCP service if needed
                if (!enabled) {
                  const mcpService = MCPService.getInstance();
                  const client = mcpService.getClient(serverName);
                  if (client) {
                    await client.disconnect();
                  }
                }
              } catch (error: any) {
                this.logger.error("Failed to toggle MCP server:", error);
              }
              break;

            case "mcp-toggle-tool":
              try {
                const { serverName, toolName, enabled } = message.message || {};
                this.logger.info(
                  `Toggling MCP tool ${serverName}.${toolName}: ${enabled}`,
                );

                // Get current disabled tools for this server
                const disabledToolsKey = `mcp.disabledTools.${serverName}`;
                let disabledTools: string[] =
                  getConfigValue(disabledToolsKey) || [];

                if (enabled) {
                  // Remove from disabled list
                  disabledTools = disabledTools.filter((t) => t !== toolName);
                } else {
                  // Add to disabled list
                  if (!disabledTools.includes(toolName)) {
                    disabledTools.push(toolName);
                  }
                }

                // Update config
                await vscode.workspace
                  .getConfiguration("ola-code-buddy")
                  .update(
                    disabledToolsKey,
                    disabledTools,
                    vscode.ConfigurationTarget.Global,
                  );

                // Notify UI
                this.currentWebView?.webview.postMessage({
                  command: "mcp-tool-updated",
                  data: { serverName, toolName, enabled },
                });
              } catch (error: any) {
                this.logger.error("Failed to toggle MCP tool:", error);
              }
              break;

            case "mcp-refresh-tools":
              try {
                this.logger.info("Refreshing MCP tools...");
                const mcpService = MCPService.getInstance();
                await mcpService.refreshTools();

                // Re-fetch and send updated data
                const stats = mcpService.getStat();
                const allTools = await mcpService.getAllTools();
                const serverConfigs = getConfigValue("mcp.servers") || {};

                const servers = Object.entries(serverConfigs).map(
                  ([id, config]: [string, any]) => {
                    const serverTools = allTools.filter(
                      (t) => t.serverName === id,
                    );
                    const client = mcpService.getClient(id);

                    let status:
                      | "connected"
                      | "disconnected"
                      | "connecting"
                      | "error" = "disconnected";
                    if (client) {
                      const clientState =
                        client.getState?.() || MCPClientState.DISCONNECTED;
                      if (clientState === MCPClientState.CONNECTED)
                        status = "connected";
                      else if (clientState === MCPClientState.CONNECTING)
                        status = "connecting";
                      else if (clientState === MCPClientState.ERROR)
                        status = "error";
                    }

                    const disabledTools =
                      getConfigValue(`mcp.disabledTools.${id}`) || [];

                    return {
                      id,
                      name: id
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                      description: config.description || `MCP Server: ${id}`,
                      status,
                      enabled: config.enabled !== false,
                      toolCount: serverTools.length,
                      tools: serverTools.map((t) => ({
                        name: t.name,
                        description: t.description,
                        serverName: t.serverName,
                        enabled: !disabledTools.includes(t.name),
                      })),
                    };
                  },
                );

                // Docker gateway fallback
                if (
                  Object.keys(serverConfigs).length === 0 &&
                  stats.isGatewayMode
                ) {
                  const gatewayTools = allTools.filter(
                    (t) => t.serverName === "docker-gateway",
                  );
                  const disabledTools =
                    getConfigValue("mcp.disabledTools.docker-gateway") || [];
                  servers.push({
                    id: "docker-gateway",
                    name: "Docker MCP Gateway",
                    description: "Docker MCP Gateway (unified catalog)",
                    status:
                      stats.connectedServers > 0 ? "connected" : "disconnected",
                    enabled: true,
                    toolCount: gatewayTools.length,
                    tools: gatewayTools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      serverName: t.serverName,
                      enabled: !disabledTools.includes(t.name),
                    })),
                  });
                }

                this.currentWebView?.webview.postMessage({
                  command: "mcp-servers-data",
                  data: { servers },
                });

                vscode.window.showInformationMessage(
                  `MCP tools refreshed: ${allTools.length} tools available`,
                );
              } catch (error: any) {
                this.logger.error("Failed to refresh MCP tools:", error);
                this.currentWebView?.webview.postMessage({
                  command: "mcp-servers-data",
                  data: { servers: [], error: error.message },
                });
              }
              break;

            case "get-local-models":
              try {
                this.logger.info("Fetching local models...");
                const localModelService = LocalModelService.getInstance();
                const models = await localModelService.getLocalModels();
                const isModelRunnerAvailable =
                  await localModelService.isModelRunnerAvailable();
                const isOllamaRunning =
                  await localModelService.isOllamaRunning();

                this.currentWebView?.webview.postMessage({
                  command: "local-models-data",
                  data: {
                    models,
                    isModelRunnerAvailable,
                    isOllamaRunning,
                  },
                });
              } catch (error: any) {
                this.logger.error("Failed to fetch local models:", error);
                this.currentWebView?.webview.postMessage({
                  command: "local-models-data",
                  data: { models: [], error: error.message },
                });
              }
              break;

            case "open-mcp-settings":
              // Open VS Code settings filtered to MCP settings
              this.logger.info("Opening MCP settings...");
              vscode.commands.executeCommand(
                "workbench.action.openSettings",
                "@ext:fiatinnovations.ola-code-buddy mcp",
              );
              break;

            // Rules & Subagents Commands
            case "rules-get-all":
              try {
                const rules = getConfigValue("rules.customRules") || [];
                const systemPrompt =
                  getConfigValue("rules.customSystemPrompt") || "";
                const subagentConfig = getConfigValue("rules.subagents") || {};

                // Get project rules status
                const projectRulesService = ProjectRulesService.getInstance();
                const projectRulesStatus = projectRulesService.getStatus();

                // Default subagents
                const defaultSubagents = [
                  {
                    id: "code-analyzer",
                    name: "Code Analyzer",
                    description:
                      "Deep code analysis, security scanning, and architecture review",
                    enabled: true,
                    toolPatterns: [
                      "analyze",
                      "lint",
                      "security",
                      "complexity",
                      "quality",
                      "ast",
                      "parse",
                      "check",
                      "scan",
                      "review",
                    ],
                  },
                  {
                    id: "doc-writer",
                    name: "Documentation Writer",
                    description:
                      "Generate comprehensive documentation and API references",
                    enabled: true,
                    toolPatterns: [
                      "search",
                      "read",
                      "generate",
                      "doc",
                      "api",
                      "reference",
                      "web",
                    ],
                  },
                  {
                    id: "debugger",
                    name: "Debugger",
                    description:
                      "Find and fix bugs with access to all available tools",
                    enabled: true,
                    toolPatterns: ["*"],
                  },
                  {
                    id: "file-organizer",
                    name: "File Organizer",
                    description:
                      "Restructure and organize project files and directories",
                    enabled: true,
                    toolPatterns: [
                      "file",
                      "directory",
                      "list",
                      "read",
                      "write",
                      "move",
                      "rename",
                      "delete",
                      "structure",
                      "organize",
                    ],
                  },
                ];

                // Merge saved config with defaults
                const subagents = defaultSubagents.map((s) => ({
                  ...s,
                  enabled: subagentConfig[s.id]?.enabled ?? s.enabled,
                }));

                this.currentWebView?.webview.postMessage({
                  command: "rules-data",
                  data: { rules, systemPrompt, subagents, projectRulesStatus },
                });
              } catch (error: any) {
                this.logger.error("Failed to fetch rules:", error);
              }
              break;

            case "rules-add":
              try {
                const newRule = message.message;
                if (newRule) {
                  const rules = getConfigValue("rules.customRules") || [];
                  const ruleWithId = {
                    ...newRule,
                    id: `rule-${Date.now()}`,
                    createdAt: Date.now(),
                  };
                  rules.push(ruleWithId);
                  await vscode.workspace
                    .getConfiguration("ola-code-buddy")
                    .update(
                      "rules.customRules",
                      rules,
                      vscode.ConfigurationTarget.Global,
                    );

                  this.logger.info(`Added custom rule: ${ruleWithId.name}`);
                  this.currentWebView?.webview.postMessage({
                    command: "rule-added",
                    data: { rule: ruleWithId },
                  });
                }
              } catch (error: any) {
                this.logger.error("Failed to add rule:", error);
              }
              break;

            case "rules-update":
              try {
                const { id, updates } = message.message || {};
                if (id) {
                  const rules = getConfigValue("rules.customRules") || [];
                  const index = rules.findIndex((r: any) => r.id === id);
                  if (index !== -1) {
                    rules[index] = { ...rules[index], ...updates };
                    await vscode.workspace
                      .getConfiguration("ola-code-buddy")
                      .update(
                        "rules.customRules",
                        rules,
                        vscode.ConfigurationTarget.Global,
                      );

                    this.logger.info(`Updated rule: ${id}`);
                  }
                }
              } catch (error: any) {
                this.logger.error("Failed to update rule:", error);
              }
              break;

            case "rules-delete":
              try {
                const { id } = message.message || {};
                if (id) {
                  const rules = getConfigValue("rules.customRules") || [];
                  const filteredRules = rules.filter((r: any) => r.id !== id);
                  await vscode.workspace
                    .getConfiguration("ola-code-buddy")
                    .update(
                      "rules.customRules",
                      filteredRules,
                      vscode.ConfigurationTarget.Global,
                    );

                  this.logger.info(`Deleted rule: ${id}`);
                }
              } catch (error: any) {
                this.logger.error("Failed to delete rule:", error);
              }
              break;

            case "rules-toggle":
              try {
                const { id, enabled } = message.message || {};
                if (id !== undefined) {
                  const rules = getConfigValue("rules.customRules") || [];
                  const index = rules.findIndex((r: any) => r.id === id);
                  if (index !== -1) {
                    rules[index].enabled = enabled;
                    await vscode.workspace
                      .getConfiguration("ola-code-buddy")
                      .update(
                        "rules.customRules",
                        rules,
                        vscode.ConfigurationTarget.Global,
                      );

                    this.logger.info(`Toggled rule ${id}: ${enabled}`);
                  }
                }
              } catch (error: any) {
                this.logger.error("Failed to toggle rule:", error);
              }
              break;

            case "subagents-get-all":
              // Handled by rules-get-all
              break;

            case "subagents-toggle":
              try {
                const { id, enabled } = message.message || {};
                if (id) {
                  const subagentConfig =
                    getConfigValue("rules.subagents") || {};
                  subagentConfig[id] = { ...subagentConfig[id], enabled };
                  await vscode.workspace
                    .getConfiguration("ola-code-buddy")
                    .update(
                      "rules.subagents",
                      subagentConfig,
                      vscode.ConfigurationTarget.Global,
                    );

                  this.logger.info(`Toggled subagent ${id}: ${enabled}`);
                }
              } catch (error: any) {
                this.logger.error("Failed to toggle subagent:", error);
              }
              break;

            case "project-rules-open":
              try {
                const projectRulesService = ProjectRulesService.getInstance();
                await projectRulesService.openRulesFile();
              } catch (error: any) {
                this.logger.error("Failed to open project rules:", error);
              }
              break;

            case "project-rules-create":
              try {
                const projectRulesService = ProjectRulesService.getInstance();
                await projectRulesService.createRulesFile();
              } catch (error: any) {
                this.logger.error("Failed to create project rules:", error);
              }
              break;

            case "project-rules-reload":
              try {
                const projectRulesService = ProjectRulesService.getInstance();
                await projectRulesService.reloadRules();
                // Send updated status to webview
                const status = projectRulesService.getStatus();
                this.currentWebView?.webview.postMessage({
                  command: "project-rules-status",
                  data: status,
                });
              } catch (error: any) {
                this.logger.error("Failed to reload project rules:", error);
              }
              break;

            case "project-rules-get-status":
              try {
                const projectRulesService = ProjectRulesService.getInstance();
                const status = projectRulesService.getStatus();
                this.currentWebView?.webview.postMessage({
                  command: "project-rules-status",
                  data: status,
                });
              } catch (error: any) {
                this.logger.error("Failed to get project rules status:", error);
              }
              break;

            case "system-prompt-update":
              try {
                const { prompt } = message.message || {};
                await vscode.workspace
                  .getConfiguration("ola-code-buddy")
                  .update(
                    "rules.customSystemPrompt",
                    prompt || "",
                    vscode.ConfigurationTarget.Global,
                  );

                this.logger.info("Updated custom system prompt");
              } catch (error: any) {
                this.logger.error("Failed to update system prompt:", error);
              }
              break;

            // Phase 5: Performance & Production Commands
            case "showPerformanceReport":
              if (this.performanceProfiler) {
                const report = this.performanceProfiler.getPerformanceReport();
                const stats = this.performanceProfiler.getStats();
                await this.sendResponse(
                  `
                **Performance Report** 📊

                • **Search Performance**: ${report.avgSearchLatency.toFixed(0)}ms avg, ${report.p95SearchLatency.toFixed(0)}ms P95
                • **Indexing Throughput**: ${report.avgIndexingThroughput.toFixed(1)} items/sec
                • **Memory Usage**: ${report.avgMemoryUsage.toFixed(0)}MB
                • **Cache Hit Rate**: ${(report.cacheHitRate * 100).toFixed(1)}%
                • **Error Rate**: ${(report.errorRate * 100).toFixed(2)}%

                **Targets**: Search <500ms, Memory <500MB, Errors <5%
                **Status**: ${stats.searchLatency.count > 0 ? "✅ Active" : "⚠️ Limited Data"}
                `.trim(),
                  "bot",
                );
              } else {
                await this.sendResponse(
                  "Performance profiler not available",
                  "bot",
                );
              }
              break;

            case "clearCache":
              if (this.enhancedCacheManager) {
                const type = message.data?.type || "all";
                await this.enhancedCacheManager.clearCache(type);
                const cacheInfo = this.enhancedCacheManager.getCacheInfo();
                await this.sendResponse(
                  `
                **Cache Cleared** 🧹

                • **Type**: ${type}
                • **Remaining Memory**: ${cacheInfo.total.memoryMB.toFixed(1)}MB
                • **Hit Rate**: ${(cacheInfo.total.hitRate * 100).toFixed(1)}%
                `.trim(),
                  "bot",
                );
              } else {
                await this.sendResponse(
                  "Enhanced cache manager not available",
                  "bot",
                );
              }
              break;

            case "reduceBatchSize":
              if (this.vectorConfigManager) {
                const config = this.vectorConfigManager.getConfig();
                const currentBatchSize = config.batchSize;
                const newBatchSize = Math.max(
                  5,
                  Math.floor(currentBatchSize * 0.7),
                );
                await this.vectorConfigManager.updateConfig(
                  "batchSize",
                  newBatchSize,
                );
                await this.sendResponse(
                  `
                **Batch Size Reduced** ⚡

                • **Previous**: ${currentBatchSize}
                • **New**: ${newBatchSize}
                • **Impact**: Lower memory usage, potentially slower indexing
                `.trim(),
                  "bot",
                );
              } else {
                await this.sendResponse(
                  "Configuration manager not available",
                  "bot",
                );
              }
              break;

            case "emergencyStop":
              if (this.productionSafeguards) {
                // Emergency stop will be handled by the safeguards service
                await this.sendResponse(
                  "🚨 **Emergency Stop Activated** - All vector operations have been stopped due to resource concerns",
                  "bot",
                );
              } else {
                await this.sendResponse(
                  "Production safeguards not available",
                  "bot",
                );
              }
              break;

            case "resumeFromEmergencyStop":
              if (this.productionSafeguards) {
                // Resume will be handled by the safeguards service
                await this.sendResponse(
                  "✅ **Resumed from Emergency Stop** - Vector operations are now active",
                  "bot",
                );
              } else {
                await this.sendResponse(
                  "Production safeguards not available",
                  "bot",
                );
              }
              break;

            case "optimizePerformance":
              if (this.performanceProfiler && this.enhancedCacheManager) {
                // Use public method to optimize configuration
                const optimizedConfig =
                  this.performanceProfiler.getOptimizedConfig();
                await this.enhancedCacheManager.optimizeConfiguration();

                const report = this.performanceProfiler.getPerformanceReport();
                await this.sendResponse(
                  `
                **Performance Optimized** ⚡

                • **Memory Usage**: ${report.avgMemoryUsage.toFixed(0)}MB
                • **Cache Hit Rate**: ${(report.cacheHitRate * 100).toFixed(1)}%
                • **Search Latency**: ${report.avgSearchLatency.toFixed(0)}ms
                • **Configuration**: Automatically tuned based on system resources
                `.trim(),
                  "bot",
                );
              } else {
                await this.sendResponse(
                  "Performance optimization services not available",
                  "bot",
                );
              }
              break;

            default:
              throw new Error("Unknown command");
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

  async categorizeQuestion(userQuestion: string): Promise<
    | {
        isCodebaseRelated: boolean;
        categories: string[];
        confidence: "high" | "medium" | "low";
      }
    | undefined
  > {
    const prompt = `You are an AI copilot expert in analyzing user questions to distinguish between codebase-specific queries and general knowledge questions. Given a user's question, determine if it is related to analyzing or querying details within a specific codebase (e.g., "how was authentication handled within this application" is codebase-related because it asks about implementation in a particular code context). If it's a general definition or non-code-specific question (e.g., "what is MCP, model context protocol" is not codebase-related because it's seeking a general explanation), classify it accordingly.

                    Analyze the question to provide context about what type of codebase information is needed:
                    - If codebase-related, extract relevant categories (e.g., "authentication", "database integration", "API endpoints") as strings in an array. These should represent key concepts or areas in the codebase that the question targets.
                    - If not codebase-related, use an empty array for categories.
                    - Assign a confidence level: "high" for clear cases, "medium" for ambiguous, "low" for uncertain.

                    Focus on:
                    - Codebase-related: Questions about code structure, implementation, feature handling, or specifics in "this application", "codebase", or implied project context.
                    - Not codebase-related: General definitions, acronyms, protocols, or abstract concepts without reference to a specific code instance.
                    - Edge cases: If the question implies code analysis (e.g., "how does authentication work here"), set isCodebaseRelated to true with appropriate categories; if purely explanatory (e.g., "define OAuth"), set to false.
                    - Categories: Be concise, 1-5 items max, directly derived from the question's core topics.
                    - Confidence: Base on clarity—e.g., explicit "in this codebase" is high; vague implications are medium/low.

                    Questions like, what is MCP (Model Context Protocol) and A2A (Agent 2 Agent protocol), how do I use them together. These type of questions are not current codebase related question. These are general knowledge questions. Understand the tone and what the user is asking for.

                    User question: "${userQuestion}"

                    Output exactly as a JSON object in this format, nothing else (no explanations, no additional text)
                    Output format:
                    {
                      "isCodebaseRelated": true/false,
                      "categories": [architectural, debugging],
                      "confidence": "high" | "medium" | "low"
                    }`;

    try {
      const response = await this.groqLLM?.generateText(prompt);
      if (!response) {
        throw new Error("No response from Groq LLM");
      }
      const terms = JSON.parse(response.replace(/```/g, "").trim());

      return terms;
    } catch (error) {
      this.logger.error("Error generating search terms:", error);
      return undefined;
    }
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
    try {
      const categorizedQuestion = await this.categorizeQuestion(message);
      const questionAnalysis =
        categorizedQuestion ??
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

      // Load content of user-selected files (@ mentions)
      let userSelectedFileContents: Map<string, string> | undefined;
      if (userSelectedFiles && userSelectedFiles.length > 0) {
        userSelectedFileContents =
          await this.fileService.getFilesContent(userSelectedFiles);
        this.logger.info(
          `Loaded ${userSelectedFileContents?.size || 0} user-selected files for context`,
        );
      }

      // Create enhanced prompt using the dedicated service
      const promptContext: PromptContext = {
        questionAnalysis: {
          ...questionAnalysis,
          confidence:
            typeof questionAnalysis.confidence === "string"
              ? this.convertConfidenceToNumber(questionAnalysis.confidence)
              : questionAnalysis.confidence,
        },
        userSelectedFileContents,
        modelName: modelName || "default",
      };

      const enhancedMessage =
        await this.promptBuilderService.createEnhancedPrompt(
          message,
          promptContext,
        );

      return { systemInstruction: enhancedMessage, userMessage: message };
    } catch (error: any) {
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
      this.logger.info(error);
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
    return await this.chatHistoryManager.formatChatHistory(
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
    return await this.chatHistoryManager.getPruningStats(key);
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
    return await this.chatHistoryManager.initializeHistory(key);
  }

  /**
   * Converts string-based confidence levels to numerical values
   */
  private convertConfidenceToNumber(confidence: string): number {
    switch (confidence.toLowerCase()) {
      case "high":
        return 0.9;
      case "medium":
        return 0.7;
      case "low":
        return 0.4;
      default:
        return 0.7;
    }
  }

  // Example of a generateSummary function
  async generateSummaryForModel(
    historyToSummarize: any[],
  ): Promise<string | undefined> {
    const summarizationPrompt = `
    The following is a conversation history. Please provide a concise summary of the key information, decisions, and topics discussed. 
    Focus on retaining facts, names, and important context that would be necessary to continue the conversation without confusion.

    CONVERSATION HISTORY:
    ${historyToSummarize.map((msg) => `${msg.role}: ${msg.parts[0].text}`).join("\n")}
  `;

    const response = await this.groqLLM?.generateText(summarizationPrompt);
    if (!response) {
      undefined;
    }
    return response;
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
    // --- 1. Calculate initial token count (same as before) ---
    const systemInstructionTokens =
      systemInstruction.length > 0
        ? await this.getTokenCounts(systemInstruction)
        : 0;

    const historyWithTokens = await Promise.all(
      history.map(async (msg) => ({
        message: msg,
        tokens: await this.getTokenCounts(
          msg.parts ? msg.parts[0].text : msg.content,
        ),
      })),
    );

    const currentTokenCount =
      systemInstructionTokens +
      historyWithTokens.reduce((sum, item) => sum + item.tokens, 0);
    this.logger.info(
      `Initial token count (history + system instruction): ${currentTokenCount}`,
    );

    if (currentTokenCount <= maxTokens) {
      this.logger.info("Token count is within the limit. No pruning needed.");
      return history;
    }

    this.logger.info(
      `Token count ${currentTokenCount} exceeds limit of ${maxTokens}. Attempting summarization.`,
    );

    // --- 3. Partition the history for summarization ---
    // We'll keep the last 4 messages (2 user/model turns) for recent context. This is configurable.
    const MESSAGES_TO_KEEP_RECENT = 4;
    // We need a minimum number of messages to make summarization worthwhile.
    const MIN_MESSAGES_FOR_SUMMARY = MESSAGES_TO_KEEP_RECENT + 2; // e.g., at least 3 turns

    if (historyWithTokens.length < MIN_MESSAGES_FOR_SUMMARY) {
      this.logger.warn(
        "History is too short to summarize. Falling back to simple pruning.",
      );
      // Fallback to the simple pruning logic from the original function
      return this.pruneChatHistory(history, maxTokens, systemInstruction);
    }

    const sliceIndex = historyWithTokens.length - MESSAGES_TO_KEEP_RECENT;
    const messagesToSummarize = historyWithTokens.slice(0, sliceIndex);
    const recentMessages = historyWithTokens.slice(sliceIndex);

    this.logger.info(
      `Summarizing ${messagesToSummarize.length} messages and keeping ${recentMessages.length} recent messages.`,
    );

    // --- 4. Generate the summary ---
    const summaryText = await this.generateSummaryForModel(
      messagesToSummarize.map((item) => item.message),
    );

    // Save summary if agentId is provided
    if (summaryText && agentId) {
      await this.chatHistoryManager.saveSummary(agentId, summaryText);
      this.logger.info(`Saved chat summary for agent ${agentId}`);
    }

    const summaryTokens = await this.getTokenCounts(summaryText ?? "");

    let summaryMessage;

    // --- 5. Reconstruct the history with the summary ---
    const geminiSummary = {
      role: "user",
      parts: [
        {
          text: `[System Note: This is a summary of our earlier conversation to preserve context]:\n${summaryText}`,
        },
      ],
    };

    const anthropicOrGroqSummary = {
      role: "user",
      content: `[System Note: This is a summary of our earlier conversation to preserve context]:\n${summaryText}`,
    };

    if (history[0].parts) {
      summaryMessage = geminiSummary;
    } else {
      summaryMessage = anthropicOrGroqSummary;
    }

    const newHistoryWithTokens = [
      { message: summaryMessage, tokens: summaryTokens },
      ...recentMessages,
    ];

    // --- 6. Recalculate token count and perform final pruning if necessary (Fallback) ---
    let newTotalTokens =
      systemInstructionTokens +
      newHistoryWithTokens.reduce((sum, item) => sum + item.tokens, 0);

    this.logger.info(`History summarized. New token count: ${newTotalTokens}`);

    // If we're *still* over the limit, prune the oldest messages from the *new* history
    while (newTotalTokens > maxTokens && newHistoryWithTokens.length >= 2) {
      this.logger.warn(
        `Token count ${newTotalTokens} still exceeds limit after summarization. Pruning oldest message from new history...`,
      );
      // Remove the summary or the oldest "recent" message. It must start with a user message.
      // The summary is a 'user' role, so this logic is sound.
      const userMessage = newHistoryWithTokens.shift()!;
      const modelMessage = newHistoryWithTokens.shift()!;
      newTotalTokens -= userMessage.tokens + modelMessage.tokens;
    }

    // --- 7. Final checks and return ---
    // Ensure the history starts with a 'user' role. The summary message we created has the 'user' role.
    if (
      newHistoryWithTokens.length > 0 &&
      newHistoryWithTokens[0].message.role !== "user"
    ) {
      this.logger.error(
        "History unexpectedly does not start with 'user' after summarization. Removing leading model message.",
      );
      newHistoryWithTokens.shift();
    }

    return newHistoryWithTokens.map((item) => item.message);
  }

  async pruneChatHistory(
    history: any[],
    maxTokens: number,
    systemInstruction: string,
  ): Promise<any[]> {
    try {
      const mutableHistory = [...history];
      while (mutableHistory.length > 0 && mutableHistory[0].role !== "user") {
        this.logger.warn(
          `History does not start with 'user'. Removing oldest message to correct pattern.`,
        );
        mutableHistory.shift();
      }

      if (mutableHistory.length === 0) {
        this.logger.warn(
          "History is empty after initial validation. Starting fresh.",
        );
        return [];
      }

      const systemInstructionTokens = await this.getTokenCounts(
        systemInstruction || "",
      );

      const historyWithTokens = await Promise.all(
        mutableHistory.map(async (msg) => ({
          message: msg,
          tokens: await this.getTokenCounts(
            (msg.parts ? msg.parts[0].text : msg.content) || "",
          ),
        })),
      );

      let currentTokenCount =
        systemInstructionTokens +
        historyWithTokens.reduce((sum, item) => sum + item.tokens, 0);
      this.logger.info(
        `Initial token count (history + system instruction): ${currentTokenCount}`,
      );

      while (currentTokenCount > maxTokens && historyWithTokens.length >= 2) {
        this.logger.info(
          `Token count ${currentTokenCount} exceeds limit of ${maxTokens}. Removing oldest user-model pair...`,
        );

        const userMessage = historyWithTokens.shift()!;
        const modelMessage = historyWithTokens.shift()!;

        const tokensRemoved = userMessage.tokens + modelMessage.tokens;
        currentTokenCount -= tokensRemoved;

        this.logger.info(
          `Removed pair with ${tokensRemoved} tokens. New token count: ${currentTokenCount}`,
        );
      }

      if (currentTokenCount > maxTokens) {
        this.logger.warn(
          `Token count ${currentTokenCount} still exceeds limit after pruning. This might happen if the last remaining messages are very large. Proceeding with current history.`,
        );
      }

      if (historyWithTokens.length === 0) {
        this.logger.warn(`History is empty after pruning. Starting fresh.`);
      } else if (historyWithTokens[0].message.role !== "user") {
        this.logger.error(
          `History unexpectedly does not start with 'user' after pruning. Correcting...`,
        );
        while (
          historyWithTokens.length > 0 &&
          historyWithTokens[0].message.role !== "user"
        ) {
          const removed = historyWithTokens.shift()!;
          currentTokenCount -= removed.tokens;
        }
      }

      // 6. Return the pruned list of messages.
      return historyWithTokens.map((item) => item.message);
    } catch (error: any) {
      this.logger.info("Error while prunning chat history", error);
      throw error(error.message);
    }
    // 1. Create a mutable copy and ensure the history starts with a 'user' role.
  }

  abstract getTokenCounts(input: string): Promise<number>;
}
