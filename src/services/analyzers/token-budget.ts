/**
 * Token Budget Allocator for Context Generation
 *
 * Manages a fixed token/character budget and allocates portions
 * to different context sections with priority-based selection.
 */

// Approximate characters per token (conservative estimate)
const CHARS_PER_TOKEN = 4;

export interface BudgetAllocation {
  name: string;
  budget: number; // in characters
  priority: number; // higher = more important
  used: number;
}

export interface BudgetItem<T> {
  data: T;
  size: number; // character count
  priority?: number; // item-level priority within category
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
  static tokensToChars(tokens: number): number {
    return tokens * CHARS_PER_TOKEN;
  }

  /**
   * Convert characters to approximate tokens
   */
  static charsToTokens(chars: number): number {
    return Math.ceil(chars / CHARS_PER_TOKEN);
  }

  /**
   * Allocate budget to a category
   * @param name Category name
   * @param budget Character budget for this category
   * @param priority Priority (higher = more important, will get full allocation first)
   */
  allocate(name: string, budget: number, priority: number = 1): this {
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

    // Sort by score descending
    const sorted = [...items].sort((a, b) => getScore(b) - getScore(a));

    const selected: T[] = [];
    let usedBudget = 0;

    for (const item of sorted) {
      const size = getSize(item);
      if (usedBudget + size <= remaining) {
        selected.push(item);
        usedBudget += size;
      }
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

  // Allocate budget by priority
  budget.allocate("overview", 2000, 10); // High priority - always include
  budget.allocate("architecture", 3000, 9); // Architecture patterns
  budget.allocate("codeSnippets", 15000, 8); // Main content - code
  budget.allocate("endpoints", 4000, 7); // API endpoints
  budget.allocate("models", 4000, 6); // Data models
  budget.allocate("relationships", 2000, 5); // Domain relationships
  budget.allocate("fileList", 2000, 4); // File listing

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
