import { GoogleGenerativeAI } from "@google/generative-ai";
import { FeatureExtractionPipeline } from "@xenova/transformers";
import { EmbeddingsConfig } from "../application/constant";
import { IFunctionData } from "../application/interfaces";
import { Logger } from "../infrastructure/logger/logger";
import { CodeStructureMapper } from "./code-structure.mapper.service";
import { TypeScriptAtsMapper } from "./typescript-ats.service";

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

export class EmbeddingService {
  private static readonly DEFAULT_OPTIONS: Required<EmbeddingServiceOptions> = EmbeddingsConfig;

  private readonly options: Required<EmbeddingServiceOptions>;
  private readonly requestInterval: number;
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger: Logger;

  constructor(private readonly apiKey: string) {
    if (!this.apiKey) {
      throw new Error("Gemini API key is required");
    }

    this.options = { ...EmbeddingService.DEFAULT_OPTIONS };
    this.requestInterval = (60 * 1000) / this.options.rateLimit;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.logger = new Logger("EmbeddingService");
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateWaitTime(lastRequestTime: number): number {
    const elapsed = Date.now() - lastRequestTime;
    return Math.max(0, this.requestInterval - elapsed);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { pipeline } = await import("@xenova/transformers");
      const extractor: FeatureExtractionPipeline = await pipeline("feature-extraction", this.options.embeddingModel);
      const result = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      return Array.from(result.data);
    } catch (error) {
      this.logger.error("Failed to generate embedding", { error, text });
      throw new Error("Embedding generation failed");
    }
  }

  private async generateText(item: IFunctionData): Promise<IFunctionData> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.options.textModel,
      });

      const prompt = this.buildPrompt(item.content);
      const result = await model.generateContent(prompt);
      const description = result.response.text();

      return {
        ...item,
        description,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Failed to generate text", { error, item });
      throw new Error("Text generation failed");
    }
  }

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

  private async generateFunctionEmbeddings(item: IFunctionData): Promise<IFunctionData> {
    try {
      const embedding = await this.generateEmbedding(item.compositeText);
      return {
        ...item,
        embedding,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Failed to generate function embeddings", {
        error,
        item,
      });
      throw error;
    }
  }

  private async processBatchWithRetry(
    batch: IFunctionData[],
    lastRequestTime: number,
    forEmbedding: boolean
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
          const embeddings = await Promise.all(batch.map((item) => this.generateFunctionEmbeddings(item)));
          generateEmbeddings.push(...embeddings.filter(Boolean));
        } else {
          const comments = await Promise.all(
            batch.map((item) => {
              if (!item.description) {
                return item.content ? this.generateText(item) : null;
              }
            })
          );
          generateComments.push(...comments.filter((comment): comment is IFunctionData => comment !== null));
        }

        return {
          generateEmbeddings,
          generateComments,
        };
      } catch (error) {
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

    return { generateEmbeddings: [], generateComments: [] };
  }

  public async processFunctions(data: IFunctionData[], forEmbedding = false): Promise<IFunctionData[]> {
    try {
      const result = await this.processWithRateLimit(data, forEmbedding);

      this.logger.info("Processing completed", {
        successful: result.successful.length,
        failed: result.failed.length,
      });

      return result.successful;
    } catch (error) {
      this.logger.error("Processing failed", { error });
      throw error;
    }
  }

  private async processWithRateLimit(
    data: IFunctionData[],
    forEmbedding: boolean
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
        await this.delay(60000);
        const result = await this.processBatchWithRetry(batch, lastRequestTime, forEmbedding);

        successful.push(...(forEmbedding ? result.generateEmbeddings : result.generateComments));
        lastRequestTime = Date.now();

        this.logger.info(`Batch processed`, { startIndex: i });
      } catch (error) {
        this.logger.error(`Batch processing failed`, {
          startIndex: i,
          error,
        });
        failed.push(...batch.map((item) => ({ ...item, error: error as Error })));
      }
    }

    return { successful, failed };
  }
}
