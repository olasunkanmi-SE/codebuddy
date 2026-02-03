/**
 * ResultSynthesizerService - Transforms raw tool results into clean, user-friendly summaries
 *
 * This service creates Claude-like synthesized responses from raw search results,
 * code analysis, and other tool outputs.
 */

export interface ISynthesizedResult {
  /** Short title/headline for the result */
  title: string;
  /** Clean, synthesized summary */
  summary: string;
  /** Key insights or takeaways */
  keyPoints: string[];
  /** Source references */
  sources?: ISourceReference[];
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Result type for UI rendering */
  type: ResultType;
  /** Raw data for expandable details */
  rawData?: any;
}

export interface ISourceReference {
  title: string;
  url?: string;
  snippet?: string;
  relevance?: number;
}

export type ResultType =
  | "web_search"
  | "code_analysis"
  | "file_read"
  | "code_search"
  | "documentation"
  | "error"
  | "general";

export interface ISearchResultItem {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface ISearchResponse {
  answer?: string;
  results: ISearchResultItem[];
  query: string;
}

export class ResultSynthesizerService {
  private static instance: ResultSynthesizerService;

  static getInstance(): ResultSynthesizerService {
    return (ResultSynthesizerService.instance ??=
      new ResultSynthesizerService());
  }

  /**
   * Synthesize web search results into a clean summary
   */
  synthesizeWebSearch(response: ISearchResponse): ISynthesizedResult {
    const { answer, results, query } = response;

    if (results.length === 0) {
      return {
        title: "No Results Found",
        summary: `No relevant results were found for "${query}". Try rephrasing your search or using different keywords.`,
        keyPoints: [
          "Consider using more specific terms",
          "Try alternative search phrases",
        ],
        confidence: "low",
        type: "web_search",
        rawData: response,
      };
    }

    // Extract key information from results
    const topResults = results.slice(0, 3);
    const keyPoints = this.extractKeyPointsFromSearch(topResults);
    const sources = this.formatSources(results);

    // Create a synthesized summary
    let summary: string;
    if (answer) {
      summary = answer;
    } else {
      summary = this.generateSearchSummary(query, topResults);
    }

    return {
      title: `Search Results: ${this.truncate(query, 50)}`,
      summary,
      keyPoints,
      sources,
      confidence: this.calculateConfidence(results),
      type: "web_search",
      rawData: response,
    };
  }

  /**
   * Synthesize code analysis results
   */
  synthesizeCodeAnalysis(
    files: string[],
    analysis: string,
    findings?: any[],
  ): ISynthesizedResult {
    const keyPoints = this.extractKeyPointsFromText(analysis);

    return {
      title: `Code Analysis: ${files.length} file${files.length > 1 ? "s" : ""}`,
      summary: this.cleanAnalysisSummary(analysis),
      keyPoints: keyPoints.slice(0, 5),
      confidence: "high",
      type: "code_analysis",
      rawData: { files, analysis, findings },
    };
  }

  /**
   * Synthesize file read results
   */
  synthesizeFileRead(
    filePath: string,
    content: string,
    purpose?: string,
  ): ISynthesizedResult {
    const fileName = filePath.split("/").pop() || filePath;
    const lineCount = content.split("\n").length;
    const fileExt = fileName.split(".").pop() || "";

    return {
      title: `File: ${fileName}`,
      summary: `Read ${lineCount} lines from ${fileName}${purpose ? ` for ${purpose}` : ""}.`,
      keyPoints: [
        `File type: ${this.getFileTypeDescription(fileExt)}`,
        `Size: ${lineCount} lines`,
        ...this.extractCodeStructure(content, fileExt),
      ],
      confidence: "high",
      type: "file_read",
      rawData: { filePath, lineCount, fileExt },
    };
  }

  /**
   * Synthesize codebase search results
   */
  synthesizeCodebaseSearch(
    query: string,
    results: Array<{ file: string; matches: string[]; score?: number }>,
  ): ISynthesizedResult {
    if (results.length === 0) {
      return {
        title: "Codebase Search",
        summary: `No matches found for "${query}" in the codebase.`,
        keyPoints: [
          "Try broader search terms",
          "Check spelling of technical terms",
        ],
        confidence: "medium",
        type: "code_search",
        rawData: { query, results },
      };
    }

    const matchCount = results.reduce((acc, r) => acc + r.matches.length, 0);
    const fileCount = results.length;

    return {
      title: `Found ${matchCount} matches in ${fileCount} files`,
      summary: `Searched for "${query}" and found ${matchCount} relevant matches across ${fileCount} file${fileCount > 1 ? "s" : ""}.`,
      keyPoints: results.slice(0, 5).map((r) => {
        const fileName = r.file.split("/").pop() || r.file;
        return `${fileName}: ${r.matches.length} match${r.matches.length > 1 ? "es" : ""}`;
      }),
      sources: results.map((r) => ({
        title: r.file.split("/").pop() || r.file,
        snippet: r.matches[0],
        relevance: r.score,
      })),
      confidence: this.calculateCodeSearchConfidence(results),
      type: "code_search",
      rawData: { query, results },
    };
  }

  /**
   * Create an error result
   */
  synthesizeError(
    operation: string,
    error: Error | string,
  ): ISynthesizedResult {
    const errorMessage = typeof error === "string" ? error : error.message;

    return {
      title: `Error: ${operation}`,
      summary: `An error occurred while ${operation.toLowerCase()}: ${errorMessage}`,
      keyPoints: [
        "The operation could not be completed",
        "Try again or rephrase your request",
      ],
      confidence: "low",
      type: "error",
      rawData: { operation, error: errorMessage },
    };
  }

  /**
   * Format results as clean markdown for display
   */
  formatAsMarkdown(result: ISynthesizedResult): string {
    const parts: string[] = [];

    // Don't show title in markdown - it will be shown in the UI card
    parts.push(result.summary);

    if (result.keyPoints.length > 0) {
      parts.push("\n**Key Points:**");
      result.keyPoints.forEach((point) => {
        parts.push(`• ${point}`);
      });
    }

    if (result.sources && result.sources.length > 0) {
      parts.push("\n**Sources:**");
      result.sources.slice(0, 3).forEach((source, i) => {
        if (source.url) {
          parts.push(`${i + 1}. [${source.title}](${source.url})`);
        } else {
          parts.push(`${i + 1}. ${source.title}`);
        }
      });
    }

    return parts.join("\n");
  }

  /**
   * Format results as compact summary for tool activity feed
   */
  formatAsCompactSummary(result: ISynthesizedResult): string {
    const { type, summary, keyPoints, sources } = result;

    switch (type) {
      case "web_search":
        return sources
          ? `Found ${sources.length} sources: ${keyPoints[0] || summary}`
          : summary;
      case "code_analysis":
        return keyPoints[0] || "Analysis complete";
      case "file_read":
        return summary;
      case "code_search":
        return summary;
      case "error":
        return summary;
      default:
        return summary;
    }
  }

  // --- Private Helper Methods ---

  private extractKeyPointsFromSearch(results: ISearchResultItem[]): string[] {
    const points: string[] = [];

    results.forEach((result) => {
      // Extract first sentence or meaningful phrase
      const content = result.content || "";
      const firstSentence = content.match(/^[^.!?]+[.!?]/)?.[0];
      if (
        firstSentence &&
        firstSentence.length > 20 &&
        firstSentence.length < 200
      ) {
        points.push(this.truncate(firstSentence, 100));
      }
    });

    // Deduplicate and limit
    return [...new Set(points)].slice(0, 4);
  }

  private extractKeyPointsFromText(text: string): string[] {
    const points: string[] = [];

    // Look for bullet points
    const bulletMatches = text.match(/[-•*]\s+[^\n]+/g);
    if (bulletMatches) {
      points.push(
        ...bulletMatches.map((m) => m.replace(/^[-•*]\s+/, "").trim()),
      );
    }

    // Look for numbered items
    const numberedMatches = text.match(/\d+\.\s+[^\n]+/g);
    if (numberedMatches) {
      points.push(
        ...numberedMatches.map((m) => m.replace(/^\d+\.\s+/, "").trim()),
      );
    }

    // If no structured points, extract key sentences
    if (points.length === 0) {
      const sentences = text
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      points.push(
        ...sentences.slice(0, 3).map((s) => this.truncate(s.trim(), 100)),
      );
    }

    return [...new Set(points)].slice(0, 5);
  }

  private formatSources(results: ISearchResultItem[]): ISourceReference[] {
    return results.map((r) => ({
      title: r.title || "Unknown Source",
      url: r.url,
      snippet: this.truncate(r.content, 150),
      relevance: r.score ? Math.round(r.score * 100) : undefined,
    }));
  }

  private generateSearchSummary(
    query: string,
    results: ISearchResultItem[],
  ): string {
    if (results.length === 0) {
      return `No results found for "${query}".`;
    }

    const topResult = results[0];
    const snippets = results
      .slice(0, 2)
      .map((r) => this.truncate(r.content, 100))
      .join(" ");

    return `Based on ${results.length} search results for "${query}": ${this.truncate(snippets, 300)}`;
  }

  private cleanAnalysisSummary(analysis: string): string {
    // Remove excess whitespace and code blocks for summary
    return analysis
      .replace(/```[\s\S]*?```/g, "[code]")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 500);
  }

  private getFileTypeDescription(ext: string): string {
    const types: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript React",
      js: "JavaScript",
      jsx: "JavaScript React",
      py: "Python",
      java: "Java",
      rb: "Ruby",
      go: "Go",
      rs: "Rust",
      cpp: "C++",
      c: "C",
      h: "C/C++ Header",
      css: "CSS",
      scss: "SCSS",
      html: "HTML",
      json: "JSON",
      yaml: "YAML",
      yml: "YAML",
      md: "Markdown",
      sql: "SQL",
    };
    return types[ext.toLowerCase()] || ext.toUpperCase();
  }

  private extractCodeStructure(content: string, ext: string): string[] {
    const structure: string[] = [];

    if (["ts", "tsx", "js", "jsx"].includes(ext.toLowerCase())) {
      // Count exports
      const exportCount = (
        content.match(/export\s+(const|function|class|interface|type)/g) || []
      ).length;
      if (exportCount > 0) {
        structure.push(`${exportCount} export${exportCount > 1 ? "s" : ""}`);
      }

      // Count functions
      const functionCount = (
        content.match(
          /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()/g,
        ) || []
      ).length;
      if (functionCount > 0) {
        structure.push(
          `${functionCount} function${functionCount > 1 ? "s" : ""}`,
        );
      }

      // Count classes
      const classCount = (content.match(/class\s+\w+/g) || []).length;
      if (classCount > 0) {
        structure.push(`${classCount} class${classCount > 1 ? "es" : ""}`);
      }
    }

    return structure.slice(0, 3);
  }

  private calculateConfidence(
    results: ISearchResultItem[],
  ): "high" | "medium" | "low" {
    if (results.length === 0) return "low";

    const avgScore =
      results.reduce((acc, r) => acc + (r.score || 0.5), 0) / results.length;

    if (avgScore >= 0.7 && results.length >= 3) return "high";
    if (avgScore >= 0.4 && results.length >= 2) return "medium";
    return "low";
  }

  private calculateCodeSearchConfidence(
    results: Array<{ file: string; matches: string[]; score?: number }>,
  ): "high" | "medium" | "low" {
    const totalMatches = results.reduce((acc, r) => acc + r.matches.length, 0);

    if (totalMatches >= 5 && results.length >= 2) return "high";
    if (totalMatches >= 2) return "medium";
    return "low";
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
  }
}
