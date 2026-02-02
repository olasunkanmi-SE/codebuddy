import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { SymbolSearchTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainSymbolSearchTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: SymbolSearchTool) {
    super();
    this.logger = Logger.initialize("LangChainSymbolSearchTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "search_symbols";
  description =
    "Search for symbols (classes, functions, variables) across the workspace using the editor's LSP. Good for finding definitions without knowing the exact file.";
  schema = z.object({
    query: z
      .string()
      .describe("The symbol name or partial name to search for."),
  });

  async _call(input: { query: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.query);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error searching symbols: ${error.message}`;
    }
  }
}
