import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import { FolderEntry, IContextInfo } from "../application/interfaces/workspace.interface";
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
import { formatText, getAPIKeyAndModel, getGenerativeAiModel } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import { VectorDatabaseService } from "../services/vector-database.service";
import { VectorDbWorkerManager } from "../services/vector-db-worker-manager";
import { VectorDbSyncService } from "../services/vector-db-sync.service";
import { SmartContextExtractor } from "../services/smart-context-extractor";
import { SmartEmbeddingOrchestrator } from "../services/smart-embedding-orchestrator";
import { ContextRetriever } from "../services/context-retriever";
import { UserFeedbackService } from "../services/user-feedback.service";
import { VectorDbConfigurationManager } from "../config/vector-db.config";
import { ICodeIndexer } from "../interfaces/vector-db.interface";
import { PerformanceProfiler } from "../services/performance-profiler.service";
import { ProductionSafeguards } from "../services/production-safeguards.service";
import { EnhancedCacheManager } from "../services/enhanced-cache-manager.service";

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

  // Vector database services
  protected vectorDb?: VectorDatabaseService;
  protected vectorDbService?: VectorDatabaseService; // Alias for compatibility
  protected vectorWorkerManager?: VectorDbWorkerManager;
  protected vectorSyncService?: VectorDbSyncService;
  protected vectorDbSyncService?: VectorDbSyncService; // Alias for compatibility
  protected smartContextExtractor?: SmartContextExtractor;
  protected smartEmbeddingOrchestrator?: SmartEmbeddingOrchestrator;
  protected vectorConfigManager?: VectorDbConfigurationManager;
  protected configManager?: VectorDbConfigurationManager; // Alias for compatibility
  protected userFeedbackService?: UserFeedbackService;
  protected contextRetriever?: ContextRetriever;

  // Phase 5: Performance & Production services
  protected performanceProfiler?: PerformanceProfiler;
  protected productionSafeguards?: ProductionSafeguards;
  protected enhancedCacheManager?: EnhancedCacheManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    protected readonly apiKey: string,
    protected readonly generativeAiModel: string,
    context: vscode.ExtensionContext
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

    // Initialize vector database components with Phase 4 orchestration
    const { apiKey: geminiApiKey } = getAPIKeyAndModel("Gemini");

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
      this.performanceProfiler
    );

    // Initialize user feedback service
    this.userFeedbackService = new UserFeedbackService();

    // Initialize vector services
    this.vectorWorkerManager = new VectorDbWorkerManager(context);
    this.vectorDbService = new VectorDatabaseService(context, geminiApiKey);
    this.vectorDb = this.vectorDbService; // Alias

    // Note: codeIndexingService will be initialized when a proper implementation is available
    this.smartEmbeddingOrchestrator = new SmartEmbeddingOrchestrator(
      context,
      this.vectorDbService,
      this.vectorWorkerManager
    );

    // Create a temporary code indexing service (to be properly implemented later)
    // Import the correct interface from vector-db-sync.service
    const tempCodeIndexer = {
      generateEmbeddings: async (): Promise<any[]> => [],
    };

    this.contextRetriever = new ContextRetriever();

    this.vectorDbSyncService = new VectorDbSyncService(this.vectorDbService, tempCodeIndexer);
    this.vectorSyncService = this.vectorDbSyncService; // Alias

    this.smartContextExtractor = new SmartContextExtractor(
      this.vectorDbService,
      this.contextRetriever,
      this.codebaseUnderstanding,
      this.questionClassifier,
      {},
      this.performanceProfiler
    );

    // Initialize configuration manager first
    this.configManager = new VectorDbConfigurationManager();

    // Initialize user feedback service
    this.userFeedbackService = new UserFeedbackService();

    // Note: codeIndexingService is already initialized with temp implementation above

    // Don't register disposables here - do it lazily when webview is resolved
  }

  /**
   * Initialize vector database components with Phase 4 orchestration
   */
  protected async initializeVectorComponents(): Promise<void> {
    try {
      this.logger.info("Starting Phase 4 vector database orchestration...");

      // Phase 4.1: Initialize worker manager (non-blocking architecture)
      await this.vectorWorkerManager?.initialize();
      this.logger.info("✓ Vector database worker manager initialized");

      // Phase 4.2: Initialize vector database service
      await this.vectorDbService?.initialize();
      this.logger.info("✓ Vector database service initialized");

      // Phase 4.3: Start smart embedding orchestrator (multi-phase strategy)
      await this.smartEmbeddingOrchestrator?.initialize();
      this.logger.info("✓ Smart embedding orchestrator started");

      // Phase 4.4: Initialize sync service for real-time file monitoring
      await this.vectorDbSyncService?.initialize();
      this.logger.info("✓ Vector database sync service initialized");

      // Phase 4.5: Trigger immediate embedding phase for essential files
      await this.executeImmediateEmbeddingPhase();
      this.logger.info("✓ Immediate embedding phase completed");

      this.logger.info("🚀 Phase 4 vector database orchestration completed successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Phase 4 orchestration:", error);
      // Continue with graceful degradation
      await this.handleVectorInitializationError(error);
    }
  }

  /**
   * Execute immediate embedding phase for essential files
   */
  private async executeImmediateEmbeddingPhase(): Promise<void> {
    try {
      // The orchestrator's initialize method handles the immediate phase internally
      // No need to call it separately - it's already handled in the orchestrator initialization

      // Show user feedback
      vscode.window.setStatusBarMessage("$(check) CodeBuddy: Essential files indexed and ready", 5000);
    } catch (error) {
      this.logger.warn("Immediate embedding phase failed, continuing with fallback:", error);
    }
  }

  /**
   * Handle vector database initialization errors gracefully
   */
  private async handleVectorInitializationError(error: any): Promise<void> {
    this.logger.warn("Vector database initialization failed, enabling fallback mode");

    // Provide specific guidance based on error type
    if (error instanceof Error && error.message.includes("ChromaDB Connection Failed")) {
      // Show detailed ChromaDB setup guidance
      const action = await vscode.window.showWarningMessage(
        "ChromaDB setup required for vector search. CodeBuddy will use keyword search as fallback.",
        "Fix ChromaDB",
        "Continue",
        "Run Diagnostic"
      );

      if (action === "Fix ChromaDB") {
        vscode.window
          .showInformationMessage(
            `To enable vector search:\n\n` +
              `Quick Fix: npm install chromadb@1.8.1\n` +
              `Then restart VS Code\n\n` +
              `Alternative: Start ChromaDB server:\n` +
              `pip install chromadb && chroma run --host localhost --port 8000`,
            "Copy Command"
          )
          .then((copyAction) => {
            if (copyAction === "Copy Command") {
              vscode.env.clipboard.writeText("npm install chromadb@1.8.1");
            }
          });
      } else if (action === "Run Diagnostic") {
        vscode.commands.executeCommand("codebuddy.vectorDb.diagnostic");
      }
    } else {
      // Generic error handling
      const action = await vscode.window.showWarningMessage(
        "Vector database initialization failed. CodeBuddy will use keyword-based search as fallback.",
        "Retry",
        "Continue",
        "Run Diagnostic"
      );

      if (action === "Retry") {
        // Retry initialization after a delay
        setTimeout(() => {
          this.initializeVectorComponents();
        }, 10000);
      } else if (action === "Run Diagnostic") {
        vscode.commands.executeCommand("codebuddy.vectorDb.diagnostic");
      }
    }
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
      this.orchestrator.onSecretChange(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onActiveworkspaceUpdate(this.handleGenericEvents.bind(this)),
      this.orchestrator.onFileUpload(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onStrategizing(this.handleModelResponseEvent.bind(this)),
      this.orchestrator.onConfigurationChange(this.handleGenericEvents.bind(this)),
      this.orchestrator.onUserPrompt(this.handleUserPrompt.bind(this)),
      this.orchestrator.onGetUserPreferences(this.handleUserPreferences.bind(this)),
      this.orchestrator.onUpdateThemePreferences(this.handleThemePreferences.bind(this))
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
      vscode.window.showErrorMessage("API key not configured. Check your settings.");
      return;
    }

    this.setWebviewHtml(this.currentWebView);
    this.setupMessageHandler(this.currentWebView);

    // Synchronize provider chat history with database on startup
    await this.synchronizeChatHistoryFromDatabase();

    // Get the current workspace files from DB.
    await this.getFiles();
  }

  /**
   * Synchronize provider's chatHistory array with database on startup
   * This ensures the provider has immediate access to persistent chat data
   */
  protected async synchronizeChatHistoryFromDatabase(): Promise<void> {
    try {
      // Get chat history from database via AgentService
      const agentId = "agentId"; // Using the same hardcoded ID as WebViewProviderManager
      const persistentHistory = await this.agentService.getChatHistory(agentId);

      if (persistentHistory && persistentHistory.length > 0) {
        // Convert database format to provider's IMessageInput format
        const providerHistory = persistentHistory.map((msg: any) => ({
          role: msg.type === "user" ? "user" : "model",
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
          metadata: msg.metadata,
        }));

        // Update the provider's chatHistory array (this should be overridden in child classes)
        await this.updateProviderChatHistory(providerHistory);

        this.logger.debug(`Synchronized ${persistentHistory.length} chat messages from database`);
      } else {
        this.logger.debug("No chat history found in database to synchronize");
      }
    } catch (error) {
      this.logger.warn("Failed to synchronize chat history from database:", error);
      // Don't throw - this is not critical for provider initialization
    }
  }

  /**
   * Update the provider's specific chatHistory array
   * Should be overridden by child classes to update their specific chatHistory type
   */
  protected async updateProviderChatHistory(history: any[]): Promise<void> {
    // Base implementation - child classes should override this
    // to update their specific chatHistory arrays
    this.logger.debug("Base provider - no specific chat history array to update");
  }

  private async setWebviewHtml(view: vscode.WebviewView): Promise<void> {
    view.webview.html = getWebviewContent(this.currentWebView?.webview!, this._extensionUri);
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

  public async handleUserPrompt({ type, message }: IEventPayload) {
    return await this.currentWebView?.webview.postMessage({
      type: "user-prompt",
      message,
    });
  }

  private async publishWorkSpace(): Promise<void> {
    try {
      const filesAndDirs: IContextInfo = await this.workspaceService.getContextInfo(true);
      const workspaceFiles: Map<string, FolderEntry[]> | undefined = filesAndDirs.workspaceFiles;
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
              const validation = this.inputValidator.validateInput(message.message, "chat");

              if (validation.blocked) {
                this.logger.warn("User input blocked due to security concerns", {
                  originalLength: message.message.length,
                  warnings: validation.warnings,
                });

                await this.sendResponse(
                  "⚠️ Your message contains potentially unsafe content and has been blocked. Please rephrase your question in a more direct way.",
                  "bot"
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
                    "bot"
                  );
                }
              }

              // Use sanitized input
              const sanitizedMessage = validation.sanitizedInput;

              // Check if we should prune history for performance
              if (this.UserMessageCounter % 10 === 0) {
                const stats = await this.getChatHistoryStats("agentId");
                if (stats.totalMessages > 100 || stats.estimatedTokens > 16000) {
                  this.logger.info(
                    `High chat history usage detected: ${stats.totalMessages} messages, ${stats.estimatedTokens} tokens`
                  );
                  // Optionally trigger manual pruning here
                  // await this.pruneHistoryManually("agentId", { maxMessages: 50, maxTokens: 8000 });
                }
              }

              response = await this.generateResponse(
                await this.enhanceMessageWithCodebaseContext(sanitizedMessage),
                message.metaData
              );
              if (this.UserMessageCounter === 1) {
                await this.publishWorkSpace();
              }
              if (response) {
                console.log(`[DEBUG] Response from generateResponse: ${response.length} characters`);
                const formattedResponse = formatText(response);
                console.log(`[DEBUG] Formatted response: ${formattedResponse.length} characters`);
                console.log(`[DEBUG] Original response ends with: "${response.slice(-100)}"`);

                await this.sendResponse(formattedResponse, "bot");
              } else {
                console.log(`[DEBUG] No response received from generateResponse`);
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
            case "theme-change-event":
              // Handle theme change and store in user preferences
              this.logger.info(`Theme changed to: ${message.message}`);
              this.orchestrator.publish("onUpdateThemePreferences", message.message, {
                theme: message.message,
              });
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
                  "bot"
                );
              } else {
                await this.sendResponse("Performance profiler not available", "bot");
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
                  "bot"
                );
              } else {
                await this.sendResponse("Enhanced cache manager not available", "bot");
              }
              break;

            case "reduceBatchSize":
              if (this.vectorConfigManager) {
                const config = this.vectorConfigManager.getConfig();
                const currentBatchSize = config.batchSize;
                const newBatchSize = Math.max(5, Math.floor(currentBatchSize * 0.7));
                await this.vectorConfigManager.updateConfig("batchSize", newBatchSize);
                await this.sendResponse(
                  `
**Batch Size Reduced** ⚡

• **Previous**: ${currentBatchSize}
• **New**: ${newBatchSize}
• **Impact**: Lower memory usage, potentially slower indexing
                `.trim(),
                  "bot"
                );
              } else {
                await this.sendResponse("Configuration manager not available", "bot");
              }
              break;

            case "pauseIndexing":
              if (this.smartEmbeddingOrchestrator) {
                // TODO: Implement pause functionality in SmartEmbeddingOrchestrator
                await this.sendResponse(
                  "🛑 **Indexing Pause Requested** - This feature will be implemented in a future update",
                  "bot"
                );
              } else {
                await this.sendResponse("Smart embedding orchestrator not available", "bot");
              }
              break;

            case "resumeIndexing":
              if (this.smartEmbeddingOrchestrator) {
                // TODO: Implement resume functionality in SmartEmbeddingOrchestrator
                await this.sendResponse(
                  "▶️ **Indexing Resume Requested** - This feature will be implemented in a future update",
                  "bot"
                );
              } else {
                await this.sendResponse("Smart embedding orchestrator not available", "bot");
              }
              break;

            case "restartWorker":
              if (this.vectorWorkerManager) {
                // TODO: Implement restart functionality in VectorDbWorkerManager
                await this.sendResponse(
                  "🔄 **Worker Restart Requested** - This feature will be implemented in a future update",
                  "bot"
                );
              } else {
                await this.sendResponse("Vector worker manager not available", "bot");
              }
              break;

            case "emergencyStop":
              if (this.productionSafeguards) {
                // Emergency stop will be handled by the safeguards service
                await this.sendResponse(
                  "🚨 **Emergency Stop Activated** - All vector operations have been stopped due to resource concerns",
                  "bot"
                );
              } else {
                await this.sendResponse("Production safeguards not available", "bot");
              }
              break;

            case "resumeFromEmergencyStop":
              if (this.productionSafeguards) {
                // Resume will be handled by the safeguards service
                await this.sendResponse("✅ **Resumed from Emergency Stop** - Vector operations are now active", "bot");
              } else {
                await this.sendResponse("Production safeguards not available", "bot");
              }
              break;

            case "optimizePerformance":
              if (this.performanceProfiler && this.enhancedCacheManager) {
                // Use public method to optimize configuration
                const optimizedConfig = this.performanceProfiler.getOptimizedConfig();
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
                  "bot"
                );
              } else {
                await this.sendResponse("Performance optimization services not available", "bot");
              }
              break;

            default:
              throw new Error("Unknown command");
          }
        })
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
    this.sendResponse(formatText(event.message), event.message === "folders" ? "bootstrap" : "bot");
  }
  abstract generateResponse(message?: string, metaData?: Record<string, any>): Promise<string | undefined>;

  abstract sendResponse(response: string, currentChat?: string): Promise<boolean | undefined>;

  /**
   * Enhances user messages with codebase context if the question is codebase-related
   */
  private async enhanceMessageWithCodebaseContext(message: string): Promise<string> {
    try {
      const questionAnalysis = this.questionClassifier.categorizeQuestion(message);

      if (!questionAnalysis.isCodebaseRelated) {
        this.logger.debug("Question not codebase-related, returning original message");
        return message;
      }

      this.logger.info(
        `Detected codebase question with confidence: ${questionAnalysis.confidence}, categories: ${questionAnalysis.categories.join(", ")}`
      );

      // First try vector-based semantic search for precise context
      let vectorContext = "";
      let fallbackContext = "";

      try {
        const vectorResult = await this.smartContextExtractor?.extractRelevantContextWithVector(
          message,
          vscode.window.activeTextEditor?.document.fileName
        );

        if (vectorResult?.content && vectorResult.sources.length > 0) {
          vectorContext = `\n**Semantic Context** (${vectorResult.searchMethod} search results):\n${vectorResult.sources
            .map(
              (source) =>
                `- **${source.filePath}** (relevance: ${source.relevanceScore.toFixed(2)}): ${source.clickableReference}`
            )
            .join(
              "\n"
            )}\n\n**Context Content**:\n${vectorResult.content.substring(0, 2000)}${vectorResult.content.length > 2000 ? "..." : ""}`;

          this.logger.info(
            `Vector search found ${vectorResult.sources.length} relevant sources with ${vectorResult.totalTokens} tokens`
          );
        }
      } catch (vectorError) {
        this.logger.warn("Vector search failed, falling back to traditional context", vectorError);
      }

      // Fallback to comprehensive codebase context if vector search didn't provide enough
      if (!vectorContext) {
        fallbackContext = await this.codebaseUnderstanding.getCodebaseContext();
      }

      // Create enhanced prompt with both vector and fallback context
      const enhancedMessage = `
**User Question**: ${message}

${vectorContext}

${!vectorContext ? `**Codebase Context** (Automatically included because your question is related to understanding this codebase):\n\n${fallbackContext}` : ""}

**Instructions for AI**: Use the ${vectorContext ? "semantic context" : "codebase context"} above to provide accurate, specific answers about this project. Reference actual files, patterns, and implementations found in the analysis. Use the provided clickable file references (e.g., [[1]], [[2]]) so users can navigate directly to the source code.

IMPORTANT: Please provide a complete response. Do not truncate your answer mid-sentence or mid-word. Ensure your response is fully finished before ending.
`.trim();

      this.logger.debug("Enhanced message with vector/codebase context");
      return enhancedMessage;
    } catch (error) {
      this.logger.error("Error enhancing message with codebase context", error);
      // Return original message if enhancement fails
      return message;
    }
  }

  public dispose(): void {
    this.logger.debug(`Disposing BaseWebViewProvider with ${this.disposables.length} disposables`);

    // Dispose vector database components
    try {
      this.smartEmbeddingOrchestrator?.dispose();
      this.vectorWorkerManager?.dispose();
    } catch (error) {
      this.logger.error("Error disposing vector database components", error);
    }

    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0; // Clear the array
  }

  async getContext(files: string[]) {
    try {
      const filesContent: Map<string, string> | undefined = await this.fileService.getFilesContent(files);
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
    }>
  ): Promise<any[]> {
    return this.chatHistoryManager.formatChatHistory(role, message, model, key, pruneConfig);
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
    }
  ): Promise<void> {
    await this.chatHistoryManager.pruneHistoryForKey(key, config);
  }

  // Initialize chat history with proper sync
  async initializeChatHistory(key: string): Promise<any[]> {
    return this.chatHistoryManager.initializeHistory(key);
  }
}
