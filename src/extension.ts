import * as vscode from "vscode";
import {
  APP_CONFIG,
  CODEBUDDY_ACTIONS,
  generativeAiModels,
  USER_MESSAGE,
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
import { EventEmitter } from "./emitter/publisher";
import { Logger, LogLevel } from "./infrastructure/logger/logger";
import { Memory } from "./memory/base";
import { FileUploadService } from "./services/file-upload";
import { FileWatcherService } from "./services/file-watcher";
import { Credentials } from "./services/github-authentication";
import { SecretStorageService } from "./services/secret-storage";
import { getAPIKeyAndModel, getConfigValue } from "./utils/utils";
import { AnthropicWebViewProvider } from "./webview-providers/anthropic";
import { CodeActionsProvider } from "./webview-providers/code-actions";
import { DeepseekWebViewProvider } from "./webview-providers/deepseek";
import { GeminiWebViewProvider } from "./webview-providers/gemini";
import { GroqWebViewProvider } from "./webview-providers/groq";
import { WebViewProviderManager } from "./webview-providers/manager";
import { InitDatabaseManager } from "./infrastructure/repository/init-db-manager";

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
const fileWatcher = FileWatcherService.getInstance();

let quickFixCodeAction: vscode.Disposable;
let agentEventEmmitter: EventEmitter;

export async function activate(context: vscode.ExtensionContext) {
  try {
    const secretStorageService = new SecretStorageService(context);
    const dbManager = InitDatabaseManager.getInstance();
    await dbManager.initialize(context);

    const credentials = new Credentials();
    const { apiKey, model } = getAPIKeyAndModel("gemini");
    FileUploadService.initialize(apiKey);
    await credentials.initialize(context);
    const session: vscode.AuthenticationSession | undefined =
      await credentials.getSession();
    logger.info(`Logged into GitHub as ${session?.account.label}`);
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
    } = CODEBUDDY_ACTIONS;
    const getComment = new Comments(
      `${USER_MESSAGE} generates the code comments...`,
      context,
    );
    const getInLineChat = new InLineChat(
      `${USER_MESSAGE} generates a response...`,
      context,
    );
    const generateOptimizeCode = new OptimizeCode(
      `${USER_MESSAGE} optimizes the code...`,
      context,
    );
    const generateRefactoredCode = new RefactorCode(
      `${USER_MESSAGE} refactors the code...`,
      context,
    );
    const explainCode = new ExplainCode(
      `${USER_MESSAGE} explains the code...`,
      context,
    );
    const generateReview = new ReviewCode(
      `${USER_MESSAGE} reviews the code...`,
      context,
    );
    const generateMermaidDiagram = new GenerateMermaidDiagram(
      `${USER_MESSAGE} creates the mermaid diagram...`,
      context,
    );
    const generateCommitMessage = new GenerateCommitMessage(
      `${USER_MESSAGE} generates a commit message...`,
      context,
    );
    const generateInterviewQuestions = new InterviewMe(
      `${USER_MESSAGE} generates interview questions...`,
      context,
    );

    const actionMap = {
      [comment]: async () => {
        await getComment.execute(
          "💭 Add a helpful comment to explain the code logic",
        );
      },
      [review]: async () => {
        await generateReview.execute(
          "🔍 Perform a thorough code review to ensure best practices",
        );
      },
      [refactor]: async () => {
        await generateRefactoredCode.execute(
          " 🔄 Improve code readability and maintainability",
        );
      },
      [optimize]: async () => {
        await generateOptimizeCode.execute(
          "⚡ optimize for performance and efficiency",
        );
      },
      [interviewMe]: async () => {
        await generateInterviewQuestions.execute(
          "📚 Prepare for technical interviews with relevant questions",
        );
      },
      [fix]: (errorMessage: string) => {
        new FixError(
          `${USER_MESSAGE} finds a solution to the error...`,
          context,
          errorMessage,
        ).execute(errorMessage, "🔧 Debug and fix the issue");
      },
      [explain]: async () => {
        await explainCode.execute(
          "💬 Get a clear and concise explanation of the code concept",
        );
      },
      [commitMessage]: async () => {
        await generateCommitMessage.execute(undefined, "commitMessage");
      },
      [generateDiagram]: async () => {
        await generateMermaidDiagram.execute(
          "📈 Visualize the code with a Mermaid diagram",
        );
      },
      [inlineChat]: async () => {
        await getInLineChat.execute(
          "💬 Discuss and reason about your code with me",
        );
      },
    };

    let subscriptions: vscode.Disposable[] = Object.entries(actionMap).map(
      ([action, handler]) => vscode.commands.registerCommand(action, handler),
    );

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
      secretStorageService,
    );
  } catch (error) {
    Memory.clear();
    vscode.window.showErrorMessage(
      "An Error occured while setting up generative AI model",
    );
    console.log(error);
  }
}

export function deactivate(context: vscode.ExtensionContext) {
  quickFixCodeAction.dispose();
  agentEventEmmitter.dispose();
  fileWatcher.dispose();
  context.subscriptions.forEach((subscription) => subscription.dispose());
}
