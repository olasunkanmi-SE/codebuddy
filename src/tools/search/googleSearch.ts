import { customsearch_v1 as GoogleSearchAPI } from "@googleapis/customsearch";
import { Logger } from "../../infrastructure/logger/logger";

export class GoogleSearchTool {
  static readonly MAX_SEARCH_RESULT = 10;
  protected logger: Logger;
  constructor(private readonly apiKey: string) {
    this.logger = new Logger("GoogleSearchTool");
  }

  get client() {
    return new GoogleSearchAPI.Customsearch({ auth: this.apiKey });
  }

  async search(query: string) {
    try {
      if (!query.length) throw new Error("User query cannot be empty");
      const response = await this.client.cse.list({
        q: query.trim(),
        num: GoogleSearchTool.MAX_SEARCH_RESULT,
      });

      if (Array.isArray(response?.data?.items)) {
        response.data.items.forEach((item) => ({
          title: item.title ?? "",
          description: item.snippet ?? "",
          url: item.link ?? "",
        }));
      }
      return response;
    } catch (error) {
      this.logger.error("Error while searching google", error);
      throw new Error("Failed to search google api");
    }
  }
}
