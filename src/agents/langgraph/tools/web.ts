import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { WebTool } from "../../../tools/tools";

export class LangChainWebTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: WebTool) {
    super();
    this.logger = Logger.initialize("GeminiLLM", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  name = "web_search";
  description: string =
    "Search the internet for general programming knowledge, best practices, or solutions to common coding problems. Useful for understanding concepts, exploring different approaches, or finding external libraries.";
  schema = z.object({
    query: z
      .string()
      .describe(
        "The search query to use when searching the web for relevant information.",
      ),
  });

  async _call(input: { query: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.query);
      return JSON.stringify(result);
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      throw error;
    }
  }
}
