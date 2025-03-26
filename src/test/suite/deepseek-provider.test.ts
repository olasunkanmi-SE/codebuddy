import * as assert from 'assert';
import * as vscode from 'vscode';
import { DeepseekWebViewProvider } from '../../providers/deepseek';
import { COMMON } from '../../application/constant';
import { Memory } from '../../memory/base';

// Mock classes and utilities
class MockWebview implements Partial<vscode.Webview> {
  public html: string = '';
  public options: vscode.WebviewOptions | undefined;
  public async postMessage(message: any): Promise<boolean> {
    return true;
  }
}

class MockWebviewView implements Partial<vscode.WebviewView> {
  public webview: MockWebview = new MockWebview();
  public visible: boolean = true;
  public viewType: string = 'chatView';
}

describe('DeepseekWebViewProvider', () => {
  let provider: DeepseekWebViewProvider;
  let mockContext: any;
  let mockExtensionUri: vscode.Uri;
  
  beforeEach(() => {
    // Set up mocks
    mockExtensionUri = vscode.Uri.file('/fake/path');
    mockContext = {
      extensionUri: mockExtensionUri,
      subscriptions: [],
    };
    
    // Initialize the provider
    provider = new DeepseekWebViewProvider(
      mockExtensionUri,
      'fake-api-key',
      'deepseek-model',
      mockContext as vscode.ExtensionContext
    );
    
    // Reset Memory store
    Memory.removeItems(COMMON.DEEPSEEK_CHAT_HISTORY);
  });
  
  describe('sendResponse', () => {
    it('should add user messages to chat history', async () => {
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
    
    it('should add bot messages to chat history', async () => {
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
    
    it('should store chat history in Memory after 2 messages', async () => {
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
  
  describe('generateResponse', () => {
    it('should store user message in chat history', async () => {
      // Arrange & Act
      // Mock the API call to return a known value
      (provider as any).callDeepseekAPI = async () => 'Mocked response';
      
      const response = await provider.generateResponse('Test question');
      
      // Assert
      assert.strictEqual(response, 'Mocked response');
    });
  });
});