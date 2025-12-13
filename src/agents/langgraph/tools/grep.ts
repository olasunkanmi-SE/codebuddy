import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { GrepTool } from "../../../tools/tools";

export class LangChainGrepTool extends StructuredTool<any> {
  private readonly logger: Logger;

  constructor(private readonly toolInstance: GrepTool) {
    super();
    this.logger = Logger.initialize("LangChainGrepTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  name = "workspace_grep_search";
  description =
    "Search the active workspace using ripgrep. Provide patterns to locate references or related code rapidly.";
  schema = z.object({
    pattern: z
      .string()
      .min(1)
      .describe("Search pattern (regex or plain text) to locate."),
    glob: z
      .string()
      .min(1)
      .optional()
      .describe("Optional glob to limit files, e.g. **/*.ts."),
    caseSensitive: z
      .boolean()
      .optional()
      .default(false)
      .describe("Run a case-sensitive search when true."),
    maxResults: z
      .number()
      .int()
      .positive()
      .optional()
      .default(200)
      .describe("Maximum number of matches to return."),
  });

  async _call(input: {
    pattern: string;
    glob?: string;
    caseSensitive?: boolean;
    maxResults?: number;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );

    try {
      const result = await this.toolInstance.execute(input);
      if (typeof result === "string") {
        return result;
      }
      return result ? JSON.stringify(result) : "No output.";
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error?.message}`, {
        input,
        error,
      });
      throw error;
    }
  }
}
