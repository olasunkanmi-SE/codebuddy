import * as vscode from "vscode";
import { Orchestrator } from "../agents/orchestrator";
import { generativeAiModels } from "../application/constant";
import { IEventPayload } from "../emitter/interface";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { getAPIKeyAndModel } from "../utils/utils";
import { AnthropicWebViewProvider } from "./anthropic";
import { BaseWebViewProvider } from "./base";
import { DeepseekWebViewProvider } from "./deepseek";
import { GeminiWebViewProvider } from "./gemini";
import { GroqWebViewProvider } from "./groq";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class WebViewProviderManager implements vscode.Disposable {
  private static instance: WebViewProviderManager;
  private currentProvider: BaseWebViewProvider | undefined;
  private readonly providerRegistry: Map<
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
  protected readonly chatHistoryManager: ChatHistoryManager;

  static readonly AgentId = "agentId"; // TODO This is hardcoded for now,in upcoming versions, requests will be tagged to respective agents.
  private readonly logger: Logger;

  private constructor(
    private readonly extensionContext: vscode.ExtensionContext,
  ) {
    this.orchestrator = Orchestrator.getInstance();
    this.chatHistoryManager = ChatHistoryManager.getInstance();
    this.registerProviders();
    this.disposables.push(
      this.orchestrator.onModelChange(this.handleModelChange.bind(this)),
    );
    this.disposables.push(
      this.orchestrator.onHistoryUpdated(this.handleHistoryUpdate.bind(this)),
    );
    this.disposables.push(
      this.orchestrator.onClearHistory(this.handleClearHistory.bind(this)),
    );
    this.logger = Logger.initialize("WebViewProviderManager", {
      minLevel: LogLevel.DEBUG,
    });
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

  private async getChatHistory() {
    return await this.chatHistoryManager.getHistory(
      WebViewProviderManager.AgentId,
    );
  }

  private async clearHistory() {
    return await this.chatHistoryManager.clearHistory(
      WebViewProviderManager.AgentId,
    );
  }

  private async handleClearHistory({ type, message }: IEventPayload) {
    return this.clearHistory();
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
      const chatHistory = await this.getChatHistory();
      if (this.currentProvider) {
        this.currentProvider.dispose();
      }
      this.currentProvider = newProvider;
      if (this.webviewView) {
        await this.currentProvider.resolveWebviewView(this.webviewView);
      }
      if (chatHistory?.length > 0 && onload) {
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

  private async restoreChatHistory() {
    const chatHistory = await this.getChatHistory();
    setTimeout(async () => {
      const lastTenMessages = chatHistory.slice(-10);
      await this.webviewView?.webview.postMessage({
        type: "chat-history",
        message: JSON.stringify(lastTenMessages),
      });
    }, 6000);
  }

  async handleHistoryUpdate({ type, message }: IEventPayload) {
    if (message.command === "messages-updated" && message.messages?.length) {
      await this.chatHistoryManager.setHistory(
        WebViewProviderManager.AgentId,
        message.messages,
      );
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
