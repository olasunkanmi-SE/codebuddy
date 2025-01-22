import { EmbedContentResponse, GoogleGenerativeAI } from "@google/generative-ai";
import { EmbeddingsConfig } from "../application/constant";
import { IFunctionData } from "../application/interfaces";
import { Logger } from "../infrastructure/logger/logger";

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

/**
 * EmbeddingService is responsible for generating embeddings and text comments for functions.
 * It handles rate limiting, retries, and error logging.
 * @export
 * @class EmbeddingService
 */
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
    //update this to 120000
    this.requestInterval = (60 * 1000) / this.options.rateLimit;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.logger = new Logger("EmbeddingService");
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

  /**
   * Generates an embedding for the given text using the configured AI model.
   * The embedding is a numerical representation of the text that can be used for various tasks, such as clustering and classification.
   * @async
   * @param {string} text - The text to generate an embedding for.
   * @returns {Promise<number[]>} The generated embedding.
   * @memberof EmbeddingService
   */
  async generateEmbedding(text: string) {
    const model = this.genAI.getGenerativeModel({
      model: this.options.embeddingModel,
    });
    const result: EmbedContentResponse = await model.embedContent(text);
    const embedding = result.embedding.values;
    return embedding;
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
