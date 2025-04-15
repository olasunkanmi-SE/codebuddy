import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import { generativeAiModels } from "../application/constant";
import { IEventPayload } from "../emitter/interface";
import { AgentService } from "../services/agent-state";
import { Logger } from "../services/telemetry";
import { getAPIKey } from "../utils/utils";
import { AnthropicWebViewProvider } from "./anthropic";
import { BaseWebViewProvider } from "./base";
import { DeepseekWebViewProvider } from "./deepseek";
import { GeminiWebViewProvider } from "./gemini";
import { GroqWebViewProvider } from "./groq";

export class WebViewProviderManager implements vscode.Disposable {
  private static instance: WebViewProviderManager;
  private currentProvider: BaseWebViewProvider | undefined;
  private providerRegistry: Map<
    string,
    new (
      extensionUri: vscode.Uri,
      apiKey: string,
      model: string,
      context: vscode.ExtensionContext,
    ) => BaseWebViewProvider
  > = new Map();
  private webviewView: vscode.WebviewView | undefined;
  private disposables: vscode.Disposable[] = [];
  private viewProvider: vscode.WebviewViewProvider | undefined;
  private webviewViewProvider: vscode.WebviewViewProvider | undefined;
  protected readonly orchestrator: Orchestrator;
  private readonly agentService: AgentService;
  static AgentId = "agentId"; // TODO This is hardcoded for now,in upcoming versions, requests will be tagged to respective agents.
  private readonly logger = new Logger(WebViewProviderManager.name);

  private constructor(private extensionContext: vscode.ExtensionContext) {
    this.orchestrator = Orchestrator.getInstance();
    this.agentService = AgentService.getInstance();
    this.registerProviders();
    this.disposables.push(
      this.orchestrator.onModelChange(this.handleModelChange.bind(this)),
    );
  }

  public static getInstance(
    extensionContext: vscode.ExtensionContext,
  ): WebViewProviderManager {
    if (!WebViewProviderManager.instance) {
      WebViewProviderManager.instance = new WebViewProviderManager(
        extensionContext,
      );
    }
    return WebViewProviderManager.instance;
  }

  private registerProviders(): void {
    this.providerRegistry.set(generativeAiModels.GEMINI, GeminiWebViewProvider);
    this.providerRegistry.set(generativeAiModels.GROQ, GroqWebViewProvider);
    this.providerRegistry.set(
      generativeAiModels.ANTHROPIC,
      AnthropicWebViewProvider,
    );
    this.providerRegistry.set(
      generativeAiModels.GROK,
      AnthropicWebViewProvider,
    );
    this.providerRegistry.set(
      generativeAiModels.DEEPSEEK,
      DeepseekWebViewProvider,
    );
  }

  registerWebViewProvider(): vscode.Disposable {
    this.webviewViewProvider = {
      resolveWebviewView: async (webviewView: vscode.WebviewView) => {
        this.webviewView = webviewView;
        if (this.currentProvider) {
          await this.currentProvider.resolveWebviewView(webviewView);
        }
      },
    };

    const disposable = vscode.window.registerWebviewViewProvider(
      BaseWebViewProvider.viewId,
      this.webviewViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    );
    this.disposables.push(disposable);
    return disposable;
  }

  // NOTE. This could be better off as modelName instead of modelType, once we are focusing on specific Models
  private createProvider(
    modelType: string,
    apiKey: string,
    model: string,
  ): BaseWebViewProvider | undefined {
    const providerClass = this.providerRegistry.get(modelType);
    if (!providerClass) {
      this.logger.warn(`Provider for model type ${modelType} not found`);
      return;
    }
    return new providerClass(
      this.extensionContext.extensionUri,
      apiKey,
      model,
      this.extensionContext,
    );
  }

  private async switchProvider(
    modelType: string,
    apiKey: string,
    model: string,
  ): Promise<void> {
    try {
      const newProvider = this.createProvider(modelType, apiKey, model);
      if (!newProvider) {
        return;
      }
      const chatHistory = await this.getCurrentHistory();
      if (this.currentProvider) {
        this.currentProvider.dispose();
      }
      this.currentProvider = newProvider;
      if (this.webviewView) {
        await this.currentProvider.resolveWebviewView(this.webviewView);
      }
      if (chatHistory?.length > 0) {
        await this.restoreChatHistory();
      }
      this.orchestrator.publish(
        "onModelChangeSuccess",
        JSON.stringify({
          success: true,
          modelType,
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error switching provider: ${error}`);
      this.orchestrator.publish(
        "onModelChangeSuccess",
        JSON.stringify({
          success: false,
          modelType,
        }),
      );
      throw new Error(error);
    }
  }

  async initializeProvider(
    modelType: string,
    apiKey: string,
    model: string,
  ): Promise<void> {
    await this.switchProvider(modelType, apiKey, model);
  }

  private async handleModelChange(event: IEventPayload): Promise<void> {
    if (!event.message) {
      return;
    }
    const { model, modelType } = JSON.parse(event.message);
    const apiKey = getAPIKey(modelType);
    if (!apiKey) {
      this.logger.warn(`${modelType} APIkey is required`);
    }
    await this.switchProvider(modelType, apiKey, model);
  }

  private async getCurrentHistory(): Promise<any[]> {
    const history = await this.agentService.getChatHistory(
      WebViewProviderManager.AgentId,
    );
    return history;
  }

  private async restoreChatHistory() {
    const history = await this.getCurrentHistory();
    await this.webviewView?.webview.postMessage({
      type: "chat-history-export",
      message: JSON.stringify(history),
    });
  }

  async setCurrentHistory(data: any[]): Promise<void> {
    await this.agentService.saveChatHistory(
      WebViewProviderManager.AgentId,
      data,
    );
  }

  getCurrentProvider(): BaseWebViewProvider | undefined {
    return this.currentProvider;
  }

  dispose(): void {
    if (this.currentProvider) {
      this.currentProvider.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
