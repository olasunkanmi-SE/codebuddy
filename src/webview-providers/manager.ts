import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import { generativeAiModels } from "../application/constant";
import { IEventPayload } from "../emitter/interface";
import { AgentService } from "../services/agent-state";
import { Logger } from "../services/telemetry";
import { getAPIKeyAndModel } from "../utils/utils";
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
  private webviewViewProvider: vscode.WebviewViewProvider | undefined;
  protected readonly orchestrator: Orchestrator;
  private readonly agentService: AgentService;
  static AgentId = "agentId"; // TODO This is hardcoded for now,in upcoming versions, requests will be tagged to respective agents.
  private readonly logger = new Logger(WebViewProviderManager.name);

  private constructor(
    private readonly extensionContext: vscode.ExtensionContext,
  ) {
    this.orchestrator = Orchestrator.getInstance();
    this.agentService = AgentService.getInstance();
    this.registerProviders();
    this.disposables.push(
      this.orchestrator.onModelChange(this.handleModelChange.bind(this)),
    );
    this.disposables.push(
      this.orchestrator.onHistoryUpdated(this.handleHistoryUpdate.bind(this)),
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

  registerWebViewProvider(): vscode.Disposable | undefined {
    if (!this.webviewViewProvider) {
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
  }

  private createProvider(
    modelName: string,
    apiKey: string,
    model: string,
  ): BaseWebViewProvider | undefined {
    const providerClass = this.providerRegistry.get(modelName);
    if (!providerClass) {
      this.logger.warn(`Provider for model type ${modelName} not found`);
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
    modelName: string,
    apiKey: string,
    model: string,
    onload: boolean,
  ): Promise<void> {
    try {
      const newProvider = this.createProvider(modelName, apiKey, model);
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
      if (chatHistory.messages?.length > 0 && onload) {
        await this.restoreChatHistory();
      }
      const webviewProviderDisposable = this.registerWebViewProvider();
      if (webviewProviderDisposable) {
        this.extensionContext.subscriptions.push(webviewProviderDisposable);
      }

      this.orchestrator.publish(
        "onModelChangeSuccess",
        JSON.stringify({
          success: true,
          modelName,
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error switching provider: ${error}`);
      this.orchestrator.publish(
        "onModelChangeSuccess",
        JSON.stringify({
          success: false,
          modelName,
        }),
      );
      throw new Error(error);
    }
  }

  async initializeProvider(
    modelName: string,
    apiKey: string,
    model: string,
    onload: boolean,
  ): Promise<void> {
    await this.switchProvider(modelName, apiKey, model, onload);
  }

  private async handleModelChange(event: IEventPayload): Promise<void> {
    try {
      if (!event.message) {
        return;
      }
      const modelName = event.message.message as string;
      if (!modelName) {
        throw new Error("Unknown model");
      }
      const { apiKey, model } = getAPIKeyAndModel(modelName.toLowerCase());
      if (!model) {
        throw new Error("Model not found");
      }
      if (!apiKey) {
        this.logger.warn(`${modelName} APIkey is required`);
      }
      await this.switchProvider(modelName, apiKey, model, false);
    } catch (error: any) {
      this.logger.error("Error handling model change", error);
      throw new Error(error.message);
    }
  }

  private async getCurrentHistory(): Promise<any> {
    const history = await this.agentService.getChatHistory(
      WebViewProviderManager.AgentId,
    );
    return history;
  }

  private async restoreChatHistory() {
    const history = await this.getCurrentHistory();
    setTimeout(async () => {
      const lastTenMessages = history.messages.slice(-10);
      await this.webviewView?.webview.postMessage({
        type: "chat-history",
        message: JSON.stringify(lastTenMessages),
      });
    }, 6000);
  }

  async setCurrentHistory(data: any[]): Promise<void> {
    await this.agentService.saveChatHistory(
      WebViewProviderManager.AgentId,
      data,
    );
  }

  async handleHistoryUpdate({ type, message }: IEventPayload) {
    if (message.command === "messages-updated" && message.messages?.length) {
      await this.setCurrentHistory(message);
    }
  }

  getCurrentProvider(): BaseWebViewProvider | undefined {
    return this.currentProvider;
  }

  dispose(): void {
    if (this.currentProvider) {
      this.currentProvider.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
    this.extensionContext.subscriptions.forEach((subscription) =>
      subscription.dispose(),
    );
    this.disposables = [];
  }
}
