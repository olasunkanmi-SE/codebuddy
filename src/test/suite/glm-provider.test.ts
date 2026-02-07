import * as assert from 'assert';
import * as sinon from 'sinon';
import { GLMWebViewProvider } from '../../webview-providers/glm';
import { COMMON } from '../../application/constant';
import { Memory } from '../../memory/base';
import { setupMockEditorHost } from '../mock/editor-host-mock';

// Mock classes
class MockWebview {
  public html = '';
  public options = { enableScripts: true };
  public cspSource = '';
  public onDidReceiveMessage = {
    event: (listener: any) => ({ dispose: () => {} }),
    dispose: () => {}
  };

  public async postMessage(message: any): Promise<boolean> {
    return true;
  }

  public asWebviewUri(localResource: any): any {
    return localResource;
  }
}

class MockWebviewView {
  public webview = new MockWebview();
  public visible = true;
  public viewType = 'chatView';
  public onDidDispose = {
    event: (listener: any) => ({ dispose: () => {} }),
    dispose: () => {}
  };
}

suite('GLMWebViewProvider Test Suite', () => {
  let provider: GLMWebViewProvider;
  let mockContext: any;
  let mockExtensionUri: any;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    setupMockEditorHost();
    
    // Set up mocks
    mockExtensionUri = { fsPath: '/mock/extension/path', path: '/mock/extension/path', scheme: 'file' };
    mockContext = {
      extensionUri: mockExtensionUri,
      subscriptions: [],
      extensionPath: '/mock/extension/path'
    };

    // Initialize Memory
    Memory.getInstance();

    // Initialize the provider
    provider = new GLMWebViewProvider(
      mockExtensionUri,
      'fake-api-key',
      'glm-model',
      mockContext as any
    );

    // Mock the webview
    const mockView = new MockWebviewView();
    provider.resolveWebviewView(mockView as any);
    
    // Reset Memory store
    Memory.removeItems(COMMON.GLM_CHAT_HISTORY);
  });

  teardown(() => {
    sandbox.restore();
    Memory.removeItems(COMMON.GLM_CHAT_HISTORY);
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
    // Stub OpenAI client method
    const mockCompletion = {
      choices: [
        {
          message: {
            content: 'Mocked GLM response'
          }
        }
      ]
    };

    // We need to cast model to any to stub the nested method
    const createStub = sandbox.stub();
    createStub.resolves(mockCompletion);
    
    (provider.model as any).chat = {
      completions: {
        create: createStub
      }
    };

    // Act
    const response = await provider.generateResponse('Test question');

    // Assert
    assert.strictEqual(response, 'Mocked GLM response');
    assert.ok(createStub.calledOnce);
  });
});
