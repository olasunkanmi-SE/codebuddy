import * as vscode from "vscode";
import { Comments } from "./comment";
import { OLA_ACTIONS, USER_MESSAGE } from "./constant";
import { fixCodeError } from "./fix";
import { OptimizeCode } from "./optimize";
import { ChatViewProvider } from "./providers/chat-web-view-provider";
import { CodeActionsProvider } from "./providers/code-actions-provider";
import { RefactorCode } from "./refactor";
import { ReviewCode } from "./review";
import { ChatManager } from "./services/chat-manager";

export async function activate(context: vscode.ExtensionContext) {
  const { comment, review, refactor, optimize, fix } = OLA_ACTIONS;
  const getComment = new Comments(`${USER_MESSAGE} generates the code comments...`);
  const generateOptimizeCode = new OptimizeCode(`${USER_MESSAGE} optimizes the code...`);
  const generateRefactoredCode = new RefactorCode(`${USER_MESSAGE} refactors the code...`);
  const generateReview = new ReviewCode(`${USER_MESSAGE} reviews the code...`);
  const commentCode = vscode.commands.registerCommand(comment, () => getComment.execute());
  const reviewCode = vscode.commands.registerCommand(review, () => generateReview.execute());
  const refactorCode = vscode.commands.registerCommand(refactor, () => generateRefactoredCode.execute());
  const optimizeCode = vscode.commands.registerCommand(optimize, () => generateOptimizeCode.execute());
  const fixCode = vscode.commands.registerCommand(fix, (errorMessage: string) => {
    fixCodeError(errorMessage);
  });

  const quickFix = new CodeActionsProvider();
  const quickFixCodeAction = vscode.languages.registerCodeActionsProvider({ scheme: "file", language: "*" }, quickFix);
  const chatViewProvider = new ChatViewProvider(context.extensionUri, context);
  const chatWebViewProvider = vscode.window.registerWebviewViewProvider(ChatViewProvider.viewId, chatViewProvider);
  const chatManager = new ChatManager(context);
  const chatWithOla = chatManager.chatWithOla();

  context.subscriptions.push(
    commentCode,
    reviewCode,
    refactorCode,
    fixCode,
    optimizeCode,
    quickFixCodeAction,
    chatWebViewProvider,
    chatWithOla
  );
}
