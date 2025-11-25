import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { TravilySearchTool } from "../../../tools/tools";

export class LangChainTravilySearchTool extends StructuredTool<any> {
  private readonly logger: Logger;

  constructor(private readonly toolInstance: TravilySearchTool) {
    super();
    this.logger = Logger.initialize("TravilySearchTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  name = "web_search";
  schema = z.object({
    query: z.string().min(1).describe("Search query"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results"),
    includeRawContent: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include raw HTML content"),
    timeout: z
      .number()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  });

  description = `Search the web for current information, documentation, or solutions.
            Use this when you need:
            - Current events or real-time data
            - External documentation
            - Stack Overflow solutions
            - API references
  
            Returns formatted results with titles, URLs, and content snippets.`;

  async _call(input: { query: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.query);
      return result ?? "";
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      throw error;
    }
  }
}
