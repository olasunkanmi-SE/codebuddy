import { error } from "console";
import { Logger } from "../infrastructure/logger/logger";
import { validateLlmConfig } from "../utils/llm-config-validator";
import { IBaseLLM, ILlmConfig } from "./interface";

export abstract class BaseLLM<T extends Record<string, any>>
  implements IBaseLLM
{
  protected logger: Logger;
  constructor(protected config: ILlmConfig) {
    this.logger = new Logger("BaseLLM");
    this.validateConfig();
  }

  abstract generateEmbeddings(text: string): Promise<number[]>;

  abstract generateText(prompt: string, instruction?: string): Promise<string>;

  abstract createSnapShot(): T;

  abstract loadSnapShot(snapshot: T): void;

  private validateConfig() {
    try {
      const llmConfig = this.config;
      const validationErrors = validateLlmConfig(llmConfig);
      if (validationErrors?.length > 0) {
        validationErrors.forEach((error) => this.logger.info(`${error}`));
        this.logger.info("LLM configuration is invalid");
      }
    } catch (error) {
      this.logger.error("LLM configuration is invalid", error);
      throw error;
    }
  }

  prompts(props: { title: string; query: string }): {
    urlRelevanceScore: string;
  } {
    return {
      urlRelevanceScore: `
      You are an expert in natural language processing. Your task is to first generate a list of 10 keywords or phrases that are synonyms or semantically related to a given user query. Then, evaluate how relevant a webpage title is to these generated keywords based on semantic similarity, synonyms, and overall meaning—not just exact matches. Consider the following:

      - Query: "${props.query}"
      - Title: "${props.title}"

      Return your response in this format:

      - Score: [number]
    `,
    };
  }
}
