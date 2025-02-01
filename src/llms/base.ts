import { error } from "console";
import { Logger } from "../infrastructure/logger/logger";
import { validateLlmConfig } from "../utils/llm-config-validator";
import { IBaseLLM, ILlmConfig } from "./interface";

export abstract class BaseLLM<T extends Record<string, any>>
  implements IBaseLLM
{
  protected readonly logger: Logger;
  constructor(protected config: ILlmConfig) {
    this.logger = new Logger("BaseLLM");
    this.validateConfig();
  }

  abstract generateEmbeddings(text: string): Promise<number[]>;

  abstract generateText(prompt: string): Promise<string>;

  abstract createSnapShot(): T;

  abstract loadSnapShot(snapshot: T): void;

  private validateConfig() {
    const llmConfig = this.config;
    const validationErrors = validateLlmConfig(llmConfig);
    if (validationErrors?.length > 0) {
      this.logger.error("LLM configuration is invalid", error);
      validationErrors.forEach((error) => this.logger.info(`${error}`));
      throw new Error("LLM configuration is invalid");
    }
  }
}
