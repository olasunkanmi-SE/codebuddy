import {
  EmbedContentResponse,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import OpenAI from "openai";
import * as path from "path";
import * as fs from "fs";
import { EmbeddingsConfig } from "../application/constant";
import { IFunctionData } from "../application/interfaces";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
// Import transformers directly to ensure esbuild bundles it and applies the alias
import { pipeline, env } from "@huggingface/transformers";

interface EmbeddingServiceOptions {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  rateLimit: number;
  embeddingModel: string;
  textModel: string;
}

interface BatchProcessResult {
  generateEmbeddings: IFunctionData[];
  generateComments: IFunctionData[];
}

export interface EmbeddingProviderConfig {
  apiKey: string;
  provider: string;
  model?: string;
  baseUrl?: string;
}

/**
 * EmbeddingService is responsible for generating embeddings and text comments for functions.
 * It handles rate limiting, retries, and error logging.
 * Supports Gemini and OpenAI-compatible providers.
 * @export
 * @class EmbeddingService
 */
export class EmbeddingService {
  private static readonly DEFAULT_OPTIONS: Required<EmbeddingServiceOptions> =
    EmbeddingsConfig;

  private readonly options: Required<EmbeddingServiceOptions>;
  private readonly requestInterval: number;
  private readonly genAI: GoogleGenerativeAI | undefined;
  private readonly openai: OpenAI | undefined;
  private readonly logger: Logger;
  private readonly provider: string;
  private readonly modelName: string | undefined;
  private extractor: any | undefined;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: EmbeddingProviderConfig) {
    this.provider = config.provider.toLowerCase();

    // Providers that don't require an API key
    const localProviders = ["local", "transformers", "ollama"];
    const isLocal = localProviders.includes(this.provider);

    if (!config.apiKey && !isLocal) {
      throw new Error(
        `${config.provider} API key is required for embedding generation`,
      );
    }

    this.modelName = config.model;
    this.options = { ...EmbeddingService.DEFAULT_OPTIONS };
    //update this to 120000
    this.requestInterval = (60 * 1000) / this.options.rateLimit;

    this.logger = Logger.initialize("EmbeddingService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });

    if (this.provider === "gemini") {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    } else if (
      this.provider === "openai" ||
      this.provider === "local" ||
      this.provider === "deepseek" ||
      this.provider === "groq" ||
      this.provider === "transformers" ||
      this.provider === "ollama"
    ) {
      // OpenAI compatible or local providers
      const baseURL = config.baseUrl;
      if (this.provider !== "transformers" && this.provider !== "ollama") {
        this.openai = new OpenAI({
          apiKey: config.apiKey,
          baseURL: baseURL,
          dangerouslyAllowBrowser: true, // Add this if needed for certain environments
        });
      }
    } else {
      // Fallback or default to Gemini if unknown, but better to warn
      this.logger.warn(
        `Unsupported provider for embeddings: ${this.provider}. Defaulting to Gemini logic if possible.`,
      );
      this.genAI = new GoogleGenerativeAI(config.apiKey);
      this.provider = "gemini";
    }
  }

  /**
   * Get embedding model from VS Code configuration
   */
  private getEmbeddingModelFromConfig(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const vscode = require("vscode");
      const config = vscode.workspace?.getConfiguration?.();
      return (
        (config?.get("codebuddy.embeddingModel") as string) ||
        "gemini-2.0-flash"
      );
    } catch {
      // Fallback if vscode module is not available (e.g., in tests)
      return "gemini-2.0-flash";
    }
  }

  /**
   * Introduces a delay in the execution of the code, allowing for asynchronous processing.
   * This delay is used to prevent excessive requests to the Google Generative AI model and ensure compliance with the rate limit.
   * @private
   * @async
   * @param {number} ms - The duration of the delay in milliseconds.
   * @returns {Promise<void>}
   * @memberof EmbeddingService
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculates the time to wait before making the next request to the Google Generative AI model.
   * This calculation is based on the rate limit and the time elapsed since the last request.
   * @private
   * @param {number} lastRequestTime - The time of the last request in milliseconds.
   * @returns {number} The time to wait before making the next request in milliseconds.
   * @memberof EmbeddingService
   */
  private calculateWaitTime(lastRequestTime: number): number {
    const elapsed = Date.now() - lastRequestTime;
    return Math.max(0, this.requestInterval - elapsed);
  }

  getModel(aiModel?: string): GenerativeModel | undefined {
    const genAI = this.genAI;
    if (genAI) {
      return genAI.getGenerativeModel({
        model: aiModel ?? this.options.embeddingModel,
      });
    }
    return undefined;
  }

  private async initTransformers(aiModel?: string) {
    if (this.extractor) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        this.logger.info("Initializing Transformers.js (v4)...");

        if (!pipeline) {
          throw new Error(
            "Pipeline function not found in Transformers.js exports.",
          );
        }

        // Configure environment for VS Code extension
        if (env) {
          env.allowLocalModels = true;
          env.allowRemoteModels = true;
          env.useWasmCache = false; // Disable WASM cache to avoid blob: URL issues in VS Code/Electron

          // Force WASM backend by disabling native node backend
          if (env.backends && env.backends.onnx) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            env.backends.onnx.node = false;

            if (env.backends.onnx.wasm) {
              // Ensure WASM paths are configured if needed
              const isProd = __filename.includes("dist");
              // In prod, extension is in dist/, so wasm is in dist/wasm/
              const wasmDir = isProd
                ? path.resolve(__dirname, "wasm")
                : path.resolve(__dirname, "..", "..", "dist", "wasm");

              // Fallback to current directory if wasmDir doesn't exist (though it should)
              const finalWasmDir =
                isProd && !fs.existsSync(wasmDir) ? __dirname : wasmDir;

              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              (env.backends.onnx.wasm as any).wasmPaths = {
                "ort-wasm-simd-threaded.wasm": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.wasm")}`,
                "ort-wasm-simd-threaded.mjs": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.mjs")}`,
                "ort-wasm-simd-threaded.asyncify.wasm": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.asyncify.wasm")}`,
                "ort-wasm-simd-threaded.asyncify.mjs": `file://${path.join(finalWasmDir, "ort-wasm-simd-threaded.asyncify.mjs")}`,
              };
            }
          }
        }

        // Use local model name only if provider is local/transformers, otherwise use default
        const localProviders = ["local", "transformers", "ollama"];
        const isLocalProvider = localProviders.includes(this.provider);
        const model =
          aiModel ??
          (isLocalProvider ? this.modelName : undefined) ??
          "Xenova/all-MiniLM-L6-v2";

        this.logger.info(
          `Initializing Transformers.js pipeline with model: ${model} (dtype: q8)`,
        );

        this.extractor = await pipeline("feature-extraction", model, {
          dtype: "q8", // Use quantized model to save memory and avoid std::bad_alloc
        });
        this.logger.info("Transformers.js pipeline initialized successfully.");
      } catch (error: any) {
        this.logger.error("Failed to initialize Transformers.js", {
          message: error.message,
          stack: error.stack,
          code: error.code,
        });
        this.initializationPromise = null; // Reset on failure
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Generates an embedding for the given text using the configured AI model.
   * Prioritizes local generation using Transformers.js (v4) to ensure data privacy and
   * reduce reliance on remote APIs. Falls back to OpenAI or Gemini if local generation
   * is not possible and an API key is available.
   *
   * @async
   * @param {string} text - The text to generate an embedding for.
   * @param {string} [aiModel] - Optional specific model to use.
   * @returns {Promise<number[]>} The generated embedding.
   * @memberof EmbeddingService
   */
  async generateEmbedding(text: string, aiModel?: string) {
    // Use Transformers.js (Local) - No fallback to cloud providers
    try {
      await this.initTransformers(aiModel);
      if (this.extractor) {
        const output = await this.extractor(text, {
          pooling: "mean",
          normalize: true,
        });

        if (output && output.data) {
          this.logger.debug("Generated embedding using Transformers.js");
          return Array.from(output.data) as number[];
        } else {
          throw new Error("Transformers.js returned empty or invalid output");
        }
      }
    } catch (error: any) {
      this.logger.error("Transformers.js embedding failed", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }

    throw new Error(
      "Local embedding provider (Transformers.js) not initialized",
    );
  }

  /**
   * Generates text for the given function data using the configured AI model.
   * The generated text is a human-readable description of the function's purpose and behavior.
   * @private
   * @async
   * @param {IFunctionData} item - The function data to generate text for.
   * @returns {Promise<IFunctionData>} The function data with the generated text.
   * @memberof EmbeddingService
   */
  private async generateText(item: IFunctionData): Promise<IFunctionData> {
    try {
      const prompt = this.buildPrompt(item.content);
      let description = "";

      const openai = this.openai;
      const genAI = this.genAI;

      if (openai) {
        let model = this.modelName;
        if (!model) {
          switch (this.provider) {
            case "groq":
              model = "llama3-8b-8192";
              break;
            case "deepseek":
              model = "deepseek-chat";
              break;
            default:
              model = "gpt-3.5-turbo";
          }
        }

        this.logger.debug(
          `Generating text using ${this.provider} model: ${model}`,
        );
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
        });
        description = response.choices[0].message.content || "";
      } else if (genAI) {
        const model = genAI.getGenerativeModel({
          model: this.options.textModel,
        });
        const result = await model.generateContent(prompt);
        description = result.response.text();
      } else {
        throw new Error("No valid provider for text generation");
      }

      return {
        ...item,
        description,
        processedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error("Failed to generate text", { error, item });
      throw new Error("Text generation failed");
    }
  }

  /**
   * Builds a prompt for generating text based on the given function content.
   * The prompt is a string that provides context and guidance for the AI model to generate high-quality text.
   * @private
   * @param {string} content - The function content to build a prompt for.
   * @returns {string} The built prompt.
   * @memberof EmbeddingService
   */
  private buildPrompt(content: string): string {
    return `
      Generate function level comment for this code.
      Example:  
      Fetches daily transactions from an API and saves them in bulk.
      This function continues fetching transactions in a loop until no more transactions are available.
      It also handles rate limit errors by waiting before retrying.
      ${content}
      Just explain what the function does. No Params etc
    `.trim();
  }

  /**
   * Generates embeddings for the given function data using the configured AI model.
   * The generated embeddings are numerical representations of the function data that can be used for various tasks, such as clustering and classification.
   * @private
   * @async
   * @param {IFunctionData} item - The function data to generate embeddings for.
   * @returns {Promise<IFunctionData>} The function data with the generated embeddings.
   * @memberof EmbeddingService
   */
  private async generateFunctionEmbeddings(
    item: IFunctionData,
  ): Promise<IFunctionData> {
    try {
      const embedding = await this.generateEmbedding(item.compositeText);
      return {
        ...item,
        embedding,
        processedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error("Failed to generate function embeddings", {
        error,
        item,
      });
      throw error;
    }
  }

  /**
   * Processes a batch of function data with retries, ensuring that all data is processed successfully.
   * The batch is processed in a loop, with retries attempted if any errors occur during processing.
   * @private
   * @async
   * @param {IFunctionData[]} batch - The batch of function data to process.
   * @param {number} lastRequestTime - The time of the last request in milliseconds.
   * @param {boolean} forEmbedding - Whether to generate embeddings or text for the function data.
   * @returns {Promise<BatchProcessResult>} The result of the batch processing, including any generated embeddings or text.
   * @memberof EmbeddingService
   */
  private async processBatchWithRetry(
    batch: IFunctionData[],
    lastRequestTime: number,
    forEmbedding: boolean,
  ): Promise<BatchProcessResult> {
    let retries = 0;
    const generateComments: IFunctionData[] = [];
    const generateEmbeddings: IFunctionData[] = [];

    while (retries < this.options.maxRetries) {
      try {
        const timeToWait = this.calculateWaitTime(lastRequestTime);
        if (timeToWait > 0) {
          await this.delay(timeToWait);
        }

        if (forEmbedding) {
          const embeddings = await Promise.all(
            batch.map((item) => this.generateFunctionEmbeddings(item)),
          );
          generateEmbeddings.push(...embeddings.filter(Boolean));
        } else {
          const comments = await Promise.all(
            batch.map((item) => {
              if (!item.description) {
                return item.content ? this.generateText(item) : null;
              }
            }),
          );
          generateComments.push(
            ...comments.filter(
              (comment): comment is IFunctionData => comment !== null,
            ),
          );
        }

        return {
          generateEmbeddings,
          generateComments,
        };
      } catch (error: any) {
        retries++;
        this.logger.error(`Retry ${retries}/${this.options.maxRetries}`, {
          error,
        });

        if (retries === this.options.maxRetries) {
          throw error;
        }

        await this.delay(this.options.retryDelay * retries);
      }
    }
    // If retry is eq or greater than retries.
    // Save json.stringify({ generateEmbeddings, generateComments }) to storage
    // can replay later to conclude the process
    return { generateEmbeddings, generateComments };
  }

  /**
   * Processes the given function data, generating embeddings or text as specified.
   * The processing is done in batches, with retries attempted if any errors occur during processing.
   * @public
   * @async
   * @param {IFunctionData[]} data - The function data to process.
   * @param {boolean} [forEmbedding=false] - Whether to generate embeddings or text for the function data.
   * @returns {Promise<IFunctionData[]>} The processed function data, including any generated embeddings or text.
   * @memberof EmbeddingService
   */
  public async processFunctions(
    data: IFunctionData[],
    forEmbedding = false,
  ): Promise<IFunctionData[]> {
    try {
      const result = await this.processWithRateLimit(data, forEmbedding);

      this.logger.info("Processing completed", {
        successful: result.successful.length,
        failed: result.failed.length,
      });

      return result.successful;
    } catch (error: any) {
      this.logger.error("Processing failed", { error });
      throw error;
    }
  }

  /**
   * Processes the given function data with rate limiting, ensuring that the processing is done within the allowed rate limit.
   * The processing is done in batches, with retries attempted if any errors occur during processing.
   * @private
   * @async
   * @param {IFunctionData[]} data - The function data to process.
   * @param {boolean} forEmbedding - Whether to generate embeddings or text for the function data.
   * @returns {Promise<{ successful: IFunctionData[]; failed: IFunctionData[] }>} The result of the processing, including any successful and failed function data.
   * @memberof EmbeddingService
   */
  private async processWithRateLimit(
    data: IFunctionData[],
    forEmbedding: boolean,
  ): Promise<{
    successful: IFunctionData[];
    failed: IFunctionData[];
  }> {
    const successful: IFunctionData[] = [];
    const failed: IFunctionData[] = [];
    let lastRequestTime = 0;

    for (let i = 0; i < data.length; i += this.options.batchSize) {
      const batch = data.slice(i, i + this.options.batchSize);

      try {
        // Only delay for non-embedding (cloud) processing to avoid rate limits
        if (!forEmbedding) {
          await this.delay(60000);
        }
        const result = await this.processBatchWithRetry(
          batch,
          lastRequestTime,
          forEmbedding,
        );

        successful.push(
          ...(forEmbedding
            ? result.generateEmbeddings
            : result.generateComments),
        );
        lastRequestTime = Date.now();

        this.logger.info(`Batch processed`, { startIndex: i });
      } catch (error: any) {
        this.logger.error(`Batch processing failed`, {
          startIndex: i,
          error,
        });
        failed.push(
          ...batch.map((item) => ({ ...item, error: error as Error })),
        );
      }
    }

    return { successful, failed };
  }
}
