import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { GroqLLM } from "../llms/groq/groq";
import { getAPIKeyAndModel } from "../utils/utils";
import { AnalyzeCodeProvider } from "../ast/commands/analyze-code-provider";
import { truncateForLLM } from "../ast/smart-truncate";

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

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.initialize("EnhancedPromptBuilderService", {
      minLevel: LogLevel.DEBUG,
    });
    const { apiKey, model } = getAPIKeyAndModel("groq");
    const config = {
      apiKey: apiKey,
      model: model ?? "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    };
    this.groqLLM = GroqLLM.getInstance(config);
    this._context = context;
    this.codeAnalyzerProvider = AnalyzeCodeProvider.getInstance(this._context);
  }

  /**
   * Creates an enhanced, sophisticated prompt with contextual awareness and specific instructions
   * This method generates rich, detailed prompts that help the LLM understand context and provide optimal responses
   */
  async createEnhancedPrompt(
    message: string,
    context: PromptContext,
  ): Promise<string> {
    const { questionAnalysis } = context;
    const searchTerm = await this.generateSearchTerms(message);
    if (searchTerm?.length) {
      context.questionAnalysis.technicalKeywords = searchTerm;
    }

    const code = await this.codeAnalyzerProvider.analyse(searchTerm ?? []);
    let truncatedCode: string | undefined;

    if (code) {
      truncatedCode = truncateForLLM(code, 100000);
    }

    // Classify the question type and intent
    const questionType = await this.classifyQuestionType(message);

    // Generate question-type specific instructions
    const specificInstructions = this.generateQuestionSpecificInstructions(
      questionType,
      questionAnalysis,
    );

    // Generate response format guidelines
    const responseFormat = this.generateResponseFormatGuidelines(questionType);

    // Create the enhanced prompt
    const enhancedPrompt = `
      **🤖 You are CodeBuddy**, an expert software engineer and architect with deep knowledge of this codebase. You have access to relevant context and should provide comprehensive, accurate, and actionable responses.

      **🔍 Context Analysis**:
      - **Question Type**: ${this.categorizeQuestionTypeForDisplay(questionType)}

      **🎯 Response Instructions**:
      ${specificInstructions}

      **📋 Response Format**:
      ${responseFormat}

      **⚡ Key Guidelines**:
      - **Be Specific**: Reference actual files, functions, and implementations from the context
      - **Be Actionable**: Provide concrete steps, code examples, and clear guidance
      - **Be Comprehensive**: Cover edge cases, best practices, and potential pitfalls
      - **Be Accurate**: Base your response on the actual codebase context provided
      - **Include Examples**: Show real code snippets when explaining concepts
      - **Provide Navigation**: Use file references so users can explore the codebase
      - **Consider Dependencies**: Account for frameworks, libraries, and patterns in use

      **🚨 Critical Requirements**:
      1. **Complete your response fully** - Do not truncate or end abruptly
      2. **Use the provided context** - Don't make assumptions outside the given information
      3. **Be honest about limitations** - If context is insufficient, explain what additional information would help
      4. **Maintain consistency** - Follow the existing patterns and conventions shown in the codebase

      ** Code From CodeBase
      ${truncatedCode}

      Please provide a detailed, helpful response based on the context and guidelines above.`.trim();

    this.logger.debug(
      `Enhanced prompt created for ${questionType.isImplementation ? "implementation" : "general"} question`,
    );
    return enhancedPrompt;
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
      const response = await this.groqLLM.generateText(prompt); // Adjust to your GroqLLM method (e.g., groqLLM.chat({ messages: [{ role: 'user', content: prompt }] }))
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
    questionAnalysis: QuestionAnalysis,
  ): string {
    let instructions = [];

    if (questionType.isImplementation) {
      instructions.push(`
**For Implementation Questions**:
- Explain the current implementation approach and patterns
- Show actual code examples from the context
- Describe the data flow and control flow
- Identify key functions, classes, and modules involved
- Explain any frameworks or libraries being used
- Sequence diagram
  #### ⏱️ **Sequence Diagram**
  \`\`\`mermaid
  sequenceDiagram
      participant Client
      participant API
      participant Service
      participant Database
      
      Client->>API: POST /users
      API->>API: Validate Input
      API->>Service: createUser(data)
      Service->>Database: save(user)
      Database-->>Service: user created
      Service->>Service: sendWelcomeEmail()
      Service-->>API: success response
      API-->>Client: 201 Created
  \`\`\`
  - Highlight important design decisions and their rationale`);
    }

    if (questionType.isArchitectural) {
      instructions.push(`
**For Architectural Questions**:
- Describe the overall system design and structure
- Explain component relationships and dependencies
- Identify key architectural patterns in use
- Discuss scalability and maintainability considerations
- Reference configuration files and setup procedures
- Explain how different parts of the system communicate`);
    }

    if (questionType.isDebugging) {
      instructions.push(`
**For Debugging Questions**:
- Identify potential root causes based on the context
- Suggest specific debugging approaches and tools
- Recommend places to add logging or breakpoints
- Explain common pitfalls and error patterns
- Provide step-by-step troubleshooting guidance
- Reference error handling patterns in the codebase`);
    }

    if (questionType.isCodeExplanation) {
      instructions.push(`
**For Code Explanation Questions**:
- Break down complex code into understandable parts
- Explain the purpose and functionality clearly
- Use analogies when helpful for understanding
- Show the bigger picture and context
- Explain any non-obvious logic or algorithms
- Connect the explanation to broader system concepts`);
    }

    if (questionType.isFeatureRequest) {
      instructions.push(`
**For Feature Requests**:
- Analyze existing patterns to suggest consistent approaches
- Identify reusable components and utilities
- Suggest specific file locations and modifications
- Consider impact on existing functionality
- Recommend testing approaches
- Provide implementation roadmap with steps`);
    }

    if (instructions.length === 0) {
      instructions.push(`
**For General Questions**:
- Provide comprehensive information based on the available context
- Use specific examples from the codebase when possible
- Explain both the 'what' and the 'why' of implementations
- Connect different parts of the system when relevant`);
    }

    return instructions.join("\n");
  }

  /**
   * Generates response format guidelines based on question type
   */
  private generateResponseFormatGuidelines(
    questionType: QuestionTypeClassification,
  ): string {
    let format = `
**Standard Format**:
1. **Quick Summary** - Brief answer to the main question
2. **Detailed Analysis** - In-depth explanation with context
3. **Code Examples** - Relevant snippets from the actual codebase
4. **File References** - Specific paths and locations
6. **Citations (if applicable)**: Where possible, link to official documentations, specs, or trusted resources like Github, Mozilla etc
5. **Next Steps** - Actionable recommendations
`;

    if (questionType.isDebugging) {
      format += `

**Additional for Debugging**:
- **Root Cause Analysis** - Most likely causes
- **Debugging Steps** - Specific actions to take
- **Common Solutions** - Known fixes for similar issues`;
    }

    if (questionType.isFeatureRequest) {
      format += `

**Additional for Features**:
- **Implementation Plan** - Step-by-step approach
- **Code Structure** - Where to add new functionality
- **Testing Strategy** - How to validate the feature`;
    }

    if (questionType.isArchitectural) {
      format += `

**Additional for Architecture**:
- **System Overview** - High-level design explanation
- **Component Relationships** - How parts interact
- **Design Patterns** - Architectural patterns in use`;
    }

    return format;
  }

  /**
   * Formats context with metadata and structure for better LLM understanding
   */
  private formatContextWithMetadata(context: string): string {
    if (!context || context.trim().length === 0) {
      return "*No specific context available*";
    }

    // Add structure indicators to help the LLM parse the context better
    const formattedContext = context
      // Ensure code blocks are properly marked
      .replace(
        /```(\w+)?\n/g,
        "```$1\n// Context: Code snippet from codebase\n",
      )
      // Add metadata markers for file references
      .replace(/File: ([^\n]+)/g, "**📁 File**: `$1`")
      // Enhance function/class markers
      .replace(/Function: ([^\n]+)/g, "**🔧 Function**: `$1`")
      .replace(/Class: ([^\n]+)/g, "**🏗️ Class**: `$1`")
      // Mark interface/type definitions
      .replace(/Interface: ([^\n]+)/g, "**📋 Interface**: `$1`")
      .replace(/Type: ([^\n]+)/g, "**📝 Type**: `$1`");

    return formattedContext;
  }

  /**
   * Creates a simple prompt for basic questions without complex context
   */
  createSimplePrompt(message: string): string {
    return `
**🤖 You are CodeBuddy**, a helpful AI assistant for software development.

**User's Question**:
${message}

Please provide a clear, helpful response to the user's question.`.trim();
  }

  /**
   * Validates that the provided context is meaningful and not empty
   */
  validateContext(context: PromptContext): boolean {
    const hasValidVectorContext = !!(
      context.vectorContext && context.vectorContext.trim().length > 0
    );
    const hasValidFallbackContext = !!(
      context.fallbackContext && context.fallbackContext.trim().length > 0
    );
    const hasValidAnalysis = !!(
      context.questionAnalysis && context.questionAnalysis.confidence > 0
    );

    return (
      (hasValidVectorContext || hasValidFallbackContext) && hasValidAnalysis
    );
  }

  /**
   * Get statistics about prompt complexity
   */
  getPromptStats(prompt: string): {
    characterCount: number;
    wordCount: number;
    estimatedTokens: number;
    hasCodeBlocks: boolean;
    hasFileReferences: boolean;
  } {
    const characterCount = prompt.length;
    const wordCount = prompt.split(/\s+/).length;
    const estimatedTokens = Math.ceil(characterCount / 4); // Rough estimate
    const hasCodeBlocks = /```/.test(prompt);
    const hasFileReferences = /\*\*📁 File\*\*/.test(prompt);

    return {
      characterCount,
      wordCount,
      estimatedTokens,
      hasCodeBlocks,
      hasFileReferences,
    };
  }
}
