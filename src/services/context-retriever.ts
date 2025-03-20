import { Row } from "@libsql/client/.";
import * as vscode from "vscode";
import {
  IFileToolConfig,
  IFileToolResponse,
} from "../application/interfaces/agent.interface";
import { Logger } from "../infrastructure/logger/logger";
import { CodeRepository } from "../infrastructure/repository/code";
import { getGeminiAPIKey } from "../utils/utils";
import { EmbeddingService } from "./embedding";
import { WebSearchService } from "./web-search-service";
import { Orchestrator } from "../agents/orchestrator";

export class ContextRetriever {
  private readonly codeRepository: CodeRepository;
  private readonly embeddingService: EmbeddingService;
  private static readonly SEARCH_RESULT_COUNT = 2;
  private readonly logger: Logger;
  private static instance: ContextRetriever;
  private readonly webSearchService: WebSearchService;
  protected readonly orchestrator: Orchestrator;
  constructor() {
    this.codeRepository = CodeRepository.getInstance();
    const geminiApiKey = getGeminiAPIKey();
    this.embeddingService = new EmbeddingService(geminiApiKey);
    this.logger = new Logger("ContextRetriever");
    this.webSearchService = WebSearchService.getInstance();
    this.orchestrator = Orchestrator.getInstance();
  }

  static initialize() {
    if (!ContextRetriever.instance) {
      ContextRetriever.instance = new ContextRetriever();
    }
    return ContextRetriever.instance;
  }

  async retrieveContext(input: string): Promise<Row[] | undefined> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(input);
      this.logger.info("Retrieving context from DB");
      // this.orchestrator.publish("onUpdate", "Retrieving context from DB");
      return this.codeRepository.searchSimilarFunctions(
        embedding,
        ContextRetriever.SEARCH_RESULT_COUNT,
      );
    } catch (error) {
      this.logger.error("Unable to retrieve context", error);
      throw error;
    }
  }

  async readFiles(
    fileConfigs: IFileToolConfig[],
  ): Promise<IFileToolResponse[]> {
    const files = fileConfigs.flatMap((file) => file);
    const promises = files.map(async (file) => {
      try {
        if (file.file_path) {
          const content = await this.readFileContent(file.file_path);
          return { function: file.function_name, content: content };
        }
      } catch (error) {
        this.logger.error(`Error reading file ${file.file_path}:`, error);
        throw new Error(`Error reading file ${file.file_path}: ${error}`);
      }
    });
    const results = await Promise.all(promises);
    return results.filter(
      (result): result is IFileToolResponse => result !== undefined,
    );
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(fileContent).toString("utf-8");
    } catch (error) {
      this.logger.error("Error reading file:", error);
      throw error;
    }
  }

  async webSearch(query: string) {
    try {
      const text = Array.isArray(query) ? query.join("") : query;
      return await this.webSearchService.run(text);
    } catch (error) {
      this.logger.error("Error reading file:", error);
      throw error;
    }
  }
}
