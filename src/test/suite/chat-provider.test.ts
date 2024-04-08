import { formatText } from "./../../utils";
import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { getWebviewContent } from "../../chat";
import { ChatViewProvider } from "../../providers/chat-web-view-provider";
import { GoogleGenerativeAI } from "@google/generative-ai";

suite("Test the ChatProvider", async () => {
  test("should send a response to the webview when a message is received", async () => {
    const question = "Write K nearest neighbour function in typescript";
    const webview = {
      options: {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file("../../../../codebuddy")],
      },
      webview: {
        html: getWebviewContent(),
        onDidReceiveMessage: (callBack: (message: any) => void) => {
          callBack({ type: "user-input", message: question });
        },
        postMessage: (message: any) => {
          assert.strictEqual(message.type, "bot-response");
          assert.strictEqual(typeof message.message, "string");
        },
      },
    };

    const createExtensionContextStub = (): vscode.ExtensionContext =>
      ({
        subscriptions: [],
        workspaceState: {
          get: () => {
            return {
              chatHistory: [
                { role: "user", parts: [{ text: "Hello" }] },
                { role: "model", parts: [{ text: "Hi there!" }] },
              ],
            };
          },
          update: () => {
            return {
              chatHistory: [
                { role: "user", parts: [{ text: "Hello" }] },
                { role: "model", parts: [{ text: "Hi there!" }] },
              ],
            };
          },
        },
      } as any);
    let extensionContext: vscode.ExtensionContext;
    extensionContext = createExtensionContextStub();
    const provider = new ChatViewProvider(vscode.Uri.file("../../../../codebuddy"), extensionContext);
    provider.resolveWebviewView(webview as any);
    assert.strictEqual(typeof webview.webview.html, "string");
    assert.strictEqual(provider.chatHistory.length, 0);
  });

  suite("", () => {
    try {
      test("Should send a response to the webview when a message is received", async () => {
        const question = "Write K nearest neighbour function in typescript";
        const googleGenerativeAIStub = sinon.stub(GoogleGenerativeAI.prototype, "getGenerativeModel") as any;
        const startChartStub = sinon.stub();
        const sendMessageStub = sinon.stub();

        googleGenerativeAIStub.returns({
          startChat: startChartStub,
          apiKey: "1234",
          model: "Google Gemini",
          generationConfig: {},
          safetySettings: [],
          requestOptions: {},
          tools: [],
          generateContent: () => {},
        });

        startChartStub.returns({
          sendMessage: sendMessageStub,
        });

        sendMessageStub.resolves({
          response: {
            text: () => Promise.resolve("Hello World"),
          },
        });

        const webview = {
          options: {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file("../../../../codebuddy")],
          },
          webview: {
            html: getWebviewContent(),
            onDidReceiveMessage: (callBack: (message: any) => void) => {
              callBack({ type: "user-input", message: question });
            },
            postMessage: async (message: any) => {
              assert.strictEqual(message.type, "bot-response");
              assert.strictEqual(typeof message.message, "string");
            },
          },
        };

        const apiKeyStub = sinon.stub(vscode.workspace, "getConfiguration") as any;
        apiKeyStub.returns({
          get: sinon.stub().withArgs("google.gemini.apiKey").returns("1234"),
        });
        const createExtensionContextStub = (): vscode.ExtensionContext =>
          ({
            subscriptions: [],
            workspaceState: {
              get: () => {
                return [
                  { role: "user", parts: [{ text: "Hello" }] },
                  { role: "model", parts: [{ text: "Hi there!" }] },
                ];
              },
              update: () => {
                return [
                  { role: "user", parts: [{ text: "Hello" }] },
                  { role: "model", parts: [{ text: "Hi there!" }] },
                ];
              },
            },
          } as any);
        let extensionContext: vscode.ExtensionContext;
        extensionContext = createExtensionContextStub();
        const provider = new ChatViewProvider(vscode.Uri.file("../../../../codebuddy"), extensionContext);
        const sendResponsePromise = new Promise<void>((resolve) => {
          const sendResponse = provider.sendResponse;
          provider.sendResponse = async (...args) => {
            const result = await sendResponse.apply(provider, args);
            resolve();
            return result;
          };
        });
        await provider.resolveWebviewView(webview as any);
        await sendResponsePromise;

        sinon.assert.calledOnce(googleGenerativeAIStub);
        assert.strictEqual(provider.chatHistory.length, 1);
        assert.strictEqual(provider.chatHistory[0].role, "model");
        assert.strictEqual(provider.chatHistory[0].parts[0].text, formatText("Hello World"));
        sinon.restore();
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
