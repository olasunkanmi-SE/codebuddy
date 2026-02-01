import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "../services/telemetry";
import { validateLlmConfig } from "../utils/llm-config-validator";
import { IBaseLLM, ILlmConfig } from "./interface";

export abstract class BaseLLM<T extends Record<string, any>>
  implements IBaseLLM
{
  protected logger: Logger;
  constructor(protected config: ILlmConfig) {
    this.logger = Logger.initialize("BaseLLM", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
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
    } catch (error: any) {
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

  /**
   * Parses a thought string into a series of steps, extracting titles and bullet points.
   *
   * @param {string} thought The input thought string, expected to be in a numbered step format.
   *                         Example: "1. **Step Title**: Step content.\n   * Bullet point 1\n   * Bullet point 2"
   * @returns {string[]} An array of parsed steps. Each step is a string. Returns a single-element array
   *                      containing the trimmed input if the input doesn't follow the expected format.
   */
  protected parseThought(thought: string): string[] {
    const sections = this.splitThoughtIntoSections(thought);

    if (sections.length <= 1) {
      return [thought.trim()];
    }

    return this.processSections(sections);
  }

  /**
   * Splits the thought string into sections based on numbered steps.
   *
   * @param {string} thought The input thought string.
   * @returns {string[]} An array of strings, where even indices are step numbers (e.g., "1. ") and odd indices are step contents.
   */
  private splitThoughtIntoSections(thought: string): string[] {
    return thought.split(/(\d+\.\s+)/);
  }

  /**
   * Processes the sections array to extract step titles, content, and bullet points.
   *
   * @param {string[]} sections An array of strings representing the split thought.
   * @returns {string[]} An array of parsed steps.
   */
  private processSections(sections: string[]): string[] {
    const steps: string[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      if (i + 1 >= sections.length) break;

      const stepNumber = sections[i].trim();
      const stepContent = sections[i + 1];

      const parsedStep = this.parseStepContent(stepNumber, stepContent);
      steps.push(parsedStep);
    }

    return steps;
  }

  /**
   * Parses the content of a single step to extract the title and any associated bullet points.
   *
   * @param {string} stepNumber The step number (e.g., "1.").
   * @param {string} stepContent The content of the step.
   * @returns {string} The formatted step string.
   */
  private parseStepContent(stepNumber: string, stepContent: string): string {
    const titleRegex = /^\s*\*\*([^:\n*]+)\*\*:?\s*/;
    const titleMatch = titleRegex.exec(stepContent);

    if (titleMatch) {
      return this.formatStepWithTitle(titleMatch, stepContent);
    } else {
      return stepNumber + " " + stepContent.trim();
    }
  }

  /**
   * Formats a step that includes a title.  Handles cases with and without bullet points.
   *
   * @param {RegExpMatchArray} titleMatch The result of the regex match for the title.
   * @param {string} stepContent The content of the step.
   * @returns {string} The formatted step string including the title and bullet points (if any).
   */
  private formatStepWithTitle(
    titleMatch: RegExpMatchArray,
    stepContent: string,
  ): string {
    const title = titleMatch[1].trim();
    const remainingContent = stepContent.substring(titleMatch[0].length).trim();

    if (remainingContent.includes("*")) {
      const bulletPoints = this.extractBulletPoints(remainingContent);

      if (bulletPoints.length > 0) {
        const formattedBulletPoints = bulletPoints
          .map((bp) => "- " + bp)
          .join(" ");
        return title + ": " + formattedBulletPoints;
      } else {
        return `${title}: ${remainingContent}`;
      }
    } else {
      return `${title}: ${remainingContent}`;
    }
  }

  /**
   * Extracts bullet points from the step content.
   *
   * @param {string} content The remaining content of the step (after the title).
   * @returns {string[]} An array of bullet points.
   */
  private extractBulletPoints(content: string): string[] {
    return content
      .split(/\n\s*\*\s+/)
      .filter(Boolean)
      .map((point) => point.trim());
  }
}
