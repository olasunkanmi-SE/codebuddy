import { z } from "zod";
import { IFileToolConfig } from "../../../application/interfaces/agent.interface";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { FileTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainFileTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: FileTool) {
    super();
    this.logger = Logger.initialize("LangChainFileTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "analyze_files_for_question";
  description =
    "Read the content of specific code files. Use this tool when you need to examine existing code, configuration files, or documentation.";
  schema = z.object({
    files: z
      .array(
        z.object({
          file_path: z
            .string()
            .describe("The absolute path to the file to read."),
          class_name: z
            .string()
            .optional()
            .describe("(Optional) The class name to focus on (metadata only)."),
          function_name: z
            .string()
            .optional()
            .describe(
              "(Optional) The function name to focus on (metadata only).",
            ),
        }),
      )
      .describe("An array of file configuration to analyze"),
  });

  async _call(input: { files: IFileToolConfig[] }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.files);
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
