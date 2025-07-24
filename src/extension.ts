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

export async function activate(context: vscode.ExtensionContext) {
  try {
    orchestrator.start();

    const { apiKey, model } = getAPIKeyAndModel("gemini");
    FileUploadService.initialize(apiKey);
    Memory.getInstance();

    // TODO for RAG codeIndexing incase user allows
    // const index = CodeIndexingService.createInstance();
    // Get each of the folders and call the next line for each
    // const result = await index.buildFunctionStructureMap();
    // await index.insertFunctionsinDB();
    // console.log(result);
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
    };

    let subscriptions: vscode.Disposable[] = Object.entries(actionMap).map(
      ([action, handler]) => {
        console.log(`Registering command: ${action}`);
        return vscode.commands.registerCommand(action, handler);
      },
    );

    console.log(`Total commands registered: ${subscriptions.length}`);

    const selectedGenerativeAiModel = getConfigValue("generativeAi.option");

    const quickFix = new CodeActionsProvider();
    quickFixCodeAction = vscode.languages.registerCodeActionsProvider(
      { scheme: "file", language: "*" },
      quickFix,
    );

    agentEventEmmitter = new EventEmitter();

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
    }
    context.subscriptions.push(
      ...subscriptions,
      quickFixCodeAction,
      agentEventEmmitter,
      orchestrator,
      providerManager,
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
