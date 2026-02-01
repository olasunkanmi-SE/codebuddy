import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * Token budget configuration per model type
 * These are conservative estimates leaving room for the response
 */
export const MODEL_TOKEN_BUDGETS: Record<string, number> = {
  // Local models (conservative)
  "qwen2.5-coder": 4000,
  "qwen2.5-coder:3b": 3000,
  "llama3.2": 3000,
  codellama: 4000,
  // Groq models
  "llama-3.3-70b-versatile": 20000,
  "llama-4-scout-17b-16e-instruct": 20000,
  "meta-llama/Llama-4-Scout-17B-16E-Instruct": 20000,
  // OpenAI models
  "gpt-4": 6000,
  "gpt-4-turbo": 20000,
  "gpt-4o": 20000,
  "gpt-3.5-turbo": 4000,
  // Claude models
  "claude-3-opus": 50000,
  "claude-3-sonnet": 50000,
  "claude-3-haiku": 20000,
  // Default fallback
  default: 4000,
};

/**
 * Represents a code snippet with metadata for relevance scoring
 */
export interface CodeSnippet {
  /** File path relative to workspace */
  filePath: string;
  /** Line number where snippet starts */
  startLine: number;
  /** Line number where snippet ends */
  endLine: number;
  /** The actual code content */
  content: string;
  /** Type of the code element */
  type:
    | "function"
    | "class"
    | "interface"
    | "type"
    | "variable"
    | "import"
    | "block";
  /** Name of the element (function name, class name, etc.) */
  name?: string;
  /** Relevance score (0-1) */
  relevanceScore: number;
  /** Approximate token count */
  tokenCount: number;
  /** Whether this was explicitly selected by user (@ mention) */
  isUserSelected: boolean;
}

/**
 * Context selection result
 */
export interface ContextSelectionResult {
  /** Selected snippets within token budget */
  snippets: CodeSnippet[];
  /** Total tokens used */
  totalTokens: number;
  /** Token budget */
  budgetTokens: number;
  /** Whether budget was exceeded (some context dropped) */
  wasTruncated: boolean;
  /** Number of snippets dropped due to budget */
  droppedCount: number;
}

/**
 * Smart Context Selector Service
 *
 * Implements intelligent context selection following patterns from world-class
 * AI coding assistants like GitHub Copilot, Cursor, and Gemini.
 *
 * Key principles:
 * 1. Token Budget Awareness - Respect model context limits
 * 2. User Context Priority - @ mentioned files always included first
 * 3. Relevance Ranking - Score snippets by query relevance
 * 4. Smart Extraction - Function signatures over full implementations
 * 5. Deduplication - No redundant context
 */
export class SmartContextSelectorService {
  private logger: Logger;
  private static instance: SmartContextSelectorService;

  constructor() {
    this.logger = Logger.initialize("SmartContextSelectorService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): SmartContextSelectorService {
    if (!SmartContextSelectorService.instance) {
      SmartContextSelectorService.instance = new SmartContextSelectorService();
    }
    return SmartContextSelectorService.instance;
  }

  /**
   * Estimates token count using the common 4 chars ≈ 1 token approximation
   */
  estimateTokens(text: string): number {
    // More precise estimation: ~4 chars per token for code, accounting for whitespace
    return Math.ceil(text.length / 4);
  }

  /**
   * Gets the token budget for a specific model
   */
  getTokenBudget(modelName: string): number {
    const normalizedName = modelName.toLowerCase();

    // Check for exact match first
    if (MODEL_TOKEN_BUDGETS[normalizedName]) {
      return MODEL_TOKEN_BUDGETS[normalizedName];
    }

    // Check for partial matches
    for (const [key, budget] of Object.entries(MODEL_TOKEN_BUDGETS)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return budget;
      }
    }

    return MODEL_TOKEN_BUDGETS.default;
  }

  /**
   * Calculates relevance score based on keyword matches and position
   */
  calculateRelevanceScore(
    snippet: string,
    keywords: string[],
    isUserSelected: boolean,
  ): number {
    // User-selected content always gets highest priority
    if (isUserSelected) {
      return 1.0;
    }

    if (!keywords.length) {
      return 0.5; // Default score when no keywords
    }

    const lowerSnippet = snippet.toLowerCase();
    let matchCount = 0;
    let exactMatchBonus = 0;

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Count keyword occurrences
      const regex = new RegExp(lowerKeyword, "gi");
      const matches = lowerSnippet.match(regex);
      if (matches) {
        matchCount += matches.length;

        // Bonus for function/class name matches
        if (
          lowerSnippet.includes(`function ${lowerKeyword}`) ||
          lowerSnippet.includes(`class ${lowerKeyword}`) ||
          lowerSnippet.includes(`interface ${lowerKeyword}`) ||
          lowerSnippet.includes(`const ${lowerKeyword}`) ||
          lowerSnippet.includes(`def ${lowerKeyword}`)
        ) {
          exactMatchBonus += 0.2;
        }
      }
    }

    // Base score from match density
    const words = snippet.split(/\s+/).length;
    const matchDensity = matchCount / Math.max(words, 1);

    // Score between 0.1 and 0.9 (leaving room for user-selected priority)
    const baseScore = Math.min(0.9, 0.1 + matchDensity * 5 + exactMatchBonus);

    return baseScore;
  }

  /**
   * Extracts smart snippets from code - prefers signatures over full implementations
   */
  extractSmartSnippets(
    filePath: string,
    content: string,
    keywords: string[],
    isUserSelected: boolean,
  ): CodeSnippet[] {
    const snippets: CodeSnippet[] = [];
    const lines = content.split("\n");

    // If user selected this file, include it more fully but still smart
    if (isUserSelected) {
      // For user-selected files, include the full content but with higher relevance
      const fullSnippet: CodeSnippet = {
        filePath,
        startLine: 1,
        endLine: lines.length,
        content: content,
        type: "block",
        relevanceScore: 1.0,
        tokenCount: this.estimateTokens(content),
        isUserSelected: true,
      };
      snippets.push(fullSnippet);
      return snippets;
    }

    // For auto-gathered context, extract specific elements
    const patterns = [
      // TypeScript/JavaScript patterns
      {
        regex: /^(export\s+)?(async\s+)?function\s+(\w+)/gm,
        type: "function" as const,
      },
      { regex: /^(export\s+)?class\s+(\w+)/gm, type: "class" as const },
      { regex: /^(export\s+)?interface\s+(\w+)/gm, type: "interface" as const },
      { regex: /^(export\s+)?type\s+(\w+)/gm, type: "type" as const },
      { regex: /^(export\s+)?const\s+(\w+)\s*=/gm, type: "variable" as const },
      // Python patterns
      { regex: /^(async\s+)?def\s+(\w+)/gm, type: "function" as const },
      { regex: /^class\s+(\w+)/gm, type: "class" as const },
    ];

    for (const { regex, type } of patterns) {
      let match;
      regex.lastIndex = 0; // Reset regex state

      while ((match = regex.exec(content)) !== null) {
        const startIndex = match.index;
        const startLine = content.slice(0, startIndex).split("\n").length;

        // Extract the element with context (up to 30 lines or until next element)
        const endLine = Math.min(startLine + 30, lines.length);
        const elementContent = lines.slice(startLine - 1, endLine).join("\n");

        // Get the name from the match
        const name = match[match.length - 1] || match[2] || match[1];

        const relevanceScore = this.calculateRelevanceScore(
          elementContent,
          keywords,
          false,
        );

        // Only include if relevance is above threshold
        if (relevanceScore > 0.2) {
          snippets.push({
            filePath,
            startLine,
            endLine,
            content: elementContent,
            type,
            name,
            relevanceScore,
            tokenCount: this.estimateTokens(elementContent),
            isUserSelected: false,
          });
        }
      }
    }

    // If no specific elements found but file matches keywords, include summary
    if (snippets.length === 0) {
      const lowerContent = content.toLowerCase();
      const hasMatch = keywords.some((k) =>
        lowerContent.includes(k.toLowerCase()),
      );

      if (hasMatch) {
        // Include first 50 lines as summary
        const summaryContent = lines.slice(0, 50).join("\n");
        snippets.push({
          filePath,
          startLine: 1,
          endLine: Math.min(50, lines.length),
          content: summaryContent,
          type: "block",
          relevanceScore: 0.3,
          tokenCount: this.estimateTokens(summaryContent),
          isUserSelected: false,
        });
      }
    }

    return snippets;
  }

  /**
   * Deduplicates snippets, preferring higher relevance
   */
  deduplicateSnippets(snippets: CodeSnippet[]): CodeSnippet[] {
    const seen = new Map<string, CodeSnippet>();

    for (const snippet of snippets) {
      const key = `${snippet.filePath}:${snippet.startLine}`;
      const existing = seen.get(key);

      if (!existing || snippet.relevanceScore > existing.relevanceScore) {
        seen.set(key, snippet);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Main method: Selects context within token budget
   *
   * @param userSelectedFiles - Files explicitly selected by user (@ mentions)
   * @param autoGatheredCode - Code gathered from search (from AnalyzeCodeProvider)
   * @param keywords - Search keywords for relevance scoring
   * @param modelName - Model name for budget calculation
   */
  selectContext(
    userSelectedFiles: Map<string, string>, // filepath -> content
    autoGatheredCode: string | undefined,
    keywords: string[],
    modelName: string,
  ): ContextSelectionResult {
    const budget = this.getTokenBudget(modelName);
    const allSnippets: CodeSnippet[] = [];

    this.logger.info(
      `Selecting context with budget: ${budget} tokens for model: ${modelName}`,
    );

    // 1. First, process user-selected files (highest priority)
    for (const [filePath, content] of userSelectedFiles.entries()) {
      const snippets = this.extractSmartSnippets(
        filePath,
        content,
        keywords,
        true,
      );
      allSnippets.push(...snippets);
    }

    // 2. Parse auto-gathered code if present and extract snippets
    if (autoGatheredCode) {
      const autoSnippets = this.parseAutoGatheredCode(
        autoGatheredCode,
        keywords,
      );
      allSnippets.push(...autoSnippets);
    }

    // 3. Deduplicate
    const dedupedSnippets = this.deduplicateSnippets(allSnippets);

    // 4. Sort by relevance (user-selected first, then by score)
    dedupedSnippets.sort((a, b) => {
      if (a.isUserSelected !== b.isUserSelected) {
        return a.isUserSelected ? -1 : 1;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // 5. Select within budget
    const selected: CodeSnippet[] = [];
    let totalTokens = 0;
    let droppedCount = 0;

    for (const snippet of dedupedSnippets) {
      if (totalTokens + snippet.tokenCount <= budget) {
        selected.push(snippet);
        totalTokens += snippet.tokenCount;
      } else {
        droppedCount++;
      }
    }

    this.logger.info(
      `Selected ${selected.length} snippets (${totalTokens} tokens), dropped ${droppedCount}`,
    );

    return {
      snippets: selected,
      totalTokens,
      budgetTokens: budget,
      wasTruncated: droppedCount > 0,
      droppedCount,
    };
  }

  /**
   * Parses auto-gathered code (which may be in various formats) into snippets
   */
  private parseAutoGatheredCode(
    code: string,
    keywords: string[],
  ): CodeSnippet[] {
    const snippets: CodeSnippet[] = [];

    // The auto-gathered code from AnalyzeCodeProvider has file markers
    // Format: ## File: path/to/file.ts\n```\ncode\n```
    const fileBlockRegex = /## File: ([^\n]+)\n```[^\n]*\n([\s\S]*?)```/g;
    let match;

    while ((match = fileBlockRegex.exec(code)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].trim();

      const fileSnippets = this.extractSmartSnippets(
        filePath,
        content,
        keywords,
        false,
      );
      snippets.push(...fileSnippets);
    }

    // If no file blocks found, treat as raw code
    if (snippets.length === 0 && code.trim()) {
      const relevanceScore = this.calculateRelevanceScore(
        code,
        keywords,
        false,
      );

      // Only include if somewhat relevant
      if (relevanceScore > 0.2) {
        // Limit to first 100 lines
        const lines = code.split("\n").slice(0, 100);
        snippets.push({
          filePath: "gathered-context",
          startLine: 1,
          endLine: lines.length,
          content: lines.join("\n"),
          type: "block",
          relevanceScore,
          tokenCount: this.estimateTokens(lines.join("\n")),
          isUserSelected: false,
        });
      }
    }

    return snippets;
  }

  /**
   * Formats selected snippets for inclusion in prompt
   */
  formatForPrompt(result: ContextSelectionResult): string {
    if (result.snippets.length === 0) {
      return "No relevant code context found.";
    }

    const parts: string[] = [];

    // Group by file for cleaner output
    const byFile = new Map<string, CodeSnippet[]>();
    for (const snippet of result.snippets) {
      const existing = byFile.get(snippet.filePath) || [];
      existing.push(snippet);
      byFile.set(snippet.filePath, existing);
    }

    for (const [filePath, fileSnippets] of byFile.entries()) {
      parts.push(`### File: ${filePath}`);

      for (const snippet of fileSnippets) {
        const locationInfo = snippet.name
          ? `${snippet.type} \`${snippet.name}\` (lines ${snippet.startLine}-${snippet.endLine})`
          : `lines ${snippet.startLine}-${snippet.endLine}`;

        parts.push(`#### ${locationInfo}`);
        parts.push("```");
        parts.push(snippet.content);
        parts.push("```");
      }
    }

    if (result.wasTruncated) {
      parts.push(
        `\n_Note: ${result.droppedCount} additional snippets omitted due to context limit._`,
      );
    }

    return parts.join("\n");
  }
}
