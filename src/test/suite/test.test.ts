import { formatText } from "./../../utils";
import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { getWebviewContent } from "../../chat";
import { ChatViewProvider } from "../../providers/chat-web-view-provider";
import { GoogleGenerativeAI } from "@google/generative-ai";

const sandbox = sinon.createSandbox();

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
    const provider = new ChatViewProvider(vscode.Uri.file("../../../../codebuddy"));
    provider.resolveWebviewView(webview as any);
    assert.strictEqual(typeof webview.webview.html, "string");
    assert.strictEqual(provider.chatHistory.length, 0);
  });

  suite("", () => {
    try {
      test("Should send a response to the webview when a message is received", async () => {
        const question = "Write K nearest neighbour function in typescript";
        const googleGenerativeAIStub = sandbox.stub(GoogleGenerativeAI.prototype, "getGenerativeModel") as any;
        const startChartStub = sandbox.stub();
        const sendMessageStub = sandbox.stub();

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

        const apiKeyStub = sandbox.stub(vscode.workspace, "getConfiguration") as any;
        apiKeyStub.returns({
          get: sandbox.stub().withArgs("google.gemini.apiKey").returns("1234"),
        });
        const provider = new ChatViewProvider(vscode.Uri.file("../../../../codebuddy"));
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

        sandbox.assert.calledOnce(googleGenerativeAIStub);
        assert.strictEqual(provider.chatHistory.length, 2, "Chat history should have 2 entries");
        assert.strictEqual(provider.chatHistory[0].role, "user");
        assert.strictEqual(provider.chatHistory[0].parts[0].text, formatText(question));
        assert.strictEqual(provider.chatHistory[1].role, "model");
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});

afterEach(() => {
  sandbox.restore();
});
