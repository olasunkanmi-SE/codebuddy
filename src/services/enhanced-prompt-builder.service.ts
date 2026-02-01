import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { GroqLLM } from "../llms/groq/groq";
import { getAPIKeyAndModel } from "../utils/utils";
import { AnalyzeCodeProvider } from "../ast/commands/analyze-code-provider";
import { QUESTION_TYPE_INSTRUCTIONS } from "../application/constant";
import {
  SmartContextSelectorService,
  ContextSelectionResult,
} from "./smart-context-selector.service";

export interface QuestionAnalysis {
  isCodebaseRelated: boolean;
  confidence: number;
  categories: string[];
  technicalKeywords?: string[];
}

export interface PromptContext {
  vectorContext?: string;
  fallbackContext?: string;
  activeFile?: string;
  questionAnalysis: QuestionAnalysis;
  /** User-selected file paths from @ mentions */
  userSelectedFiles?: string[];
  /** Contents of user-selected files (pre-loaded) */
  userSelectedFileContents?: Map<string, string>;
  /** Model name for token budget calculation */
  modelName?: string;
}

export interface QuestionTypeClassification {
  isImplementation: boolean;
  isArchitectural: boolean;
  isDebugging: boolean;
  isCodeExplanation: boolean;
  isFeatureRequest: boolean;
}

/**
 * Enhanced Prompt Builder Service
 *
 * Responsible for creating sophisticated, contextually-aware prompts that help LLMs
 * understand user questions and provide optimal responses. This service encapsulates
 * all prompt engineering logic and question analysis.
 */
export class EnhancedPromptBuilderService {
  private logger: Logger;
  private readonly groqLLM: GroqLLM | null;
  private readonly _context: vscode.ExtensionContext;
  private readonly codeAnalyzerProvider: AnalyzeCodeProvider;
  private readonly smartContextSelector: SmartContextSelectorService;

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.initialize("EnhancedPromptBuilderService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    const { apiKey, model } = getAPIKeyAndModel("groq");
    const config = {
      apiKey: apiKey,
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    };
    this.groqLLM = GroqLLM.getInstance(config);
    this._context = context;
    this.codeAnalyzerProvider = AnalyzeCodeProvider.getInstance(this._context);
    this.smartContextSelector = SmartContextSelectorService.getInstance();
  }

  async createEnhancedPrompt(
    message: string,
    context: PromptContext,
  ): Promise<string> {
    // Get search terms for relevance scoring (skip if user provided explicit files)
    const hasUserSelectedFiles =
      context.userSelectedFileContents &&
      context.userSelectedFileContents.size > 0;
    let searchTerms: string[] = [];

    // Only generate search terms if we don't have user-provided context or for relevance scoring
    if (!hasUserSelectedFiles) {
      const generatedTerms = await this.generateSearchTerms(message);
      if (generatedTerms?.length) {
        searchTerms = generatedTerms;
        context.questionAnalysis.technicalKeywords = searchTerms;
      }
    } else {
      // Extract keywords from message for relevance scoring of auto-gathered code
      searchTerms = this.extractSimpleKeywords(message);
      context.questionAnalysis.technicalKeywords = searchTerms;
    }

    // Get auto-gathered code only if no user-selected files OR we need supplementary context
    let autoGatheredCode: string | undefined;
    if (!hasUserSelectedFiles && searchTerms.length > 0) {
      // Limit search terms to top 5 to avoid over-fetching
      const limitedTerms = searchTerms.slice(0, 5);
      autoGatheredCode = await this.codeAnalyzerProvider.analyse(limitedTerms);
    }

    // Use smart context selector to pick the best context within token budget
    const modelName = context.modelName || "default";
    const userFiles =
      context.userSelectedFileContents || new Map<string, string>();

    const contextResult = this.smartContextSelector.selectContext(
      userFiles,
      autoGatheredCode,
      searchTerms,
      modelName,
    );

    // Format the selected context for the prompt
    const formattedContext =
      this.smartContextSelector.formatForPrompt(contextResult);

    this.logger.info(
      `Smart context selection: ${contextResult.totalTokens}/${contextResult.budgetTokens} tokens, ` +
        `${contextResult.snippets.length} snippets, ${contextResult.droppedCount} dropped`,
    );

    const questionType = await this.classifyQuestionType(message);
    const specificInstructions =
      this.generateQuestionSpecificInstructions(questionType);
    const responseFormat = this.generateResponseFormatGuidelines(questionType);

    const enhancedPrompt = `
      persona: |
        You are CodeBuddy, an expert software engineer and architect with deep knowledge of the provided codebase context. Your goal is to provide comprehensive, accurate, and actionable responses.

      mission: |
        Analyze the user's question and the provided codebase context to generate an expert-level response. Follow all instructions and formatting rules precisely.

      context:
        question_type: ${this.categorizeQuestionTypeForDisplay(questionType)}
        token_budget_info: ${contextResult.totalTokens}/${contextResult.budgetTokens} tokens used${contextResult.wasTruncated ? ` (${contextResult.droppedCount} snippets omitted)` : ""}
        codebase_snippets: |
          ${formattedContext}

      rules:
        - Base your response *only* on the provided context. Do not invent APIs or file structures.
        - Be specific: Reference actual files, functions, and variables from the context.
        - Be actionable: Provide concrete steps, code, and clear guidance.
        - If context is insufficient, state what is missing.
        - Adhere strictly to the response format defined below.
        - Complete your entire response. Do not truncate.

      task_instructions:
      ${specificInstructions}

      response_format:
      ${responseFormat}

      user_question: |
        ${message}

      Begin response:
      `.trim();

    this.logger.debug(`Enhanced prompt created with smart context selection.`);
    return enhancedPrompt;
  }

  /**
   * Extracts simple keywords from a message without LLM call
   * Used when user provides explicit file context
   */
  private extractSimpleKeywords(message: string): string[] {
    // Remove common words and extract potential code-related terms
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "what",
      "how",
      "why",
      "when",
      "where",
      "which",
      "who",
      "whom",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "my",
      "your",
      "his",
      "its",
      "our",
      "their",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "for",
      "of",
      "to",
      "in",
      "on",
      "at",
      "by",
      "with",
      "from",
      "about",
      "into",
      "through",
      "please",
      "explain",
      "tell",
      "show",
      "help",
      "need",
      "want",
    ]);

    const words = message
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    // Deduplicate and return top 10
    return [...new Set(words)].slice(0, 10);
  }

  async generateSearchTerms(
    userQuestion: string,
  ): Promise<string[] | undefined> {
    if (!this.groqLLM) {
      return;
    }

    const prompt = `You are a software engineering expert specializing in codebase analysis. Given a user's question about a codebase, extract the core concept (e.g., "Authentication" from "how was Authentication handled within this codebase") and generate exactly 10 similar words or short phrases that are synonyms, related technical terms, or common implementations in software engineering. These should be useful as search keywords for scanning code files (e.g., via ripgrep or similar tools) to find relevant sections.

                  Focus on:
                  - Technical accuracy in software contexts (e.g., APIs, patterns, libraries).
                  - Variety: Include acronyms, protocols, functions, or modules (e.g., "jwt", "oauth", "login", "session").
                  - Brevity: Each term should be 1-3 words max.
                  - Relevance: Only terms directly related to the core concept.

                  User question: "${userQuestion}"

                  Output exactly as a comma-separated list of the 10 terms, nothing else (no explanations, no JSON, no numbering). Example: term1,term2,term3,term4,term5,term6,term7,term8,term9,term10`;

    try {
      const response = await this.groqLLM.generateText(prompt.trim()); // Adjust to your GroqLLM method (e.g., groqLLM.chat({ messages: [{ role: 'user', content: prompt }] }))
      if (!response) {
        throw new Error("No response from Groq LLM");
      }
      const terms = response
        .trim()
        .split(",")
        .map((term) => term.trim());

      return terms;
    } catch (error) {
      this.logger.error("Error generating search terms:", error);
      return undefined;
    }
  }

  /**
   * Classifies the question into different types based on keywords and patterns
   */
  private async classifyQuestionType(
    message: string,
  ): Promise<QuestionTypeClassification> {
    if (!this.groqLLM) {
      // Fallback to keyword-based if LLM init fails
      return {
        isImplementation: this.isImplementationQuestion(message),
        isArchitectural: this.isArchitecturalQuestion(message),
        isDebugging: this.isDebuggingQuestion(message),
        isCodeExplanation: this.isCodeExplanationQuestion(message),
        isFeatureRequest: this.isFeatureRequest(message),
      };
    }

    const prompt = `
        Classify the following user message into these exact categories (output as JSON only, no extra text):
        - isImplementation: True if about implementation details, like "how is X implemented" or algorithms/logic.
        - isArchitectural: True if about architectural decisions, like design patterns or system structure.
        - isDebugging: True if about debugging, errors, bugs, or troubleshooting.
        - isCodeExplanation: True if asking for code explanation, like "explain this code" or purpose/breakdown.
        - isFeatureRequest: True if requesting a new feature or enhancement.

        Message: "${message}"

        Output format:
        {
          "isImplementation": true/false,
          "isArchitectural": true/false,
          "isDebugging": true/false,
          "isCodeExplanation": true/false,
          "isFeatureRequest": true/false
        }
`;

    try {
      const response = await this.groqLLM.generateText(prompt); // Adjust to your GroqLLM method (e.g., groqLLM.chat({ messages: [{ role: 'user', content: prompt }] }))
      const classification = JSON.parse(response.trim()); // Parse the JSON output
      return {
        isImplementation: !!classification.isImplementation,
        isArchitectural: !!classification.isArchitectural,
        isDebugging: !!classification.isDebugging,
        isCodeExplanation: !!classification.isCodeExplanation,
        isFeatureRequest: !!classification.isFeatureRequest,
      };
    } catch (error) {
      this.logger.error("LLM classification failed:", error);
      // Fallback to keyword-based on error
      return {
        isImplementation: this.isImplementationQuestion(message),
        isArchitectural: this.isArchitecturalQuestion(message),
        isDebugging: this.isDebuggingQuestion(message),
        isCodeExplanation: this.isCodeExplanationQuestion(message),
        isFeatureRequest: this.isFeatureRequest(message),
      };
    }
  }

  /**
   * Determines if the question is about implementation details
   */
  private isImplementationQuestion(message: string): boolean {
    const implementationKeywords = [
      "how is",
      "how does",
      "how do",
      "implementation",
      "implement",
      "works",
      "functions",
      "handles",
      "processes",
      "algorithm",
      "logic",
      "method",
    ];
    const lowerMessage = message.toLowerCase();
    return implementationKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );
  }

  /**
   * Determines if the question is about architectural decisions
   */
  private isArchitecturalQuestion(message: string): boolean {
    const architecturalKeywords = [
      "architecture",
      "structure",
      "design",
      "pattern",
      "framework",
      "organization",
      "dependencies",
      "modules",
      "components",
      "system",
    ];
    const lowerMessage = message.toLowerCase();
    return architecturalKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );
  }

  /**
   * Determines if the question is about debugging or troubleshooting
   */
  private isDebuggingQuestion(message: string): boolean {
    const debugKeywords = [
      "debug",
      "error",
      "bug",
      "issue",
      "problem",
      "fix",
      "troubleshoot",
      "not working",
      "fails",
      "broken",
      "exception",
      "crash",
    ];
    const lowerMessage = message.toLowerCase();
    return debugKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Determines if the question is asking for code explanation
   */
  private isCodeExplanationQuestion(message: string): boolean {
    const explanationKeywords = [
      "explain",
      "what does",
      "what is",
      "meaning",
      "purpose",
      "understand",
      "clarify",
      "breakdown",
      "walkthrough",
      "overview",
    ];
    const lowerMessage = message.toLowerCase();
    return explanationKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );
  }

  /**
   * Determines if the question is a feature request or enhancement
   */
  private isFeatureRequest(message: string): boolean {
    const featureKeywords = [
      "add",
      "create",
      "build",
      "implement",
      "feature",
      "enhancement",
      "improve",
      "extend",
      "modify",
      "change",
      "want to",
      "need to",
    ];
    const lowerMessage = message.toLowerCase();
    return featureKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Categorizes the question type for display
   */
  private categorizeQuestionTypeForDisplay(
    questionType: QuestionTypeClassification,
  ): string {
    const types = [];
    if (questionType.isImplementation) types.push("Implementation");
    if (questionType.isArchitectural) types.push("Architectural");
    if (questionType.isDebugging) types.push("Debugging");
    if (questionType.isCodeExplanation) types.push("Explanation");
    if (questionType.isFeatureRequest) types.push("Feature Request");
    return types.length > 0 ? types.join(" + ") : "General Inquiry";
  }

  /**
   * Generates question-specific instructions for the LLM
   */
  private generateQuestionSpecificInstructions(
    questionType: QuestionTypeClassification,
  ): string {
    const instructions: string[] = [];

    for (const [type, details] of QUESTION_TYPE_INSTRUCTIONS.entries()) {
      if (questionType[type as keyof QuestionTypeClassification]) {
        const title = type.replace("is", ""); // e.g., "Implementation"
        instructions.push(`- ${title}:\n  - ${details.join("\n  - ")}`);
      }
    }

    if (instructions.length === 0) {
      return `- General:
  - Provide a comprehensive answer using the codebase context.
  - Use specific code examples.
  - Explain both the "what" and the "why".`;
    }

    return instructions.join("\n");
  }

  /**
   * Generates response format guidelines based on question type
   */
  private generateResponseFormatGuidelines(
    questionType: QuestionTypeClassification,
  ): string {
    // Base structure is always present.
    const formatSections = [
      "1. Summary: Brief, direct answer.",
      "2. Detailed Analysis: In-depth explanation with context.",
      "3. Code Examples: Relevant snippets from the codebase.",
      "4. File References: Paths and line numbers.",
      "5. Citations: Links to official docs if applicable.",
      "6. Next Steps: Actionable recommendations.",
    ];

    // Conditionally add section headers. They are self-explanatory.
    if (questionType.isDebugging) {
      formatSections.push(
        "7. Debugging Guide:\n   - Root Cause Analysis\n   - Step-by-Step Debugging\n   - Common Solutions",
      );
    }
    if (questionType.isFeatureRequest) {
      formatSections.push(
        "7. Feature Plan:\n   - Implementation Plan\n   - Code Structure\n   - Testing Strategy",
      );
    }
    if (questionType.isArchitectural) {
      formatSections.push(
        "7. Architecture Overview:\n   - System Design\n   - Component Interaction\n   - Design Patterns",
      );
    }

    return formatSections.join("\n");
  }
}
