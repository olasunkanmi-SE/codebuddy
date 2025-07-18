import { Readability } from "@mozilla/readability";
import axios from "axios";
import { JSDOM } from "jsdom";
import { Orchestrator } from "../agents/orchestrator";
import { PRIORITY_URLS, WEB_SEARCH_CONFIG } from "../application/constant";
import { Logger } from "../infrastructure/logger/logger";
import { generateQueryString } from "../utils/utils";
import { UrlReranker } from "./url-reranker";

interface ArticleContent {
  url: string;
  content: string;
}

export interface IPageMetada {
  url: string;
  favicon: string;
  title: string | undefined;
  content?: string;
  publishedDate?: Date;
  sourceReputation?: number;
}

export class WebSearchService {
  protected readonly orchestrator: Orchestrator;
  private static instance: WebSearchService;
  private readonly baseUrl = WEB_SEARCH_CONFIG.baseUrl;
  private readonly logger: Logger;
  private readonly userAgent = WEB_SEARCH_CONFIG.userAgent;
  private readonly urlRanker: UrlReranker;
  static readonly URL_PRIORITY_LIST = PRIORITY_URLS;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.orchestrator = Orchestrator.getInstance();
    this.urlRanker = new UrlReranker("");
  }

  public static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService(
        new Logger("WebSearchService"),
      );
    }
    return WebSearchService.instance;
  }

  private async fetchArticleContent(
    url: string,
  ): Promise<ArticleContent | undefined> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent": this.userAgent,
        },
      });
      const html = response.data;
      const dom = new JSDOM(html);

      // Try Readability first
      const content =
        this.extractContentWithReadability(dom) ||
        this.extractContentWithSelectors(dom) ||
        this.extractContentFallback(dom, url);

      return { url, content: content.trim() };
    } catch (error: any) {
      this.logger.warn(`Failed to fetch ${url}: ${error.message}`, error);
      return {
        url: "",
        content: `Error fetching content from ${url}: ${error.message}`,
      };
    }
  }

  private extractContentWithReadability(dom: JSDOM): string | null {
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article?.textContent && article.textContent.trim().length > 100) {
      return article.textContent.trim().slice(0, 10000);
    }
    return null;
  }

  private extractContentWithSelectors(dom: JSDOM): string | null {
    const doc = dom.window.document;
    const contentSelectors = [
      "main",
      "article",
      ".content",
      ".markdown-body",
      ".docs-content",
      '[role="main"]',
      "body",
    ];

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent || "";
        if (text.trim().length > 100) {
          return text.trim().slice(0, 10000);
        }
      }
    }
    return null;
  }

  private extractContentFallback(dom: JSDOM, url: string): string {
    const doc = dom.window.document;
    const allText = doc.body?.textContent || "";

    if (allText.trim().length > 50) {
      return allText.trim().slice(0, 10000);
    }

    return `Content could not be extracted from ${url}. This may be a JavaScript-rendered page or have restricted access.`;
  }

  private async fetchSearchResultMetadata(
    searchUrl: string,
  ): Promise<IPageMetada[]> {
    try {
      const response = await axios.get(searchUrl, {
        timeout: 10000,
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
        .slice(0, 12);

      const pagesMetaData: IPageMetada[] = await Promise.all(
        urls.map(async (url) => {
          const metadata = await this.extracturlMetaData(url);
          return metadata;
        }),
      );

      this.logger.info(`Extracted URLs: ${urls.join(", ")}`);
      if (pagesMetaData?.length) {
        this.orchestrator.publish(
          "onUpdate",
          pagesMetaData.map((item) => JSON.stringify(item)).join("\n\n"),
        );
      }

      console.log(pagesMetaData);
      return pagesMetaData.filter(
        ({ url, favicon }) => url.length > 1 && favicon.length > 1,
      );
    } catch (error: any) {
      this.logger.error(
        `Error fetching or parsing search results: ${error.message}`,
        error,
      );
      return [];
    }
  }

  private async extracturlMetaData(
    url: string,
  ): Promise<{ url: string; title: string | undefined; favicon: string }> {
    try {
      const parsedUrl = new URL(url);
      const origin = parsedUrl.origin;
      let favicon = "";
      let title: string | undefined;

      try {
        const response = await axios.get(url, {
          timeout: 3000,
          headers: {
            "User-Agent": this.userAgent,
          },
        });

        const dom = new JSDOM(response.data);
        const doc = dom.window.document;

        title = this.extractTitle(doc);

        const faviconElement = doc.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]',
        );

        favicon = await this.extractFavicon(faviconElement, origin, parsedUrl);
      } catch (error: any) {
        this.logger.warn(
          `Error fetching page for metadata extraction (${url}): ${error.message}`,
          error,
        );
        favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
        title = parsedUrl.hostname.slice(0, 20);
        return { url: url ?? "", favicon: favicon ?? "", title: title ?? "" };
      }
      return { url, favicon, title };
    } catch (error: any) {
      this.logger.warn(
        `Error fetching favicon and title for ${url}: ${error.message}`,
      );
      return { url: "", title: "", favicon: "" };
    }
  }

  private extractTitle(doc: Document): string | undefined {
    let title: string | undefined;

    let titleElement = doc.querySelector("title");
    if (titleElement) {
      title = titleElement.textContent?.trim();
    }

    if (!title) {
      let ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        title = ogTitle.getAttribute("content")?.trim();
      }
    }

    if (!title) {
      let twitterTitle = doc.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        title = twitterTitle.getAttribute("content")?.trim();
      }
    }

    return title;
  }

  private async extractFavicon(
    faviconElement: Element | null,
    origin: string,
    parsedUrl: URL,
  ): Promise<string> {
    let favicon = "";

    if (faviconElement?.getAttribute("href")) {
      const faviconHref = faviconElement.getAttribute("href")!;
      favicon = faviconHref.startsWith("http")
        ? faviconHref
        : new URL(faviconHref, origin).href;
    }
    if (!favicon) {
      const rootFaviconUrl = `${origin}/favicon.ico`;

      try {
        const faviconResponse = await axios.head(rootFaviconUrl, {
          timeout: 5000,
        });
        if (faviconResponse.status === 200) {
          favicon = rootFaviconUrl;
        }
      } catch (error: any) {
        this.logger.info(`unable to fetch Favicons ${error.message}`, error);
        return "";
      }
    }
    if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
    }

    return favicon ?? "";
  }

  public async run(query: string): Promise<string[] | string> {
    this.urlRanker.query = query;
    if (!query || query.trim().length < 2) {
      return "Query too short or invalid.";
    }

    const queryString = generateQueryString(query);
    const searchUrl = `${this.baseUrl}${queryString}`;

    try {
      const pageMetadata = await this.fetchSearchResultMetadata(searchUrl);
      if (pageMetadata.length === 0) {
        return this.generateFallbackContent(query);
      }
      const excludedURLs = [
        "medium.com",
        "linkedin.com",
        "naukri.com",
        "akamai.com",
        "x.com",
        "reuters.com",
        "cbinsights.com",
        "openai.com",
        "sp-edge.com",
        "accuweather.com",
        "www.blockchain-council.org",
      ];

      const crawleableMetadata: IPageMetada[] = [];

      pageMetadata.forEach((meta) => {
        const urlObj = new URL(meta.url);
        const domain = urlObj.hostname.toLowerCase();
        if (!excludedURLs.some((ex) => domain.includes(ex))) {
          crawleableMetadata.push(meta);
        }
      });

      const urls = this.sortUrlsByPriority(
        crawleableMetadata,
        WebSearchService.URL_PRIORITY_LIST,
      ).filter((url) => !url.includes("youtube.com"));

      const contextPromises = urls
        .slice(0, 3)
        .map((url) => this.fetchArticleContent(url));
      const contextResults = await Promise.all(contextPromises);
      const filteredContext = contextResults.filter((c) => c !== undefined);
      const combinedContent = filteredContext
        .map((result) => result?.content)
        .join("\n\n");

      // If no meaningful content was extracted, provide a fallback
      if (!combinedContent || combinedContent.trim().length < 100) {
        return this.generateFallbackContent(query);
      }

      return combinedContent;
    } catch (error: any) {
      this.logger.info(`search error: ${error.message}`, error);
      return this.generateFallbackContent(query);
    }
  }

  private generateFallbackContent(query: string): string {
    return `I searched for "${query}" but couldn't retrieve detailed content from the web sources. This might be due to:

1. **Dynamic content**: Many modern websites load content with JavaScript
2. **Access restrictions**: Some sites block automated requests
3. **Network issues**: Temporary connectivity problems

However, I can still help you with general knowledge about "${query}". Please let me know if you'd like me to:
- Provide general information about this topic
- Help with specific implementation details
- Suggest alternative approaches or resources

What specific aspect of "${query}" would you like to explore?`;
  }

  readonly sortUrlsByPriority = (
    metadata: IPageMetada[],
    priorityDomains: string[],
  ): string[] => {
    const priorityUrls: string[] = [];
    const otherUrls: string[] = [];

    metadata.forEach((m) => {
      try {
        const urlObj = new URL(m.url);
        const domain = urlObj.hostname.toLowerCase();

        if (priorityDomains.some((priority) => domain.includes(priority))) {
          priorityUrls.push(m.url);
        } else {
          otherUrls.push(m.url);
        }
      } catch (error: any) {
        this.logger.warn(`Invalid URL skipped: ${m.url}`, error);
        otherUrls.push(m.url);
      }
    });
    return [...priorityUrls, ...otherUrls];
  };
}
