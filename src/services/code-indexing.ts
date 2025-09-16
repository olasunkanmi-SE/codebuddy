import { IFunctionData } from "../application/interfaces";
import { Logger } from "../infrastructure/logger/logger";
import { CodeRepository } from "../infrastructure/repository/code";
import { CodeStructureMapper } from "./code-structure.mapper";
import { EmbeddingService } from "./embedding";
import { TypeScriptAtsMapper } from "./typescript-ats.service";
import { getAPIKeyAndModel } from "../utils/utils";
import { LogLevel } from "./telemetry";

/**
 * Provides a centralized service for managing code indexing, including building function structure maps,
 * generating function descriptions, generating embeddings, and inserting function data into a database.
 */
export class CodeIndexingService {
  logger: Logger;
  embeddingService: EmbeddingService;
  codeRepository: CodeRepository | undefined;
  private static instance: CodeIndexingService;
  constructor() {
    this.logger = Logger.initialize("CodeIndexingService", {
      minLevel: LogLevel.DEBUG,
    });
    const { apiKey, model } = getAPIKeyAndModel("gemini");
    this.embeddingService = new EmbeddingService(apiKey);
  }

  /**
   * Creates a singleton instance of the CodeIndexingService class.
   * @returns {CodeIndexingService} The CodeIndexingService instance.
   */
  public static createInstance(): CodeIndexingService {
    if (!CodeIndexingService.instance) {
      CodeIndexingService.instance = new CodeIndexingService();
    }
    return CodeIndexingService.instance;
  }

  /**
   * Retrieves an instance of the CodeRepository, which is used to interact with the database.
   * @returns {Promise<void>} A promise that resolves when the repository is initialized.
   */
  async getCodeRepository() {
    this.codeRepository = await CodeRepository.getInstance();
  }

  /**
   * Builds a function structure map using the TypeScript ATS mapper and CodeStructureMapper services.
   * @returns {Promise<Partial<IFunctionData>[]>} A promise that resolves with an array of function data.
   */
  async buildFunctionStructureMap(): Promise<Partial<IFunctionData>[]> {
    try {
      // TODO Get all the typescript project compilers information
      const codeATS = await TypeScriptAtsMapper.getInstance();
      if (!codeATS) {
        throw new Error("Failed to get TypeScriptAtsMapper instance");
      }
      const mappedCode = await codeATS.buildCodebaseMap();
      if (!mappedCode) {
        throw new Error("Failed to build codebase map");
      }
      const ats = Object.values(mappedCode).flatMap((repo) =>
        Object.values(repo.modules),
      );
      const mapper = new CodeStructureMapper(ats);
      return mapper.normalizeData();
    } catch (error) {
      this.logger.error("Error building function structure map:", error);
      throw error;
    }
  }

  /**
   * Generates function descriptions using the EmbeddingService.
   * @returns {Promise<IFunctionData[]>} A promise that resolves with an array of function data.
   */
  async generateFunctionDescription(): Promise<IFunctionData[]> {
    try {
      const functions =
        (await this.buildFunctionStructureMap()) as IFunctionData[];
      if (!functions?.length) {
        throw new Error("failed to generate ATS");
      }
      return await this.embeddingService.processFunctions(functions);
    } catch (error) {
      this.logger.error("LLM unable to generate description", error);
      throw error;
    }
  }

  /**
   * Generates embeddings for the given functions using the EmbeddingService.
   * @returns {Promise<IFunctionData[]>} A promise that resolves with an array of function data.
   */
  async generateEmbeddings(): Promise<IFunctionData[]> {
    const functionsWithDescription = await this.generateFunctionDescription();
    functionsWithDescription.forEach((item) => {
      if (!item.compositeText) {
        item.compositeText = `Description: ${item.description} Function: ${item.name} ${item.returnType} Dependencies: ${(item.dependencies ?? []).join(", ")}`;
      }
    });
    const functionWithEmbeddings = await this.embeddingService.processFunctions(
      functionsWithDescription,
      true,
    );
    return functionWithEmbeddings;
  }

  // /**
  //  * Inserts function data into the database using the CodeRepository.
  //  * @returns {Promise<ResultSet | undefined>} A promise that resolves with the result set or undefined.
  //  */
  // async insertFunctionsinDB(): Promise<ResultSet | undefined> {
  //   await this.getCodeRepository();
  //   if (!this.codeRepository) {
  //     this.logger.info("Unable to connect to the DB");
  //     throw new Error("Unable to connect to DB");
  //   }
  //   const dataToInsert = await this.generateEmbeddings();
  //   if (dataToInsert?.length) {
  //     const valuesString = dataToInsert
  //       .map(
  //         (value) =>
  //           `('${value.className}', '${value.name}', '${value.path}', '${value.processedAt}', vector32('[${(value.embedding ?? []).join(",")}]'))`,
  //       )
  //       .join(",");
  //     const result = await this.codeRepository?.insertFunctions(valuesString);
  //     return result;
  //   }
  // }
}
