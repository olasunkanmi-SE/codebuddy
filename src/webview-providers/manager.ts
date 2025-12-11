import * as vscode from "vscode";
import { StreamEventType } from "../agents/interface/agent.interface";
import { generativeAiModels } from "../application/constant";
import { IEventPayload } from "../emitter/interface";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../orchestrator";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { formatText, getAPIKeyAndModel } from "../utils/utils";
import { AnthropicWebViewProvider } from "./anthropic";
import { BaseWebViewProvider } from "./base";
import { DeepseekWebViewProvider } from "./deepseek";
import { GeminiWebViewProvider } from "./gemini";
import { GroqWebViewProvider } from "./groq";

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
  private readonly disposables: vscode.Disposable[] = [];
  private webviewViewProvider: vscode.WebviewViewProvider | undefined;
  private isInitialized = false;
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
    this.registerWebViewProvider();
    // Don't register event listeners immediately - do it lazily
    this.logger = Logger.initialize("WebViewProviderManager", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  // Initialize event listeners only when needed
  private initializeEventListeners(): void {
    if (this.isInitialized) {
      return;
    }

    this.disposables.push(
      this.orchestrator.onModelChange(this.handleModelChange.bind(this)),
      this.orchestrator.onClearHistory(this.handleClearHistory.bind(this)),
      this.orchestrator.onStreamStart(this.handleStreamStart.bind(this)),
      this.orchestrator.onStreamChunk(this.handleStreamChunk.bind(this)),
      this.orchestrator.onStreamEnd(this.handleStreamEnd.bind(this)),
      this.orchestrator.onStreamError(this.handleStreamError.bind(this)),
    );
    this.isInitialized = true;
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

      await this.orchestrator.publish(
        "onModelChangeSuccess",
        JSON.stringify({
          success: true,
          modelName,
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error switching provider: ${error}`);
      await this.orchestrator.publish(
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
    // Initialize event listeners when first provider is created
    this.initializeEventListeners();
    await this.switchProvider(modelName, apiKey, model, onload);
  }

  private async handleModelChange(event: IEventPayload): Promise<void> {
    try {
      if (!event.message) {
        return;
      }
      const modelName = (event.message.message as string) ?? event.message;
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
    try {
      const chatHistory = await this.getChatHistory();

      // Send chat history immediately - no artificial delay
      if (this.webviewView?.webview) {
        await this.webviewView.webview.postMessage({
          type: "chat-history",
          message: JSON.stringify(chatHistory),
        });

        this.logger.debug(
          `Restored ${chatHistory.length} chat messages immediately`,
        );
      } else {
        this.logger.warn("Webview not available for chat history restoration");
      }
    } catch (error: any) {
      this.logger.error("Failed to restore chat history:", error);

      // Send empty history to prevent UI hanging
      if (this.webviewView?.webview) {
        await this.webviewView.webview.postMessage({
          type: "chat-history",
          message: JSON.stringify([]),
        });
      }
    }
  }

  // This update has to happen in the DB
  async handleHistoryUpdate({ type, message }: IEventPayload) {
    if (message.command === "messages-updated" && message.messages?.length) {
      await this.chatHistoryManager.setHistory(
        WebViewProviderManager.AgentId,
        message.message,
      );
    }
  }

  getCurrentProvider(): BaseWebViewProvider | undefined {
    return this.currentProvider;
  }

  private async handleStreamStart(event: IEventPayload) {
    try {
      if (this.webviewView?.webview) {
        await this.webviewView.webview.postMessage({
          type: StreamEventType.START,
          payload: {
            requestId: event.message.requestId,
            threadId: event.message.threadId,
            timestamp: Date.now(),
          },
        });
      }
    } catch (error: any) {
      this.logger.error("Failed to send stream start:", error);
      throw error;
    }
  }

  private async handleStreamChunk(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.CHUNK,
        payload: {
          requestId: event.message.requestId,
          content: event.message.content,
          timestamp: Date.now(),
          accumulated: formatText(event.message.accumulated),
          metadata: event.message.metadata,
        },
      });
    }
  }

  private async handleStreamEnd(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.END,
        payload: {
          requestId: event.message.requestId,
          content: formatText(event.message.content),
          timestamp: event.message.timestamp,
        },
      });
    }
  }

  private async handleStreamError(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.END,
        payload: {
          requestId: event.message.requestId,
          threadId: event.threadId,
          timestamp: event.timestamp,
          error: event.error,
        },
      });
    }
  }

  dispose(): void {
    this.logger.info("WebViewProviderManager disposing...");

    if (this.currentProvider) {
      this.currentProvider.dispose();
      this.currentProvider = undefined;
    }

    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    this.isInitialized = false;

    // Note: Don't dispose extensionContext.subscriptions here as they're managed by VS Code

    // Clear singleton instance if needed
    if (WebViewProviderManager.instance === this) {
      WebViewProviderManager.instance = undefined as any;
    }
  }
}
