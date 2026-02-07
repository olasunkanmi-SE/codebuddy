import { Language } from "web-tree-sitter";
import { languageConfigs, validateLanguageConfig } from "../language-config";
import * as path from "path";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { IOutputChannel } from "../../interfaces/output-channel";

export class GrammarLoader {
  private grammarCache = new Map<string, Language>();
  private logger: Logger;
  private static instance: GrammarLoader;

  constructor(
    private extensionPath: string,
    private outputChannel: IOutputChannel,
  ) {
    this.logger = Logger.initialize("QueryExecutor", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(extensionPath: string, outputChannel: IOutputChannel) {
    return (GrammarLoader.instance ??= new GrammarLoader(
      extensionPath,
      outputChannel,
    ));
  }

  async loaderGrammar(languageId: string): Promise<Language | undefined> {
    if (this.grammarCache.has(languageId)) {
      return this.grammarCache.get(languageId);
    }

    const config = languageConfigs[languageId];
    if (!config || !validateLanguageConfig(languageId, config)) {
      return undefined;
    }

    const fullPath = path.join(this.extensionPath, config.grammarPath);
    try {
      const language: Language = await Language.load(fullPath);
      this.grammarCache.set(languageId, language);
      this.outputChannel.appendLine(`Loaded grammar for ${languageId}`);
      this.logger.info(`Loaded grammar for ${languageId}`);
      return language;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `Failed to load grammar for ${languageId} from ${fullPath}: ${errorMsg}`,
      );
      this.logger.error(
        `Failed to load grammar for ${languageId} from ${fullPath}: ${errorMsg}`,
        error.stack,
      );
      return undefined;
    }
  }

  async prelodGrammars(): Promise<void> {
    const validLanguages = Object.entries(languageConfigs).filter(
      ([languageId, config]) => validateLanguageConfig(languageId, config),
    );

    for (const [languageId] of validLanguages) {
      await this.loaderGrammar(languageId);
    }
  }

  hasGrammar(languageId: string) {
    return this.grammarCache.has(languageId);
  }

  getCacheSize() {
    return this.grammarCache.size;
  }

  clear(): void {
    this.grammarCache.clear();
  }
}
