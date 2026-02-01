import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DeepseekWebViewProvider } from '../../webview-providers/deepseek';
import { COMMON } from '../../application/constant';
import { Memory } from '../../memory/base';

// Mock classes and utilities
class MockWebview implements Partial<vscode.Webview> {
  public html: string = '';
  public options: vscode.WebviewOptions = { enableScripts: true };
  public cspSource: string = 'test-csp-source';
  public async postMessage(message: any): Promise<boolean> {
    return true;
  }
  public onDidReceiveMessage: vscode.Event<any> = new vscode.EventEmitter<any>().event;
  public asWebviewUri(localResource: vscode.Uri): vscode.Uri {
    return localResource;
  }
}

class MockWebviewView implements Partial<vscode.WebviewView> {
  public webview: vscode.Webview = new MockWebview() as unknown as vscode.Webview;
  public visible: boolean = true;
  public viewType: string = 'chatView';
  public onDidChangeVisibility: vscode.Event<void> = new vscode.EventEmitter<void>().event;
}

suite('DeepseekWebViewProvider', () => {
  let provider: DeepseekWebViewProvider;
  let mockContext: any;
  let mockExtensionUri: vscode.Uri;
  let tempDir: string;

  setup(() => {
    // Create temp directory for mock extension path
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebuddy-test-'));

    // Set up mocks
    mockExtensionUri = vscode.Uri.file(tempDir);
    mockContext = {
      extensionUri: mockExtensionUri,
      subscriptions: [],
      extensionPath: tempDir
    };

    // Initialize Memory
    Memory.getInstance();
    // Reset Memory store
    Memory.removeItems(COMMON.DEEPSEEK_CHAT_HISTORY);

    // Initialize the provider
    provider = new DeepseekWebViewProvider(
      mockExtensionUri,
      'fake-api-key',
      'deepseek-chat',
      mockContext as vscode.ExtensionContext
    );
  });

  teardown(() => {
    // Clean up temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Failed to clean up temp dir:', e);
    }
  });

  suite('sendResponse', () => {
    test('should add user messages to chat history', async () => {
      // Arrange
      const mockView = new MockWebviewView();
      (provider as any).currentWebView = mockView;

      // Act
      await provider.sendResponse('Hello from user', 'user-input');

      // Assert
      assert.strictEqual(provider.chatHistory.length, 1);
      assert.strictEqual(provider.chatHistory[0].role, 'user');
      assert.strictEqual(provider.chatHistory[0].content, 'Hello from user');
    });

    test('should add bot messages to chat history', async () => {
      // Arrange
      const mockView = new MockWebviewView();
      (provider as any).currentWebView = mockView;

      // Act
      await provider.sendResponse('Hello from bot', 'bot');

      // Assert
      assert.strictEqual(provider.chatHistory.length, 1);
      assert.strictEqual(provider.chatHistory[0].role, 'assistant');
      assert.strictEqual(provider.chatHistory[0].content, 'Hello from bot');
    });

    test('should store chat history in Memory after 2 messages', async () => {
      // Arrange
      const mockView = new MockWebviewView();
      (provider as any).currentWebView = mockView;

      // Act
      await provider.sendResponse('Hello from user', 'user-input');
      await provider.sendResponse('Hello from bot', 'bot');

      // Assert
      const storedHistory = Memory.get(COMMON.DEEPSEEK_CHAT_HISTORY);
      assert.strictEqual(storedHistory.length, 2);
      assert.strictEqual(storedHistory[0].role, 'user');
      assert.strictEqual(storedHistory[1].role, 'assistant');
    });
  });

  suite('generateResponse', () => {
    test('should store user message in chat history', async () => {
      // Arrange & Act
      // Mock the DeepseekLLM.generateText to avoid actual API calls
      const deepseekLLM = (provider as any).deepseekLLM;
      deepseekLLM.generateText = async () => 'Mocked response';
      
      const mockView = new MockWebviewView();
      (provider as any).currentWebView = mockView;

      await provider.generateResponse('Test question');

      // Assert
      // 1 user message + 1 assistant message
      assert.strictEqual(provider.chatHistory.length, 2);
      assert.strictEqual(provider.chatHistory[0].role, 'user');
      assert.strictEqual(provider.chatHistory[0].content, 'Test question');
      assert.strictEqual(provider.chatHistory[1].role, 'assistant');
      assert.strictEqual(provider.chatHistory[1].content, 'Mocked response');
    });
  });

  suite('Model Switching', () => {
    test('should update DeepseekLLM config when provider is re-instantiated with new model', () => {
      // Arrange
      const initialModel = 'deepseek-chat';
      const newModel = 'deepseek-coder';
      
      // Check initial model
      let llm = (provider as any).deepseekLLM;
      assert.strictEqual(llm.config.model, initialModel);

      // Act
      const newProvider = new DeepseekWebViewProvider(
        mockExtensionUri,
        'fake-api-key',
        newModel,
        mockContext as vscode.ExtensionContext
      );
      
      // Assert
      llm = (newProvider as any).deepseekLLM;
      assert.strictEqual(llm.config.model, newModel);
    });
  });
});
