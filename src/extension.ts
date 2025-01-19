import * as vscode from "vscode";
import {
  APP_CONFIG,
  generativeAiModels,
  OLA_ACTIONS,
  USER_MESSAGE,
} from "./application/constant";
import { getConfigValue } from "./application/utils";
import { Comments } from "./events/comment";
import { ExplainCode } from "./events/explain";
import { FixError } from "./events/fixError";
import { CodeChartGenerator } from "./events/generate-code-chart";
import { GenerateCommitMessage } from "./events/generate-commit-message";
import { GenerateUnitTest } from "./events/generate-unit-test";
import { InLineChat } from "./events/inline-chat";
import { InterviewMe } from "./events/interview-me";
import { ReadFromKnowledgeBase } from "./events/knowledge-base";
import { OptimizeCode } from "./events/optimize";
import { RefactorCode } from "./events/refactor";
import { ReviewCode } from "./events/review";
import { AnthropicWebViewProvider } from "./providers/anthropic-web-view-provider";
import { CodeActionsProvider } from "./providers/code-actions-provider";
import { GeminiWebViewProvider } from "./providers/gemini-web-view-provider";
import { GroqWebViewProvider } from "./providers/groq-web-view-provider";
import { FileUploader } from "./services/file-uploader";
import { setUpGenerativeAiModel } from "./services/generative-ai-model-manager";
import { Brain } from "./services/memory";
import { TypeScriptAtsMapper } from "./services/typescript-ats.service";
import { CodeStructureMapper } from "./services/code-structure.mapper.service";

const {
  geminiKey,
  geminiModel,
  groqApiKey,
  groqModel,
  anthropicApiKey,
  anthropicModel,
  grokApiKey,
  grokModel,
} = APP_CONFIG;

export async function activate(context: vscode.ExtensionContext) {
  try {
    Brain.getInstance();

    const getKnowledgeBase = async () => {
      const codeMapper = new TypeScriptAtsMapper();
      const mappedCode = await codeMapper.buildCodebaseMap();
      const ats = Object.values(mappedCode).flatMap((repo) =>
        Object.values(repo.modules),
      );
      const mapper = new CodeStructureMapper(ats);
      return mapper.normalizeData();
    };
    getKnowledgeBase();
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
    const codeChartGenerator = new CodeChartGenerator(
      `${USER_MESSAGE} creates the code chart...`,
      context,
    );
    const codePattern = new FileUploader(context);
    const knowledgeBase = new ReadFromKnowledgeBase(
      `${USER_MESSAGE} generate your code pattern...`,
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

    const generateUnitTests = new GenerateUnitTest(
      `${USER_MESSAGE} generates unit tests...`,
      context,
    );

    const actionMap = {
      [comment]: () => getComment.execute(),
      [review]: () => generateReview.execute(),
      [refactor]: () => generateRefactoredCode.execute(),
      [optimize]: () => generateOptimizeCode.execute(),
      [interviewMe]: () => generateInterviewQuestions.execute(),
      [generateUnitTest]: () => generateUnitTests.execute(),
      [fix]: (errorMessage: string) =>
        new FixError(
          `${USER_MESSAGE} finds a solution to the error...`,
          context,
          errorMessage,
        ).execute(errorMessage),
      [explain]: () => explainCode.execute(),
      [pattern]: () => codePattern.uploadFileHandler(),
      [knowledge]: () => knowledgeBase.execute(),
      [commitMessage]: () => generateCommitMessage.execute("hello"),
      [generateCodeChart]: () => codeChartGenerator.execute(),
      [inlineChat]: () => getInLineChat.execute(),
    };

    const subscriptions: vscode.Disposable[] = Object.entries(actionMap).map(
      ([action, handler]) => vscode.commands.registerCommand(action, handler),
    );

    const selectedGenerativeAiModel = getConfigValue("generativeAi.option");

    const quickFix = new CodeActionsProvider();
    const quickFixCodeAction: vscode.Disposable =
      vscode.languages.registerCodeActionsProvider(
        { scheme: "file", language: "*" },
        quickFix,
      );

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
      setUpGenerativeAiModel(
        context,
        model,
        key,
        webviewProviderClass,
        subscriptions,
        quickFixCodeAction,
      );
    }
  } catch (error) {
    Brain.clear();
    vscode.window.showErrorMessage(
      "An Error occured while setting up generative AI model",
    );
    console.log(error);
  }
}

export function deactivate(context: vscode.ExtensionContext) {
  //TODO once the application is rewritten in React, delete the pattern file on deactivate
  context.subscriptions.forEach((subscription) => subscription.dispose());
}
