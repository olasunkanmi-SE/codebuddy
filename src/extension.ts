import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as l10n from "@vscode/l10n";
import { APP_CONFIG, CODEBUDDY_ACTIONS } from "./application/constant";
import { architecturalRecommendationCommand } from "./commands/architectural-recommendation";
import { Comments } from "./commands/comment";
import { ExplainCode } from "./commands/explain";
import { FixError } from "./commands/fixError";
import { GenerateMermaidDiagram } from "./commands/generate-code-chart";
import { GenerateCommitMessage } from "./commands/generate-commit-message";
import {
  generateDocumentationCommand,
  openDocumentationCommand,
  regenerateDocumentationCommand,
} from "./commands/generate-documentation";
import { indexWorkspaceCommand } from "./commands/index-workspace";
import { InLineChat } from "./commands/inline-chat";
import { InterviewMe } from "./commands/interview-me";
import { OptimizeCode } from "./commands/optimize";
import { ReviewPR } from "./commands/pr/review-pr";
import { RefactorCode } from "./commands/refactor";
import { ReviewCode } from "./commands/review";
import { EventEmitter } from "./emitter/publisher";
import { Logger, LogLevel } from "./infrastructure/logger/logger";
import { LocalObservabilityService } from "./infrastructure/observability/telemetry";
import { setupInstrumentation } from "./instrumentation"; // Moved call to tail end
import { Memory } from "./memory/base";
import { Orchestrator } from "./orchestrator";
import { AgentRunningGuardService } from "./services/agent-running-guard.service";
import { CompletionStatusBarService } from "./services/completion-status-bar.service";
import { ContextRetriever } from "./services/context-retriever";
import { InlineCompletionService } from "./services/inline-completion.service";
import { OutputManager } from "./services/output-manager";
import { PersistentCodebaseUnderstandingService } from "./services/persistent-codebase-understanding.service";
import { ProjectRulesService } from "./services/project-rules.service";
import { SchedulerService } from "./services/scheduler.service";
import { SqliteDatabaseService } from "./services/sqlite-database.service";
import { Terminal } from "./utils/terminal";
import { getConfigValue } from "./utils/utils";

import { createBranchFromGitLabCommand } from "./commands/create-branch-from-gitlab";
import { createBranchFromJiraCommand } from "./commands/create-branch-from-jira";
import {
  openInReaderCommand,
  openSelectionInReaderCommand,
} from "./commands/open-reader";
import { AstIndexingService } from "./services/ast-indexing.service";
import { DiffReviewService } from "./services/diff-review.service";
import { SecretStorageService } from "./services/secret-storage";
import { NotificationService } from "./services/notification.service";
import { SqliteVectorStore } from "./services/sqlite-vector-store";
import { StandupService } from "./services/standup.service";
import { CodeHealthTask } from "./services/tasks/code-health.task";
import { DependencyCheckTask } from "./services/tasks/dependency-check.task";
import { GitWatchdogTask } from "./services/tasks/git-watchdog.task";
import { EndOfDaySummaryTask } from "./services/tasks/end-of-day-summary.task";

const logger = Logger.initialize("extension-main", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

let quickFixCodeAction: vscode.Disposable;
let agentEventEmmitter: EventEmitter;
const orchestrator = Orchestrator.getInstance();

async function initializeWebViewProviders(
  context: vscode.ExtensionContext,
  selectedGenerativeAiModel: any,
) {
  try {
    logger.info(
      `Initializing WebView providers for model: ${selectedGenerativeAiModel}`,
    );
    const { WebViewProviderManager } =
      await import("./webview-providers/manager");
    const providerManager = WebViewProviderManager.getInstance(context);
    const modelConfigurations: any = {
      Anthropic: {
        key: APP_CONFIG.anthropicApiKey,
        model: APP_CONFIG.anthropicModel,
        provider: () => import("./webview-providers/anthropic"),
      },
      Deepseek: {
        key: APP_CONFIG.deepseekApiKey,
        model: APP_CONFIG.deepseekModel,
        provider: () => import("./webview-providers/deepseek"),
      },
      Gemini: {
        key: APP_CONFIG.geminiKey,
        model: APP_CONFIG.geminiModel,
        provider: () => import("./webview-providers/gemini"),
      },
      Groq: {
        key: APP_CONFIG.groqApiKey,
        model: APP_CONFIG.groqModel,
        provider: () => import("./webview-providers/groq"),
      },
      OpenAI: {
        key: APP_CONFIG.openaiApiKey,
        model: APP_CONFIG.openaiModel,
        provider: () => import("./webview-providers/openai"),
      },
      Qwen: {
        key: APP_CONFIG.qwenApiKey,
        model: APP_CONFIG.qwenModel,
        provider: () => import("./webview-providers/qwen"),
      },
      GLM: {
        key: APP_CONFIG.glmApiKey,
        model: APP_CONFIG.glmModel,
        provider: () => import("./webview-providers/glm"),
      },
      Local: {
        key: APP_CONFIG.localApiKey,
        model: APP_CONFIG.localModel,
        provider: () => import("./webview-providers/local"),
      },
    };

    vscode.commands.executeCommand("setContext", "isModelSelected", true);
    let apiKeys = "";
    for (const [key, value] of Object.entries(modelConfigurations)) {
      const configKey = (value as any).key;
      const hasSecretKey =
        SecretStorageService.getInstance().getApiKey(configKey);
      const settingsKey = getConfigValue(configKey);
      if (!hasSecretKey && (!settingsKey || settingsKey === "apiKey")) {
        apiKeys += `${key}, `;
      }
    }

    if (selectedGenerativeAiModel in modelConfigurations) {
      const modelConfig = modelConfigurations[selectedGenerativeAiModel];
      const apiKey =
        SecretStorageService.getInstance().getApiKey(modelConfig.key) ||
        getConfigValue(modelConfig.key);
      const apiModel = getConfigValue(modelConfig.model);

      // Ensure the provider class is loaded before initializing
      await modelConfig.provider();

      await providerManager.initializeProvider(
        selectedGenerativeAiModel,
        apiKey,
        apiModel,
        true,
      );

      logger.info(
        `✓ WebView provider initialized: ${selectedGenerativeAiModel}`,
      );
    }

    if (apiKeys.length > 0) {
      vscode.window.showErrorMessage(
        l10n.t(
          "{0} API keys may be required. Check out the FAQ and SETTINGS section to configure your AI assistant.",
          apiKeys,
        ),
      );
    }

    // Store providerManager globally and add to subscriptions
    (globalThis as any).providerManager = providerManager;
    context.subscriptions.push(providerManager);
  } catch (error: any) {
    logger.error(
      `Failed to initialize WebView providers (model: ${selectedGenerativeAiModel}): ${error.message}`,
      error,
    );
    vscode.window.showWarningMessage(
      l10n.t(
        "CodeBuddy: WebView initialization failed, some features may be limited",
      ),
    );
  }
}

export async function activate(context: vscode.ExtensionContext) {
  try {
    // Initialize l10n with the user's preferred language
    const savedLanguage =
      vscode.workspace.getConfiguration().get<string>("codebuddy.language") ||
      "en";
    if (savedLanguage !== "en") {
      const bundleUri = vscode.Uri.joinPath(
        context.extensionUri,
        "l10n",
        `bundle.l10n.${savedLanguage}.json`,
      );
      l10n.config({ uri: bundleUri.toString() });
    }

    // Initialize Terminal with extension path early for Docker Compose support
    const terminal = Terminal.getInstance();
    terminal.setExtensionPath(context.extensionPath);

    // Initialize shared vector store (used by AstIndexingService + ContextRetriever)
    const vectorStore = SqliteVectorStore.getInstance();
    await vectorStore.initialize(context);
    context.subscriptions.push(vectorStore);

    // Initialize AST Indexing Service (Worker Thread Manager)
    AstIndexingService.getInstance(context);
    logger.info("AST Indexing Service initialized");

    // Initialize Secret Storage Service (must be before webview providers for secure API key access)
    const secretStorageService = SecretStorageService.initialize(context);
    await secretStorageService.migrateApiKeys();
    context.subscriptions.push(secretStorageService);

    // Use dynamic import for DeveloperAgent to ensure it's loaded AFTER telemetry initialization
    const { DeveloperAgent } = await import("./agents/developer/agent");
    new DeveloperAgent({});
    const selectedGenerativeAiModel = getConfigValue("generativeAi.option");
    // setConfigValue("generativeAi.option", "Gemini");
    await initializeWebViewProviders(context, selectedGenerativeAiModel);
    Logger.sessionId = Logger.generateId();

    const databaseService: SqliteDatabaseService =
      SqliteDatabaseService.getInstance();
    await databaseService.initialize();

    // Start Scheduler Service
    SchedulerService.getInstance().start();

    // Initialize ContextRetriever for semantic search
    const contextRetriever = ContextRetriever.initialize(context);

    // Initialize Persistent Codebase Service and Git Watcher
    const persistentCodebaseService =
      PersistentCodebaseUnderstandingService.getInstance();
    persistentCodebaseService.initializeWatcher(context);

    // Auto-index files on save using the optimized Worker Service
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        // Skip irrelevant files
        if (
          document.languageId === "git-commit" ||
          document.languageId === "log" ||
          document.fileName.includes("node_modules") ||
          document.fileName.includes(".git") ||
          document.fileName.includes(".codebuddy")
        ) {
          return;
        }

        try {
          // Offload indexing to the worker thread
          AstIndexingService.getInstance().indexFile(
            document.fileName,
            document.getText(),
          );
        } catch (error) {
          logger.error(
            `Failed to auto-index file: ${document.fileName}`,
            error,
          );
        }
      }),
    );

    // Initialize Project Rules Service
    const projectRulesService = ProjectRulesService.getInstance();
    projectRulesService.initialize();
    context.subscriptions.push(projectRulesService);

    const mainLogger = Logger.initialize("activate", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    mainLogger.info("CodeBuddy extension is now active!");
    logger.info("🚀 CodeBuddy: Starting fast activation...");

    // ⚡ FAST STARTUP: Only essential sync operations
    orchestrator.start();

    Memory.getInstance();

    // Show early status
    vscode.window.setStatusBarMessage(
      l10n.t("$(loading~spin) CodeBuddy: Initializing..."),
      3000,
    );

    // ⚡ DEFER HEAVY OPERATIONS: Initialize in background after UI is ready
    setImmediate(() => {
      // initializeBackgroundServices(context);
      SchedulerService.getInstance().start();
    });

    logger.info("✓ CodeBuddy: Core services started, UI ready");

    context.subscriptions.push(
      vscode.commands.registerCommand("codebuddy.indexWorkspace", () =>
        indexWorkspaceCommand(NotificationService.getInstance()),
      ),
    );

    // Register Automation Triggers
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "codebuddy.triggerDailyStandup",
        async () => {
          logger.info("Manually triggering Daily Standup...");
          await StandupService.getInstance().generateReport();
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.triggerCodeHealth",
        async () => {
          logger.info("Manually triggering Code Health Check...");
          await new CodeHealthTask().execute();
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.triggerDependencyCheck",
        async () => {
          logger.info("Manually triggering Dependency Check...");
          await new DependencyCheckTask().execute();
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.triggerGitWatchdog",
        async () => {
          logger.info("Manually triggering Git Watchdog...");
          await new GitWatchdogTask().execute();
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.triggerEndOfDaySummary",
        async () => {
          logger.info("Manually triggering End-of-Day Summary...");
          await new EndOfDaySummaryTask().execute();
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.createBranchFromJira",
        async () => {
          logger.info("Triggering Create Branch from Jira...");
          await createBranchFromJiraCommand(NotificationService.getInstance());
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.createBranchFromGitLab",
        async () => {
          logger.info("Triggering Create Branch from GitLab...");
          await createBranchFromGitLabCommand(
            NotificationService.getInstance(),
          );
        },
      ),
    );

    // Initialize Diff Review Service
    const diffReviewService = DiffReviewService.getInstance();
    context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider(
        DiffReviewService.SCHEME,
        diffReviewService,
      ),
    );

    // Wire DiffReviewService events to Orchestrator
    context.subscriptions.push(
      diffReviewService.onChangeEvent((event) => {
        const orchestrator = Orchestrator.getInstance();
        switch (event.type) {
          case "added":
            orchestrator.publish("onPendingChange", {
              type: "added",
              change: {
                id: event.change.id,
                filePath: event.change.filePath,
                timestamp: event.change.timestamp,
                status: event.change.status,
                isNewFile: event.change.isNewFile,
              },
            });
            break;
          case "applied":
            orchestrator.publish("onChangeApplied", {
              type: "applied",
              change: {
                id: event.change.id,
                filePath: event.change.filePath,
                timestamp: event.change.timestamp,
                status: event.change.status,
                isNewFile: event.change.isNewFile,
              },
            });
            break;
          case "rejected":
            orchestrator.publish("onChangeRejected", {
              type: "rejected",
              change: {
                id: event.change.id,
                filePath: event.change.filePath,
                timestamp: event.change.timestamp,
                status: event.change.status,
                isNewFile: event.change.isNewFile,
              },
            });
            break;
        }
      }),
    );

    // Register Review Commands
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "codebuddy.reviewChange",
        async (id: string) => {
          const change = diffReviewService.getPendingChange(id);
          if (change) {
            const left = vscode.Uri.file(change.filePath);
            const right = vscode.Uri.parse(
              `${DiffReviewService.SCHEME}:${change.id}`,
            );
            const title = `Review: ${path.basename(change.filePath)}`;
            await vscode.commands.executeCommand(
              "vscode.diff",
              left,
              right,
              title,
            );
          } else {
            vscode.window.showErrorMessage(
              l10n.t("Change not found or expired."),
            );
          }
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.applyChange",
        async (id?: string) => {
          // If ID is not passed, try to get it from the active editor
          if (!id) {
            const activeEditor = vscode.window.activeTextEditor;
            if (
              activeEditor &&
              activeEditor.document.uri.scheme === DiffReviewService.SCHEME
            ) {
              id = activeEditor.document.uri.path;
            }
          }

          if (id) {
            const success = await diffReviewService.applyChange(id);
            if (success) {
              vscode.window.showInformationMessage(
                l10n.t("Change applied successfully."),
              );
              // Optionally close the diff editor?
              // vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            }
          } else {
            vscode.window.showErrorMessage(
              l10n.t("Could not determine change ID to apply."),
            );
          }
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.rejectChange",
        async (id?: string) => {
          if (!id) {
            const activeEditor = vscode.window.activeTextEditor;
            if (
              activeEditor &&
              activeEditor.document.uri.scheme === DiffReviewService.SCHEME
            ) {
              id = activeEditor.document.uri.path;
            }
          }
          if (id) {
            diffReviewService.removePendingChange(id);
            vscode.window.showInformationMessage(
              l10n.t("Change rejected/discarded."),
            );
            vscode.commands.executeCommand(
              "workbench.action.closeActiveEditor",
            );
          }
        },
      ),
    );

    // Initialize Inline Completion Service
    logger.info("Initializing Inline Completion Service...");
    const outputChannel = OutputManager.getInstance().getChannel();
    const inlineCompletionService = new InlineCompletionService(
      context.extensionPath,
      outputChannel,
    );
    const inlineCompletionProvider =
      vscode.languages.registerInlineCompletionItemProvider(
        { pattern: "**" },
        inlineCompletionService,
      );
    context.subscriptions.push(inlineCompletionProvider);
    logger.info("Inline Completion Provider registered");

    // Initialize Status Bar
    const completionStatusBar = new CompletionStatusBarService(context);

    // Register Completion Commands
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "codebuddy.completion.toggle",
        async () => {
          const config = vscode.workspace.getConfiguration(
            "codebuddy.completion",
          );
          const current = config.get<boolean>("enabled", true);
          await config.update(
            "enabled",
            !current,
            vscode.ConfigurationTarget.Global,
          );
        },
      ),
      vscode.commands.registerCommand(
        "codebuddy.completion.openSettings",
        () => {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "codebuddy.completion",
          );
        },
      ),
    );

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
          l10n.t(
            "Are you sure you want to clear the codebase analysis cache? This will require re-analysis next time.",
          ),
          l10n.t("Clear Cache"),
          l10n.t("Cancel"),
        );

        if (choice === l10n.t("Clear Cache")) {
          try {
            const persistentCodebaseService =
              PersistentCodebaseUnderstandingService.getInstance();
            await persistentCodebaseService.clearCache();
            vscode.window.showInformationMessage(
              l10n.t("Codebase analysis cache cleared successfully"),
            );
          } catch (error: any) {
            vscode.window.showErrorMessage(
              `❌ Failed to clear cache: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      },
      "CodeBuddy.refreshAnalysis": async () => {
        const choice = await vscode.window.showInformationMessage(
          l10n.t(
            "This will refresh the codebase analysis. It may take some time.",
          ),
          l10n.t("Refresh Now"),
          l10n.t("Cancel"),
        );

        if (choice === l10n.t("Refresh Now")) {
          try {
            const persistentCodebaseService =
              PersistentCodebaseUnderstandingService.getInstance();

            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: l10n.t("Refreshing codebase analysis..."),
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
          } catch (error: any) {
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
      "CodeBuddy.rules.open": async () => {
        await projectRulesService.openRulesFile();
      },
      "CodeBuddy.rules.init": async () => {
        await projectRulesService.createRulesFile();
      },
      "CodeBuddy.openInReader": async () => {
        await openInReaderCommand();
      },
      "CodeBuddy.openSelectionInReader": async () => {
        await openSelectionInReaderCommand();
      },
      "CodeBuddy.openLastBrowsedInReader": async () => {
        const { NewsReaderService } =
          await import("./services/news-reader.service");
        const reader = NewsReaderService.getInstance();
        const url = reader.lastBrowsedUrl;
        if (url) {
          await reader.openReader(url);
        } else {
          await openInReaderCommand();
        }
      },
      "codebuddy.appendToChat": async (snippet: string) => {
        try {
          const manager = (globalThis as any).providerManager;
          const provider = manager?.getCurrentProvider();
          if (provider?.currentWebView?.webview) {
            await provider.currentWebView.webview.postMessage({
              type: "append-to-chat",
              text: snippet,
            });
          }
        } catch (error: any) {
          logger.error("Failed to append to chat:", error);
        }
      },
      "codebuddy.sendMessage": async (message: string) => {
        try {
          const manager = (globalThis as any).providerManager;
          const provider = manager?.getCurrentProvider();
          if (provider?.currentWebView?.webview) {
            await provider.currentWebView.webview.postMessage({
              type: "send-message",
              text: message,
            });
          }
        } catch (error: any) {
          logger.error("Failed to send message:", error);
        }
      },
      "CodeBuddy.rules.reload": async () => {
        await projectRulesService.reloadRules();
      },
    };

    const subscriptions: vscode.Disposable[] = Object.entries(actionMap).map(
      ([action, handler]) => {
        logger.info(`Registering command: ${action}`);
        return vscode.commands.registerCommand(action, handler);
      },
    );

    logger.info(`Total commands registered: ${subscriptions.length}`);

    // Dynamic import for CodeActionsProvider
    const { CodeActionsProvider } =
      await import("./webview-providers/code-actions");
    const quickFix = new CodeActionsProvider();
    quickFixCodeAction = vscode.languages.registerCodeActionsProvider(
      { scheme: "file", language: "*" },
      quickFix,
    );

    agentEventEmmitter = new EventEmitter();
    const agentRunningGuard = AgentRunningGuardService.getInstance();
    context.subscriptions.push(
      ...subscriptions,
      quickFixCodeAction,
      agentEventEmmitter,
      orchestrator,
      agentRunningGuard,
    );

    // Initialize Traceloop observability at the tail end as requested
    try {
      setupInstrumentation();
      await LocalObservabilityService.getInstance().initialize();
    } catch (obsError) {
      logger.error("Failed to initialize observability:", obsError);
    }
  } catch (error: any) {
    logger.error(`Extension activation failed: ${error.message}`, error);
    vscode.window.showErrorMessage(
      l10n.t(
        "CodeBuddy: Activation failed — {0}. Check Output > CodeBuddy for details.",
        error.message || "unknown error",
      ),
    );
  }
}

/**
 * Restarts the extension by clearing state and reloading the window
 */
async function restartExtension(context: vscode.ExtensionContext) {
  try {
    logger.info("Restarting CodeBuddy extension...");

    // Show confirmation dialog
    const choice = await vscode.window.showInformationMessage(
      l10n.t("Are you sure you want to restart the CodeBuddy extension?"),
      l10n.t("Restart"),
      l10n.t("Cancel"),
    );

    if (choice === l10n.t("Restart")) {
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
          title: l10n.t("Restarting CodeBuddy..."),
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 50, message: l10n.t("Cleaning up...") });
          await new Promise((resolve) => setTimeout(resolve, 500));
          progress.report({ increment: 100, message: l10n.t("Reloading...") });
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        },
      );
    }
  } catch (error: any) {
    logger.error("Error restarting extension:", error);
    vscode.window.showErrorMessage(
      l10n.t("Failed to restart extension. Please reload VS Code manually."),
    );
  }
}

export function deactivate(context: vscode.ExtensionContext) {
  logger.info("Deactivating CodeBuddy extension...");

  // Stop Scheduler Service
  SchedulerService.getInstance().stop();

  // Clear database history before deactivation
  clearFileStorageData();

  try {
    const persistentCodebaseService =
      PersistentCodebaseUnderstandingService.getInstance();
    persistentCodebaseService.shutdown();
    logger.info("Persistent codebase service shutdown");
  } catch (error: any) {
    console.warn("Error shutting down persistent codebase service:", error);
  }

  quickFixCodeAction.dispose();
  agentEventEmmitter.dispose();
  orchestrator.dispose();

  // Dispose agent running guard
  const agentGuard = AgentRunningGuardService.getInstance();
  agentGuard.dispose();

  // Dispose provider manager
  import("./webview-providers/manager").then(({ WebViewProviderManager }) => {
    const providerManager = WebViewProviderManager.getInstance(context);
    providerManager.dispose();
  });

  context.subscriptions.forEach((subscription) => subscription.dispose());

  logger.info("CodeBuddy extension deactivated successfully");
}

/**
 * Clears file storage data (.codebuddy folder contents)
 */
async function clearFileStorageData() {
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
      logger.info(`Cleared ${files.length} files from .codebuddy folder`);
    }
  } catch (error: any) {
    logger.error("Error clearing file storage data:", error);
  }
}
