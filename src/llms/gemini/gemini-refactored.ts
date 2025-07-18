import {
  EmbedContentResponse,
  FunctionCall,
  FunctionCallingMode,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import * as vscode from "vscode";
import { COMMON } from "../../application/constant";
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { createPrompt } from "../../utils/prompt";
import { BaseLLM } from "../base";
import { ILlmConfig } from "../interface";
import { Logger } from "../../infrastructure/logger/logger";
import { LogLevel } from "../../services/telemetry";
import {
  IMemoryManager,
  IOrchestrator,
  IFallbackLLM,
  IGeminiSnapshot,
  IToolExecutionResult,
  IGeminiLLMConfig,
  IQueryProcessingResult,
} from "./interfaces";
import { CircuitBreaker } from "./circuit-breaker";
import { GeminiChatHistoryManager } from "./chat-history-manager";

// Type alias for return types
type GeminiRunResult = string | GenerateContentResult | undefined;

/**
 * Production-ready GeminiLLM class with improved architecture and error handling
 */
export class GeminiLLM extends BaseLLM<IGeminiSnapshot> implements vscode.Disposable {
  private readonly generativeAi: GoogleGenerativeAI;
  private response: EmbedContentResponse | GenerateContentResult | undefined;
  private readonly disposables: vscode.Disposable[] = [];
  private model: GenerativeModel | undefined;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly chatHistoryManager: GeminiChatHistoryManager;
  private readonly responseCache = new Map<string, { result: any; timestamp: number }>();

  // Progress tracking
  private lastFunctionCalls: Set<string> = new Set();
  private planSteps: string[] = [];
  private currentStepIndex = 0;
  private initialThought = "";
  private userQuery = "";
  private readonly lastQueryHash = "";
  private consecutiveThinkCalls = 0; // Track consecutive think tool calls

  constructor(
    config: ILlmConfig,
    private readonly memory: IMemoryManager,
    private readonly orchestrator: IOrchestrator,
    private readonly fallbackLLM: IFallbackLLM,
    private readonly geminiConfig: IGeminiLLMConfig = {
      maxRetries: 3,
      timeoutMs: 30000,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 120000,
      },
      cacheTTL: 300000, // 5 minutes
      enableCaching: true,
    }
  ) {
    super(config);
    this.generativeAi = new GoogleGenerativeAI(this.config.apiKey);
    this.circuitBreaker = new CircuitBreaker(
      geminiConfig.circuitBreaker.failureThreshold,
      geminiConfig.circuitBreaker.resetTimeout,
      geminiConfig.circuitBreaker.monitoringPeriod
    );
    this.chatHistoryManager = new GeminiChatHistoryManager(this.memory);
    this.initializeDisposables();
    this.logger = Logger.initialize("GeminiLLM", { minLevel: LogLevel.DEBUG });

    // Initialize tools with model
    CodeBuddyToolProvider.initialize(this.model);

    // Setup cache cleanup
    this.setupCacheCleanup();
  }

  /**
   * Factory method for creating GeminiLLM instances with dependency injection
   */
  static create(
    config: ILlmConfig,
    memory: IMemoryManager,
    orchestrator: IOrchestrator,
    fallbackLLM: IFallbackLLM,
    geminiConfig?: IGeminiLLMConfig
  ): GeminiLLM {
    return new GeminiLLM(config, memory, orchestrator, fallbackLLM, geminiConfig);
  }

  /**
   * Generates embeddings for given text
   */
  public async generateEmbeddings(text: string): Promise<number[]> {
    try {
      return await this.circuitBreaker.execute(async () => {
        const model = this.getModel();
        const result = await model.embedContent(text);
        this.response = result;
        return result.embedding.values;
      });
    } catch (error) {
      this.logger.error("Failed to generate embeddings", { error, text });
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  /**
   * Generates text response
   */
  public async generateText(prompt: string, instruction?: string): Promise<string> {
    try {
      return await this.circuitBreaker.execute(async () => {
        const model = this.getModel();
        const result = await model.generateContent(prompt);
        this.response = result;
        return result.response.text();
      });
    } catch (error) {
      this.logger.error("Failed to generate text", { error, prompt });
      throw new Error(`Text generation failed: ${error}`);
    }
  }

  /**
   * Gets or creates a generative model with configuration
   */
  public getModel(modelParams?: Partial<ILlmConfig>): GenerativeModel {
    try {
      this.model ??= this.generativeAi.getGenerativeModel({
        model: this.config.model,
        systemInstruction: modelParams?.systemInstruction ?? this.config.systemInstruction,
        generationConfig: {
          stopSequences: ["Thank you", "Done", "End", "stuck in a loop", "loop"],
        },
      });
      return this.model;
    } catch (error) {
      this.logger.error("Failed to retrieve model", {
        error,
        modelName: this.config.model,
      });
      throw new Error(`Failed to retrieve model: ${this.config.model}`);
    }
  }

  /**
   * Gets available tools
   */
  private getTools(): { functionDeclarations: any[] } {
    const tools = CodeBuddyToolProvider.getTools();
    console.log("GeminiLLM getTools called:", {
      toolCount: tools.length,
      toolNames: tools.map((tool) => tool.config().name),
    });
    this.logger.debug("Available tools", {
      toolCount: tools.length,
      toolNames: tools.map((tool) => tool.config().name),
    });
    return { functionDeclarations: tools.map((tool) => tool.config()) };
  }

  /**
   * Generates content with tools
   */
  private async generateContentWithTools(userInput: string): Promise<GenerateContentResult> {
    try {
      const chatHistory = await this.chatHistoryManager.buildChatHistory(userInput, COMMON.GEMINI_CHAT_HISTORY, true);

      const prompt = createPrompt(userInput);
      const tools = this.getTools();

      console.log("Creating model with tools:", {
        toolsCount: tools.functionDeclarations.length,
        toolsStructure: tools,
      });

      // Create a fresh model with tools for this request
      const modelWithTools = this.generativeAi.getGenerativeModel({
        model: this.config.model,
        systemInstruction: prompt,
        tools: [tools], // Wrap functionDeclarations in an array
        generationConfig: {
          stopSequences: ["Thank you", "Done", "End", "stuck in a loop", "loop"],
        },
      });

      console.log("About to generate content with model");
      const result = await modelWithTools.generateContent({
        contents: chatHistory,
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingMode.AUTO },
        },
      });
      console.log("Generated content result:", result);

      return result;
    } catch (error: any) {
      this.logger.error("Error generating content with tools", {
        error,
        userInput,
      });
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  /**
   * Calculates dynamic call limit based on query complexity
   */
  private calculateDynamicCallLimit(userQuery: string): number {
    const baseLimit = 5;
    const queryLength = userQuery.length;
    const complexityFactor = Math.min(1 + Math.floor(queryLength / 100), 3);
    const limit = baseLimit * complexityFactor;

    this.logger.debug("Calculated dynamic call limit", {
      queryLength,
      complexityFactor,
      limit,
    });

    return limit;
  }

  /**
   * Main entry point for processing user queries
   */
  public async run(userQuery: string): Promise<GeminiRunResult> {
    try {
      this.userQuery = userQuery;

      // Check cache first
      if (this.geminiConfig.enableCaching) {
        const cached = this.getCachedResponse(userQuery);
        if (cached) {
          this.logger.debug("Returning cached response", { query: userQuery });
          return cached;
        }
      }

      const result = await this.processUserQuery(userQuery);

      // Cache successful results
      if (result && this.geminiConfig.enableCaching) {
        this.cacheResponse(userQuery, result);
      }

      return result;
    } catch (error) {
      this.logger.error("Error occurred while running the agent", {
        error,
        userQuery,
      });

      // Attempt fallback
      try {
        const fallbackResult = await this.executeWithFallback(userQuery);
        this.orchestrator.publish("onResponse" as any, fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        this.logger.error("Fallback also failed", { fallbackError });
        throw new Error(`Both primary and fallback LLMs failed: ${error}`);
      }
    }
  }

  /**
   * Processes user query with improved loop detection and error handling
   */
  private async processUserQuery(userInput: string): Promise<GeminiRunResult> {
    let finalResult: string | GenerateContentResult | undefined;
    let userQuery = userInput;
    let callCount = 0;
    const previousQueries = new Set<string>();

    try {
      // Load existing snapshot if available
      this.loadExistingSnapshot();

      const dynamicLimit = this.calculateDynamicCallLimit(userQuery);

      while (callCount < dynamicLimit) {
        // Break if we've seen this exact query before (infinite loop prevention)
        const queryHash = this.hashQuery(userQuery);
        if (previousQueries.has(queryHash)) {
          this.logger.warn("Breaking loop due to repeated query", {
            userQuery,
            callCount,
          });
          break;
        }
        previousQueries.add(queryHash);

        try {
          const result = await this.executeWithTimeout(
            () => this.generateContentWithTools(userQuery),
            this.geminiConfig.timeoutMs
          );

          this.response = result;

          if (result?.response) {
            const { text, functionCalls } = result.response;
            const toolCalls = functionCalls?.() || [];

            this.logger.debug("Tool execution results", {
              hasToolCalls: toolCalls.length > 0,
              toolCallCount: toolCalls.length,
              toolNames: toolCalls.map((call) => call.name),
            });

            // No function calls - check if model is talking about using tools
            if (toolCalls.length === 0) {
              const textResponse = text();

              this.logger.debug("Model returned text response without function calls", {
                response: textResponse,
                userQuery: this.userQuery,
                callCount,
              });

              // Check if the response mentions using tools without actually calling them
              if (this.shouldForceToolCall(textResponse)) {
                this.logger.warn("Model mentioned tools without calling them, forcing tool usage", {
                  response: textResponse,
                  userQuery: this.userQuery,
                  callCount,
                });

                // Force direct tool execution instead of relying on the model
                const forcedResult = await this.executeForcedTool(this.userQuery, textResponse);
                if (forcedResult) {
                  // For now, executeForcedTool primarily returns web_search results
                  // but we'll format it generically to handle future tools
                  const toolResultContent =
                    typeof forcedResult === "string" && forcedResult.includes("<")
                      ? forcedResult // Assume it's HTML formatted
                      : JSON.stringify(forcedResult);

                  const nextQuery = `Tool result: ${toolResultContent}

Based on the above web search results, use the think tool to analyze and synthesize this information before providing your final response.`;
                  // Instead of continuing, we'll let this be the final result of this turn
                  finalResult = nextQuery;
                  this.orchestrator.publish("onResponse" as any, finalResult);
                  break;
                }

                // If forced execution fails, break and respond
                finalResult = "I tried to execute a tool but failed. Please try rephrasing your request.";
                this.orchestrator.publish("onResponse" as any, finalResult);
                break;
              }

              finalResult = textResponse;
              this.orchestrator.publish("onResponse" as any, finalResult);
              break;
            }

            // Check for repeated function call patterns
            const currentCallSignature = this.createCallSignature(toolCalls);
            if (this.lastFunctionCalls.has(currentCallSignature)) {
              this.logger.warn("Detected repeated function calls, using fallback", { signature: currentCallSignature });
              finalResult = await this.executeWithFallback(this.userQuery);
              break;
            }

            this.lastFunctionCalls.add(currentCallSignature);
            this.pruneCallHistory();

            // Process tool calls
            const toolResult = await this.processToolCalls(toolCalls, userQuery);
            if (toolResult.shouldBreak) {
              finalResult = toolResult.result;
              break;
            }

            userQuery = toolResult.result as string;
            finalResult = userQuery;

            this.saveSnapshot(userQuery, toolCalls[0]?.name, toolResult);
            callCount++;
          } else {
            throw new Error("Invalid response structure from model");
          }
        } catch (error) {
          this.logger.error("Error in query processing iteration", {
            error,
            callCount,
            userQuery,
          });

          if (callCount === 0) {
            // First attempt failed, try fallback
            finalResult = await this.executeWithFallback(userInput);
            break;
          } else {
            // Subsequent attempt failed, return last known good result
            this.logger.warn("Using last known result due to error", { error });
            break;
          }
        }
      }

      if (!finalResult) {
        throw new Error("No final result generated after function calls");
      }

      // Cleanup
      this.cleanupAfterQuery();

      return finalResult;
    } catch (error) {
      this.logger.error("Error processing user query", { error, userInput });
      throw error;
    }
  }

  /**
   * Processes tool calls with enhanced error handling
   */
  private async processToolCalls(toolCalls: FunctionCall[], userInput: string): Promise<IQueryProcessingResult> {
    for (const functionCall of toolCalls) {
      try {
        if (functionCall.name === "think") {
          return await this.handleThinkTool(functionCall);
        } else {
          return await this.handleStandardTool(functionCall);
        }
      } catch (error: any) {
        return this.handleToolError(error, functionCall);
      }
    }
    return { result: userInput, shouldBreak: false };
  }

  /**
   * Handles the 'think' tool call, including loop prevention and direct execution.
   */
  private async handleThinkTool(functionCall: FunctionCall): Promise<IQueryProcessingResult> {
    this.consecutiveThinkCalls++;
    if (this.consecutiveThinkCalls > 1) {
      this.logger.warn("Loop detected: consecutive think calls. Forcing web_search.");
      this.consecutiveThinkCalls = 0; // Reset counter
      return this.forceWebSearch();
    }

    const functionResult = await this.handleSingleFunctionCall(functionCall);
    const thought = functionResult?.content;
    this.initialThought = this.initialThought || thought;

    if (thought) {
      this.orchestrator.publish("onStrategizing" as any, thought);
      this.planSteps = this.parseThought(thought);
      this.logger.debug("Parsed thought into steps", {
        thought,
        planSteps: this.planSteps,
      });

      const includesWebSearch = this.planSteps.some((step) => step.toLowerCase().includes("web_search"));
      this.logger.debug("Checking if plan includes web_search", {
        includesWebSearch,
      });

      if (includesWebSearch) {
        this.logger.info("Plan includes web_search, executing it directly and returning result.");
        return this.forceWebSearchAndRespond();
      }

      const nextQuery =
        this.planSteps.length > 0
          ? `You have completed your analysis. Based on your thinking: ${this.planSteps.join(
              ". "
            )}\nNow execute the appropriate tool or provide your final response.`
          : `You have completed your thinking. Now execute the appropriate tool or provide your final response.`;
      return { result: nextQuery, shouldBreak: false };
    }

    // For HTML formatted tools, publish directly and break the loop
    if (this.isHtmlFormattedTool(functionCall.name)) {
      const toolResultContent = this.formatToolResult(functionCall.name, functionResult.content);
      this.orchestrator.publish("onResponse" as any, toolResultContent);
      return { result: toolResultContent, shouldBreak: true };
    }

    return {
      result: `Tool result: ${this.formatToolResult(functionCall.name, functionResult.content)}`,
      shouldBreak: false,
    };
  }

  /**
   * Forces the execution of the web_search tool and returns a comprehensive, production-ready response.
   */
  private async forceWebSearchAndRespond(): Promise<IQueryProcessingResult> {
    const searchResult = await this.executeForcedTool(this.userQuery, "web_search");
    if (searchResult) {
      // Generate a comprehensive, senior engineer-level response
      const comprehensiveResponse = await this.generateComprehensiveWebSearchResponse(searchResult);
      // Don't publish here - let the caller handle publishing to avoid duplicates
      return { result: comprehensiveResponse, shouldBreak: true };
    } else {
      const errorMessage =
        "I apologize, but I was unable to retrieve the requested information from the web. Please try rephrasing your query or check your internet connection.";
      // Don't publish here - let the caller handle publishing to avoid duplicates
      return { result: errorMessage, shouldBreak: true };
    }
  }

  /**
   * Generates a comprehensive, production-ready response from web search results.
   * Written from the perspective of a senior software engineer.
   */
  private async generateComprehensiveWebSearchResponse(searchResult: any): Promise<string> {
    const prompt = `You are a senior software engineer with deep expertise across multiple technologies and frameworks. Based on the following web search results, provide a comprehensive, production-ready response that would be suitable for a professional development environment.

## Response Guidelines

### 🎯 **Professional Standards**
- Write as if you're mentoring a fellow developer
- Focus on practical, production-ready solutions
- Include best practices and industry standards
- Provide actionable insights and recommendations

### 📊 **Technical Depth**
- Explain core concepts and underlying principles
- Include architecture considerations and design patterns
- Discuss scalability, performance, and maintainability
- Address common pitfalls and how to avoid them

### 💼 **Enterprise Perspective**
- Consider real-world implementation challenges
- Include testing strategies and deployment considerations
- Discuss team collaboration and code maintainability
- Address security and performance implications

### 🔧 **Code Quality & Formatting**
- Provide production-ready code examples in proper markdown code blocks
- Use \`\`\`typescript, \`\`\`javascript, \`\`\`bash as appropriate
- Include error handling and edge cases
- Use modern syntax and best practices
- Ensure code is maintainable and testable
- Always wrap code in proper markdown formatting

### 📋 **Structure Requirements**
- Use clear headings (##, ###) and organized sections
- Include practical examples and use cases
- Provide step-by-step implementation guidance
- End with key takeaways and next steps
- Format all code blocks with proper syntax highlighting

### 🎨 **Markdown Formatting Rules**
- Use ## for main sections
- Use ### for subsections
- Use \`inline code\` for small code snippets
- Use \`\`\`language blocks for multi-line code
- Use bullet points for lists
- Use numbered lists for step-by-step instructions

## Search Results to Analyze:

${typeof searchResult === "string" ? searchResult : JSON.stringify(searchResult, null, 2)}

## Instructions:
Transform the above search results into a comprehensive, senior-level technical response. Focus on practical implementation, best practices, and production considerations. Make it informative enough that a developer could implement the solution confidently in a production environment.

IMPORTANT: Format ALL code examples in proper markdown code blocks with appropriate language syntax highlighting. Never return raw code without proper formatting.`;

    try {
      if (!this.model) {
        throw new Error("Model not initialized");
      }
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Return the response as-is, let the webview provider handle formatting
      return this.formatToolResult("web_search_comprehensive", response);
    } catch (error) {
      this.logger.error("Error generating comprehensive web search response", {
        error,
      });
      // Fallback to a simpler formatted response
      return this.formatSearchResultFallback(searchResult);
    }
  }

  /**
   * Fallback method to format search results when AI generation fails.
   */
  private formatSearchResultFallback(searchResult: any): string {
    const content = typeof searchResult === "string" ? searchResult : JSON.stringify(searchResult, null, 2);

    // Create a simple markdown structure
    const markdownContent = `## Search Results

Based on the available information:

\`\`\`
${content}
\`\`\`

## Key Points
- The search has returned relevant information for your query
- Consider reviewing the results for implementation details
- For production use, ensure proper testing and validation

## Next Steps
1. Review the information provided above
2. Validate the approach for your specific use case
3. Implement with proper error handling and testing
4. Consider scalability and performance implications`;

    // Return the markdown content as-is, let the webview provider handle formatting
    return markdownContent;
  } /**
   * Forces the execution of the web_search tool and continues the conversation.
   */
  private async forceWebSearch(): Promise<IQueryProcessingResult> {
    const searchResult = await this.executeForcedTool(this.userQuery, "web_search");
    if (searchResult) {
      // Generate a comprehensive response and continue the conversation
      const comprehensiveResponse = await this.generateComprehensiveWebSearchResponse(searchResult);
      const nextQuery = `Tool result: ${comprehensiveResponse}\n\nBased on these comprehensive results, please provide any additional insights or clarifications if needed.`;
      return { result: nextQuery, shouldBreak: false };
    } else {
      const errorMessage =
        "I apologize, but I was unable to retrieve the requested information from the web. Please try rephrasing your query.";
      // Don't publish here - let the caller handle publishing to avoid duplicates
      return { result: errorMessage, shouldBreak: true };
    }
  }

  /**
   * Checks if a tool returns formatted content that should not be JSON.stringify'd
   */
  private isHtmlFormattedTool(toolName: string): boolean {
    const formattedTools = ["summarize_content", "web_search_comprehensive"]; // Keep web_search_comprehensive to avoid JSON.stringify
    return formattedTools.includes(toolName);
  } /**
   * Formats tool result content appropriately based on tool type
   */
  private formatToolResult(toolName: string, content: any): string {
    return this.isHtmlFormattedTool(toolName) ? content : JSON.stringify(content);
  }

  /**
   * Handles standard tool calls (non-think).
   */
  private async handleStandardTool(functionCall: FunctionCall): Promise<IQueryProcessingResult> {
    this.consecutiveThinkCalls = 0; // Reset think counter
    const functionResult = await this.handleSingleFunctionCall(functionCall);

    const toolResultContent = this.formatToolResult(functionCall.name, functionResult.content);

    // For HTML formatted tools, publish directly and break the loop
    if (this.isHtmlFormattedTool(functionCall.name)) {
      this.orchestrator.publish("onResponse" as any, toolResultContent);
      return { result: toolResultContent, shouldBreak: true };
    }

    const nextQuery = `Tool result: ${toolResultContent}

Based on the above results, use the think tool to analyze and synthesize this information before providing your final response.`;

    await this.chatHistoryManager.buildChatHistory(nextQuery, COMMON.GEMINI_CHAT_HISTORY, false);
    this.chatHistoryManager.addModelResponse(COMMON.GEMINI_CHAT_HISTORY, functionCall.name, functionResult);

    return { result: nextQuery, shouldBreak: false };
  }

  /**
   * Handles errors that occur during tool execution.
   */
  private async handleToolError(error: any, functionCall: FunctionCall): Promise<IQueryProcessingResult> {
    this.logger.error("Error processing function call", {
      error,
      functionName: functionCall.name,
      args: functionCall.args,
    });

    if (this.circuitBreaker.getState() === "OPEN") {
      this.logger.warn("Circuit breaker is open, using fallback");
      const fallbackResult = await this.executeWithFallback(this.userQuery);
      return { result: fallbackResult, shouldBreak: true };
    }

    const retry = await vscode.window.showErrorMessage(
      `Function call failed: ${error.message}. Retry or use fallback?`,
      "Retry",
      "Use Fallback"
    );

    if (retry === "Use Fallback") {
      const fallbackResult = await this.executeWithFallback(this.userQuery);
      return { result: fallbackResult, shouldBreak: true };
    } else if (retry === "Retry") {
      // The loop in processToolCalls will retry the call.
      return { result: this.userQuery, shouldBreak: false };
    } else {
      return {
        result: `Function call error: ${error.message}. Operation cancelled.`,
        shouldBreak: true,
      };
    }
  }

  /**
   * Handles a single function call with retry logic
   */
  private async handleSingleFunctionCall(
    functionCall: FunctionCall,
    attempt: number = 0
  ): Promise<IToolExecutionResult> {
    const args = functionCall.args as Record<string, any>;
    const name = functionCall.name;
    const startTime = Date.now();

    try {
      const tools = CodeBuddyToolProvider.getTools();
      const tool = tools.find((tool) => tool.config().name === name);

      if (!tool) {
        throw new Error(`No tool found for function: ${name}`);
      }

      this.logger.debug("Executing function call", {
        name,
        args,
        toolFound: !!tool,
      });

      // For web_search tool, extract the query parameter
      let executionInput: any;
      if (name === "web_search" && args.query) {
        executionInput = args.query;
      } else if (name === "analyze_files_for_question" && args.files) {
        executionInput = args.files;
      } else if (name === "think" && args.thought) {
        executionInput = [args.thought]; // ThinkTool expects an array
      } else {
        // Fallback to the original logic for other tools
        executionInput = Object.values(args);
      }

      const executionResult = await tool.execute(executionInput);

      return {
        name,
        content: executionResult,
        success: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      if (attempt < this.geminiConfig.maxRetries) {
        this.logger.warn(`Retry attempt ${attempt + 1} for function ${name}`, {
          error: error.message,
          args,
        });

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.handleSingleFunctionCall(functionCall, attempt + 1);
      }

      throw new Error(`Function ${name} failed after ${this.geminiConfig.maxRetries} attempts: ${error.message}`);
    }
  }

  /**
   * Creates a snapshot of current state
   */
  public createSnapShot(data?: any): IGeminiSnapshot {
    return {
      lastQuery: data?.lastQuery,
      lastCall: data?.lastCall,
      lastResult: data?.lastResult,
      chatHistory: this.memory.get(COMMON.GEMINI_CHAT_HISTORY),
      planSteps: data?.planSteps || this.planSteps,
      currentStepIndex: data?.currentStepIndex || this.currentStepIndex,
      response: (this.response as GenerateContentResult)?.response,
      embedding: (this.response as EmbedContentResponse)?.embedding,
      timestamp: Date.now(),
      version: "1.0.0",
    };
  }

  /**
   * Loads a snapshot with validation
   */
  public loadSnapShot(snapshot: IGeminiSnapshot): void {
    if (!this.isValidSnapshot(snapshot)) {
      this.logger.warn("Invalid snapshot provided, skipping load");
      return;
    }

    if (snapshot.planSteps) {
      this.planSteps = snapshot.planSteps;
    }

    if (typeof snapshot.currentStepIndex === "number") {
      this.currentStepIndex = snapshot.currentStepIndex;
    }

    if (snapshot.chatHistory) {
      this.memory.set(COMMON.GEMINI_CHAT_HISTORY, snapshot.chatHistory);
    }

    if (snapshot.lastQuery) {
      this.lastFunctionCalls.clear();
    }

    this.logger.debug("Snapshot loaded successfully", {
      timestamp: snapshot.timestamp,
      version: snapshot.version,
    });
  }

  /**
   * Validates snapshot data
   */
  private isValidSnapshot(snapshot: IGeminiSnapshot): boolean {
    return (
      snapshot &&
      typeof snapshot === "object" &&
      typeof snapshot.timestamp === "number" &&
      typeof snapshot.version === "string" &&
      // Snapshot should not be too old (24 hours)
      Date.now() - snapshot.timestamp < 24 * 60 * 60 * 1000
    );
  }

  /**
   * Executes operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timeout")), timeoutMs)
    );

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Executes fallback LLM
   */
  private async executeWithFallback(userInput: string): Promise<string> {
    try {
      this.logger.info("Executing fallback LLM", { userInput });
      const result = await this.fallbackLLM.generateText(
        `User Input: ${this.userQuery}\nPlans: ${userInput}\nWrite production ready code to demonstrate your solution`
      );

      this.orchestrator.publish("onResponse" as any, result);
      return result;
    } catch (error) {
      this.logger.error("Fallback LLM failed", { error });
      throw new Error(`Fallback execution failed: ${error}`);
    }
  }

  /**
   * Utility methods
   */
  private hashQuery(query: string): string {
    return btoa(query).slice(0, 16);
  }

  private createCallSignature(toolCalls: FunctionCall[]): string {
    return toolCalls.map((call: FunctionCall) => `${call.name}:${JSON.stringify(call.args)}`).join(";");
  }

  private pruneCallHistory(): void {
    if (this.lastFunctionCalls.size > 10) {
      const callsArray = Array.from(this.lastFunctionCalls);
      this.lastFunctionCalls = new Set(callsArray.slice(-10));
    }
  }

  private getCachedResponse(query: string): any {
    const cached = this.responseCache.get(query);
    if (cached && Date.now() - cached.timestamp < this.geminiConfig.cacheTTL) {
      return cached.result;
    }
    return null;
  }

  private cacheResponse(query: string, result: any): void {
    this.responseCache.set(query, { result, timestamp: Date.now() });
  }

  private setupCacheCleanup(): void {
    // Cleanup cache every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.responseCache.entries()) {
        if (now - value.timestamp > this.geminiConfig.cacheTTL) {
          this.responseCache.delete(key);
        }
      }
    }, 600000);
  }

  private loadExistingSnapshot(): void {
    const snapShot = this.memory.get<IGeminiSnapshot>(COMMON.GEMINI_SNAPSHOT);
    if (snapShot) {
      this.loadSnapShot(snapShot);
    }
  }

  private saveSnapshot(lastQuery: string, lastCall: string, lastResult: any): void {
    const snapShot = this.createSnapShot({
      lastQuery,
      lastCall,
      lastResult,
      currentStepIndex: this.currentStepIndex,
      planSteps: this.planSteps,
    });
    this.memory.set(COMMON.GEMINI_SNAPSHOT, snapShot);
  }

  private cleanupAfterQuery(): void {
    const snapshot = this.memory.get(COMMON.GEMINI_SNAPSHOT);
    if (snapshot) {
      this.memory.delete(COMMON.GEMINI_SNAPSHOT);
    }
    // Reset consecutive think counter
    this.consecutiveThinkCalls = 0;
  }

  /**
   * Parses thought content to extract plan steps
   */
  protected parseThought(thought: string): string[] {
    if (!thought) return [];

    const steps = [];
    const lines = thought.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      // Match numbered steps, bullet points, or lines starting with "I should" or "I will"
      if (/^\d+\.\s|^Step\s+\d+:|^-\s|^\*\s|^(I should|I will)/i.test(trimmed)) {
        steps.push(trimmed);
      }
    }

    // If no specific steps are found, treat the whole thought as a single step
    if (steps.length === 0) {
      return [thought];
    }

    return steps;
  }

  /**
   * Checks if the model response mentions using tools without actually calling them
   */
  private shouldForceToolCall(response: string): boolean {
    if (!response) return false;

    const toolMentions = [
      "execute the web_search tool",
      "use the web_search tool",
      "call the web_search tool",
      "search tool",
      "Now execute",
      "should use web_search",
      "use web_search",
      "web_search tool",
    ];

    const found = toolMentions.some((mention) => response.toLowerCase().includes(mention.toLowerCase()));

    this.logger.debug("Checking if should force tool call", {
      response: response.substring(0, 200),
      found,
      matchedMentions: toolMentions.filter((mention) => response.toLowerCase().includes(mention.toLowerCase())),
    });

    return found;
  }

  /**
   * Generates a forced tool query based on the user's original query
   */
  private generateForcedToolQuery(originalQuery: string, modelResponse: string): string {
    const lowerQuery = originalQuery.toLowerCase();
    const lowerResponse = modelResponse.toLowerCase();

    // Determine which tool to force based on context
    if (lowerResponse.includes("web_search") || lowerResponse.includes("search the web")) {
      if (lowerQuery.includes("news")) {
        return `You must call the web_search tool now. Use the function call syntax to search for latest world news. Do not explain or describe - just call the web_search tool with query "latest world news 2025".`;
      } else {
        return `You must call the web_search tool now. Use the function call syntax with an appropriate query based on: "${originalQuery}". Do not explain or describe - just call the web_search tool.`;
      }
    } else if (lowerResponse.includes("analyze_files") || lowerResponse.includes("file analysis")) {
      return `You must call the analyze_files_for_question tool now. Use the function call syntax with the appropriate file configuration. Do not explain or describe - just call the tool.`;
    } else {
      // Default to web search for general queries
      return `You must call the web_search tool now. Use the function call syntax with query related to: "${originalQuery}". Do not explain or describe - just call the web_search tool.`;
    }
  }

  /**
   * Executes tools directly when the model fails to call them
   */
  private async executeForcedTool(originalQuery: string, modelResponse: string): Promise<any> {
    const lowerQuery = originalQuery.toLowerCase();
    const lowerResponse = modelResponse.toLowerCase();

    try {
      // Determine which tool to execute based on context
      if (lowerResponse.includes("web_search") || lowerResponse.includes("search the web")) {
        const tools = CodeBuddyToolProvider.getTools();
        const webTool = tools.find((tool) => tool.config().name === "web_search");

        if (webTool) {
          let query = originalQuery;
          if (lowerQuery.includes("news")) {
            query = "latest world news 2025";
          }

          this.logger.debug("Executing forced web search", { query });
          const result = await webTool.execute(query);
          return result;
        }
      }

      return null;
    } catch (error) {
      this.logger.error("Error executing forced tool", {
        error,
        originalQuery,
      });
      return null;
    }
  }

  private initializeDisposables(): void {
    this.disposables.push(vscode.workspace.onDidChangeConfiguration(() => this.handleConfigurationChange()));
  }

  private handleConfigurationChange(): void {
    this.model = undefined;
    this.logger.info("Configuration changed, model reset");
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.chatHistoryManager.clearHistory(COMMON.GEMINI_CHAT_HISTORY);
    this.memory.delete(COMMON.GEMINI_SNAPSHOT);
    this.responseCache.clear();
    this.logger.info("GeminiLLM disposed");
  }
}
