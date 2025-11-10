import { authKeywords, keywordWeights, typeWeights } from "../constants";
import { ICodeElement } from "../query-types";
import { IRelevanceConfig, IScoredElement } from "./analytics.interface";

export class RelevanceScorer {
  private static instance: RelevanceScorer;

  static getInstance() {
    return (RelevanceScorer.instance ??= new RelevanceScorer());
  }

  private findKeywordsInText(text: string): string[] {
    const found: string[] = [];
    for (const keyword of authKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    }
    return found;
  }

  private calculateKeywordScore(keywords: string[]) {
    return keywords.reduce((sum, keyword) => {
      return sum + (keywordWeights.get(keyword.toLowerCase()) || 3);
    }, 0);
  }

  scoreElement(element: ICodeElement): IScoredElement {
    let score = 0;
    const reasons: string[] = [];

    const typeScore = typeWeights.get(element.type) || 1;
    score += typeScore;
    reasons.push(`Type: ${element.type} (+${typeScore})`);

    const nameKeywords = this.findKeywordsInText(element.name.toLowerCase());
    if (nameKeywords?.length > 0) {
      const nameScore = this.calculateKeywordScore(nameKeywords);
      score += nameScore * 2;
      reasons.push(
        `Name keywords: ${nameKeywords.join(", ")} (+${nameScore * 2})`
      );
    }

    const codeKeywords = this.findKeywordsInText(
      element.codeSnippet.toLowerCase()
    );
    if (codeKeywords?.length > 0) {
      const codeScore = this.calculateKeywordScore(nameKeywords);
      score += codeScore;
      reasons.push(`Code keywords: ${codeKeywords.join(", ")} (+${codeScore})`);
    }

    // 4. Bonus for having children (classes with methods)
    if (element.children && element.children.length > 0) {
      const childBonus = element.children.length * 2;
      score += childBonus;
      reasons.push(`Has ${element.children.length} children (+${childBonus})`);
    }

    // 5. Bonus for being a parent (more architectural)
    if (element.type === "class" || element.type === "method") {
      score += 3;
      reasons.push("Architectural element (+3)");
    }

    if (element.codeSnippet.length > 1000) {
      score -= 2;
      reasons.push("Very long code (-2)");
    }

    const totalKeywords = nameKeywords.length + codeKeywords.length;
    if (totalKeywords >= 3) {
      const multiKeywordBonus = totalKeywords * 0.5;
      score += multiKeywordBonus;
      reasons.push(`Multiple keywords (+${multiKeywordBonus.toFixed(1)})`);
    }

    return { element, score, reasons };
  }

  scoreElements(elements: ICodeElement[]): IScoredElement[] {
    return elements
      .map((el) => this.scoreElement(el))
      .sort((a, b) => b.score - a.score);
  }

  filterByRelevance(
    elements: ICodeElement[],
    config: IRelevanceConfig = {}
  ): IScoredElement[] {
    const {
      minScore = 10,
      maxElements = 50,
      prioritizeTypes = ["class", "function", "method"],
      requireKeywordInName = false,
      includeChildren = true,
    } = config;

    let scored = this.scoreElements(elements);
    scored = scored.filter((s) => s.score >= minScore);

    if (requireKeywordInName) {
      scored = scored.filter(
        (s) => this.findKeywordsInText(s.element.name.toLowerCase()).length > 0
      );
    }

    scored = scored.sort((a, b) => {
      const aPriority = prioritizeTypes.indexOf(a.element.type);
      const bPriority = prioritizeTypes.indexOf(b.element.type);
      if (aPriority !== bPriority) {
        return (
          (bPriority === -1 ? -1 : bPriority) -
          (aPriority === -1 ? -1 : aPriority)
        );
      }
      return b.score - a.score;
    });

    if (!includeChildren) {
      scored = scored.filter((s) => !s.element.parent);
    }
    return scored.slice(0, maxElements);
  }

  categorizeForLLM(scoredElements: IScoredElement[]): {
    critical: IScoredElement[];
    important: IScoredElement[];
    relevant: IScoredElement[];
    supplementary: IScoredElement[];
  } {
    return {
      critical: scoredElements.filter((s) => s.score >= 30),
      important: scoredElements.filter((s) => s.score >= 20 && s.score < 30),
      relevant: scoredElements.filter((s) => s.score >= 10 && s.score < 20),
      supplementary: scoredElements.filter((s) => s.score < 10),
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generates LLM-optimized summary with token estimation
   */
  generateLLMSummary(scoredElements: IScoredElement[]): {
    summary: string;
    estimatedTokens: number;
    elementCount: number;
  } {
    const categorized = this.categorizeForLLM(scoredElements);
    let summary = "";
    let estimatedTokens = 0;

    // Critical elements (full code)
    if (categorized.critical.length > 0) {
      summary += "=== CRITICAL ELEMENTS ===\n\n";
      for (const scored of categorized.critical) {
        const el = scored.element;
        summary += `[${el.type.toUpperCase()}] ${el.name} (Score: ${scored.score})\n`;
        summary += `File: ${el.filePath}:${el.startPosition.row + 1}\n`;
        summary += `Reasons: ${scored.reasons.join("; ")}\n`;
        summary += `Code:\n\`\`\`\n${el.codeSnippet}\n\`\`\`\n\n`;
        estimatedTokens += this.estimateTokens(el.codeSnippet) + 50;
      }
    }

    // Important elements (full code)
    if (categorized.important.length > 0) {
      summary += "=== IMPORTANT ELEMENTS ===\n\n";
      for (const scored of categorized.important) {
        const el = scored.element;
        summary += `[${el.type.toUpperCase()}] ${el.name} (Score: ${scored.score})\n`;
        summary += `File: ${el.filePath}:${el.startPosition.row + 1}\n`;
        summary += `Code:\n\`\`\`\n${el.codeSnippet}\n\`\`\`\n\n`;
        estimatedTokens += this.estimateTokens(el.codeSnippet) + 30;
      }
    }

    // Relevant elements (summary only)
    if (categorized.relevant.length > 0) {
      summary += "=== RELEVANT ELEMENTS (Summary) ===\n\n";
      for (const scored of categorized.relevant) {
        const el = scored.element;
        summary += `- [${el.type}] ${el.name} in ${el.filePath}:${el.startPosition.row + 1}\n`;
        estimatedTokens += 20;
      }
      summary += "\n";
    }

    const elementCount =
      categorized.critical.length +
      categorized.important.length +
      categorized.relevant.length;

    //Summary goes to LLM.
    return { summary, estimatedTokens, elementCount };
  }

  recommendConfig(totalElements: number): IRelevanceConfig {
    if (totalElements < 50) {
      return {
        minScore: 5,
        maxElements: totalElements,
        requireKeywordInName: false,
        includeChildren: true,
      };
    } else if (totalElements < 200) {
      return {
        minScore: 10,
        maxElements: 100,
        requireKeywordInName: false,
        includeChildren: true,
      };
    } else if (totalElements < 500) {
      return {
        minScore: 15,
        maxElements: 75,
        requireKeywordInName: true,
        includeChildren: false,
      };
    } else {
      return {
        minScore: 20,
        maxElements: 50,
        prioritizeTypes: ["class", "function"],
        requireKeywordInName: true,
        includeChildren: false,
      };
    }
  }
}
