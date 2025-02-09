import { Row } from "@libsql/client/.";
import { CodeRepository } from "../infrastructure/repository/code";
import { getGeminiAPIKey } from "../utils/utils";
import { EmbeddingService } from "./embedding";
import { Logger } from "../infrastructure/logger/logger";

export class ContextRetriever {
  private readonly codeRepository: CodeRepository;
  private readonly embeddingService: EmbeddingService;
  private static readonly SEARCH_RESULT_COUNT = 2;
  private readonly logger: Logger;
  constructor() {
    this.codeRepository = CodeRepository.getInstance();
    const geminiApiKey = getGeminiAPIKey();
    this.embeddingService = new EmbeddingService(geminiApiKey);
    this.logger = new Logger("ContextRetriever");
  }

  async retrieveContext(input: string): Promise<Row[] | undefined> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(input);
      this.logger.info("Retrieving context from DB");
      return this.codeRepository.searchSimilarFunctions(
        embedding,
        ContextRetriever.SEARCH_RESULT_COUNT,
      );
    } catch (error) {
      this.logger.error("Unable to retrieve context", error);
      throw error;
    }
  }
}
