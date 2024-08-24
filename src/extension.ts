import * as vscode from "vscode";
import * as fs from "fs";
import {
  appConfig,
  generativeAiModel,
  OLA_ACTIONS,
  USER_MESSAGE,
} from "./constant";
import { Comments } from "./events/comment";
import { ExplainCode } from "./events/explain";
import { FixError } from "./events/fixError";
import { GenerateCommitMessage } from "./events/generate-commit-message";
import { GenerateUnitTest } from "./events/generate-unit-test";
import { InterviewMe } from "./events/interview-me";
import { ReadFromKnowledgeBase } from "./events/knowledge-base";
import { OptimizeCode } from "./events/optimize";
import { FileUploader } from "./events/file-uploader";
import { RefactorCode } from "./events/refactor";
import { ReviewCode } from "./events/review";
import { CodeActionsProvider } from "./providers/code-actions-provider";
import { GeminiWebViewProvider } from "./providers/gemini-web-view-provider";
import { GroqWebViewProvider } from "./providers/groq-web-view-provider";
import { ChatManager } from "./services/chat-manager";
import { getConfigValue } from "./utils";
import { CodeChartGenerator } from "./events/generate-code-chart";
import { setUpGenerativeAiModel } from "./services/generative-ai-model-manager";
import * as path from "path";

const { geminiKey, geminiModel, groqKey, groqModel } = appConfig;

export async function activate(context: vscode.ExtensionContext) {
  try {
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
    } = OLA_ACTIONS;
    const getComment = new Comments(
      `${USER_MESSAGE} generates the code comments...`,
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
        subscriptions: vscode.Disposable[];
        quickFixCodeAction: vscode.Disposable;
      };
    } = {
      [generativeAiModel.GEMINI]: {
        key: geminiKey,
        model: geminiModel,
        webviewProviderClass: GeminiWebViewProvider,
        subscriptions,
        quickFixCodeAction,
      },
      [generativeAiModel.GROQ]: {
        key: groqKey,
        model: groqModel,
        webviewProviderClass: GroqWebViewProvider,
        subscriptions,
        quickFixCodeAction,
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
