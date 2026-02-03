import {
  ICompletionContext,
  IImportSignature,
} from "../interfaces/completion.interface";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface IFIMTokens {
  prefix: string;
  suffix: string;
  middle: string;
  eot: string; // End of turn/text
}

export class FIMPromptService {
  private static instance: FIMPromptService;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("FIMPromptService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): FIMPromptService {
    if (!FIMPromptService.instance) {
      FIMPromptService.instance = new FIMPromptService();
    }
    return FIMPromptService.instance;
  }

  /**
   * Build the final prompt based on model capabilities and FIM format
   */
  public buildPrompt(
    model: string,
    context: ICompletionContext,
    useFim: boolean,
  ): { prompt: string; stopSequences: string[] } {
    const importsText = this.formatImports(context.imports);
    const fullPrefix = importsText + context.prefix;

    if (!useFim) {
      // Non-FIM fallback: Just send prefix + system instruction
      return {
        prompt: fullPrefix,
        stopSequences: ["\n\n", "```"],
      };
    }

    const tokens = this.getFIMTokens(model);

    // FIM Format: <PREFIX> prefix <SUFFIX> suffix <MIDDLE>
    const prompt = `${tokens.prefix}${fullPrefix}${tokens.suffix}${context.suffix}${tokens.middle}`;

    return {
      prompt,
      stopSequences: [tokens.eot, "<file_sep>", "\n\n\n"], // Stop at EOF or triple newline
    };
  }

  private getFIMTokens(modelName: string): IFIMTokens {
    const model = modelName.toLowerCase();

    if (model.includes("deepseek")) {
      // DeepSeek Coder V2 / V3
      return {
        prefix: "<|fim_begin|>",
        suffix: "<|fim_hole|>",
        middle: "<|fim_end|>",
        eot: "<|end_of_text|>",
      };
    } else if (model.includes("codellama")) {
      // CodeLlama
      return {
        prefix: "<PRE>",
        suffix: "<SUF>",
        middle: "<MID>",
        eot: "<EOT>",
      };
    } else if (model.includes("starcoder") || model.includes("codestral")) {
      // StarCoder / Mistral Codestral
      return {
        prefix: "<fim_prefix>",
        suffix: "<fim_suffix>",
        middle: "<fim_middle>",
        eot: "<|endoftext|>",
      };
    }

    // Default (Qwen and generic OpenAI-compatible FIM)
    // Qwen 2.5 Coder uses: <|fim_prefix|>, <|fim_suffix|>, <|fim_middle|>
    return {
      prefix: "<|fim_prefix|>",
      suffix: "<|fim_suffix|>",
      middle: "<|fim_middle|>",
      eot: "<|endoftext|>",
    };
  }

  private formatImports(imports: IImportSignature[]): string {
    if (imports.length === 0) return "";

    // We prepend relevant imports to the top of the context if they aren't already there.
    // However, since we grabbed 'prefix' from the file, it likely contains the import statements.
    // This method is useful if we are injecting imports from *other* files (cross-file context).
    // For now, we'll keep it simple and assume the prefix covers local imports.
    // Future enhancement: Inject cross-file signatures here as a comment block.

    return "";
  }
}
