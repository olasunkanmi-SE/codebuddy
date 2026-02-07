import { StreamEventType } from "../agents/interface/agent.interface";
import { generativeAiModels } from "../application/constant";
import { IEventPayload } from "../emitter/interface";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../orchestrator";
import { MCPService } from "../MCP/service";
import { ChatHistoryManager } from "../services/chat-history-manager";
import { formatText, getAPIKeyAndModel } from "../utils/utils";
import { AnthropicWebViewProvider } from "./anthropic";
import { BaseWebViewProvider } from "./base";
import { DeepseekWebViewProvider } from "./deepseek";
import { GeminiWebViewProvider } from "./gemini";
import { GroqWebViewProvider } from "./groq";
import { OpenAIWebViewProvider } from "./openai";
import { QwenWebViewProvider } from "./qwen";
import { GLMWebViewProvider } from "./glm";
import { LocalWebViewProvider } from "./local";
import { Terminal } from "../utils/terminal";
import { IDisposable } from "../interfaces/disposable";
import {
  IExtensionContext,
  IWebviewView,
  IWebviewViewProvider,
  IEditorHost,
  IWebviewViewResolveContext,
} from "../interfaces/editor-host";
import { EditorHostService } from "../services/editor-host.service";

export class WebViewProviderManager implements IDisposable {
  private static instance: WebViewProviderManager;
  private currentProvider: BaseWebViewProvider | undefined;
  private activeProviderName: string | undefined;
  private readonly providerRegistry: Map<
    string,
    new (
      extensionUri: any,
      apiKey: string,
      model: string,
      context: IExtensionContext,
    ) => BaseWebViewProvider
  > = new Map();
  private webviewView: IWebviewView | undefined;
  private readonly disposables: IDisposable[] = [];
  private webviewViewProvider: IWebviewViewProvider | undefined;
  private isInitialized = false;
  protected readonly orchestrator: Orchestrator;
  protected readonly chatHistoryManager: ChatHistoryManager;
  private readonly editorHost: IEditorHost;
  private mcpService = MCPService.getInstance();

  static readonly AgentId = "agentId"; // TODO This is hardcoded for now,in upcoming versions, requests will be tagged to respective agents.
  private readonly logger: Logger;

  private constructor(private readonly extensionContext: IExtensionContext) {
    this.editorHost = EditorHostService.getInstance().getHost();
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

    // Initialize MCP subscriptions for remote events
    this.initializeMCPSubscriptions().catch((err) =>
      this.logger.error("Failed to initialize MCP subscriptions:", err),
    );

    this.disposables.push(
      this.orchestrator.onModelChange(this.handleModelChange.bind(this)),
      this.orchestrator.onClearHistory(this.handleClearHistory.bind(this)),
      this.orchestrator.onStreamStart(this.handleStreamStart.bind(this)),
      this.orchestrator.onStreamChunk(this.handleStreamChunk.bind(this)),
      // Fallback: also consume buffered flush events so chunks still reach the UI
      this.orchestrator.onStreamFlush(this.handleStreamFlush.bind(this)),
      this.orchestrator.onStreamEnd(this.handleStreamEnd.bind(this)),
      this.orchestrator.onStreamError(this.handleStreamError.bind(this)),
      this.orchestrator.onStreamMetadata(this.handleStreamMetadata.bind(this)),
      // Tool activity events for real-time feedback
      this.orchestrator.onToolStart(this.handleToolStart.bind(this)),
      this.orchestrator.onToolEnd(this.handleToolEnd.bind(this)),
      this.orchestrator.onToolProgress(this.handleToolProgress.bind(this)),
      this.orchestrator.onPlanning(this.handlePlanning.bind(this)),
      this.orchestrator.onSummarizing(this.handleSummarizing.bind(this)),
      this.orchestrator.onThinking(
        this.handleActivityEvent.bind(this, StreamEventType.THINKING),
      ),
      this.orchestrator.onThinkingStart(
        this.handleActivityEvent.bind(this, StreamEventType.THINKING_START),
      ),
      this.orchestrator.onThinkingUpdate(
        this.handleActivityEvent.bind(this, StreamEventType.THINKING_UPDATE),
      ),
      this.orchestrator.onThinkingEnd(
        this.handleActivityEvent.bind(this, StreamEventType.THINKING_END),
      ),
      // New detailed activity event handlers
      this.orchestrator.onDecision(
        this.handleActivityEvent.bind(this, StreamEventType.DECISION),
      ),
      this.orchestrator.onReading(
        this.handleActivityEvent.bind(this, StreamEventType.READING),
      ),
      this.orchestrator.onSearching(
        this.handleActivityEvent.bind(this, StreamEventType.SEARCHING),
      ),
      this.orchestrator.onReviewing(
        this.handleActivityEvent.bind(this, StreamEventType.REVIEWING),
      ),
      this.orchestrator.onAnalyzing(
        this.handleActivityEvent.bind(this, StreamEventType.ANALYZING),
      ),
      this.orchestrator.onExecuting(
        this.handleActivityEvent.bind(this, StreamEventType.EXECUTING),
      ),
      this.orchestrator.onWorking(
        this.handleActivityEvent.bind(this, StreamEventType.WORKING),
      ),
      Terminal.getInstance().onOutput((data) => {
        if (this.webviewView?.webview) {
          this.webviewView.webview.postMessage({
            type: StreamEventType.TERMINAL_OUTPUT,
            payload: { content: data },
          });
        }
      }),
    );
    this.isInitialized = true;
  }

  // Handle buffered flush events emitted by StreamManager as a safety net
  private async handleStreamFlush(event: IEventPayload) {
    if (!this.webviewView?.webview) return;

    try {
      const chunks: any[] = Array.isArray(event.message) ? event.message : [];

      for (const chunk of chunks) {
        await this.webviewView.webview.postMessage({
          type: StreamEventType.CHUNK,
          payload: {
            requestId: chunk.id,
            content: chunk.content,
            accumulated: undefined,
            metadata: chunk.metadata,
            timestamp: chunk.metadata?.timestamp ?? Date.now(),
          },
        });
      }
    } catch (error: any) {
      this.logger.error("Failed to handle stream flush:", error);
    }
  }

  public static getInstance(
    extensionContext: IExtensionContext,
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
    this.providerRegistry.set(generativeAiModels.OPENAI, OpenAIWebViewProvider);
    this.providerRegistry.set(generativeAiModels.QWEN, QwenWebViewProvider);
    this.providerRegistry.set(generativeAiModels.GLM, GLMWebViewProvider);
    this.providerRegistry.set(generativeAiModels.LOCAL, LocalWebViewProvider);
  }

  registerWebViewProvider(): IDisposable | undefined {
    if (!this.webviewViewProvider) {
      this.webviewViewProvider = {
        resolveWebviewView: async (webviewView: IWebviewView) => {
          this.webviewView = webviewView;
          if (this.currentProvider) {
            await this.currentProvider.resolveWebviewView(webviewView);
          }
        },
      };

      const disposable = this.editorHost.window.registerWebviewViewProvider(
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
      this.activeProviderName = modelName;
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

  public getActiveModelName(): string | undefined {
    return this.activeProviderName;
  }

  private async handleStreamStart(event: IEventPayload) {
    try {
      if (this.webviewView?.webview) {
        const requestId = event.message?.requestId ?? event.message?.id;
        await this.webviewView.webview.postMessage({
          type: StreamEventType.START,
          payload: {
            requestId,
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
      const requestId = event.message?.requestId ?? event.message?.id;
      await this.webviewView.webview.postMessage({
        type: StreamEventType.END,
        payload: {
          requestId,
          content: formatText(event.message.content),
          timestamp: event.message.timestamp,
        },
      });
    }
  }

  private async handleStreamError(event: IEventPayload) {
    if (this.webviewView?.webview) {
      const requestId = event.message?.requestId ?? event.message?.id;
      await this.webviewView.webview.postMessage({
        type: StreamEventType.ERROR,
        payload: {
          requestId,
          threadId: event.message?.threadId,
          timestamp: Date.now(),
          error: event.message?.error || event.error || "An error occurred",
        },
      });
    }
  }

  private async handleStreamMetadata(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.METADATA,
        payload: {
          requestId: event.message?.requestId,
          threadId: event.message?.threadId,
          status: event.message?.status,
          toolName: event.message?.toolName,
          description: event.message?.description,
          content: event.message?.content,
          timestamp: Date.now(),
        },
      });
    }
  }

  private async initializeMCPSubscriptions(): Promise<void> {
    try {
      const serverName = "codebuddy-internal";
      // Try to connect to the internal server
      // This will spawn the process if configured in MCPService.initialize
      await this.mcpService.ensureServerConnected(serverName);

      const events = [
        StreamEventType.START,
        StreamEventType.CHUNK,
        StreamEventType.END,
        StreamEventType.TOOL_START,
        StreamEventType.TOOL_END,
        StreamEventType.TOOL_PROGRESS,
        StreamEventType.PLANNING,
        StreamEventType.THINKING,
        StreamEventType.SUMMARIZING,
        StreamEventType.THINKING_START,
        StreamEventType.THINKING_UPDATE,
        StreamEventType.THINKING_END,
      ];

      for (const event of events) {
        await this.mcpService.subscribeToNotifications(
          serverName,
          event,
          (params: any) => {
            // Forward notification to handler
            // Wrap params in IEventPayload structure
            const payload: IEventPayload = {
              type: event,
              timestamp: new Date().toISOString(),
              message: params,
              metadata: { source: "mcp-server" },
            };
            this.handleRemoteEvent(event, payload);
          },
        );
      }

      this.logger.info(`Subscribed to MCP notifications from ${serverName}`);
    } catch (error: any) {
      // It's normal for the server to be missing if not bundled/configured
      this.logger.debug(
        "MCP subscription skipped (server not available):",
        error,
      );
    }
  }

  private handleRemoteEvent(eventType: StreamEventType, event: IEventPayload) {
    // Avoid double-handling if the event originated locally (though unlikely if distinct sources)
    // Dispatch to specific handlers
    switch (eventType) {
      case StreamEventType.START:
        this.handleStreamStart(event);
        break;
      case StreamEventType.CHUNK:
        this.handleStreamChunk(event);
        break;
      case StreamEventType.END:
        this.handleStreamEnd(event);
        break;
      case StreamEventType.TOOL_START:
        this.handleToolStart(event);
        break;
      case StreamEventType.TOOL_END:
        this.handleToolEnd(event);
        break;
      case StreamEventType.TOOL_PROGRESS:
        this.handleToolProgress(event);
        break;
      case StreamEventType.PLANNING:
        this.handlePlanning(event);
        break;
      case StreamEventType.SUMMARIZING:
        this.handleSummarizing(event);
        break;
      default:
        // Handle thinking and other activity events
        this.handleActivityEvent(eventType, event);
        break;
    }
  }

  private async handleToolStart(event: IEventPayload) {
    this.logger.debug(
      "handleToolStart received:",
      JSON.stringify(event, null, 2),
    );
    if (this.webviewView?.webview) {
      try {
        const toolData =
          typeof event.message === "string"
            ? JSON.parse(event.message)
            : event.message;
        const requestId =
          toolData?.requestId ??
          event.message?.requestId ??
          event.metadata?.requestId ??
          event.message?.id;
        const payload = {
          requestId,
          toolId: toolData.id || event.metadata?.toolId,
          toolName: toolData.toolName || event.metadata?.toolName,
          description: toolData.description,
          args: toolData.args,
          status: toolData.status || "running",
          timestamp: Date.now(),
        };
        this.logger.debug(
          "Sending TOOL_START to webview:",
          JSON.stringify(payload),
        );
        await this.webviewView.webview.postMessage({
          type: StreamEventType.TOOL_START,
          payload,
        });
      } catch (error: any) {
        this.logger.error("Failed to send tool start:", error);
      }
    } else {
      this.logger.warn("handleToolStart: webview not available");
    }
  }

  private async handleToolEnd(event: IEventPayload) {
    if (this.webviewView?.webview) {
      try {
        const toolData =
          typeof event.message === "string"
            ? JSON.parse(event.message)
            : event.message;
        const requestId =
          toolData?.requestId ??
          event.message?.requestId ??
          event.metadata?.requestId ??
          event.message?.id;
        await this.webviewView.webview.postMessage({
          type: StreamEventType.TOOL_END,
          payload: {
            requestId,
            toolId: toolData.id || event.metadata?.toolId,
            toolName: toolData.toolName || event.metadata?.toolName,
            status: toolData.status || "completed",
            result: toolData.result,
            duration: event.metadata?.duration,
            timestamp: Date.now(),
          },
        });
      } catch (error: any) {
        this.logger.error("Failed to send tool end:", error);
      }
    }
  }

  private async handleToolProgress(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.TOOL_PROGRESS,
        payload: {
          requestId: event.message?.requestId,
          toolName: event.message?.toolName,
          status: event.message?.status,
          message: event.message?.message,
          progress: event.message?.progress,
          timestamp: Date.now(),
        },
      });
    }
  }

  private async handlePlanning(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.PLANNING,
        payload: {
          requestId: event.message?.requestId,
          content: event.message?.content || event.message,
          timestamp: Date.now(),
        },
      });
    }
  }

  private async handleSummarizing(event: IEventPayload) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: StreamEventType.SUMMARIZING,
        payload: {
          requestId: event.message?.requestId,
          content: event.message?.content || event.message,
          timestamp: Date.now(),
        },
      });
    }
  }

  /**
   * Generic handler for activity events (DECISION, READING, SEARCHING, etc.)
   * This provides a unified way to send detailed activity updates to the webview
   */
  private async handleActivityEvent(
    eventType: StreamEventType,
    event: IEventPayload,
  ) {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage({
        type: eventType,
        payload: {
          requestId: event.message?.requestId,
          threadId: event.message?.threadId,
          content: event.message?.content || event.message,
          metadata: event.message?.metadata || event.metadata,
          timestamp: Date.now(),
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
