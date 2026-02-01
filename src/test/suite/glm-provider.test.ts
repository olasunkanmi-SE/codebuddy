import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GLMWebViewProvider } from '../../webview-providers/glm';
import { COMMON } from '../../application/constant';
import { Memory } from '../../memory/base';

// Mock classes
class MockWebview implements vscode.Webview {
  public html: string = '';
  public options: vscode.WebviewOptions = { enableScripts: true };
  public cspSource: string = '';
  public onDidReceiveMessage: vscode.Event<any> = new vscode.EventEmitter<any>().event;

  public async postMessage(message: any): Promise<boolean> {
    return true;
  }

  public asWebviewUri(localResource: vscode.Uri): vscode.Uri {
    return localResource;
  }
}

class MockWebviewView implements Partial<vscode.WebviewView> {
  public webview: MockWebview = new MockWebview();
  public visible: boolean = true;
  public viewType: string = 'chatView';
  public onDidDispose: vscode.Event<void> = new vscode.EventEmitter<void>().event;
}

suite('GLMWebViewProvider Test Suite', () => {
  let provider: GLMWebViewProvider;
  let mockContext: any;
  let mockExtensionUri: vscode.Uri;
  let sandbox: sinon.SinonSandbox;
  let tempDir: string;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Create temp directory for tests
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

    // Initialize the provider
    provider = new GLMWebViewProvider(
      mockExtensionUri,
      'fake-api-key',
      'glm-model',
      mockContext as vscode.ExtensionContext
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
    
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to clean up temp dir:', error);
      }
    }
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
