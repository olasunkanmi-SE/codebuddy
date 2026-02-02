import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { SearchTool } from "../../../tools/tools";

export class LangChainSearchTool extends StructuredTool<any> {
  private readonly logger: Logger;

  constructor(private readonly toolInstance: SearchTool) {
    super();
    this.logger = Logger.initialize("SearchTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  name = "search_vector_db";
  schema = z.object({
    query: z
      .string()
      .min(1)
      .describe(
        "The user's question or topic to search for in the codebase knowledge base.",
      ),
  });

  description =
    "Search the codebase knowledge base for information related to the user's query. Use this to find code snippets, architectural decisions, or existing solutions within the project.";

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
