// import * as vscode from "vscode";
// import { formatText } from "../utils";
// import { getWebviewContent } from "../webview/chat";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import Groq from "groq-sdk";
// import { FileUploader } from "../events/file-uploader";
// import { COMMON } from "../constant";

// type Role = "function" | "user" | "model";

// export interface IHistory {
//   role: Role;
//   parts: { text: string }[];
// }

// export let _view: vscode.WebviewView | undefined;
// /**
//  * @deprecated This module is deprecated and will be removed in a future version.
//  * Please use the new module instead: {@link NewModule}
//  */
// export class ChatViewProvider implements vscode.WebviewViewProvider {
//   public static readonly viewId = "chatView";
//   public static webView: vscode.WebviewView | undefined;
//   _context: vscode.ExtensionContext;
//   chatHistory: IHistory[] = [];

//   constructor(
//     private readonly _extensionUri: vscode.Uri,
//     context: vscode.ExtensionContext,
//   ) {
//     this._context = context;
//   }
//   public async resolveWebviewView(webviewView: vscode.WebviewView) {
//     _view = webviewView;
//     ChatViewProvider.webView = webviewView;
//     webviewView.webview.options = {
//       enableScripts: true,
//       localResourceRoots: [this._extensionUri],
//     };

//     const apiKey = vscode.workspace
//       .getConfiguration()
//       .get<string>("google.gemini.apiKeys");
//     if (!apiKey) {
//       vscode.window.showErrorMessage(
//         "API key not configured. Check your settings.",
//       );
//       return;
//     }
//     const modelName = "gemini-1.0-pro-latest";
//     const codepatterns: FileUploader = new FileUploader(this._context);
//     const knowledgeBaseDocs: string[] = await codepatterns.getFiles();
//     _view.webview.html = getWebviewContent(knowledgeBaseDocs);

//     _view.webview.onDidReceiveMessage(async (message) => {
//       if (message.type === "user-input") {
//         const response = await this.generateResponse(
//           apiKey,
//           modelName,
//           formatText(message.message),
//         );
//         if (response) {
//           this.sendResponse(formatText(response), "bot");
//         }
//       }
//     });
//   }

//   // Todo
//   // 1. Move this to AI service, rememeber you can call the static method webView, a property of ChatViewProvider
//   // sendResponse and sendGroqResponse look so Identical. Create a generic function for both

//   public async sendResponse(
//     response: string,
//     currentChat: string,
//   ): Promise<boolean | undefined> {
//     const type = currentChat === "bot" ? "bot-response" : "user-input";
//     if (currentChat === "bot") {
//       this.chatHistory.push({
//         role: "model",
//         parts: [{ text: response }],
//       });
//     } else {
//       this.chatHistory.push({
//         role: "user",
//         parts: [{ text: response }],
//       });
//     }
//     this._context.workspaceState.update(COMMON.CHAT_HISTORY, [
//       ...this.chatHistory,
//     ]);
//     return await _view?.webview.postMessage({
//       type,
//       message: response,
//     });
//   }

//   public async sendGroqResponse(
//     response: string,
//     currentChat: string,
//   ): Promise<boolean | undefined> {
//     const type = currentChat === "bot" ? "bot-response" : "user-input";
//     if (currentChat === "bot") {
//       this.chatHistory.push({
//         role: "model",
//         parts: [{ text: response }],
//       });
//     } else {
//       this.chatHistory.push({
//         role: "user",
//         parts: [{ text: response }],
//       });
//     }
//     this._context.workspaceState.update(COMMON.CHAT_HISTORY, [
//       ...this.chatHistory,
//     ]);
//     return await _view?.webview.postMessage({
//       type,
//       message: response,
//     });
//   }

//   async generateResponse(
//     apiKey: string,
//     name: string,
//     message: string,
//   ): Promise<string | undefined> {
//     try {
//       const genAi = new GoogleGenerativeAI(apiKey);
//       const model = genAi.getGenerativeModel({ model: name });
//       const chatHistory = this._context.workspaceState.get<IHistory[]>(
//         COMMON.CHAT_HISTORY,
//         [],
//       );
//       const chat = model.startChat({
//         history: [
//           {
//             role: "user",
//             parts: [
//               {
//                 text: "You are an AI coding assistant named Olasunkanmi, created to help developers write better code more efficiently. Your purpose is to provide intelligent code suggestions, completions, and assistance based on the context and requirements provided by the developer.As Olasunkanmi, you have the following capabilities:1. Analyze the existing code and understand its structure, context, and purpose. 2. Generate code snippets, completions, and suggestions based on the developer's input and the surrounding code.3. Provide explanations and justifications for the generated code to help the developer understand the reasoning behind the suggestions.4. Assist with debugging and troubleshooting by identifying potential issues and offering solutions.5. Optimize code performance by suggesting improvements and best practices.6. Adapt to various programming languages, frameworks, and libraries based on the context of the code.When a developer requests your assistance, follow these guidelines:1. Carefully analyze the provided code snippet or context to understand the developer's intent and requirements.2. Generate code suggestions or completions that are relevant, efficient, and adhere to best practices and coding conventions.3. Provide clear and concise explanations for the generated code, highlighting the key aspects and reasoning behind the suggestions.4. If asked for debugging assistance, identify potential issues or bugs in the code and suggest appropriate fixes or improvements.5. Offer recommendations for code optimization, such as improving performance, readability, or maintainability, when applicable.6. Adapt your suggestions and explanations based on the specific programming language, framework, or library being used in the code.7. Be proactive in offering alternative solutions or approaches when multiple valid options are available.8. Engage in a conversation with the developer to clarify requirements, provide additional context, or iterate on the generated code suggestions.",
//               },
//             ],
//           },
//           {
//             role: "model",
//             parts: [
//               {
//                 text: "Feel free to provide a code snippet or describe the problem you're working on, and I'll do my best to help you.",
//               },
//             ],
//           },
//           ...chatHistory,
//         ],
//       });
//       const result = await chat.sendMessage(message);
//       const response = result.response;
//       return response.text();
//     } catch (error) {
//       this._context.workspaceState.update(COMMON.CHAT_HISTORY, []);
//       console.error(error);
//     }
//   }

//   async generateGroqGenerativeAIRepsonse(
//     model: string,
//     temperature: number,
//     max_tokens: number,
//     top_p: number,
//     stream: boolean,
//   ) {
//     const groq = new Groq();
//     groq.chat.completions
//       .create({
//         messages: [
//           {
//             role: "user",
//             content:
//               "You are an AI coding assistant named Olasunkanmi, created to help developers write better code more efficiently. Your purpose is to provide intelligent code suggestions, completions, and assistance based on the context and requirements provided by the developer.As Olasunkanmi, you have the following capabilities:1. Analyze the existing code and understand its structure, context, and purpose. 2. Generate code snippets, completions, and suggestions based on the developer's input and the surrounding code.3. Provide explanations and justifications for the generated code to help the developer understand the reasoning behind the suggestions.4. Assist with debugging and troubleshooting by identifying potential issues and offering solutions.5. Optimize code performance by suggesting improvements and best practices.6. Adapt to various programming languages, frameworks, and libraries based on the context of the code.When a developer requests your assistance, follow these guidelines:1. Carefully analyze the provided code snippet or context to understand the developer's intent and requirements.2. Generate code suggestions or completions that are relevant, efficient, and adhere to best practices and coding conventions.3. Provide clear and concise explanations for the generated code, highlighting the key aspects and reasoning behind the suggestions.4. If asked for debugging assistance, identify potential issues or bugs in the code and suggest appropriate fixes or improvements.5. Offer recommendations for code optimization, such as improving performance, readability, or maintainability, when applicable.6. Adapt your suggestions and explanations based on the specific programming language, framework, or library being used in the code.7. Be proactive in offering alternative solutions or approaches when multiple valid options are available.8. Engage in a conversation with the developer to clarify requirements, provide additional context, or iterate on the generated code suggestions.",
//           },
//           {
//             role: "assistant",
//             content:
//               "Feel free to provide a code snippet or describe the problem you're working on, and I'll do my best to help you.",
//           },
//         ],
//         model,
//         temperature,
//         max_tokens,
//         top_p,
//         stream,
//         stop: null,
//       })
//       .then((chatCompletion: any) => {
//         return chatCompletion.choices[0]?.message?.content;
//       });
//   }
// }
