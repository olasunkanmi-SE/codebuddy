// src/tools/websearch.ts

import { getAPIKeyAndModel } from "../../utils/utils";

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface SearchResponse {
  answer?: string;
  results: SearchResultItem[];
  query: string;
}

export interface ISearchProvider {
  search(query: string, options: SearchOptions): Promise<SearchResponse>;
}

export interface SearchOptions {
  maxResults: number;
  includeRawContent: boolean;
  timeout: number;
}

// --- Concrete Implementation (Tavily) ---

export class TavilySearchProvider implements ISearchProvider {
  private readonly API_URL = "https://api.tavily.com/search";
  private static instance: TavilySearchProvider;
  private readonly apiKey = getAPIKeyAndModel("tavily").apiKey;

  static getInstance(): TavilySearchProvider {
    return (TavilySearchProvider.instance ??= new TavilySearchProvider());
  }

  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout);

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: query,
          max_results: options?.maxResults,
          include_answer: true,
          include_raw_content: options?.includeRawContent,
          search_depth: "advanced",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return this.normalizeResponse(data, query);
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${options?.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private normalizeResponse(data: any, query: string): SearchResponse {
    return {
      query,
      answer: data.answer,
      results: (data.results || []).map((r: any) => ({
        title: r.title || "No Title",
        url: r.url || "N/A",
        content: r.content || "No content available",
        score: r.score,
      })),
    };
  }
}

export class SearchResponseFormatter {
  /**
   * Format search response as synthesized summary (default)
   */
  static format(response: SearchResponse): string {
    return SearchResponseFormatter.formatSynthesized(response);
  }

  /**
   * Format as clean, synthesized summary for Claude-like output
   */
  static formatSynthesized(response: SearchResponse): string {
    const { answer, results, query } = response;
    const parts: string[] = [];

    if (results.length === 0) {
      return `No relevant results found for "${query}". Try using different keywords or rephrasing your search.`;
    }

    // Lead with the answer if available
    if (answer) {
      parts.push(answer);
      parts.push("");
    } else {
      // Generate a summary from top results
      const topContent = results
        .slice(0, 2)
        .map((r) => r.content)
        .join(" ")
        .slice(0, 400);
      parts.push(
        `Based on ${results.length} search results: ${topContent}${topContent.length >= 400 ? "..." : ""}`,
      );
      parts.push("");
    }

    // Key sources (compact)
    parts.push("**Sources:**");
    results.slice(0, 3).forEach((result, index) => {
      parts.push(`${index + 1}. [${result.title}](${result.url})`);
    });

    return parts.join("\n");
  }

  /**
   * Format as detailed raw output (for expandable details)
   */
  static formatDetailed(response: SearchResponse): string {
    const { answer, results, query } = response;
    const parts: string[] = [];

    if (answer) {
      parts.push(`## Quick Answer:\n${answer}\n`);
    }

    parts.push(`## Search Results for: "${query}"`);
    parts.push(`Found ${results.length} results\n`);

    if (results.length === 0) {
      parts.push(`No results found. Try different keywords.`);
      return parts.join("\n");
    }

    results.forEach((result, index) => {
      parts.push(`### ${index + 1}. ${result.title}`);
      parts.push(`**URL:** ${result.url}`);
      parts.push(`**Content:** ${result.content}`);
      if (result.score) {
        parts.push(`**Relevance:** ${(result.score * 100).toFixed(1)}%`);
      }
      parts.push("");
    });

    return parts.join("\n");
  }

  /**
   * Get structured data for UI components
   */
  static toStructured(response: SearchResponse): {
    query: string;
    answer?: string;
    resultCount: number;
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance?: number;
    }>;
  } {
    return {
      query: response.query,
      answer: response.answer,
      resultCount: response.results.length,
      sources: response.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content.slice(0, 200),
        relevance: r.score ? Math.round(r.score * 100) : undefined,
      })),
    };
  }
}
