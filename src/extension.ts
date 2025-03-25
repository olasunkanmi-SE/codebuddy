import * as path from "path";
import * as vscode from "vscode";
import { APP_CONFIG, generativeAiModels, OLA_ACTIONS, USER_MESSAGE } from "./application/constant";
import { Comments } from "./commands/comment";
import { ExplainCode } from "./commands/explain";
import { FixError } from "./commands/fixError";
import { CodeChartGenerator } from "./commands/generate-code-chart";
import { GenerateCommitMessage } from "./commands/generate-commit-message";
import { GenerateUnitTest } from "./commands/generate-unit-test";
import { InLineChat } from "./commands/inline-chat";
import { InterviewMe } from "./commands/interview-me";
import { ReadFromKnowledgeBase } from "./commands/knowledge-base";
import { OptimizeCode } from "./commands/optimize";
import { RefactorCode } from "./commands/refactor";
import { ReviewCode } from "./commands/review";
import { EventEmitter } from "./emitter/agent-emitter";
import { dbManager } from "./infrastructure/repository/data-base-manager";
import { Memory } from "./memory/base";
import { AnthropicWebViewProvider } from "./providers/anthropic";
import { CodeActionsProvider } from "./providers/code-actions";
import { GeminiWebViewProvider } from "./providers/gemini";
import { GroqWebViewProvider } from "./providers/groq";
import { FileUploader } from "./services/file-uploader";
import { initializeGenerativeAiEnvironment } from "./services/generative-ai-model-manager";
import { Credentials } from "./services/github-authentication";
import { getConfigValue } from "./utils/utils";
import { Logger } from "./infrastructure/logger/logger";
import { WorkspaceService } from "./services/workspace-service";

const { geminiKey, geminiModel, groqApiKey, groqModel, anthropicApiKey, anthropicModel, grokApiKey, grokModel } =
  APP_CONFIG;

const logger = new Logger("extension");

let quickFixCodeAction: vscode.Disposable;
let agentEventEmmitter: EventEmitter;

async function connectToDatabase() {
  try {
    const dbPath = path.join(__dirname, "..", "patterns", "dev.db");
    const urlPath = dbPath.replace(/\\/g, "/");
    const isWindows = dbPath.includes("\\");
    const filePath = isWindows ? `file:/${urlPath}` : `file:${urlPath}`;
    await dbManager.connect(filePath);
  } catch (error: any) {
    logger.error("Unable to connect to DB", error);
    throw new Error(error);
  }
}

async function createFileDB(context: vscode.ExtensionContext) {
  try {
    const fileUploader = new FileUploader(context);
    const files = await fileUploader.getFiles();
    if (!files?.find((file) => file.includes("dev.db"))) {
      await fileUploader.createFile("dev.db");
    }
  } catch (error: any) {
    logger.error("Unable to ", error);
    throw new Error(error);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  try {
    await createFileDB(context);
    await connectToDatabase();
    const credentials = new Credentials();
    await credentials.initialize(context);
    const session: vscode.AuthenticationSession | undefined = await credentials.getSession();
    logger.info(`Logged into GitHub as ${session?.account.label}`);
    Memory.getInstance();
    const fileUpload = new FileUploader(context);
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
      pattern,
      knowledge,
      commitMessage,
      interviewMe,
      generateUnitTest,
      generateCodeChart,
      inlineChat,
    } = OLA_ACTIONS;
    const getComment = new Comments(`${USER_MESSAGE} generates the code comments...`, context);
    const getInLineChat = new InLineChat(`${USER_MESSAGE} generates a response...`, context);
    const generateOptimizeCode = new OptimizeCode(`${USER_MESSAGE} optimizes the code...`, context);
    const generateRefactoredCode = new RefactorCode(`${USER_MESSAGE} refactors the code...`, context);
    const explainCode = new ExplainCode(`${USER_MESSAGE} explains the code...`, context);
    const generateReview = new ReviewCode(`${USER_MESSAGE} reviews the code...`, context);
    const codeChartGenerator = new CodeChartGenerator(`${USER_MESSAGE} creates the code chart...`, context);
    const codePattern = fileUpload;
    const knowledgeBase = new ReadFromKnowledgeBase(`${USER_MESSAGE} generate your code pattern...`, context);
    const generateCommitMessage = new GenerateCommitMessage(`${USER_MESSAGE} generates a commit message...`, context);
    const generateInterviewQuestions = new InterviewMe(`${USER_MESSAGE} generates interview questions...`, context);

    const generateUnitTests = new GenerateUnitTest(`${USER_MESSAGE} generates unit tests...`, context);

    const actionMap = {
      [comment]: async () => await getComment.execute(),
      [review]: async () => await generateReview.execute(),
      [refactor]: async () => await generateRefactoredCode.execute(),
      [optimize]: async () => await generateOptimizeCode.execute(),
      [interviewMe]: async () => await generateInterviewQuestions.execute(),
      [generateUnitTest]: async () => await generateUnitTests.execute(),
      [fix]: (errorMessage: string) =>
        new FixError(`${USER_MESSAGE} finds a solution to the error...`, context, errorMessage).execute(errorMessage),
      [explain]: async () => await explainCode.execute(),
      [pattern]: async () => await codePattern.uploadFileHandler(),
      [knowledge]: async () => await knowledgeBase.execute(),
      [commitMessage]: async () => await generateCommitMessage.execute("commitMessage"),
      [generateCodeChart]: async () => await codeChartGenerator.execute(),
      [inlineChat]: async () => await getInLineChat.execute(),
    };

    const subscriptions: vscode.Disposable[] = Object.entries(actionMap).map(([action, handler]) =>
      vscode.commands.registerCommand(action, handler)
    );

    const selectedGenerativeAiModel = getConfigValue("generativeAi.option");

    const quickFix = new CodeActionsProvider();
    quickFixCodeAction = vscode.languages.registerCodeActionsProvider({ scheme: "file", language: "*" }, quickFix);

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
    };
    if (selectedGenerativeAiModel in modelConfigurations) {
      const modelConfig = modelConfigurations[selectedGenerativeAiModel];
      const { key, model, webviewProviderClass } = modelConfig;
      initializeGenerativeAiEnvironment(
        context,
        model,
        key,
        webviewProviderClass,
        subscriptions,
        quickFixCodeAction,
        agentEventEmmitter
      );
    }
    const w = WorkspaceService.getInstance();
    await w.getContextInfo(true);
  } catch (error) {
    Memory.clear();
    vscode.window.showErrorMessage("An Error occured while setting up generative AI model");
    console.log(error);
  }
}

export function deactivate(context: vscode.ExtensionContext) {
  quickFixCodeAction.dispose();
  agentEventEmmitter.dispose();
  context.subscriptions.forEach((subscription) => subscription.dispose());
}
