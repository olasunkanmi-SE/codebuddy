/**
 * Token Budget Allocator for Context Generation
 *
 * Manages a fixed token/character budget and allocates portions
 * to different context sections with priority-based selection.
 */

import type { BudgetItem } from "../../interfaces/analysis.interface";

// Re-export for consumers of token-budget.ts
export type { BudgetItem };

/**
 * Characters per token estimates by content type.
 * Source code tokenizes more densely than prose (identifiers, brackets, operators).
 */
export const CHARS_PER_TOKEN = {
  /** Source code: identifiers, brackets, operators tokenize densely */
  code: 2.0,
  /** Prose/markdown: closer to GPT average */
  prose: 3.5,
  /** Conservative default: use when content type is unknown */
  conservative: 2.0,
} as const;

export interface BudgetAllocation {
  name: string;
  budget: number; // in characters
  priority: number; // higher = more important
  used: number;
}

/**
 * Allocates and manages a token budget for context generation
 */
export class TokenBudgetAllocator {
  private totalBudget: number;
  private allocations = new Map<string, BudgetAllocation>();
  private safetyMargin: number;

  /**
   * Create a new budget allocator
   * @param totalCharacters Total character budget (default 32000 = ~8K tokens)
   * @param safetyMargin Safety margin multiplier (default 0.9 = 10% buffer)
   */
  constructor(totalCharacters: number = 32000, safetyMargin: number = 0.9) {
    this.totalBudget = Math.floor(totalCharacters * safetyMargin);
    this.safetyMargin = safetyMargin;
  }

  /**
   * Convert tokens to characters
   */
  static tokensToChars(
    tokens: number,
    contentType: keyof typeof CHARS_PER_TOKEN = "conservative",
  ): number {
    return Math.floor(tokens * CHARS_PER_TOKEN[contentType]);
  }

  /**
   * Convert characters to approximate tokens
   */
  static charsToTokens(
    chars: number,
    contentType: keyof typeof CHARS_PER_TOKEN = "conservative",
  ): number {
    return Math.ceil(chars / CHARS_PER_TOKEN[contentType]);
  }

  /**
   * Allocate budget to a category
   * @param name Category name
   * @param budget Character budget for this category
   * @param priority Priority (higher = more important, will get full allocation first)
   */
  allocate(name: string, budget: number, priority: number = 1): this {
    const currentAllocated = Array.from(this.allocations.values()).reduce(
      (sum, a) => sum + a.budget,
      0,
    );

    if (currentAllocated + budget > this.totalBudget) {
      // Clamp to remaining available budget
      budget = Math.max(0, this.totalBudget - currentAllocated);
    }

    this.allocations.set(name, {
      name,
      budget,
      priority,
      used: 0,
    });
    return this;
  }

  /**
   * Get remaining budget for a category
   */
  getRemaining(name: string): number {
    const allocation = this.allocations.get(name);
    if (!allocation) return 0;
    return Math.max(0, allocation.budget - allocation.used);
  }

  /**
   * Get total remaining budget
   */
  getTotalRemaining(): number {
    let totalUsed = 0;
    for (const allocation of this.allocations.values()) {
      totalUsed += allocation.used;
    }
    return Math.max(0, this.totalBudget - totalUsed);
  }

  /**
   * Record usage in a category
   */
  recordUsage(name: string, chars: number): void {
    const allocation = this.allocations.get(name);
    if (allocation) {
      allocation.used += chars;
    }
  }

  /**
   * Select items that fit within budget, prioritizing by score
   * @param name Category name
   * @param items Items to select from
   * @param getSize Function to get item size in characters
   * @param getScore Function to get item priority score (higher = more important)
   */
  selectWithinBudget<T>(
    name: string,
    items: T[],
    getSize: (item: T) => number,
    getScore: (item: T) => number = () => 1,
  ): T[] {
    const remaining = this.getRemaining(name);
    if (remaining <= 0 || items.length === 0) return [];

    // Sort by score descending, then by size ascending (smaller items first as tie-breaker)
    const sorted = [...items].sort((a, b) => {
      const scoreDiff = getScore(b) - getScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return getSize(a) - getSize(b);
    });

    const selected: T[] = [];
    let usedBudget = 0;

    for (const item of sorted) {
      const size = getSize(item);
      if (usedBudget + size <= remaining) {
        selected.push(item);
        usedBudget += size;
      }
      // Continue scanning — a smaller item later may still fit
    }

    // Record usage
    this.recordUsage(name, usedBudget);

    return selected;
  }

  /**
   * Truncate string to fit within budget
   */
  truncateToFit(name: string, text: string, suffix: string = "\n..."): string {
    const remaining = this.getRemaining(name);
    if (text.length <= remaining) {
      this.recordUsage(name, text.length);
      return text;
    }

    const truncated = text.substring(0, remaining - suffix.length) + suffix;
    this.recordUsage(name, truncated.length);
    return truncated;
  }

  /**
   * Get summary of allocations
   */
  getSummary(): {
    name: string;
    budget: number;
    used: number;
    remaining: number;
  }[] {
    return Array.from(this.allocations.values()).map((a) => ({
      name: a.name,
      budget: a.budget,
      used: a.used,
      remaining: Math.max(0, a.budget - a.used),
    }));
  }

  /**
   * Check if budget is exhausted
   */
  isExhausted(): boolean {
    return this.getTotalRemaining() <= 0;
  }

  /**
   * Reset all usage counters
   */
  reset(): void {
    for (const allocation of this.allocations.values()) {
      allocation.used = 0;
    }
  }
}

/**
 * Default budget configuration for codebase analysis
 */
export function createAnalysisBudget(
  totalChars: number = 32000,
): TokenBudgetAllocator {
  const budget = new TokenBudgetAllocator(totalChars);
  const effective = budget.getTotalRemaining(); // after safety margin

  // Proportional weights (sum ≈ 0.987, ~1.3% unallocated buffer)
  // Code snippets reduced from 0.468 to 0.40 because code tokenizes
  // at ~2 chars/token vs 3.5 for prose, so same char budget = more tokens
  const weights: [string, number, number][] = [
    ["overview", 0.025, 10],
    ["frameworks", 0.019, 9],
    ["languages", 0.013, 9],
    ["architecture", 0.094, 8],
    ["codeSnippets", 0.4, 7], // largest share (reduced for denser tokenization)
    ["endpoints", 0.125, 6],
    ["models", 0.125, 5],
    ["dependencies", 0.062, 5],
    ["relationships", 0.062, 4],
    ["fileList", 0.062, 3],
  ];

  for (const [name, weight, priority] of weights) {
    budget.allocate(name, Math.floor(effective * weight), priority);
  }

  return budget;
}

/**
 * Relevance scoring utilities for prioritizing items
 */
export const RelevanceScoring = {
  /**
   * Score a file based on its path and type
   */
  scoreFile(
    filePath: string,
    options: {
      entryPoints?: string[];
      keyDirectories?: string[];
      question?: string;
    } = {},
  ): number {
    let score = 1;
    const lowerPath = filePath.toLowerCase();

    // Entry points get highest priority
    const entryPoints = options.entryPoints || [
      "index",
      "main",
      "app",
      "server",
      "entry",
    ];
    if (entryPoints.some((ep) => lowerPath.includes(ep))) {
      score += 5;
    }

    // Key directories
    const keyDirs = options.keyDirectories || [
      "controllers",
      "services",
      "models",
      "api",
      "routes",
      "handlers",
      "components",
    ];
    if (keyDirs.some((dir) => lowerPath.includes(dir))) {
      score += 3;
    }

    // Config files
    if (
      lowerPath.includes("config") ||
      lowerPath.endsWith(".json") ||
      lowerPath.endsWith(".yaml")
    ) {
      score += 1;
    }

    // Test files are lower priority
    if (
      lowerPath.includes("test") ||
      lowerPath.includes("spec") ||
      lowerPath.includes("__tests__")
    ) {
      score -= 2;
    }

    // Question-based relevance
    if (options.question) {
      const questionLower = options.question.toLowerCase();
      const fileName = filePath.split("/").pop()?.toLowerCase() || "";

      // Check if filename relates to question
      const questionWords = questionLower
        .split(/\s+/)
        .filter((w) => w.length > 3);
      for (const word of questionWords) {
        if (fileName.includes(word) || lowerPath.includes(word)) {
          score += 2;
        }
      }
    }

    return Math.max(0, score);
  },

  /**
   * Score an API endpoint based on relevance
   */
  scoreEndpoint(
    endpoint: { method: string; path: string },
    question?: string,
  ): number {
    let score = 1;

    // Common endpoints are more relevant
    if (endpoint.path.includes("/api/")) score += 2;
    if (endpoint.path.includes("/auth")) score += 2;
    if (endpoint.path.includes("/user")) score += 1;

    // Question relevance
    if (question) {
      const questionLower = question.toLowerCase();
      if (questionLower.includes(endpoint.path.toLowerCase())) {
        score += 5;
      }
      if (questionLower.includes(endpoint.method.toLowerCase())) {
        score += 1;
      }
    }

    return score;
  },

  /**
   * Score a data model based on relevance
   */
  scoreModel(model: { name: string; type: string }, question?: string): number {
    let score = 1;

    // Common model names
    const commonModels = ["user", "account", "product", "order", "session"];
    if (commonModels.some((m) => model.name.toLowerCase().includes(m))) {
      score += 2;
    }

    // Interfaces/types are often more descriptive
    if (model.type === "interface" || model.type === "type") {
      score += 1;
    }

    // Question relevance
    if (question) {
      const questionLower = question.toLowerCase();
      if (questionLower.includes(model.name.toLowerCase())) {
        score += 5;
      }
    }

    return score;
  },
};
