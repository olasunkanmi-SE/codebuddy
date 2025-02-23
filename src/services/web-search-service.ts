import { Readability } from "@mozilla/readability";
import axios from "axios";
import { JSDOM } from "jsdom";
import { generateQuerySting, WEB_SEARCH_CONFIG } from "../application/constant";
import { Logger } from "../infrastructure/logger/logger";
import { Orchestrator } from "../agents/orchestrator";

interface ArticleContent {
  url: string;
  content: string;
}

export class WebSearchService {
  protected readonly orchestrator: Orchestrator;
  private static instance: WebSearchService;
  private readonly baseUrl = WEB_SEARCH_CONFIG.baseUrl;
  private readonly logger: Logger;
  private readonly userAgent = WEB_SEARCH_CONFIG.userAgent;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.orchestrator = Orchestrator.getInstance();
  }

  public static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService(
        new Logger("WebSearchService"),
      );
    }
    return WebSearchService.instance;
  }

  private async fetchArticleContent(url: string): Promise<ArticleContent> {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const html = response.data;
      const dom = new JSDOM(html);
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      const content = article?.textContent
        ? article.textContent.trim().slice(0, 10000)
        : "No readable content found";
      return { url, content: content.trim() };
    } catch (error: any) {
      this.logger.error(`Failed to fetch ${url}: ${error.message}`, error);
      return { url, content: `Error fetching content from ${url}` };
    }
  }

  private async extractUrlsFromSearchPage(
    searchUrl: string,
  ): Promise<string[]> {
    try {
      const response = await axios.get(searchUrl, {
        timeout: 5000,
        headers: {
          Accept: "text/html",
          "User-Agent": this.userAgent,
        },
      });

      const dom = new JSDOM(response.data);
      const urlElements =
        dom.window.document.querySelectorAll("a.wgl-display-url");
      const urls = Array.from(urlElements)
        .map((el) => el.getAttribute("href"))
        .filter((url): url is string => !!url && url.startsWith("http"))
        .slice(0, 10);

      this.logger.info(`Extracted URLs: ${urls.join(", ")}`);
      if (urls?.length) {
        this.orchestrator.publish("onUpdate", urls.join("\n\n"));
      }
      return urls;
    } catch (error: any) {
      this.logger.error(
        `Error fetching or parsing search results: ${error.message}`,
        error,
      );
      throw new Error(`Error fetching search results: ${error.message}`);
    }
  }

  public async run(query: string): Promise<string> {
    if (!query || query.trim().length < 2) {
      return "Query too short or invalid.";
    }

    const queryString = generateQuerySting(query);
    const searchUrl = `${this.baseUrl}${queryString}`;

    try {
      const urls = await this.extractUrlsFromSearchPage(searchUrl);

      if (urls.length === 0) {
        return `No web results found for "${query}" on Startpage.`;
      }

      const contextPromises = urls
        .slice(0, 5)
        .map((url) => this.fetchArticleContent(url));
      const contextResults = await Promise.all(contextPromises);
      const combinedContext = contextResults
        .map((result) => result.content)
        .join("\n\n");

      if (!combinedContext) {
        return `No content retrieved for "${query}".`;
      }

      return combinedContext;
    } catch (error: any) {
      this.logger.error(`search error: ${error.message}`, error);
      return `Error searching the web: ${error.message}`;
    }
  }
}
