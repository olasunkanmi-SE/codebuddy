import { IDisposable } from "../../interfaces/disposable";
import { Orchestrator } from "../../orchestrator";
import { COMMON } from "../../application/constant";
import { Memory } from "../../memory/base";
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { BaseLLM } from "../base";
import {
  ILlmConfig,
  ICodeCompleter,
  ICodeCompletionOptions,
} from "../interface";
import { Message } from "../message";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { EditorHostService } from "../../services/editor-host.service";
import { ConfigurationTarget } from "../../interfaces/editor-host";

// Define interfaces for Local LLM responses
interface LocalLLMSnapshot {
  response?: any;
  lastQuery?: string;
  lastCall?: any;
  lastResult?: any;
  chatHistory?: any[];
}

export class LocalLLM
  extends BaseLLM<LocalLLMSnapshot>
  implements IDisposable, ICodeCompleter
{
  private client: OpenAI;
  private response: any;
  protected readonly orchestrator: Orchestrator;
  private readonly disposables: IDisposable[] = [];
  private static instance: LocalLLM | undefined;
  private lastFunctionCalls: Set<string> = new Set();
  private readonly timeOutMs: number = 30000;

  constructor(config: ILlmConfig) {
    super(config);
    this.config = config;
    // Default to Ollama endpoint if not provided
    const baseURL = this.config.baseUrl || "http://localhost:11434/v1";

    this.client = new OpenAI({
      apiKey: this.config.apiKey || "not-needed",
      baseURL: baseURL,
    });
    this.response = undefined;
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize("LocalLLM", {
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
    // Re-initialize client if config changes
    if (this.config.apiKey || this.config.baseUrl) {
      const baseURL = this.config.baseUrl || "http://localhost:11434/v1";
      this.client = new OpenAI({
        apiKey: this.config.apiKey || "not-needed",
        baseURL: baseURL,
      });
    }
  }

  static getInstance(config: ILlmConfig): LocalLLM {
    if (!LocalLLM.instance) {
      LocalLLM.instance = new LocalLLM(config);
    } else {
      LocalLLM.instance.updateConfig(config);
    }
    return LocalLLM.instance;
  }

  public updateConfig(config: ILlmConfig) {
    this.config = config;
    // Update client with new config
    const baseURL = this.config.baseUrl || "http://localhost:11434/v1";
    this.client = new OpenAI({
      apiKey: this.config.apiKey || "not-needed",
      baseURL: baseURL,
    });
  }

  getEmbeddingModel(): string {
    return this.config.additionalConfig?.embeddingModel || "text-embedding-v1";
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    try {
      // Note: Not all local LLMs support embeddings endpoint
      const response = await this.client.embeddings.create({
        model: this.getEmbeddingModel(),
        input: text,
      });

      this.response = response;
      return response.data[0].embedding;
    } catch (error: any) {
      this.logger.error("Failed to generate embeddings", { error, text });
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  public async generateText(
    prompt: string,
    systemInstruction?: string,
  ): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [];

      // Add system instruction - use default if none provided to prevent function-call mode
      const defaultSystemPrompt =
        "You are a helpful AI assistant. Respond naturally in plain text. Do not output JSON, function calls, or tool invocations. Just answer directly.";
      const effectiveSystemPrompt = systemInstruction || defaultSystemPrompt;
      messages.push({ role: "system", content: effectiveSystemPrompt });

      messages.push({ role: "user", content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
      });

      this.response = response;
      return response.choices[0].message.content || "";
    } catch (error: any) {
      this.logger.error("Failed to generate text", { error });
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  public async chat(
    messages: Message[],
    systemInstruction?: string,
  ): Promise<string> {
    try {
      const chatMessages: ChatCompletionMessageParam[] = messages.map((msg) => {
        const role = msg.role as "user" | "assistant" | "system";
        return {
          role,
          content: msg.content,
        } as ChatCompletionMessageParam;
      });

      // Add system instruction - use default if none provided to prevent function-call mode
      const defaultSystemPrompt =
        "You are a helpful AI assistant. Respond naturally in plain text. Do not output JSON, function calls, or tool invocations. Just have a normal conversation.";
      const effectiveSystemPrompt = systemInstruction || defaultSystemPrompt;
      chatMessages.unshift({ role: "system", content: effectiveSystemPrompt });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: chatMessages,
      });

      this.response = response;
      return response.choices[0].message.content || "";
    } catch (error: any) {
      this.logger.error("Failed to chat", { error });
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  public async *stream(
    messages: Message[],
    systemInstruction?: string,
  ): AsyncGenerator<string, void, unknown> {
    const makeRequest = async (client: OpenAI) => {
      const chatMessages: ChatCompletionMessageParam[] = messages.map((msg) => {
        const role = msg.role as "user" | "assistant" | "system";
        return {
          role,
          content: msg.content,
        } as ChatCompletionMessageParam;
      });

      // Add system instruction - use default if none provided to prevent function-call mode
      const defaultSystemPrompt =
        "You are a helpful AI assistant. Respond naturally in plain text. Do not output JSON, function calls, or tool invocations. Just have a normal conversation.";
      const effectiveSystemPrompt = systemInstruction || defaultSystemPrompt;
      chatMessages.unshift({ role: "system", content: effectiveSystemPrompt });

      return await client.chat.completions.create({
        model: this.config.model,
        messages: chatMessages,
        stream: true,
      });
    };

    try {
      const stream = await makeRequest(this.client);
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      // Check for connection refused on port 12434 and fallback to 11434
      // We check multiple properties because different library versions/environments expose the error differently
      const isConnectionRefused =
        error?.code === "ECONNREFUSED" ||
        error?.cause?.code === "ECONNREFUSED" ||
        error?.errno === "ECONNREFUSED" ||
        error?.message?.includes("ECONNREFUSED");

      const isPort12434 =
        this.client.baseURL.includes("12434") ||
        error?.cause?.message?.includes("12434");

      if (isConnectionRefused && isPort12434) {
        this.logger.warn(
          "Connection refused on port 12434. Attempting fallback to 11434.",
        );

        // Update config to use fallback port
        const newBaseUrl = "http://localhost:11434/v1";
        this.client = new OpenAI({
          apiKey: this.config.apiKey || "not-needed",
          baseURL: newBaseUrl,
        });

        // Update the persistent configuration so future requests succeed immediately
        const host = EditorHostService.getInstance().getHost();
        const config = host.workspace.getConfiguration("local");
        await config.update("baseUrl", newBaseUrl, ConfigurationTarget.Global);

        // Retry the request with the new client
        try {
          const stream = await makeRequest(this.client);
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              yield content;
            }
          }
          return; // Exit successfully after fallback
        } catch (retryError: any) {
          this.logger.error("Fallback request to 11434 also failed", {
            error: retryError,
          });
          throw retryError;
        }
      }

      this.logger.error("Failed to stream chat", { error });
      throw new Error(`Stream chat failed: ${error.message}`);
    }
  }

  public getModel(): OpenAI {
    return this.client;
  }

  async completeCode(
    prompt: string,
    options?: ICodeCompletionOptions,
  ): Promise<string> {
    const stop = options?.stopSequences;
    const maxTokens = options?.maxTokens || 128;
    const temperature = options?.temperature || 0.1;
    const model = options?.model || this.config.model;

    try {
      // 1. Try Legacy Completion API (standard for FIM)
      const completion = await this.client.completions.create({
        model: model,
        prompt: prompt,
        stop: stop,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      return completion.choices[0].text;
    } catch (error) {
      // 2. Fallback to Chat API (if model only supports chat)
      try {
        const chatCompletion = await this.client.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          stop: stop,
          temperature: temperature,
          max_tokens: maxTokens,
        });
        return chatCompletion.choices[0].message.content || "";
      } catch (chatError) {
        this.logger.error("Failed to complete code", { error, chatError });
        return "";
      }
    }
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }

  // Implement abstract methods from BaseLLM
  createSnapShot(): LocalLLMSnapshot {
    return {
      response: this.response,
      chatHistory: Memory.get(COMMON.LOCAL_CHAT_HISTORY),
    };
  }

  async saveSnapshot(): Promise<void> {
    // Optional implementation
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async loadSnapShot(snapshot: LocalLLMSnapshot): Promise<void> {
    // Optional implementation
  }

  async reset(): Promise<void> {
    Memory.set(COMMON.LOCAL_CHAT_HISTORY, []);
  }
}
