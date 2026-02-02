import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { RipgrepSearchTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainRipgrepTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: RipgrepSearchTool) {
    super();
    this.logger = Logger.initialize("LangChainRipgrepTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "ripgrep_search";
  description =
    "Search the codebase using regex patterns (powered by ripgrep). Efficiently finds text strings or patterns across files.";
  schema = z.object({
    pattern: z.string().describe("The regex pattern to search for."),
    glob: z
      .string()
      .optional()
      .describe(
        "Optional glob pattern to include/filter files (e.g., 'src/**/*.ts').",
      ),
  });

  async _call(input: { pattern: string; glob?: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.pattern, input.glob);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error executing search: ${error.message}`;
    }
  }
}
