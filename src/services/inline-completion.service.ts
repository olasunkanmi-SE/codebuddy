import * as vscode from "vscode";
import { CompletionConfigService } from "./completion-config.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { CompletionTriggerMode } from "../interfaces/completion.interface";
import { ContextCompletionService } from "./context-completion.service";
import { FIMPromptService } from "./fim-prompt.service";
import { CompletionProviderFactory } from "../llms/completion-factory";
import { ICodeCompleter } from "../llms/interface";

export class InlineCompletionService
  implements vscode.InlineCompletionItemProvider
{
  private configService: CompletionConfigService;
  private contextService: ContextCompletionService;
  private fimService: FIMPromptService;
  private logger: Logger;
  private debounceTimer: NodeJS.Timeout | undefined;
  private factory: CompletionProviderFactory;

  // Simple Cache: Map<hash, completionText>
  private cache: Map<string, string> = new Map();
  private readonly MAX_CACHE_SIZE = 50;

  constructor(extensionPath: string, outputChannel: vscode.OutputChannel) {
    this.configService = CompletionConfigService.getInstance();
    this.contextService = ContextCompletionService.getInstance(
      extensionPath,
      outputChannel,
    );
    this.fimService = FIMPromptService.getInstance();
    this.factory = CompletionProviderFactory.getInstance();

    this.logger = Logger.initialize("InlineCompletionService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.logger.info("InlineCompletionService initialized and ready");
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<
    | vscode.InlineCompletionItem[]
    | vscode.InlineCompletionList
    | null
    | undefined
  > {
    const config = this.configService.getConfig();
    const startTime = Date.now();

    if (!config.enabled) {
      return null;
    }

    if (
      config.triggerMode === CompletionTriggerMode.Manual &&
      context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
    ) {
      return null;
    }

    // Basic Debounce Logic
    if (config.debounceMs > 0) {
      await new Promise((resolve) => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(resolve, config.debounceMs);
      });
    }

    if (token.isCancellationRequested) {
      return null;
    }

    this.logger.debug(
      `Triggering completion for ${document.fileName}:${position.line}:${position.character}`,
    );

    try {
      // 1. Gather Context
      const completionContext = await this.contextService.gatherContext(
        document,
        position,
      );
      if (token.isCancellationRequested) return null;

      // 2. Build Prompt (FIM)
      const isFimSupported = this.configService.isFimSupported();
      const { prompt, stopSequences } = this.fimService.buildPrompt(
        config.model,
        completionContext,
        isFimSupported,
      );

      // --- CACHE CHECK ---
      // Simple hash: prompt + model
      const cacheKey = `${config.model}:${prompt}`;
      if (this.cache.has(cacheKey)) {
        this.logger.debug("Serving from cache", {
          latency: Date.now() - startTime,
        });
        const cachedText = this.cache.get(cacheKey)!;
        const item = new vscode.InlineCompletionItem(cachedText);
        item.range = new vscode.Range(position, position);
        return [item];
      }
      // -------------------

      // 3. Get LLM Provider via Factory
      const llm = this.factory.getProvider(config);

      if (!llm) {
        this.logger.warn(
          `No valid LLM provider found for type: ${config.provider}`,
        );
        return null;
      }

      // 4. Call LLM
      this.logger.debug(`Calling LLM: ${config.model} via ${config.provider}`);
      const completionText = await llm.completeCode(prompt, {
        stopSequences: stopSequences,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        model: config.model,
      });

      const latency = Date.now() - startTime;

      if (token.isCancellationRequested) return null;
      if (!completionText) {
        this.logger.debug("No completion text generated", {
          latency,
          model: config.model,
        });
        return null;
      }

      this.logger.info("Completion generated", {
        latency,
        model: config.model,
        length: completionText.length,
      });

      // --- CACHE SET ---
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        // Remove oldest (first)
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, completionText);
      // -----------------

      // 5. Return Item
      const item = new vscode.InlineCompletionItem(completionText);
      item.range = new vscode.Range(position, position);
      return [item];
    } catch (error) {
      this.logger.error("Error providing inline completion", error);
      return null;
    }
  }
}
