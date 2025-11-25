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
import { formatText, getAPIKeyAndModel } from "../utils/utils";
import { getWebviewContent } from "../webview/chat";
import { QuestionClassifierService } from "../services/question-classifier.service";
import { GroqLLM } from "../llms/groq/groq";
import { Role } from "../llms/message";

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

    // Synchronize provider chat history with database on startup
    setImmediate(() => this.synchronizeChatHistoryFromDatabase());

    // Get the current workspace files from DB.
    setImmediate(() => this.getFiles());
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

        this.logger.debug(
          `Synchronized ${persistentHistory.length} chat messages from database`,
        );
      } else {
        this.logger.debug("No chat history found in database to synchronize");
      }
    } catch (error: any) {
      this.logger.warn(
        "Failed to synchronize chat history from database:",
        error,
      );
      // Don't throw - this is not critical for provider initialization
    }
  }

  /**
   * Update the provider's specific chatHistory array
   * Should be overridden by child classes to update their specific chatHistory type
   */
  protected updateProviderChatHistory(history: any[]): void {
    // Base implementation - child classes should override this
    // to update their specific chatHistory arrays
    this.logger.debug(
      "Base provider - no specific chat history array to update",
    );
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

              const messageAndSystemInstruction =
                await this.enhanceMessageWithCodebaseContext(
                  sanitizedMessage,
                ),
                response = await this.generateResponse(
                  messageAndSystemInstruction,
                  message.metaData,
                );
              if (this.UserMessageCounter === 1) {
                await this.publishWorkSpace();
              }
              if (response) {
                this.logger.info(
                  `[DEBUG] Response from generateResponse: ${response.length} characters`,
                );
                const formattedResponse = formatText(response);
                this.logger.info(
                  `[DEBUG] Formatted response: ${formattedResponse.length} characters`,
                );
                this.logger.info(
                  `[DEBUG] Formatted response: ${formattedResponse}`,
                );
                this.logger.info(
                  `[DEBUG] Original response ends with: "${response.slice(-100)}"`,
                );

                await this.sendResponse(formattedResponse, "bot");
              } else {
                this.logger.info(
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
   */
  private async enhanceMessageWithCodebaseContext(
    message: string,
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

      // Create enhanced prompt using the dedicated service
      const promptContext: PromptContext = {
        questionAnalysis: {
          ...questionAnalysis,
          confidence:
            typeof questionAnalysis.confidence === "string"
              ? this.convertConfidenceToNumber(questionAnalysis.confidence)
              : questionAnalysis.confidence,
        },
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
   * @param generateSummary An async function that takes a list of messages and returns a summary string.
   * @returns A promise that resolves to the new, potentially summarized and pruned, chat history.
   */
  async pruneChatHistoryWithSummary(
    history: any[],
    maxTokens: number,
    systemInstruction: string,
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

    let currentTokenCount =
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

    let newHistoryWithTokens = [
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
      let mutableHistory = [...history];
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

      const systemInstructionTokens =
        await this.getTokenCounts(systemInstruction);

      const historyWithTokens = await Promise.all(
        mutableHistory.map(async (msg) => ({
          message: msg,
          tokens: await this.getTokenCounts(
            msg.parts ? msg.parts[0].text : msg.content,
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
