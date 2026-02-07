import Anthropic from "@anthropic-ai/sdk";
import { Orchestrator } from "../../orchestrator";
import { COMMON } from "../../application/constant";
import { Memory } from "../../memory/base";
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { BaseLLM } from "../base";
import {
  ICodeCompleter,
  ICodeCompletionOptions,
  ILlmConfig,
} from "../interface";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { IDisposable } from "../../interfaces/disposable";
import { EditorHostService } from "../../services/editor-host.service";

interface AnthropicLLMSnapshot {
  response?: any;
  lastQuery?: string;
  lastCall?: any;
  lastResult?: any;
  chatHistory?: any[];
}

export class AnthropicLLM
  extends BaseLLM<AnthropicLLMSnapshot>
  implements IDisposable, ICodeCompleter
{
  private client: Anthropic;
  private response: any;
  protected readonly orchestrator: Orchestrator;
  private readonly disposables: IDisposable[] = [];
  private static instance: AnthropicLLM | undefined;

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl, // Optional, for proxies
    });
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize("AnthropicLLM", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    CodeBuddyToolProvider.initialize();
    this.initializeDisposable();
  }

  private initializeDisposable(): void {
    this.disposables.push(
      EditorHostService.getInstance()
        .getHost()
        .workspace.onDidChangeConfiguration(() =>
          this.handleConfigurationChange(),
        ),
    );
  }

  private handleConfigurationChange() {
    if (this.config.apiKey) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
      });
    }
  }

  static getInstance(config: ILlmConfig): AnthropicLLM {
    if (!AnthropicLLM.instance) {
      AnthropicLLM.instance = new AnthropicLLM(config);
    } else {
      // Update config if needed, though usually new instance for new key
      AnthropicLLM.instance.updateConfig(config);
    }
    return AnthropicLLM.instance;
  }

  public updateConfig(config: ILlmConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    // Anthropic does not have an embeddings API yet.
    // Return dummy or throw.
    this.logger.warn("Anthropic does not support embeddings yet.");
    return [];
  }

  public async generateText(
    prompt: string,
    systemInstruction?: string,
  ): Promise<string> {
    try {
      const system = systemInstruction || "You are a helpful assistant.";
      const model = this.config.model || "claude-3-5-sonnet-20240620";

      const response = await this.client.messages.create({
        model: model,
        max_tokens: 4096,
        system: system,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });

      this.response = response;
      if (
        response.content &&
        response.content.length > 0 &&
        response.content[0].type === "text"
      ) {
        return response.content[0].text;
      }
      return "";
    } catch (error: any) {
      this.logger.error("Failed to generate text", error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  async completeCode(
    prompt: string,
    options?: ICodeCompletionOptions,
  ): Promise<string> {
    const maxTokens = options?.maxTokens || 128;
    const temperature = options?.temperature || 0.1;
    const model =
      options?.model || this.config.model || "claude-3-haiku-20240307";

    try {
      const response = await this.client.messages.create({
        model: model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
        temperature: temperature,
      });

      if (
        response.content &&
        response.content.length > 0 &&
        response.content[0].type === "text"
      ) {
        return response.content[0].text;
      }
      return "";
    } catch (error: any) {
      this.logger.error("Failed to complete code", { error });
      return "";
    }
  }

  public createSnapShot(data?: any): AnthropicLLMSnapshot {
    return {
      response: this.response,
      chatHistory: Memory.get(COMMON.ANTHROPIC_CHAT_HISTORY),
      lastQuery: data?.lastQuery,
      lastResult: data?.lastResult,
    };
  }

  public loadSnapShot(snapshot: AnthropicLLMSnapshot): void {
    if (snapshot) {
      this.response = snapshot.response;
    }
    if (snapshot.chatHistory) {
      Memory.set(COMMON.ANTHROPIC_CHAT_HISTORY, snapshot.chatHistory);
    }
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    Memory.delete(COMMON.ANTHROPIC_CHAT_HISTORY);
  }
}
