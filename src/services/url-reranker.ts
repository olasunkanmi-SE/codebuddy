import {
  RELEVANT_CODING_KEY_WORDS,
  REPUTATION_RANK_MAP,
  URL_CATEGORIES,
  URL_RERANKING_CONFIG,
} from "../application/constant";
import { IPageMetada } from "./web-search-service";

/**
 * Configuration interface for URL reranking parameters
 */
interface IRerankingConfig {
  titleRelevanceWeight: number;
  sourceReputationWeight: number;
  contentQualityWeight: number;
  userContextWeight: number;
  contentFreshnessWeight: number;
  diversityWeight: number;
}

export class UrlReranker {
  private static readonly CONFIG: IRerankingConfig = URL_RERANKING_CONFIG;
  private static readonly KEYWORDS: string[] = RELEVANT_CODING_KEY_WORDS;
  private static readonly WEBSITE_REPUTATIONS: Record<string, number> =
    REPUTATION_RANK_MAP;
  private static readonly CATEGORIES: Record<
    string,
    { type: string; score: number }
  > = URL_CATEGORIES;
  private static instance: UrlReranker;
  query: string;

  constructor(_query: string) {
    this.query = _query;
  }

  static getInstance(query: string) {
    if (!UrlReranker.instance) {
      UrlReranker.instance = new UrlReranker(query);
    }
    return UrlReranker.instance;
  }

  /**
   * Extracts hostname from a given URL
   * @param metadata Page metadata containing the URL
   * @returns Hostname of the URL
   */
  private extractHostname(metadata: IPageMetada): string {
    return new URL(metadata.url).hostname;
  }

  /**
   * Calculates title relevance score based on keyword matches
   * @param title Page title to evaluate
   * @returns Score between 0 and 1 representing title relevance
   */
  private calculateTitleRelevanceScore(title: string): number {
    if (!title) return 0;

    const matches = UrlReranker.KEYWORDS.filter((keyword) =>
      title.toLowerCase().includes(keyword.toLowerCase()),
    );

    return matches.length / UrlReranker.KEYWORDS.length;
  }

  /**
   * Calculates source reputation score based on domain
   * @param metadata Page metadata containing the URL
   * @returns Reputation score for the domain
   */
  private calculateSourceReputationScore(metadata: IPageMetada): number {
    const hostname = this.extractHostname(metadata);
    const domain = hostname.split(".").slice(-2).join(".");

    return (
      UrlReranker.WEBSITE_REPUTATIONS[domain] ||
      UrlReranker.WEBSITE_REPUTATIONS.default
    );
  }

  /**
   * Calculates content quality score based on code blocks and explanation length
   * @param metadata Page metadata containing the content
   * @returns Quality score for the content
   */
  private calculateContentQualityScore(metadata: IPageMetada): number {
    if (!metadata.content) return 0;

    const codeBlockCount = this.countCodeBlocks(metadata.content);
    const hasAdequateExplanation = this.hasAdequateExplanation(
      metadata.content,
    );

    return codeBlockCount + (hasAdequateExplanation ? 1 : 0);
  }

  private countCodeBlocks(content: string): number {
    return (content.match(/<code\b[^*]>[^<]*<\/code>/gm) || []).length;
  }

  private hasAdequateExplanation(content: string): boolean {
    const texts = content.split(/<code\b[^*]>[^<]*<\/code>/);
    return texts.some((text) => text.length > 100);
  }

  /**
   * Calculates diversity score based on URL category
   * @param metadata Page metadata containing the URL
   * @returns Diversity score
   */
  private calculateDiversityScore(metadata: IPageMetada): number {
    const hostname = new URL(metadata.url).hostname;
    const category = UrlReranker.CATEGORIES[hostname] || { score: 0 };
    return category.score;
  }

  /**
   * Calculates the final reranking score for a page
   * @param metadata Page metadata
   * @returns Final score for reranking
   */
  calculateFinalScore(metadata: IPageMetada): number {
    const titleRelevanceScore = this.calculateTitleRelevanceScore(
      metadata.title ?? "",
    );
    const reputationScore = this.calculateSourceReputationScore(metadata);
    const contentQualityScore = this.calculateContentQualityScore(metadata);
    const diversityScore = this.calculateDiversityScore(metadata);

    return (
      titleRelevanceScore * UrlReranker.CONFIG.titleRelevanceWeight +
      reputationScore * UrlReranker.CONFIG.sourceReputationWeight +
      contentQualityScore * UrlReranker.CONFIG.contentQualityWeight +
      4 * 0.3 +
      diversityScore * UrlReranker.CONFIG.diversityWeight
    );
  }
}
