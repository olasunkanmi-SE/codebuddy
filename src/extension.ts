import * as vscode from "vscode";
import { Comments } from "./comment";
import { OLA_ACTIONS, USER_MESSAGE } from "./constant";
import { fixCodeError } from "./fix";
import { OptimizeCode } from "./optimize";
import { CodeActionsProvider } from "./providers/code-actions-provider";
import { RefactorCode } from "./refactor";
import { ReviewCode } from "./review";
import { ChatManager } from "./services/chat-manager";
import { GroqWebViewProvider } from "./providers/groq-web-view-provider";
import { ExplainCode } from "./explain";

export async function activate(context: vscode.ExtensionContext) {
  const { comment, review, refactor, optimize, fix, explain } = OLA_ACTIONS;
  const getComment = new Comments(
    `${USER_MESSAGE} generates the code comments...`,
    context
  );
  const generateOptimizeCode = new OptimizeCode(
    `${USER_MESSAGE} optimizes the code...`,
    context
  );
  const generateRefactoredCode = new RefactorCode(
    `${USER_MESSAGE} refactors the code...`,
    context
  );
  const explainCode = new ExplainCode(
    `${USER_MESSAGE} explains the code...`,
    context
  );
  const generateReview = new ReviewCode(
    `${USER_MESSAGE} reviews the code...`,
    context
  );

  const actionMap = {
    [comment]: () => getComment.execute(),
    [review]: () => generateReview.execute(),
    [refactor]: () => generateRefactoredCode.execute(),
    [optimize]: () => generateOptimizeCode.execute(),
    [fix]: (errorMessage: string) => fixCodeError(errorMessage),
    [explain]: () => explainCode.execute(),
  };

  const subscriptions = Object.entries(actionMap).map(([action, handler]) =>
    vscode.commands.registerCommand(action, handler)
  );

  const quickFix = new CodeActionsProvider();
  const quickFixCodeAction = vscode.languages.registerCodeActionsProvider(
    { scheme: "file", language: "*" },
    quickFix
  );

  const groqWebViewProvider = new GroqWebViewProvider(
    context.extensionUri,
    "groq.llama3.apiKey",
    "llama3-70b-8192",
    context
  );

  //Make this optional based on the chosen LLM
  // const geminiWebViewProvider = new GeminiWebViewProvider(
  //   context.extensionUri,
  //   "groq.llama3.apiKey",
  //   "llama3-70b-8192",
  //   context
  // );

  // const registerGeminiWebViewProvider =
  //   vscode.window.registerWebviewViewProvider(
  //     GeminiWebViewProvider.viewId,
  //     geminiWebViewProvider
  //   );

  const registerGroqWebViewProvider = vscode.window.registerWebviewViewProvider(
    GroqWebViewProvider.viewId,
    groqWebViewProvider
  );

  const chatManager = new ChatManager(
    "groq.llama3.apiKey",
    "llama3-70b-8192",
    context
  );
  const chatWithOla = chatManager.chatWithOla();

  context.subscriptions.push(
    ...subscriptions,
    quickFixCodeAction,
    registerGroqWebViewProvider,
    chatWithOla
  );
}
