import { Logger } from "../infrastructure/logger/logger";
import { FileService } from "../services/file-system";
import { QuestionClassifierService } from "../services/question-classifier.service";
import {
  EnhancedPromptBuilderService,
  PromptContext,
} from "../services/enhanced-prompt-builder.service";
import { GroqLLM } from "../llms/groq/groq";
import { LogLevel } from "../services/telemetry";

export interface ImessageAndSystemInstruction {
  systemInstruction: string;
  userMessage: string;
}

export type LLMMessage = ImessageAndSystemInstruction | string;

/**
 * Responsible for classifying user questions and enhancing them
 * with codebase context when appropriate.
 */
export class ContextEnhancementService {
  private readonly logger: Logger;
  private readonly fileService: FileService;
  private readonly questionClassifier: QuestionClassifierService;
  private readonly promptBuilderService: EnhancedPromptBuilderService;
  private readonly groqLLM: GroqLLM | null;

  constructor(
    groqLLM: GroqLLM | null,
    promptBuilderService: EnhancedPromptBuilderService,
  ) {
    this.logger = Logger.initialize("ContextEnhancementService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.fileService = FileService.getInstance();
    this.questionClassifier = QuestionClassifierService.getInstance();
    this.groqLLM = groqLLM;
    this.promptBuilderService = promptBuilderService;
  }

  async categorizeQuestion(userQuestion: string): Promise<
    | {
        isCodebaseRelated: boolean;
        categories: string[];
        confidence: "high" | "medium" | "low";
      }
    | undefined
  > {
    const prompt = `You are an AI copilot expert in analyzing user questions to distinguish between codebase-specific queries and general knowledge questions. Given a user's question, determine if it is related to analyzing or querying details within a specific codebase (e.g., "how was authentication handled within this application" is codebase-related because it asks about implementation in a particular code context). If it's a general definition or non-code-specific question (e.g., "what is MCP, model context protocol" is not codebase-related because it's seeking a general explanation), classify it accordingly.

                    Analyze the question to provide context about what type of codebase information is needed:
                    - If codebase-related, extract relevant categories (e.g., "authentication", "database integration", "API endpoints") as strings in an array. These should represent key concepts or areas in the codebase that the question targets.
                    - If not codebase-related, use an empty array for categories.
                    - Assign a confidence level: "high" for clear cases, "medium" for ambiguous, "low" for uncertain.

                    Focus on:
                    - Codebase-related: Questions about code structure, implementation, feature handling, or specifics in "this application", "codebase", or implied project context.
                    - Not codebase-related: General definitions, acronyms, protocols, or abstract concepts without reference to a specific code instance.
                    - Edge cases: If the question implies code analysis (e.g., "how does authentication work here"), set isCodebaseRelated to true with appropriate categories; if purely explanatory (e.g., "define OAuth"), set to false.
                    - Categories: Be concise, 1-5 items max, directly derived from the question's core topics.
                    - Confidence: Base on clarity—e.g., explicit "in this codebase" is high; vague implications are medium/low.

                    Questions like, what is MCP (Model Context Protocol) and A2A (Agent 2 Agent protocol), how do I use them together. These type of questions are not current codebase related question. These are general knowledge questions. Understand the tone and what the user is asking for.

                    User question: "${userQuestion}"

                    Output exactly as a JSON object in this format, nothing else (no explanations, no additional text)
                    Output format:
                    {
                      "isCodebaseRelated": true/false,
                      "categories": [architectural, debugging],
                      "confidence": "high" | "medium" | "low"
                    }`;

    try {
      const response = await this.groqLLM?.generateText(prompt);
      if (!response) {
        throw new Error("No response from Groq LLM");
      }
      return JSON.parse(response.replace(/```/g, "").trim());
    } catch (error) {
      this.logger.error("Error generating search terms:", error);
      return undefined;
    }
  }

  /**
   * Enhances user messages with codebase context if the question is codebase-related
   */
  async enhanceMessageWithCodebaseContext(
    message: string,
    userSelectedFiles?: string[],
    modelName?: string,
  ): Promise<LLMMessage> {
    try {
      const categorizedQuestion = await this.categorizeQuestion(message);
      const questionAnalysis =
        categorizedQuestion ??
        this.questionClassifier.categorizeQuestion(message);

      if (!questionAnalysis.isCodebaseRelated) {
        this.logger.debug(
          "Question not codebase-related, returning original message",
        );
        return message;
      }

      this.logger.info(
        `Detected codebase question with confidence: ${questionAnalysis.confidence}, categories: ${questionAnalysis.categories.join(", ")}`,
      );

      let userSelectedFileContents: Map<string, string> | undefined;
      if (userSelectedFiles && userSelectedFiles.length > 0) {
        userSelectedFileContents =
          await this.fileService.getFilesContent(userSelectedFiles);
        this.logger.info(
          `Loaded ${userSelectedFileContents?.size || 0} user-selected files for context`,
        );
      }

      const promptContext: PromptContext = {
        questionAnalysis: {
          ...questionAnalysis,
          confidence:
            typeof questionAnalysis.confidence === "string"
              ? this.convertConfidenceToNumber(questionAnalysis.confidence)
              : questionAnalysis.confidence,
        },
        userSelectedFileContents,
        modelName: modelName || "default",
      };

      const enhancedMessage =
        await this.promptBuilderService.createEnhancedPrompt(
          message,
          promptContext,
        );

      return { systemInstruction: enhancedMessage, userMessage: message };
    } catch (error: any) {
      this.logger.error("Error enhancing message with codebase context", error);
      return message;
    }
  }

  private convertConfidenceToNumber(confidence: string): number {
    switch (confidence.toLowerCase()) {
      case "high":
        return 0.9;
      case "medium":
        return 0.7;
      case "low":
        return 0.4;
      default:
        return 0.7;
    }
  }
}
