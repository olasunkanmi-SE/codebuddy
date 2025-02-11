import { Row } from "@libsql/client/.";
import { CodeRepository } from "../infrastructure/repository/code";
import { getGeminiAPIKey } from "../utils/utils";
import { EmbeddingService } from "./embedding";
import { Logger } from "../infrastructure/logger/logger";
import { FileService } from "./file-system";
import {
  IFileToolConfig,
  IFileToolResponse,
} from "../application/interfaces/agent.interface";
import * as vscode from "vscode";

export class ContextRetriever {
  private readonly codeRepository: CodeRepository;
  private readonly embeddingService: EmbeddingService;
  private readonly fileService: FileService;
  private static readonly SEARCH_RESULT_COUNT = 2;
  private readonly logger: Logger;
  private static instance: ContextRetriever;
  constructor() {
    this.codeRepository = CodeRepository.getInstance();
    const geminiApiKey = getGeminiAPIKey();
    this.embeddingService = new EmbeddingService(geminiApiKey);
    this.logger = new Logger("ContextRetriever");
    this.fileService = new FileService();
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
    const filecontentsPromises = fileConfigs.map(async (file) => ({
      function: file.function_name,
      content: await this.readFileContent(file.file_path ?? ""),
    }));
    const fileContents = await Promise.all(filecontentsPromises);
    return fileContents;
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      const fileContent = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(fileContent).toString("utf-8");
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  }
}
