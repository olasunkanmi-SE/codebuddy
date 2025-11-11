/**
 * LLM Output Truncator
 *
 * Intelligently truncates analysis output to fit LLM token limits
 */

import { IScoredElement } from "./analysis/analytics.interface";

export interface TruncationOptions {
  maxTokens?: number; // Max tokens for entire output (default: 100,000)
  maxElements?: number; // Max number of elements (default: 50)
  maxSnippetLength?: number; // Max characters per code snippet (default: 500)
  includeFullCode?: boolean; // Include full code or summaries (default: true)
  priorityCutoff?: number; // Only include elements above this score (default: 20)
}

export interface TruncatedOutput {
  summary: string;
  truncated: boolean;
  originalCount: number;
  finalCount: number;
  estimatedTokens: number;
  droppedElements: number;
}

export class LLMOutputTruncator {
  private readonly DEFAULT_OPTIONS: Required<TruncationOptions> = {
    maxTokens: 100000, // Conservative for most LLMs
    maxElements: 50,
    maxSnippetLength: 500, // ~125 tokens per snippet
    includeFullCode: true,
    priorityCutoff: 20,
  };

  /**
   * Truncate analysis output to fit LLM token limits
   */
  truncate(
    analysisOutput: string,
    options: TruncationOptions = {},
  ): TruncatedOutput {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    const originalLength = analysisOutput.length;
    const estimatedOriginalTokens = this.estimateTokens(analysisOutput);

    // If already within limits, return as-is
    // if (estimatedOriginalTokens <= opts.maxTokens) {
    //   return {
    //     summary: analysisOutput,
    //     truncated: false,
    //     originalCount: this.countElements(analysisOutput),
    //     finalCount: this.countElements(analysisOutput),
    //     estimatedTokens: estimatedOriginalTokens,
    //     droppedElements: 0,
    //   };
    // }

    // Parse and truncate
    const sections = this.parseSections(analysisOutput);
    const truncatedSummary = this.buildTruncatedSummary(sections, opts);

    return {
      summary: truncatedSummary,
      truncated: true,
      originalCount: this.countElements(analysisOutput),
      finalCount: this.countElements(truncatedSummary),
      estimatedTokens: this.estimateTokens(truncatedSummary),
      droppedElements:
        this.countElements(analysisOutput) -
        this.countElements(truncatedSummary),
    };
  }

  /**
   * Truncate scored elements before generating summary
   */
  truncateScoredElements(
    scoredElements: IScoredElement[],
    options: TruncationOptions = {},
  ): IScoredElement[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Filter by priority
    let filtered = scoredElements.filter((s) => s.score >= opts.priorityCutoff);

    // Limit count
    if (filtered.length > opts.maxElements) {
      filtered = filtered.slice(0, opts.maxElements);
    }

    // Truncate code snippets if needed
    if (opts.maxSnippetLength && opts.maxSnippetLength > 0) {
      filtered = filtered.map((scored) => ({
        ...scored,
        element: {
          ...scored.element,
          codeSnippet: this.truncateSnippet(
            scored.element.codeSnippet,
            opts.maxSnippetLength,
          ),
        },
      }));
    }

    return filtered;
  }

  /**
   * Smart truncation based on LLM model
   */
  truncateForModel(
    analysisOutput: string,
    modelName:
      | "gpt-4"
      | "gpt-4-turbo"
      | "claude-3-opus"
      | "claude-3-sonnet"
      | "gemini-pro",
  ): TruncatedOutput {
    const modelLimits: Record<string, TruncationOptions> = {
      "gpt-4": {
        maxTokens: 6000, // Conservative (8K context, leave room for response)
        maxElements: 20,
        maxSnippetLength: 300,
      },
      "gpt-4-turbo": {
        maxTokens: 100000, // 128K context
        maxElements: 100,
        maxSnippetLength: 1000,
      },
      "claude-3-opus": {
        maxTokens: 150000, // 200K context
        maxElements: 150,
        maxSnippetLength: 1500,
      },
      "claude-3-sonnet": {
        maxTokens: 150000, // 200K context
        maxElements: 150,
        maxSnippetLength: 1500,
      },
      "gemini-pro": {
        maxTokens: 25000, // 32K context
        maxElements: 50,
        maxSnippetLength: 500,
      },
    };

    return this.truncate(analysisOutput, modelLimits[modelName]);
  }

  /**
   * Create a summary-only version (no code snippets)
   */
  createSummaryOnly(analysisOutput: string): TruncatedOutput {
    const sections = this.parseSections(analysisOutput);

    let summary = "=== AUTHENTICATION ANALYSIS SUMMARY ===\n\n";

    // Extract just element names and locations
    const elements = this.extractElements(analysisOutput);

    summary += `Total Elements Found: ${elements.length}\n\n`;
    summary += "=== ELEMENTS BY TYPE ===\n";

    const byType = this.groupByType(elements);
    for (const [type, items] of Object.entries(byType)) {
      summary += `\n${type.toUpperCase()} (${items.length}):\n`;
      items.forEach((item) => {
        summary += `  - ${item.name} (${item.file}:${item.line})\n`;
      });
    }

    return {
      summary,
      truncated: true,
      originalCount: elements.length,
      finalCount: elements.length,
      estimatedTokens: this.estimateTokens(summary),
      droppedElements: 0,
    };
  }

  /**
   * Truncate individual code snippet
   */
  private truncateSnippet(snippet: string, maxLength: number): string {
    if (snippet.length <= maxLength) {
      return snippet;
    }

    const truncated = snippet.substring(0, maxLength);
    const lastNewline = truncated.lastIndexOf("\n");

    // Try to cut at a newline for cleaner truncation
    if (lastNewline > maxLength * 0.8) {
      return truncated.substring(0, lastNewline) + "\n\n... (truncated)";
    }

    return truncated + "\n\n... (truncated)";
  }

  /**
   * Parse output into sections
   */
  private parseSections(output: string): Map<string, string> {
    const sections = new Map<string, string>();
    const sectionRegex = /=== (.*?) ===/g;

    let match;
    let lastIndex = 0;
    let lastSection = "header";

    while ((match = sectionRegex.exec(output)) !== null) {
      const sectionContent = output.substring(lastIndex, match.index);
      if (sectionContent.trim()) {
        sections.set(lastSection, sectionContent);
      }
      lastSection = match[1];
      lastIndex = match.index + match[0].length;
    }

    // Add final section
    sections.set(lastSection, output.substring(lastIndex));

    return sections;
  }

  /**
   * Build truncated summary from sections
   */
  private buildTruncatedSummary(
    sections: Map<string, string>,
    options: Required<TruncationOptions>,
  ): string {
    let summary = "";
    let currentTokens = 0;
    let elementCount = 0;

    // Always include header/summary
    if (sections.has("header")) {
      summary += sections.get("header");
      currentTokens += this.estimateTokens(summary);
    }

    // Process critical elements first
    if (sections.has("CRITICAL AUTHENTICATION ELEMENTS")) {
      const critical = sections.get("CRITICAL AUTHENTICATION ELEMENTS")!;
      const truncatedCritical = this.truncateSection(
        critical,
        options.maxTokens - currentTokens,
        options.maxSnippetLength,
      );

      if (truncatedCritical) {
        summary += "\n=== CRITICAL AUTHENTICATION ELEMENTS ===\n";
        summary += truncatedCritical;
        currentTokens = this.estimateTokens(summary);
        elementCount += this.countElementsInSection(truncatedCritical);
      }
    }

    // Add important elements if room
    if (
      sections.has("IMPORTANT AUTHENTICATION ELEMENTS") &&
      currentTokens < options.maxTokens * 0.7 &&
      elementCount < options.maxElements
    ) {
      const important = sections.get("IMPORTANT AUTHENTICATION ELEMENTS")!;
      const truncatedImportant = this.truncateSection(
        important,
        options.maxTokens - currentTokens,
        options.maxSnippetLength,
      );

      if (truncatedImportant) {
        summary += "\n=== IMPORTANT AUTHENTICATION ELEMENTS ===\n";
        summary += truncatedImportant;
        currentTokens = this.estimateTokens(summary);
      }
    }

    // Add note if truncated
    if (currentTokens >= options.maxTokens * 0.9) {
      summary += "\n\n--- OUTPUT TRUNCATED TO FIT TOKEN LIMIT ---\n";
    }

    return summary;
  }

  /**
   * Truncate a single section
   */
  private truncateSection(
    section: string,
    maxTokens: number,
    maxSnippetLength: number,
  ): string {
    const elements = section.split(/\n(?=\[)/); // Split on element boundaries
    let result = "";
    let tokens = 0;

    for (const element of elements) {
      const truncatedElement = this.truncateSnippet(element, maxSnippetLength);
      const elementTokens = this.estimateTokens(truncatedElement);

      if (tokens + elementTokens > maxTokens) {
        break;
      }

      result += truncatedElement + "\n\n";
      tokens += elementTokens;
    }

    return result;
  }

  /**
   * Estimate token count (1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Count elements in output
   */
  private countElements(output: string): number {
    const matches = output.match(/\[(FUNCTION|CLASS|METHOD|VARIABLE)\]/g);
    return matches ? matches.length : 0;
  }

  /**
   * Count elements in a section
   */
  private countElementsInSection(section: string): number {
    return this.countElements(section);
  }

  /**
   * Extract element information
   */
  private extractElements(
    output: string,
  ): Array<{ name: string; type: string; file: string; line: number }> {
    const elements: Array<{
      name: string;
      type: string;
      file: string;
      line: number;
    }> = [];
    const elementRegex = /\[(.*?)\] (.*?)\nFile: (.*?):(\d+)/g;

    let match;
    while ((match = elementRegex.exec(output)) !== null) {
      elements.push({
        type: match[1],
        name: match[2],
        file: match[3],
        line: parseInt(match[4]),
      });
    }

    return elements;
  }

  /**
   * Group elements by type
   */
  private groupByType(
    elements: Array<{ name: string; type: string; file: string; line: number }>,
  ): Record<string, Array<{ name: string; file: string; line: number }>> {
    const grouped: Record<
      string,
      Array<{ name: string; file: string; line: number }>
    > = {};

    for (const element of elements) {
      if (!grouped[element.type]) {
        grouped[element.type] = [];
      }
      grouped[element.type].push({
        name: element.name,
        file: element.file,
        line: element.line,
      });
    }

    return grouped;
  }
}

/**
 * Quick helper function for common use case
 */
export function truncateForLLM(
  analysisOutput: string,
  maxTokens: number = 25000,
): string {
  const truncator = new LLMOutputTruncator();
  const result = truncator.truncate(analysisOutput, { maxTokens });

  if (result.truncated) {
    console.log(
      `Truncated from ${result.originalCount} to ${result.finalCount} elements`,
    );
    console.log(`Estimated tokens: ${result.estimatedTokens}`);
  }

  return result.summary;
}
