import * as assert from 'assert';
import { DeepseekWebViewProvider } from '../../webview-providers/deepseek';
import { COMMON } from '../../application/constant';
import { Memory } from '../../memory/base';
import { setupMockEditorHost } from '../mock/editor-host-mock';

// Mock types
interface MockUri {
  fsPath: string;
  scheme: string;
}

interface MockWebviewOptions {
  enableScripts: boolean;
}

interface MockEvent<T> {
  (listener: (e: T) => any, thisArgs?: any, disposables?: any[]): any;
}

class MockEventEmitter<T> {
  event: MockEvent<T> = (listener: (e: T) => any) => {
    return { dispose: () => {} };
  };
  fire(data: T) {}
}

// Mock classes and utilities
class MockWebview {
  public html = '';
  public options: MockWebviewOptions = { enableScripts: true };
  public cspSource = 'test-csp-source';
  public async postMessage(message: any): Promise<boolean> {
    return true;
  }
  public onDidReceiveMessage: MockEvent<any> = new MockEventEmitter<any>().event;
  public asWebviewUri(localResource: MockUri): MockUri {
    return localResource;
  }
}

class MockWebviewView {
  public webview = new MockWebview();
  public visible = true;
  public viewType = 'chatView';
  public onDidChangeVisibility: MockEvent<void> = new MockEventEmitter<void>().event;
}

suite('DeepseekWebViewProvider', () => {
  let provider: DeepseekWebViewProvider;
  let mockContext: any;
  let mockExtensionUri: MockUri;

  setup(() => {
    setupMockEditorHost();
    // Set up mocks
    mockExtensionUri = { fsPath: '/mock/extension/path', scheme: 'file' };
    mockContext = {
      extensionUri: mockExtensionUri,
      subscriptions: [],
      extensionPath: '/mock/extension/path'
    };

    // Initialize Memory
    Memory.getInstance();
    // Reset Memory store
    Memory.removeItems(COMMON.DEEPSEEK_CHAT_HISTORY);

    // Initialize the provider
    provider = new DeepseekWebViewProvider(
      mockExtensionUri as any,
      'fake-api-key',
      'deepseek-chat',
      mockContext as any
    );
  });

  teardown(() => {
    // No temp dir cleanup needed
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
      const memory = Memory.getInstance();
      const history = memory.get(COMMON.DEEPSEEK_CHAT_HISTORY);
      assert.strictEqual(history.length, 2);
    });
  });
});
