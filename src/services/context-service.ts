import { EmbeddingService } from "./embedding-service";
import { APP_CONFIG } from "../application/constant";
import { IFunctionData } from "../application/interfaces";
import { getConfigValue } from "../application/utils";
import { Logger } from "../infrastructure/logger/logger";
import { CodeStructureMapper } from "./code-structure.mapper.service";
import { TypeScriptAtsMapper } from "./typescript-ats.service";

export class ContextService {
  logger: Logger;
  embeddingService: EmbeddingService;
  constructor() {
    this.logger = new Logger("ContextService");
    const apiKey = this.getAPIKey();
    this.embeddingService = new EmbeddingService(apiKey);
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

  async buildFunctionStructureMap() {
    const codeATS = TypeScriptAtsMapper.getInstance();
    const mappedCode = await codeATS.buildCodebaseMap();
    const ats = Object.values(mappedCode).flatMap((repo) =>
      Object.values(repo.modules)
    );
    const mapper = new CodeStructureMapper(ats);
    return mapper.normalizeData();
  }

  async generateFunctionDescription() {
    const functions =
      (await this.buildFunctionStructureMap()) as IFunctionData[];
    return await this.embeddingService.processFunctions(functions);
  }

  //   async generateContextEmbeddings
}
