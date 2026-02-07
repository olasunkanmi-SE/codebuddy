import * as assert from 'assert';
import * as sinon from 'sinon';
import { QwenWebViewProvider } from '../../webview-providers/qwen';
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

// Mock classes
class MockWebview {
  public html = '';
  public options: MockWebviewOptions = { enableScripts: true };
  public cspSource = '';
  public onDidReceiveMessage: MockEvent<any> = new MockEventEmitter<any>().event;
  
  public async postMessage(message: any): Promise<boolean> {
    return true;
  }

  public asWebviewUri(localResource: MockUri): MockUri {
    return localResource;
  }
}

class MockWebviewView {
  public webview: MockWebview = new MockWebview();
  public visible = true;
  public viewType = 'chatView';
  public onDidDispose: MockEvent<void> = new MockEventEmitter<void>().event;
}

suite('QwenWebViewProvider Test Suite', () => {
  let provider: QwenWebViewProvider;
  let mockContext: any;
  let mockExtensionUri: MockUri;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    setupMockEditorHost();
    
    // Set up mocks
    // Use a mock path instead of real temp directory
    mockExtensionUri = { fsPath: '/mock/extension/path', scheme: 'file' };
    mockContext = {
      extensionUri: mockExtensionUri,
      subscriptions: [],
      extensionPath: '/mock/extension/path'
    };

    // Initialize Memory
    Memory.getInstance();

    // Initialize the provider
    provider = new QwenWebViewProvider(
      mockExtensionUri as any,
      'fake-api-key',
      'qwen-model',
      mockContext as any
    );

    // Mock the webview
    const mockView = new MockWebviewView();
    provider.resolveWebviewView(mockView as any);
    
    // Reset Memory store
    Memory.removeItems(COMMON.QWEN_CHAT_HISTORY);
  });

  teardown(() => {
    sandbox.restore();
    Memory.removeItems(COMMON.QWEN_CHAT_HISTORY);
  });

  test('sendResponse should update chat history and post message', async () => {
    // Spy on postMessage
    const postMessageSpy = sandbox.spy(provider.currentWebView!.webview, 'postMessage');

    // Act
    await provider.sendResponse('Hello from user', 'user-input');

    // Assert
    assert.strictEqual(provider.chatHistory.length, 1);
    assert.strictEqual(provider.chatHistory[0].role, 'user');
    assert.strictEqual(provider.chatHistory[0].content, 'Hello from user');
    
    assert.ok(postMessageSpy.calledOnce);
    assert.deepStrictEqual(postMessageSpy.firstCall.args[0], {
      type: 'user-input',
      message: 'Hello from user'
    });
  });

  test('generateResponse should call OpenAI client and return response', async () => {
    // This test relies on internal implementation details of QwenWebViewProvider 
    // which might need mocking of OpenAI client. 
    // Since we are just removing vscode dependencies, we assume the logic inside 
    // QwenWebViewProvider that calls OpenAI is not dependent on vscode.
    // However, if QwenWebViewProvider imports OpenAI from a place that depends on vscode, 
    // we might have issues. But usually OpenAI client is independent.
    
    // The original test code had a stub for OpenAI client. I should probably include it or skip it if it's too complex to mock here without vscode.
    // Let's see the original test code again.
    
    /*
    test('generateResponse should call OpenAI client and return response', async () => {
      // Stub OpenAI client method
      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'Mocked Qwen response'
            }
          }
        ]
      };
      
      // Need to access the openai client instance on the provider
      // If it's private, we cast to any
      const openaiStub = {
        chat: {
          completions: {
            create: sandbox.stub().resolves(mockCompletion)
          }
        }
      };
      
      (provider as any).openai = openaiStub;
      
      const response = await (provider as any).generateResponse([{ role: 'user', content: 'hi' }]);
      assert.strictEqual(response, 'Mocked Qwen response');
    });
    */
    
    // I will rewrite this test part as well to be complete.
    
    const mockCompletion = {
      choices: [
        {
          message: {
            content: 'Mocked Qwen response'
          }
        }
      ]
    };
    
    const openaiStub = {
      chat: {
        completions: {
          create: sandbox.stub().resolves(mockCompletion)
        }
      }
    };
    
    (provider as any).openai = openaiStub;
    
    const response = await (provider as any).generateResponse([{ role: 'user', content: 'hi' }]);
    assert.strictEqual(response, 'Mocked Qwen response');
  });
});
