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

interface IPageMetada {
  url: string;
  favicon: string;
  title: string | undefined;
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

  private async fetchSearchResultMetadata(
    searchUrl: string,
  ): Promise<IPageMetada[]> {
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
      return pagesMetaData;
    } catch (error: any) {
      this.logger.error(
        `Error fetching or parsing search results: ${error.message}`,
        error,
      );
      throw new Error(`Error fetching search results: ${error.message}`);
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
      } catch (error) {
        favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
        title = parsedUrl.hostname;
      }
      return { url, favicon, title };
    } catch (error: any) {
      this.logger.warn(
        `Error fetching favicon and title for ${url}: ${error.message}`,
      );
      throw new Error(`Error fetching Favicons and title: ${error.message}`);
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
          timeout: 2000,
        });
        if (faviconResponse.status === 200) {
          favicon = rootFaviconUrl;
        }
      } catch (error: any) {
        this.logger.error(`unable to fetch Favicons ${error.message}`, error);
        throw new Error(`Error fetching Favicons: ${error.message}`);
      }
    }
    if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
    }

    return favicon;
  }

  public async run(query: string): Promise<string> {
    if (!query || query.trim().length < 2) {
      return "Query too short or invalid.";
    }

    const queryString = generateQuerySting(query);
    const searchUrl = `${this.baseUrl}${queryString}`;

    try {
      const urls = await this.fetchSearchResultMetadata(searchUrl);

      if (urls.length === 0) {
        return `No web results found for "${query}" on Startpage.`;
      }

      const contextPromises = urls
        .slice(0, 5)
        .map(({ url }) => this.fetchArticleContent(url));
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
