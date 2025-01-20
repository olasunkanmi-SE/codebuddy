import { EmbeddingService } from "./embedding-service";
import { APP_CONFIG } from "../application/constant";
import { IFunctionData } from "../application/interfaces";
import { getConfigValue } from "../application/utils";
import { Logger } from "../infrastructure/logger/logger";
import { CodeStructureMapper } from "./code-structure.mapper.service";
import { TypeScriptAtsMapper } from "./typescript-ats.service";
import { CodeRepository } from "../infrastructure/repository/code-repository";
import { ResultSet } from "@libsql/client/.";

export class ContextService {
  logger: Logger;
  embeddingService: EmbeddingService;
  codeRepository: CodeRepository | undefined;
  constructor() {
    this.logger = new Logger("ContextService");
    const apiKey = this.getAPIKey();
    this.embeddingService = new EmbeddingService(apiKey);
  }

  async getCodeRepository() {
    this.codeRepository = await CodeRepository.createInstance();
  }

  getAPIKey(): string {
    const { geminiKey } = APP_CONFIG;
    const apiKey = getConfigValue(geminiKey);
    if (!apiKey) {
      this.logger.info("Gemini API Key is required for code indexing");
      throw new Error("Gemini API Key is required for code indexing");
    }
    return apiKey;
  }

  async buildFunctionStructureMap(): Promise<Partial<IFunctionData>[]> {
    try {
      const codeATS = TypeScriptAtsMapper.getInstance();
      if (!codeATS) {
        throw new Error("Failed to get TypeScriptAtsMapper instance");
      }
      const mappedCode = await codeATS.buildCodebaseMap();
      if (!mappedCode) {
        throw new Error("Failed to build codebase map");
      }
      const ats = Object.values(mappedCode).flatMap((repo) => Object.values(repo.modules));
      const mapper = new CodeStructureMapper(ats);
      return mapper.normalizeData();
    } catch (error) {
      console.error("Error building function structure map:", error);
      throw error;
    }
  }

  async generateFunctionDescription(): Promise<IFunctionData[]> {
    try {
      const functions = (await this.buildFunctionStructureMap()) as IFunctionData[];
      if (!functions?.length) {
        throw new Error("failed to generate ATS");
      }
      return await this.embeddingService.processFunctions(functions);
    } catch (error) {
      this.logger.error("LLM unable to generate description", error);
      throw error;
    }
  }

  async generateEmbeddings(): Promise<IFunctionData[]> {
    const functionsWithDescription = await this.generateFunctionDescription();
    functionsWithDescription.forEach((item) => {
      if (!item.compositeText) {
        item.compositeText = `Description: ${item.description} Function: ${item.name} ${item.returnType} Dependencies: ${(item.dependencies ?? []).join(", ")}`;
      }
    });
    const functionWithEmbeddings = await this.embeddingService.processFunctions(functionsWithDescription, true);
    return functionWithEmbeddings;
  }

  async InsertFunctionsinDB(): Promise<ResultSet[] | undefined> {
    const dataToInsert = await this.generateEmbeddings();
    await this.getCodeRepository();
    if (!this.codeRepository) {
      this.logger.info("Unable to connect to the DB");
      throw new Error("Unable to connect to DB");
    }

    const valuesString = dataToInsert
      .map(
        (value) =>
          `('${value.className}', '${value.name}', '${value.path}', '${value.processedAt}', vector32('[${(value.embedding ?? []).join(",")}]'))`
      )
      .join(",");
    const result = await this.codeRepository?.InsertData(valuesString);
    return result;
  }
}
