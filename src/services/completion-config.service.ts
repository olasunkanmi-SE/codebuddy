import * as vscode from "vscode";
import {
  CompletionProviderType,
  CompletionTriggerMode,
  ICompletionConfig,
} from "../interfaces/completion.interface";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class CompletionConfigService {
  private static instance: CompletionConfigService;
  private config: ICompletionConfig;
  private logger: Logger;
  private readonly configSection = "codebuddy.completion";

  private constructor() {
    this.logger = Logger.initialize("CompletionConfigService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.config = this.loadConfig();
    this.registerConfigurationListener();
  }

  public static getInstance(): CompletionConfigService {
    if (!CompletionConfigService.instance) {
      CompletionConfigService.instance = new CompletionConfigService();
    }
    return CompletionConfigService.instance;
  }

  public getConfig(): ICompletionConfig {
    return this.config;
  }

  public isFimSupported(): boolean {
    const model = this.config.model.toLowerCase();
    // Known FIM-capable models
    return (
      model.includes("qwen") ||
      model.includes("deepseek") ||
      model.includes("codellama") ||
      model.includes("starcoder") ||
      model.includes("codestral")
    );
  }

  private loadConfig(): ICompletionConfig {
    const config = vscode.workspace.getConfiguration(this.configSection);

    return {
      enabled: config.get<boolean>("enabled", true),
      provider: config.get<CompletionProviderType>(
        "provider",
        CompletionProviderType.Local,
      ),
      model: config.get<string>("model", "qwen2.5-coder"),
      apiKey: config.get<string>("apiKey", "") || undefined,
      debounceMs: config.get<number>("debounceMs", 300),
      maxTokens: config.get<number>("maxTokens", 128),
      temperature: config.get<number>("temperature", 0.1),
      triggerMode: config.get<CompletionTriggerMode>(
        "triggerMode",
        CompletionTriggerMode.Automatic,
      ),
      multiLine: config.get<boolean>("multiLine", true),
    };
  }

  private registerConfigurationListener(): void {
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        this.logger.info("Completion configuration changed, reloading...");
        this.config = this.loadConfig();
      }
    });
  }
}
