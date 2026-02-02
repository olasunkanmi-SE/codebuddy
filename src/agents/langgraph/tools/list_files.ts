import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { ListFilesTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainListFilesTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: ListFilesTool) {
    super();
    this.logger = Logger.initialize("LangChainListFilesTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "list_files";
  description =
    "List files and directories in a given path. Use this to explore the project structure.";
  schema = z.object({
    dirPath: z
      .string()
      .optional()
      .describe(
        "The absolute path to the directory to list. If omitted, lists the root workspace directory.",
      ),
  });

  async _call(input: { dirPath?: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.dirPath);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error listing files: ${error.message}`;
    }
  }
}
