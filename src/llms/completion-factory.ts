import * as vscode from "vscode";
import {
  CompletionProviderType,
  ICompletionConfig,
} from "../interfaces/completion.interface";
import { ICodeCompleter, ILlmConfig } from "./interface";
import { LocalLLM } from "./local/local";
import { GroqLLM } from "./groq/groq";
import { QwenLLM } from "./qwen/qwen";
import { GeminiLLM } from "./gemini/gemini";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class CompletionProviderFactory {
  private static instance: CompletionProviderFactory;
  private logger: Logger;
  private providers: Map<string, ICodeCompleter> = new Map();

  private constructor() {
    this.logger = Logger.initialize("CompletionProviderFactory", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): CompletionProviderFactory {
    if (!CompletionProviderFactory.instance) {
      CompletionProviderFactory.instance = new CompletionProviderFactory();
    }
    return CompletionProviderFactory.instance;
  }

  public getProvider(config: ICompletionConfig): ICodeCompleter | undefined {
    // Normalize provider type to handle case insensitivity
    const providerTypeRaw = config.provider.toString();
    // Find matching enum value (case-insensitive)
    const providerType =
      Object.values(CompletionProviderType).find(
        (v) => v.toLowerCase() === providerTypeRaw.toLowerCase(),
      ) || CompletionProviderType.Local;

    const cacheKey = `${providerType}:${config.model}`;

    // Note: We might want to allow re-creating if config changes (apiKey, etc.)
    // For now, let's trust the Singleton .getInstance() methods of LLMs to handle config updates
    // or we just instantiate new ones if needed.
    // However, LLM classes (LocalLLM, GroqLLM, etc.) often use Singleton pattern themselves.

    try {
      let llmConfig: ILlmConfig;

      switch (providerType) {
        case CompletionProviderType.Groq:
          llmConfig = {
            model: config.model,
            apiKey: config.apiKey || "",
          };
          return GroqLLM.getInstance(llmConfig);

        case CompletionProviderType.Qwen:
          llmConfig = {
            model: config.model,
            apiKey: config.apiKey || "",
            baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
          };
          return QwenLLM.getInstance(llmConfig);

        case CompletionProviderType.Gemini:
          llmConfig = {
            model: config.model,
            apiKey: config.apiKey || "",
          };
          return GeminiLLM.getInstance(llmConfig);

        case CompletionProviderType.Local:
        case CompletionProviderType.OpenAI:
        case CompletionProviderType.Deepseek:
        case CompletionProviderType.GLM:
        default:
          // Handle OpenAI-compatible providers via LocalLLM
          const localConfig =
            vscode.workspace.getConfiguration("codebuddy.local");
          let baseUrl =
            localConfig.get<string>("baseUrl") || "http://localhost:11434/v1";

          if (providerType === CompletionProviderType.OpenAI) {
            baseUrl = "https://api.openai.com/v1";
          } else if (providerType === CompletionProviderType.Deepseek) {
            baseUrl = "https://api.deepseek.com";
          } else if (providerType === CompletionProviderType.GLM) {
            baseUrl = "https://open.bigmodel.cn/api/paas/v4";
          }

          // Special case: If user provided a Groq key but selected Local (or default)
          if (
            providerType === CompletionProviderType.Local &&
            config.apiKey &&
            config.apiKey.startsWith("gsk_")
          ) {
            baseUrl = "https://api.groq.com/openai/v1";
          }

          llmConfig = {
            model: config.model,
            apiKey: config.apiKey || "not-needed",
            baseUrl: baseUrl,
            additionalConfig: {
              maxTokens: config.maxTokens,
            },
          };

          // LocalLLM is a singleton that updates its config
          return LocalLLM.getInstance(llmConfig);
      }
    } catch (error) {
      this.logger.error(`Failed to create provider for ${providerType}`, error);
      return undefined;
    }
  }
}
