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
  name = "analyze_file_for_question";
  description =
    "Analyze specific code files to understand their functionality and answer user questions related to the code. Use this tool when the user is asking about specific parts of the codebase or how certain features are implemented.";
  schema = z.object({
    files: z
      .array(
        z.object({
          class_name: z
            .string()
            .describe(
              "The class name within the file that is relevant to the user's query.",
            ),
          function_name: z
            .string()
            .describe(
              "The function name within the file that is relevant to the user's query.",
            ),
          file_path: z
            .string()
            .describe("The path to the code file to be analyzed."),
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
