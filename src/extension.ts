import * as vscode from "vscode";
import { getWebviewContent } from "./chat";
import { Comments } from "./comment";
import { OLA_ACTIONS, USER_MESSAGE } from "./constant";
import { fixCodeError } from "./fix";
import { OptimizeCode } from "./optimize";
import { RefactorCode } from "./refactor";
import { ReviewCode } from "./review";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface IHistory {
  role?: string;
  parts?: { text?: string }[];
}

export async function activate(context: vscode.ExtensionContext) {
  const { comment, review, refactor, optimize, fix } = OLA_ACTIONS;
  const getComment = new Comments(
    `${USER_MESSAGE} generates the code comments...`
  );
  const generateOptimizeCode = new OptimizeCode(
    `${USER_MESSAGE} optimizes the code...`
  );
  const generateRefactoredCode = new RefactorCode(
    `${USER_MESSAGE} refactors the code...`
  );
  const generateReview = new ReviewCode(`${USER_MESSAGE} reviews the code...`);
  const commentCode = vscode.commands.registerCommand(comment, () =>
    getComment.execute()
  );
  const reviewCode = vscode.commands.registerCommand(review, () =>
    generateReview.execute()
  );
  const refactorCode = vscode.commands.registerCommand(refactor, () =>
    generateRefactoredCode.execute()
  );
  const optimizeCode = vscode.commands.registerCommand(optimize, () =>
    generateOptimizeCode.execute()
  );
  const fixCode = vscode.commands.registerCommand(
    fix,
    (errorMessage: string) => {
      fixCodeError(errorMessage);
    }
  );

  const askExtensionProvider = new AskExtensionProvider();
  const askExtensionDisposable = vscode.languages.registerCodeActionsProvider(
    { scheme: "file", language: "*" },
    askExtensionProvider
  );
  const provider = new ChatViewProvider(context.extensionUri);
  const chatWebViewProvider = vscode.window.registerWebviewViewProvider(
    ChatViewProvider.viewId,
    provider
  );

  const chatWithOla = vscode.commands.registerCommand(
    "ola.sendChatMessage",
    async () => {
      try {
        const apiKey = vscode.workspace
          .getConfiguration()
          .get<string>("google.gemini.apiKey");
        if (!apiKey) {
          vscode.window.showErrorMessage(
            "API key not configured. Check your settings."
          );
          return;
        }
        const modelName = "gemini-1.0-pro-latest";
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          console.debug("Abandon: no open text editor.");
          return;
        }
        const selectedText = activeEditor.document.getText(
          activeEditor.selection
        );
        const message = selectedText;

        const response = await provider.generateResponse(
          apiKey,
          modelName,
          message
        );
        if (!response) {
          throw new Error("Failed to generate content");
        }
        console.log(response);
        provider.sendResponse(message, "You");
        provider.sendResponse(response, "bot");
      } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(
          "Failed to generate content. Please try again later."
        );
      }
    }
  );

  context.subscriptions.push(
    commentCode,
    reviewCode,
    refactorCode,
    fixCode,
    optimizeCode,
    askExtensionDisposable,
    chatWebViewProvider,
    chatWithOla
  );
}

class AskExtensionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const actions: vscode.CodeAction[] = [];
    if (context.diagnostics.length > 0) {
      const diagnostic = context.diagnostics[0];
      const errorMessage = diagnostic.message;
      const action = new vscode.CodeAction(
        "Ola fix this error",
        vscode.CodeActionKind.QuickFix
      );
      action.command = {
        command: "ola.codeFix",
        title: "Ola fix this error",
        arguments: [errorMessage],
      };
      actions.push(action);
    }
    return actions;
  }
}

class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "chatView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const apiKey = vscode.workspace
      .getConfiguration()
      .get<string>("google.gemini.apiKey");
    if (!apiKey) {
      vscode.window.showErrorMessage(
        "API key not configured. Check your settings."
      );
      return;
    }
    const modelName = "gemini-1.0-pro-latest";
    this._view.webview.html = getWebviewContent();

    this._view.webview.onDidReceiveMessage(async (message) => {
      console.log(message);
      if (message.type === "user-input") {
        const response = await this.generateResponse(
          apiKey,
          modelName,
          message.message
        );
        this.sendResponse(response, "bot", message.id);
      }
    });
  }

  public async sendResponse(
    response: string,
    currentChat: string,
    messageId?: string
  ) {
    const type = currentChat === "bot" ? "bot-response" : "user-input";
    return await this._view?.webview.postMessage({
      type,
      message: response,
      id: messageId,
    });
  }

  async generateResponse(
    apiKey: string,
    name: string,
    message: string
  ): Promise<string> {
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: name });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: "You are an AI coding assistant named CodEx, created to help developers write better code more efficiently. Your purpose is to provide intelligent code suggestions, completions, and assistance based on the context and requirements provided by the developer.As CodEx, you have the following capabilities:1. Analyze the existing code and understand its structure, context, and purpose. 2. Generate code snippets, completions, and suggestions based on the developer's input and the surrounding code.3. Provide explanations and justifications for the generated code to help the developer understand the reasoning behind the suggestions.4. Assist with debugging and troubleshooting by identifying potential issues and offering solutions.5. Optimize code performance by suggesting improvements and best practices.6. Adapt to various programming languages, frameworks, and libraries based on the context of the code.When a developer requests your assistance, follow these guidelines:1. Carefully analyze the provided code snippet or context to understand the developer's intent and requirements.2. Generate code suggestions or completions that are relevant, efficient, and adhere to best practices and coding conventions.3. Provide clear and concise explanations for the generated code, highlighting the key aspects and reasoning behind the suggestions.4. If asked for debugging assistance, identify potential issues or bugs in the code and suggest appropriate fixes or improvements.5. Offer recommendations for code optimization, such as improving performance, readability, or maintainability, when applicable.6. Adapt your suggestions and explanations based on the specific programming language, framework, or library being used in the code.7. Be proactive in offering alternative solutions or approaches when multiple valid options are available.8. Engage in a conversation with the developer to clarify requirements, provide additional context, or iterate on the generated code suggestions.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Feel free to provide a code snippet or describe the problem you're working on, and I'll do my best to help you.",
            },
          ],
        },
      ],
    });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }
}
