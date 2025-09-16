import * as vscode from "vscode";
import * as path from "path";
import { VectorDatabaseService, SearchResult } from "./vector-database.service";
import { ContextRetriever } from "./context-retriever";
import { CodebaseUnderstandingService } from "./codebase-understanding.service";
import { QuestionClassifierService } from "./question-classifier.service";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { FileUtils, LanguageUtils, AsyncUtils } from "../utils/common-utils";

export interface SmartContextOptions {
  maxContextTokens?: number;
  maxResults?: number;
  enableVectorSearch?: boolean;
  enableFallback?: boolean;
  includeMetadata?: boolean;
  tokenBudgetBuffer?: number;
}

export interface ContextExtractionResult {
  content: string;
  sources: ContextSource[];
  totalTokens: number;
  searchMethod: "vector" | "keyword" | "hybrid";
  relevanceScore: number;
}

export interface ContextSource {
  filePath: string;
  type: "function" | "class" | "interface" | "enum" | "module";
  name: string;
  relevanceScore: number;
  lineNumbers?: { start: number; end: number };
  clickableReference: string;
}

/**
 * Enhanced SmartContextExtractor with vector-based semantic search capabilities.
 * Provides intelligent context extraction for AI responses with multiple search strategies.
 */
export class SmartContextExtractor {
  private logger: Logger;
  private readonly options: Required<SmartContextOptions>;
  private performanceProfiler?: any; // Will be injected for Phase 5
  private readonly RELEVANCE_RANKING_WEIGHTS = {
    vectorSimilarity: 0.6,
    activeFileBoost: 0.2,
    keywordMatch: 0.2,
  };

  constructor(
    private vectorDb?: VectorDatabaseService,
    private contextRetriever?: ContextRetriever,
    private codebaseUnderstanding?: CodebaseUnderstandingService,
    private questionClassifier?: QuestionClassifierService,
    options: SmartContextOptions = {},
    performanceProfiler?: any
  ) {
    this.performanceProfiler = performanceProfiler;
    this.logger = Logger.initialize("SmartContextExtractor", {
      minLevel: LogLevel.INFO,
    });

    // Set default options
    this.options = {
      maxContextTokens: options.maxContextTokens ?? 6000,
      maxResults: options.maxResults ?? 8,
      enableVectorSearch: options.enableVectorSearch ?? true,
      enableFallback: options.enableFallback ?? true,
      includeMetadata: options.includeMetadata ?? true,
      tokenBudgetBuffer: options.tokenBudgetBuffer ?? 500,
    };

    this.logger.info("SmartContextExtractor initialized", {
      vectorDbEnabled: !!this.vectorDb,
      maxTokens: this.options.maxContextTokens,
      maxResults: this.options.maxResults,
    });
  }

  /**
   * Main method for extracting relevant context with vector search capabilities
   */
  async extractRelevantContextWithVector(userQuestion: string, activeFile?: string): Promise<ContextExtractionResult> {
    const startTime = Date.now();

    try {
      // Use performance profiler if available
      if (this.performanceProfiler) {
        return await this.performanceProfiler.measure("search", async () => {
          return this.performContextExtraction(userQuestion, activeFile);
        });
      }

      return await this.performContextExtraction(userQuestion, activeFile);
    } catch (error) {
      this.logger.error("Error in context extraction:", error);

      // Return empty result on error to prevent breaking the flow
      return {
        content: "",
        sources: [],
        totalTokens: 0,
        searchMethod: "vector",
        relevanceScore: 0,
      };
    }
  }

  /**
   * Core context extraction logic
   */
  private async performContextExtraction(userQuestion: string, activeFile?: string): Promise<ContextExtractionResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Extracting context for question: "${userQuestion.substring(0, 50)}..."`);

      // Analyze question to determine search strategy
      const questionAnalysis = await this.analyzeQuestion(userQuestion);

      // Try vector search first if available and enabled
      let vectorResult: ContextExtractionResult | null = null;
      if (this.options.enableVectorSearch && this.vectorDb) {
        vectorResult = await this.tryVectorSearch(userQuestion, activeFile, questionAnalysis);

        if (vectorResult && vectorResult.sources.length > 0) {
          this.logger.info(
            `Vector search found ${vectorResult.sources.length} relevant results in ${Date.now() - startTime}ms`
          );
          return vectorResult;
        }
      }

      // Fallback to keyword-based search if enabled and needed
      if (this.options.enableFallback) {
        const isVectorDbAvailable = this.vectorDb && (await this.isVectorDbReady());
        const hasVectorResults = vectorResult && vectorResult.sources.length > 0;

        if (!isVectorDbAvailable || !hasVectorResults) {
          this.logger.debug("Vector search unavailable or returned no results, using fallback method");
          const fallbackResult = await this.tryKeywordSearch(userQuestion, activeFile);

          if (fallbackResult) {
            this.logger.info(
              `Fallback search found ${fallbackResult.sources.length} relevant results in ${Date.now() - startTime}ms`
            );
            return fallbackResult;
          }
        }
      }

      // Return empty result if no context found
      const actualSearchMethod = this.vectorDb && (await this.isVectorDbReady()) ? "vector" : "keyword";
      this.logger.warn("No relevant context found for question");
      return {
        content: "",
        sources: [],
        totalTokens: 0,
        searchMethod: actualSearchMethod,
        relevanceScore: 0,
      };
    } catch (error) {
      this.logger.error("Error in context extraction:", error);

      // Return empty result on error to prevent breaking the flow
      return {
        content: "",
        sources: [],
        totalTokens: 0,
        searchMethod: "vector",
        relevanceScore: 0,
      };
    }
  }

  /**
   * Analyze user question to determine optimal search strategy
   */
  private async analyzeQuestion(question: string): Promise<{
    isCodebaseRelated: boolean;
    confidence: number;
    categories: string[];
    technicalKeywords: string[];
  }> {
    if (this.questionClassifier) {
      const result = this.questionClassifier.categorizeQuestion(question);
      // Convert string confidence to number
      const confidenceMap = { high: 0.9, medium: 0.7, low: 0.3 };
      return {
        isCodebaseRelated: result.isCodebaseRelated,
        confidence: confidenceMap[result.confidence] || 0.3,
        categories: result.categories,
        technicalKeywords: this.extractTechnicalKeywords(question),
      };
    }

    // Fallback analysis
    const technicalKeywords = this.extractTechnicalKeywords(question);
    const isCodebaseRelated =
      technicalKeywords.length > 0 ||
      question.toLowerCase().includes("implement") ||
      question.toLowerCase().includes("function") ||
      question.toLowerCase().includes("class");

    return {
      isCodebaseRelated,
      confidence: isCodebaseRelated ? 0.8 : 0.3,
      categories: isCodebaseRelated ? ["implementation"] : ["general"],
      technicalKeywords,
    };
  }

  /**
   * Attempt vector-based semantic search
   */
  private async tryVectorSearch(
    question: string,
    activeFile?: string,
    questionAnalysis?: any
  ): Promise<ContextExtractionResult | null> {
    if (!this.vectorDb) return null;

    try {
      // Perform semantic search
      const searchResults = await this.vectorDb.semanticSearch(
        question,
        this.options.maxResults * 2 // Get more results to filter and rank
      );

      if (searchResults.length === 0) {
        return null;
      }

      // Rank and filter results
      const rankedResults = await this.rankSearchResults(searchResults, question, activeFile);
      const topResults = rankedResults.slice(0, this.options.maxResults);

      // Build context from results
      const contextResult = this.buildContextFromVectorResults(topResults, question);

      return {
        ...contextResult,
        searchMethod: "vector" as const,
      };
    } catch (error) {
      this.logger.error("Vector search failed:", error);
      return null;
    }
  }

  /**
   * Attempt keyword-based fallback search
   */
  private async tryKeywordSearch(question: string, activeFile?: string): Promise<ContextExtractionResult | null> {
    if (!this.codebaseUnderstanding) return null;

    try {
      // Use existing codebase understanding service
      const fullContext = await this.codebaseUnderstanding.getCodebaseContext();
      const extractedContext = this.extractRelevantKeywordContext(fullContext, question, activeFile);

      if (!extractedContext) return null;

      return {
        content: extractedContext,
        sources: [], // TODO: Extract sources from keyword search
        totalTokens: this.estimateTokenCount(extractedContext),
        searchMethod: "keyword" as const,
        relevanceScore: 0.5, // Lower relevance for keyword search
      };
    } catch (error) {
      this.logger.error("Keyword search failed:", error);
      return null;
    }
  }

  /**
   * Rank search results based on multiple criteria
   */
  private async rankSearchResults(
    results: SearchResult[],
    question: string,
    activeFile?: string
  ): Promise<SearchResult[]> {
    const questionKeywords = this.extractTechnicalKeywords(question);

    return results
      .map((result) => ({
        ...result,
        compositeScore: this.calculateCompositeScore(result, questionKeywords, activeFile),
      }))
      .sort((a, b) => (b as any).compositeScore - (a as any).compositeScore);
  }

  /**
   * Calculate composite relevance score
   */
  private calculateCompositeScore(result: SearchResult, questionKeywords: string[], activeFile?: string): number {
    let score = 0;

    // 1. Vector similarity score (primary) - weight: 40%
    score += this.calculateVectorSimilarityScore(result.relevanceScore);

    // 2. File proximity to active file (secondary) - weight: 25%
    if (activeFile && result.metadata.filePath) {
      score += this.calculateFileProximityScore(result.metadata.filePath, activeFile) * 0.25;
    }

    // 3. Keyword overlap - weight: 20%
    if (questionKeywords.length > 0) {
      score += this.calculateKeywordOverlapScore(result.content, questionKeywords) * 0.2;
    }

    // 4. Code importance/complexity (metadata-based) - weight: 15%
    score += this.calculateCodeImportanceScore(result.metadata) * 0.15;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate vector similarity score component
   */
  private calculateVectorSimilarityScore(relevanceScore: number): number {
    return relevanceScore * 0.4;
  }

  /**
   * Calculate file proximity score component
   */
  private calculateFileProximityScore(resultPath: string, activeFile: string): number {
    if (resultPath === activeFile) return 1.0;

    const resultDir = path.dirname(resultPath);
    const activeDir = path.dirname(activeFile);

    if (resultDir === activeDir) return 0.8; // Same directory

    const resultParts = resultDir.split(path.sep);
    const activeParts = activeDir.split(path.sep);

    // Calculate common path depth
    let commonDepth = 0;
    for (let i = 0; i < Math.min(resultParts.length, activeParts.length); i++) {
      if (resultParts[i] === activeParts[i]) {
        commonDepth++;
      } else {
        break;
      }
    }

    const maxDepth = Math.max(resultParts.length, activeParts.length);
    return commonDepth / maxDepth;
  }

  /**
   * Calculate keyword overlap score component
   */
  private calculateKeywordOverlapScore(content: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    const contentLower = content.toLowerCase();
    const matchedKeywords = keywords.filter((keyword) => contentLower.includes(keyword.toLowerCase()));

    return matchedKeywords.length / keywords.length;
  }

  /**
   * Calculate code importance score component
   */
  private calculateCodeImportanceScore(metadata: any): number {
    let importance = 0.5; // Base importance

    // Higher importance for certain code types
    if (metadata.type === "class") importance += 0.2;
    if (metadata.type === "interface") importance += 0.15;
    if (metadata.type === "function") importance += 0.1;

    // Higher importance for entry points and main files
    const fileName = path.basename(metadata.filePath || "");
    if (["index.ts", "main.ts", "app.ts"].includes(fileName)) {
      importance += 0.2;
    }

    // Higher importance for recently modified files
    if (metadata.lastModified) {
      const daysSinceModified = (Date.now() - new Date(metadata.lastModified).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 7) importance += 0.1;
    }

    return Math.min(importance, 1.0);
  }

  /**
   * Build formatted context from vector search results
   */
  private buildContextFromVectorResults(
    results: SearchResult[],
    question: string
  ): {
    content: string;
    sources: ContextSource[];
    totalTokens: number;
    relevanceScore: number;
  } {
    if (results.length === 0) {
      return {
        content: "",
        sources: [],
        totalTokens: 0,
        relevanceScore: 0,
      };
    }

    let context = `**Semantically Relevant Code (Vector Search Results):**\n\n`;
    const sources: ContextSource[] = [];
    let totalTokens = 0;
    let averageRelevance = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const metadata = result.metadata;
      const relevancePercentage = (result.relevanceScore * 100).toFixed(1);

      // Check token budget
      const sectionTokens = this.estimateTokenCount(result.content);
      if (totalTokens + sectionTokens > this.options.maxContextTokens - this.options.tokenBudgetBuffer) {
        this.logger.debug(`Token budget reached, stopping at ${i} results`);
        break;
      }

      // Create clickable reference
      const clickableRef = `[[${i + 1}]]`;

      // Add to context
      context += `**${clickableRef} File: ${FileUtils.getRelativePath(metadata.filePath)}** (Relevance: ${relevancePercentage}%)\n`;

      if (metadata.name && metadata.type) {
        context += `**${this.capitalizeFirst(metadata.type)}: ${metadata.name}**\n`;
      }

      context += `\`\`\`${this.getLanguageFromPath(metadata.filePath)}\n${result.content}\n\`\`\`\n\n`;

      // Add to sources
      sources.push({
        filePath: metadata.filePath,
        type: metadata.type || "module",
        name: metadata.name || path.basename(metadata.filePath),
        relevanceScore: result.relevanceScore,
        clickableReference: clickableRef,
        lineNumbers:
          metadata.startLine && metadata.endLine
            ? {
                start: metadata.startLine,
                end: metadata.endLine,
              }
            : undefined,
      });

      totalTokens += sectionTokens;
      averageRelevance += result.relevanceScore;
    }

    averageRelevance = sources.length > 0 ? averageRelevance / sources.length : 0;

    // Add context instructions
    if (sources.length > 0) {
      context += `\n**Context Instructions**: The above code snippets were selected using semantic search for relevance to your question. `;
      context += `Use the clickable references (${sources.map((s) => s.clickableReference).join(", ")}) to navigate to specific files. `;
      context += `Focus on these implementations and provide specific examples from the actual codebase.\n`;
    }

    return {
      content: context.trim(),
      sources,
      totalTokens,
      relevanceScore: averageRelevance,
    };
  }

  /**
   * Extract relevant context using keyword-based search (fallback)
   */
  private extractRelevantKeywordContext(fullContext: string, question: string, activeFile?: string): string | null {
    const keywords = this.extractTechnicalKeywords(question);
    if (keywords.length === 0) return null;

    const contextSections = fullContext.split("\n\n");
    const relevantSections: Array<{ section: string; score: number }> = [];

    for (const section of contextSections) {
      const score = this.calculateKeywordOverlapScore(section, keywords);
      if (score > 0.1) {
        // Minimum threshold
        relevantSections.push({ section, score });
      }
    }

    if (relevantSections.length === 0) return null;

    // Sort by relevance and take top sections
    relevantSections.sort((a, b) => b.score - a.score);
    const topSections = relevantSections.slice(0, 5);

    return `**Keyword-based Context:**\n\n${topSections.map((s) => s.section).join("\n\n")}`;
  }

  /**
   * Extract technical keywords from question
   */
  private extractTechnicalKeywords(question: string): string[] {
    const technicalPatterns = [
      /\b(?:function|method|class|interface|type|enum|module|service|component|hook|util|helper|config|api|endpoint|route|controller|model|schema|database|query|authentication|authorization|validation|middleware|decorator|dependency|injection|provider|factory|builder|observer|strategy|adapter|facade|proxy|singleton|prototype)\b/gi,
      /\b(?:async|await|promise|callback|event|listener|handler|trigger|emit|subscribe|publish|stream|buffer|cache|store|state|context|props|render|mount|unmount|lifecycle|effect|ref|memo|reducer|action|dispatch|selector|middleware)\b/gi,
      /\b(?:react|vue|angular|node|express|fastify|nestjs|typescript|javascript|python|java|c#|go|rust|php|ruby|sql|mongodb|postgresql|redis|docker|kubernetes|aws|azure|gcp|graphql|rest|api|json|xml|html|css|scss|sass)\b/gi,
    ];

    const keywords = new Set<string>();

    for (const pattern of technicalPatterns) {
      const matches = question.match(pattern);
      if (matches) {
        matches.forEach((match) => keywords.add(match.toLowerCase()));
      }
    }

    // Also extract camelCase and PascalCase identifiers
    const identifierPattern = /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b|\b[A-Z][a-zA-Z0-9]*\b/g;
    const identifiers = question.match(identifierPattern);
    if (identifiers) {
      identifiers.forEach((id) => keywords.add(id));
    }

    return Array.from(keywords).slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Enhanced keyword extraction for public use
   */
  extractKeywords(text: string): string[] {
    return this.extractTechnicalKeywords(text);
  }

  /**
   * Rank contexts by relevance using multiple factors - advanced ranking algorithm
   */
  private rankContextsByRelevance(contexts: any[], question: string, activeFile?: string): any[] {
    return contexts
      .map((context) => {
        let score = context.score || 0;

        // Boost score if from active file
        if (activeFile && context.metadata?.fileName === activeFile) {
          score += 0.2;
        }

        // Boost score based on question keywords
        const questionKeywords = this.extractTechnicalKeywords(question);
        const contextText = context.content || context.text || "";
        const matchingKeywords = questionKeywords.filter((keyword) => contextText.toLowerCase().includes(keyword));
        score += matchingKeywords.length * 0.1;

        return { ...context, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Fallback to keyword-based search when vector search fails
   */
  private async fallbackToKeywordSearch(
    question: string,
    activeFile?: string
  ): Promise<ContextExtractionResult | null> {
    try {
      const keywords = this.extractTechnicalKeywords(question);
      if (keywords.length === 0) return null;

      // Fallback to codebase understanding service if available
      if (this.codebaseUnderstanding) {
        const contextData = await this.codebaseUnderstanding.getCodebaseContext();

        if (contextData) {
          // Simple keyword matching in the context
          const contextLines = contextData.split("\n");
          const relevantLines = contextLines.filter((line) =>
            keywords.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))
          );

          if (relevantLines.length > 0) {
            const content = relevantLines.slice(0, 20).join("\n"); // Limit to 20 lines

            return {
              content,
              sources: [
                {
                  filePath: "codebase-context",
                  type: "module",
                  name: "Codebase Context",
                  relevanceScore: 0.5,
                  clickableReference: "[Codebase Analysis]",
                },
              ],
              totalTokens: this.estimateTokenCount(content),
              searchMethod: "keyword",
              relevanceScore: 0.5,
            };
          }
        }
      }

      // Basic keyword-based response
      return {
        content: `Context not available. Question contains keywords: ${keywords.join(", ")}`,
        sources: [],
        totalTokens: 20,
        searchMethod: "keyword",
        relevanceScore: 0.2,
      };
    } catch (error) {
      this.logger.error("Keyword fallback search failed", error);
      return null;
    }
  }

  /**
   * Estimate token count for text (approximate)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get programming language from file path
   */
  private getLanguageFromPath(filePath: string): string {
    return LanguageUtils.getLanguageFromPath(filePath);
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get semantic similarity between two texts
   */
  async getSemanticSimilarity(query: string, content: string): Promise<number> {
    if (!this.vectorDb || !(await this.isVectorDbReady())) {
      return this.calculateBasicTextSimilarity(query, content);
    }

    try {
      // Use existing vector search functionality to avoid N+1 queries
      // Search for similar content already in the database instead of indexing temporary snippets
      const existingResults = await this.vectorDb.semanticSearch(query, 5);

      if (existingResults.length === 0) {
        return this.calculateBasicTextSimilarity(query, content);
      }

      // Find the most similar existing content and use its relevance as a baseline
      const maxSimilarity = Math.max(...existingResults.map((r) => r.relevanceScore));

      // Apply text similarity to adjust the score based on actual content match
      const textSimilarity = this.calculateBasicTextSimilarity(query, content);

      // Combine vector and text similarities for a more accurate score
      return Math.min(1.0, maxSimilarity * 0.7 + textSimilarity * 0.3);
    } catch (error) {
      this.logger.error("Error calculating semantic similarity:", error);
      // Fallback to basic text similarity if vector DB fails
      return this.calculateBasicTextSimilarity(query, content);
    }
  }

  /**
   * Calculate basic text similarity as fallback when vector DB is unavailable
   */
  private calculateBasicTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);

    const matchingWords = queryWords.filter((word) =>
      contentWords.some((contentWord) => contentWord.includes(word) || word.includes(contentWord))
    );

    return queryWords.length > 0 ? matchingWords.length / queryWords.length : 0;
  }

  /**
   * Check if vector database is ready for operations
   */
  private async isVectorDbReady(): Promise<boolean> {
    if (!this.vectorDb) return false;

    try {
      // Check if vector database is initialized and operational
      // Use a simple query to test if the database is responsive
      await this.vectorDb.semanticSearch("test", 1);
      return true;
    } catch (error) {
      this.logger.debug("Vector DB not ready:", error);
      return false;
    }
  }

  /**
   * Get current configuration and stats
   */
  getStats(): {
    vectorDbEnabled: boolean;
    fallbackEnabled: boolean;
    maxTokens: number;
    maxResults: number;
  } {
    return {
      vectorDbEnabled: !!this.vectorDb && this.options.enableVectorSearch,
      fallbackEnabled: this.options.enableFallback,
      maxTokens: this.options.maxContextTokens,
      maxResults: this.options.maxResults,
    };
  }

  /**
   * Update configuration
   */
  updateOptions(newOptions: Partial<SmartContextOptions>): void {
    Object.assign(this.options, newOptions);
    this.logger.info("SmartContextExtractor options updated", this.options);
  }
}
