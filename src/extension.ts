import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Orchestrator } from "./agents/orchestrator";
import {
  APP_CONFIG,
  CODEBUDDY_ACTIONS,
  generativeAiModels,
} from "./application/constant";
import { Comments } from "./commands/comment";
import { ExplainCode } from "./commands/explain";
import { FixError } from "./commands/fixError";
import { GenerateMermaidDiagram } from "./commands/generate-code-chart";
import { GenerateCommitMessage } from "./commands/generate-commit-message";
import { InLineChat } from "./commands/inline-chat";
import { InterviewMe } from "./commands/interview-me";
import { OptimizeCode } from "./commands/optimize";
import { RefactorCode } from "./commands/refactor";
import { ReviewCode } from "./commands/review";
import { ReviewPR } from "./commands/review-pr";
import { EventEmitter } from "./emitter/publisher";
import { Logger, LogLevel } from "./infrastructure/logger/logger";
import { Memory } from "./memory/base";
import { FileUploadService } from "./services/file-upload";
import { getAPIKeyAndModel, getConfigValue } from "./utils/utils";
import { AnthropicWebViewProvider } from "./webview-providers/anthropic";
import { CodeActionsProvider } from "./webview-providers/code-actions";
import { DeepseekWebViewProvider } from "./webview-providers/deepseek";
import { GeminiWebViewProvider } from "./webview-providers/gemini";
import { GroqWebViewProvider } from "./webview-providers/groq";
import { WebViewProviderManager } from "./webview-providers/manager";
import { architecturalRecommendationCommand } from "./commands/architectural-recommendation";
import { PersistentCodebaseUnderstandingService } from "./services/persistent-codebase-understanding.service";
import { VectorDbSyncService } from "./services/vector-db-sync.service";
import { VectorDatabaseService } from "./services/vector-database.service";
import { VectorDbWorkerManager } from "./services/vector-db-worker-manager";
import { getCodeIndexingStatusProvider } from "./services/code-indexing-status.service";
import {
  generateDocumentationCommand,
  regenerateDocumentationCommand,
  openDocumentationCommand,
} from "./commands/generate-documentation";

const {
  geminiKey,
  geminiModel,
  groqApiKey,
  groqModel,
  anthropicApiKey,
  anthropicModel,
  grokApiKey,
  grokModel,
  deepseekApiKey,
  deepseekModel,
} = APP_CONFIG;
console.log(APP_CONFIG);

const logger = Logger.initialize("extension", { minLevel: LogLevel.DEBUG });

let quickFixCodeAction: vscode.Disposable;
let agentEventEmmitter: EventEmitter;
let orchestrator = Orchestrator.getInstance();

// Global references for Phase 4 components
let vectorDbSyncService: VectorDbSyncService | undefined;
let vectorDbWorkerManager: VectorDbWorkerManager | undefined;

/**
 * Initialize WebView providers lazily for faster startup
 */
function initializeWebViewProviders(
  context: vscode.ExtensionContext,
  selectedGenerativeAiModel: string,
): void {
  // Use setImmediate to defer until after current call stack
  setImmediate(() => {
    try {
      console.log("🎨 CodeBuddy: Initializing WebView providers...");

      const modelConfigurations: {
        [key: string]: {
          key: string;
          model: string;
          webviewProviderClass: any;
        };
      } = {
        [generativeAiModels.GEMINI]: {
          key: geminiKey,
          model: geminiModel,
          webviewProviderClass: GeminiWebViewProvider,
        },
        [generativeAiModels.GROQ]: {
          key: groqApiKey,
          model: groqModel,
          webviewProviderClass: GroqWebViewProvider,
        },
        [generativeAiModels.ANTHROPIC]: {
          key: anthropicApiKey,
          model: anthropicModel,
          webviewProviderClass: AnthropicWebViewProvider,
        },
        [generativeAiModels.GROK]: {
          key: grokApiKey,
          model: grokModel,
          webviewProviderClass: AnthropicWebViewProvider,
        },
        [generativeAiModels.DEEPSEEK]: {
          key: deepseekApiKey,
          model: deepseekModel,
          webviewProviderClass: DeepseekWebViewProvider,
        },
      };

      const providerManager = WebViewProviderManager.getInstance(context);

      if (selectedGenerativeAiModel in modelConfigurations) {
        const modelConfig = modelConfigurations[selectedGenerativeAiModel];
        const apiKey = getConfigValue(modelConfig.key);
        const apiModel = getConfigValue(modelConfig.model);

        providerManager.initializeProvider(
          selectedGenerativeAiModel,
          apiKey,
          apiModel,
          true,
        );

        console.log(
          `✓ WebView provider initialized: ${selectedGenerativeAiModel}`,
        );
      }

      // Store providerManager globally and add to subscriptions
      (globalThis as any).providerManager = providerManager;
      context.subscriptions.push(providerManager);
    } catch (error) {
      console.error("Failed to initialize WebView providers:", error);
      vscode.window.showWarningMessage(
        "CodeBuddy: WebView initialization failed, some features may be limited",
      );
    }
  });
}

/**
 * Initialize heavy background services after UI is ready
 * This prevents blocking the extension startup and webview loading
 */
async function initializeBackgroundServices(
  context: vscode.ExtensionContext,
): Promise<void> {
  try {
    console.log("🔄 CodeBuddy: Starting background services...");
    vscode.window.setStatusBarMessage(
      "$(sync~spin) CodeBuddy: Loading background services...",
      5000,
    );

    // Initialize persistent codebase understanding service
    try {
      const persistentCodebaseService =
        PersistentCodebaseUnderstandingService.getInstance();
      await persistentCodebaseService.initialize();
      console.log("✓ Persistent codebase understanding service initialized");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `Failed to initialize persistent codebase service: ${errorMessage}`,
        error,
      );
    }

    // Phase 4: Initialize Vector Database Orchestration (truly non-blocking)
    initializeVectorDatabaseOrchestration(context)
      .then(() => {
        console.log("✓ Vector database orchestration initialized");
        vscode.window.setStatusBarMessage(
          "$(database) CodeBuddy: Vector search ready",
          3000,
        );
      })
      .catch((error) => {
        console.warn(
          "Vector database initialization failed, using fallback mode:",
          error,
        );
        vscode.window.setStatusBarMessage(
          "$(warning) CodeBuddy: Using fallback search",
          3000,
        );
      });

    // All background services ready
    vscode.window.setStatusBarMessage("$(check) CodeBuddy: Ready", 3000);
    console.log("🎉 CodeBuddy: All background services initialized");
  } catch (error) {
    console.error("Background services initialization failed:", error);
    vscode.window.setStatusBarMessage(
      "$(warning) CodeBuddy: Some features may be limited",
      5000,
    );
  }
}

/**
 * Initialize Phase 4 Vector Database Orchestration
 * This sets up the comprehensive vector database system with multi-phase embedding
 */
async function initializeVectorDatabaseOrchestration(
  context: vscode.ExtensionContext,
): Promise<void> {
  try {
    console.log("🚀 Starting Phase 4 Vector Database Orchestration...");

    // Get Gemini API key for consistent embeddings
    let geminiApiKey: string | undefined;
    try {
      const result = getAPIKeyAndModel("Gemini");
      geminiApiKey = result.apiKey;
    } catch (error) {
      console.warn(
        "Gemini API key not found, vector database will use fallback mode:",
        error instanceof Error ? error.message : String(error),
      );
      // Continue without API key - vector database can still work with SimpleVectorStore fallback
    }

    // Initialize worker manager for non-blocking operations
    vectorDbWorkerManager = new VectorDbWorkerManager(context);
    await vectorDbWorkerManager.initialize();
    console.log("✓ Vector database worker manager initialized");

    // Initialize vector database service
    const vectorDatabaseService = new VectorDatabaseService(
      context,
      geminiApiKey,
    );
    await vectorDatabaseService.initialize();
    console.log("✓ Vector database service initialized");

    // Initialize sync service for real-time file monitoring
    // Use CodeIndexingService as the indexer for the sync service
    const { CodeIndexingService } = await import("./services/code-indexing");
    const { CodeIndexingAdapter } = await import(
      "./services/vector-db-sync.service"
    );
    const codeIndexingService = CodeIndexingService.createInstance();
    const codeIndexingAdapter = new CodeIndexingAdapter(codeIndexingService);

    vectorDbSyncService = new VectorDbSyncService(
      vectorDatabaseService,
      codeIndexingAdapter,
    );
    await vectorDbSyncService.initialize();
    console.log("✓ Vector database sync service initialized");

    // Initialize status provider
    const statusProvider = getCodeIndexingStatusProvider();
    statusProvider.initialize(vectorDbSyncService);

    // Create status bar item
    const statusBarItem = statusProvider.createStatusBarItem();
    context.subscriptions.push(statusBarItem);

    // Register commands for user control
    registerVectorDatabaseCommands(context, statusProvider);

    // Show success notification
    vscode.window.setStatusBarMessage(
      "$(check) CodeBuddy: Vector database orchestration ready",
      5000,
    );

    console.log(
      "🎉 Phase 4 Vector Database Orchestration completed successfully",
    );
  } catch (error: any) {
    console.error("Failed to initialize Phase 4 orchestration:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showWarningMessage(
      `CodeBuddy: Vector database initialization failed: ${errorMessage}. Using fallback search mode.`,
    );
  }
}

/**
 * Register vector database related commands
 */
function registerVectorDatabaseCommands(
  context: vscode.ExtensionContext,
  statusProvider?: import("./services/code-indexing-status.service").CodeIndexingStatusProvider,
): void {
  // Command to force full reindex
  const forceReindexCommand = vscode.commands.registerCommand(
    "codebuddy.vectorDb.forceReindex",
    async () => {
      if (!vectorDbSyncService) {
        vscode.window.showErrorMessage("Vector database not initialized");
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        "This will clear all embeddings and reindex the entire codebase. Continue?",
        "Yes, Reindex",
        "Cancel",
      );

      if (confirm === "Yes, Reindex") {
        try {
          // Force a full reindex using the available method
          await vectorDbSyncService.performFullReindex();
          vscode.window.showInformationMessage(
            "Full reindex completed successfully",
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Reindex failed: ${errorMessage}`);
        }
      }
    },
  );

  // Command to show vector database stats
  const showStatsCommand = vscode.commands.registerCommand(
    "codebuddy.vectorDb.showStats",
    async () => {
      if (!vectorDbSyncService) {
        vscode.window.showInformationMessage(
          "🔄 Vector database is still initializing in the background. Please wait a moment and try again.",
          "OK",
        );
        return;
      }

      const stats = vectorDbSyncService.getStats();
      const message = `**Vector Database Statistics**\n\n
• Files Monitored: ${stats.filesMonitored}\n
• Sync Operations: ${stats.syncOperations}\n
• Failed Operations: ${stats.failedOperations}\n
• Queue Size: ${stats.queueSize}\n
• Last Sync: ${stats.lastSync || "Never"}`;

      vscode.window.showInformationMessage(message);
    },
  );

  // Command to show indexing status
  const showIndexingStatusCommand = vscode.commands.registerCommand(
    "codebuddy.showIndexingStatus",
    async () => {
      if (statusProvider) {
        await statusProvider.showDetailedStatus();
      } else {
        vscode.window.showInformationMessage("Indexing status not available");
      }
    },
  );

  // Phase 5: Performance & Production Commands
  const showPerformanceReportCommand = vscode.commands.registerCommand(
    "codebuddy.showPerformanceReport",
    async () => {
      // This will be handled by the webview provider's performance profiler
      vscode.commands.executeCommand("codebuddy.webview.showPerformanceReport");
    },
  );

  const clearVectorCacheCommand = vscode.commands.registerCommand(
    "codebuddy.clearVectorCache",
    async () => {
      // This will be handled by the webview provider's enhanced cache manager
      vscode.commands.executeCommand("codebuddy.webview.clearCache", "all");
    },
  );

  const reduceBatchSizeCommand = vscode.commands.registerCommand(
    "codebuddy.reduceBatchSize",
    async () => {
      // This will be handled by the webview provider's configuration manager
      vscode.commands.executeCommand("codebuddy.webview.reduceBatchSize");
    },
  );

  const pauseIndexingCommand = vscode.commands.registerCommand(
    "codebuddy.pauseIndexing",
    async () => {
      // This will be handled by the webview provider's orchestrator
      vscode.commands.executeCommand("codebuddy.webview.pauseIndexing");
    },
  );

  const resumeIndexingCommand = vscode.commands.registerCommand(
    "codebuddy.resumeIndexing",
    async () => {
      // This will be handled by the webview provider's orchestrator
      vscode.commands.executeCommand("codebuddy.webview.resumeIndexing");
    },
  );

  const restartVectorWorkerCommand = vscode.commands.registerCommand(
    "codebuddy.restartVectorWorker",
    async () => {
      // This will be handled by the webview provider's vector worker manager
      vscode.commands.executeCommand("codebuddy.webview.restartWorker");
    },
  );

  const emergencyStopCommand = vscode.commands.registerCommand(
    "codebuddy.emergencyStop",
    async () => {
      // This will be handled by the webview provider's production safeguards
      vscode.commands.executeCommand("codebuddy.webview.emergencyStop");
    },
  );

  const resumeFromEmergencyStopCommand = vscode.commands.registerCommand(
    "codebuddy.resumeFromEmergencyStop",
    async () => {
      // This will be handled by the webview provider's production safeguards
      vscode.commands.executeCommand(
        "codebuddy.webview.resumeFromEmergencyStop",
      );
    },
  );

  const optimizePerformanceCommand = vscode.commands.registerCommand(
    "codebuddy.optimizePerformance",
    async () => {
      // This will be handled by the webview provider's performance profiler
      vscode.commands.executeCommand("codebuddy.webview.optimizePerformance");
    },
  );

  const diagnosticCommand = vscode.commands.registerCommand(
    "codebuddy.vectorDb.diagnostic",
    async () => {
      try {
        // Check LanceDB installation
        const lanceDB = await import("@lancedb/lancedb");
        let lanceStatus = "✅ LanceDB installed";

        // Check Apache Arrow
        let arrowStatus = "❌ Apache Arrow not available";
        try {
          await import("apache-arrow");
          arrowStatus = "✅ Apache Arrow available";
        } catch {
          arrowStatus = "❌ Apache Arrow not available";
        }

        // Check vector database service status
        let serviceStatus = "❌ Service not initialized";
        if (vectorDbSyncService) {
          const stats = vectorDbSyncService.getStats();
          serviceStatus = `✅ Service initialized (${stats.filesMonitored} files monitored)`;
        }

        const diagnosticMessage = `
**CodeBuddy Vector Database Diagnostic**

• **LanceDB**: ${lanceStatus}
• **Apache Arrow**: ${arrowStatus}
• **Service Status**: ${serviceStatus}
• **Node.js Version**: ${process.version}

**Fix Issues**:
1. Install missing dependencies: \`npm install @chroma-core/default-embed\`
2. Restart VS Code
3. Check API keys in settings
      `.trim();

        vscode.window
          .showInformationMessage(diagnosticMessage, "Copy to Clipboard")
          .then((action) => {
            if (action === "Copy to Clipboard") {
              vscode.env.clipboard.writeText(diagnosticMessage);
            }
          });
      } catch (error) {
        vscode.window.showErrorMessage(`Diagnostic failed: ${error}`);
      }
    },
  );

  context.subscriptions.push(
    forceReindexCommand,
    showStatsCommand,
    showIndexingStatusCommand,
    showPerformanceReportCommand,
    clearVectorCacheCommand,
    reduceBatchSizeCommand,
    pauseIndexingCommand,
    resumeIndexingCommand,
    restartVectorWorkerCommand,
    emergencyStopCommand,
    resumeFromEmergencyStopCommand,
    optimizePerformanceCommand,
    diagnosticCommand,
  );
}

export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log("🚀 CodeBuddy: Starting fast activation...");

    // ⚡ FAST STARTUP: Only essential sync operations
    orchestrator.start();

    const { apiKey, model } = getAPIKeyAndModel("gemini");
    FileUploadService.initialize(apiKey);
    Memory.getInstance();

    // Show early status
    vscode.window.setStatusBarMessage(
      "$(loading~spin) CodeBuddy: Initializing...",
      3000,
    );

    // ⚡ DEFER HEAVY OPERATIONS: Initialize in background after UI is ready
    setImmediate(() => {
      initializeBackgroundServices(context);
    });

    console.log("✓ CodeBuddy: Core services started, UI ready");

    // ⚡ IMMEDIATE: Show that extension is ready
    vscode.window.setStatusBarMessage(
      "$(check) CodeBuddy: Ready! Loading features...",
      2000,
    );

    // Show welcome message for first-time users
    const hasShownWelcome = context.globalState.get(
      "codebuddy.welcomeShown",
      false,
    );
    if (!hasShownWelcome) {
      setTimeout(() => {
        vscode.window
          .showInformationMessage(
            "🎉 CodeBuddy is ready! Features are loading in the background.",
            "Open Chat",
            "Learn More",
          )
          .then((action) => {
            if (action === "Open Chat") {
              vscode.commands.executeCommand(
                "workbench.view.extension.codeBuddy-view-container",
              );
            } else if (action === "Learn More") {
              vscode.env.openExternal(
                vscode.Uri.parse("https://github.com/olasunkanmi-SE/codebuddy"),
              );
            }
          });
        context.globalState.update("codebuddy.welcomeShown", true);
      }, 1000);
    }
    const {
      comment,
      review,
      refactor,
      optimize,
      fix,
      explain,
      commitMessage,
      interviewMe,
      generateDiagram,
      inlineChat,
      restart,
      reviewPR,
      codebaseAnalysis,
      generateDocumentation,
      regenerateDocumentation,
      openDocumentation,
    } = CODEBUDDY_ACTIONS;
    const getComment = new Comments(CODEBUDDY_ACTIONS.comment, context);
    const getInLineChat = new InLineChat(CODEBUDDY_ACTIONS.inlineChat, context);
    const generateOptimizeCode = new OptimizeCode(
      CODEBUDDY_ACTIONS.optimize,
      context,
    );
    const generateRefactoredCode = new RefactorCode(
      CODEBUDDY_ACTIONS.refactor,
      context,
    );
    const explainCode = new ExplainCode(CODEBUDDY_ACTIONS.explain, context);
    const generateReview = new ReviewCode(CODEBUDDY_ACTIONS.review, context);
    const generateMermaidDiagram = new GenerateMermaidDiagram(
      CODEBUDDY_ACTIONS.generateDiagram,
      context,
    );
    const generateCommitMessage = new GenerateCommitMessage(
      CODEBUDDY_ACTIONS.commitMessage,
      context,
    );
    const generateInterviewQuestions = new InterviewMe(
      CODEBUDDY_ACTIONS.interviewMe,
      context,
    );
    const reviewPRCommand = new ReviewPR(CODEBUDDY_ACTIONS.reviewPR, context);

    const actionMap = {
      [comment]: async () => {
        await getComment.execute(
          undefined,
          "💭 Add a helpful comment to explain the code logic",
        );
      },
      [review]: async () => {
        await generateReview.execute(
          undefined,
          "🔍 Perform a thorough code review to ensure best practices",
        );
      },
      [refactor]: async () => {
        await generateRefactoredCode.execute(
          undefined,
          " 🔄 Improve code readability and maintainability",
        );
      },
      [optimize]: async () => {
        await generateOptimizeCode.execute(
          undefined,
          "⚡ optimize for performance and efficiency",
        );
      },
      [interviewMe]: async () => {
        await generateInterviewQuestions.execute(
          undefined,
          "📚 Prepare for technical interviews with relevant questions",
        );
      },
      [fix]: (errorMessage: string) => {
        new FixError(CODEBUDDY_ACTIONS.fix, context, errorMessage).execute(
          errorMessage,
          "🔧 Debug and fix the issue",
        );
      },
      [explain]: async () => {
        await explainCode.execute(
          undefined,
          "💬 Get a clear and concise explanation of the code concept",
        );
      },
      [commitMessage]: async () => {
        await generateCommitMessage.execute(
          undefined,
          "🧪 generating commit message",
        );
      },
      [generateDiagram]: async () => {
        await generateMermaidDiagram.execute(
          undefined,
          "📈 Visualize the code with a Mermaid diagram",
        );
      },
      [inlineChat]: async () => {
        await getInLineChat.execute(
          undefined,
          "💬 Discuss and reason about your code with me",
        );
      },
      [restart]: async () => {
        await restartExtension(context);
      },
      [reviewPR]: async () => {
        await reviewPRCommand.execute(
          undefined,
          "🔍 Conducting comprehensive pull request review",
        );
      },
      [codebaseAnalysis]: async () => {
        await architecturalRecommendationCommand();
      },
      [generateDocumentation]: async () => {
        await generateDocumentationCommand();
      },
      [regenerateDocumentation]: async () => {
        await regenerateDocumentationCommand();
      },
      [openDocumentation]: async () => {
        await openDocumentationCommand();
      },
      "CodeBuddy.showCacheStatus": async () => {
        const persistentCodebaseService =
          PersistentCodebaseUnderstandingService.getInstance();
        const summary = await persistentCodebaseService.getAnalysisSummary();
        const stats = summary.stats;

        let message = `**Codebase Analysis Cache Status**\n\n`;
        message += `• Has Cache: ${summary.hasCache ? "✅ Yes" : "❌ No"}\n`;

        if (summary.lastAnalysis) {
          const lastAnalysisDate = new Date(summary.lastAnalysis);
          message += `• Last Analysis: ${lastAnalysisDate.toLocaleString()}\n`;
        }

        if (summary.gitState) {
          message += `• Branch: ${summary.gitState.branch || "Unknown"}\n`;
          message += `• Files: ${summary.gitState.fileCount || 0}\n`;
        }

        message += `• Total Snapshots: ${stats.totalSnapshots || 0}\n`;
        message += `• Database Size: ${((stats.totalSize || 0) / 1024).toFixed(1)} KB\n`;

        if (stats.oldestSnapshot) {
          message += `• Oldest: ${new Date(stats.oldestSnapshot).toLocaleString()}\n`;
        }
        if (stats.newestSnapshot) {
          message += `• Newest: ${new Date(stats.newestSnapshot).toLocaleString()}\n`;
        }

        const panel = vscode.window.createWebviewPanel(
          "cacheStatus",
          "CodeBuddy Cache Status",
          vscode.ViewColumn.One,
          {
            enableScripts: false,
          },
        );

        panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <style>
                  body { 
                      font-family: var(--vscode-font-family);
                      color: var(--vscode-foreground);
                      background: var(--vscode-editor-background);
                      padding: 20px;
                      line-height: 1.6;
                  }
                  pre { 
                      background: var(--vscode-textCodeBlock-background);
                      padding: 15px;
                      border-radius: 5px;
                      white-space: pre-wrap;
                  }
              </style>
          </head>
          <body>
              <pre>${message}</pre>
          </body>
          </html>
        `;
      },
      "CodeBuddy.clearCache": async () => {
        const choice = await vscode.window.showWarningMessage(
          "Are you sure you want to clear the codebase analysis cache? This will require re-analysis next time.",
          "Clear Cache",
          "Cancel",
        );

        if (choice === "Clear Cache") {
          try {
            const persistentCodebaseService =
              PersistentCodebaseUnderstandingService.getInstance();
            await persistentCodebaseService.clearCache();
            vscode.window.showInformationMessage(
              "✅ Codebase analysis cache cleared successfully",
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              `❌ Failed to clear cache: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      },
      "CodeBuddy.refreshAnalysis": async () => {
        const choice = await vscode.window.showInformationMessage(
          "This will refresh the codebase analysis. It may take some time.",
          "Refresh Now",
          "Cancel",
        );

        if (choice === "Refresh Now") {
          try {
            const persistentCodebaseService =
              PersistentCodebaseUnderstandingService.getInstance();

            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Refreshing codebase analysis...",
                cancellable: true,
              },
              async (progress, token) => {
                const analysis =
                  await persistentCodebaseService.forceRefreshAnalysis(token);

                if (analysis && !token.isCancellationRequested) {
                  vscode.window.showInformationMessage(
                    `✅ Analysis refreshed successfully! Found ${analysis.summary.totalFiles} files. Analysis completed at ${new Date(analysis.analysisMetadata.createdAt).toLocaleString()}.`,
                  );
                }
              },
            );
          } catch (error) {
            if (error instanceof Error && error.message.includes("cancelled")) {
              vscode.window.showInformationMessage(
                "Analysis refresh cancelled",
              );
            } else {
              vscode.window.showErrorMessage(
                `❌ Failed to refresh analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }
        }
      },
    };

    let subscriptions: vscode.Disposable[] = Object.entries(actionMap).map(
      ([action, handler]) => {
        console.log(`Registering command: ${action}`);
        return vscode.commands.registerCommand(action, handler);
      },
    );

    console.log(`Total commands registered: ${subscriptions.length}`);

    // ⚡ FAST: Essential UI components only
    const quickFix = new CodeActionsProvider();
    quickFixCodeAction = vscode.languages.registerCodeActionsProvider(
      { scheme: "file", language: "*" },
      quickFix,
    );

    agentEventEmmitter = new EventEmitter();

    // Vector database commands are already registered in initializePhase4Orchestration
    // No need to register them again here

    // ⚡ DEFER: Initialize WebView providers lazily
    const selectedGenerativeAiModel = getConfigValue("generativeAi.option");
    initializeWebViewProviders(context, selectedGenerativeAiModel);
    context.subscriptions.push(
      ...subscriptions,
      quickFixCodeAction,
      agentEventEmmitter,
      orchestrator,
      // Note: providerManager is handled in initializeWebViewProviders
      // secretStorageService,
    );
  } catch (error) {
    Memory.clear();
    vscode.window.showErrorMessage(
      "An Error occured while setting up generative AI model",
    );
    console.log(error);
  }
}

/**
 * Restarts the extension by clearing state and reloading the window
 */
async function restartExtension(context: vscode.ExtensionContext) {
  try {
    console.log("Restarting CodeBuddy extension...");

    // Show confirmation dialog
    const choice = await vscode.window.showInformationMessage(
      "Are you sure you want to restart the CodeBuddy extension?",
      "Restart",
      "Cancel",
    );

    if (choice === "Restart") {
      // Clear extension state
      clearFileStorageData();

      // Dispose resources
      if (quickFixCodeAction) {
        quickFixCodeAction.dispose();
      }
      if (agentEventEmmitter) {
        agentEventEmmitter.dispose();
      }
      if (orchestrator) {
        orchestrator.dispose();
      }

      // Show progress and reload window
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Restarting CodeBuddy...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 50, message: "Cleaning up..." });
          await new Promise((resolve) => setTimeout(resolve, 500));
          progress.report({ increment: 100, message: "Reloading..." });
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        },
      );
    }
  } catch (error) {
    console.error("Error restarting extension:", error);
    vscode.window.showErrorMessage(
      "Failed to restart extension. Please reload VS Code manually.",
    );
  }
}

export function deactivate(context: vscode.ExtensionContext) {
  console.log("Deactivating CodeBuddy extension...");

  // Clear database history before deactivation
  clearFileStorageData();

  // Phase 4: Dispose vector database components
  try {
    if (vectorDbSyncService) {
      vectorDbSyncService.dispose();
      console.log("✓ Vector database sync service disposed");
    }
    if (vectorDbWorkerManager) {
      vectorDbWorkerManager.dispose();
      console.log("✓ Vector database worker manager disposed");
    }
  } catch (error) {
    console.warn("Error disposing Phase 4 vector components:", error);
  }

  // Shutdown persistent codebase service
  try {
    const persistentCodebaseService =
      PersistentCodebaseUnderstandingService.getInstance();
    persistentCodebaseService.shutdown();
    console.log("Persistent codebase service shutdown");
  } catch (error) {
    console.warn("Error shutting down persistent codebase service:", error);
  }

  quickFixCodeAction.dispose();
  agentEventEmmitter.dispose();
  orchestrator.dispose();

  // Dispose provider manager
  const providerManager = WebViewProviderManager.getInstance(context);
  providerManager.dispose();

  context.subscriptions.forEach((subscription) => subscription.dispose());

  console.log("CodeBuddy extension deactivated successfully");
}

/**
 * Clears file storage data (.codebuddy folder contents)
 */
function clearFileStorageData() {
  try {
    const workSpaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    const codeBuddyPath = path.join(workSpaceRoot, ".codebuddy");

    if (fs.existsSync(codeBuddyPath)) {
      const files = fs.readdirSync(codeBuddyPath);
      files.forEach((file: string) => {
        const filePath = path.join(codeBuddyPath, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      console.log(`Cleared ${files.length} files from .codebuddy folder`);
    }
  } catch (error) {
    console.error("Error clearing file storage data:", error);
  }
}
