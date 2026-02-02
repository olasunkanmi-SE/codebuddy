import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { DiagnosticsTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainDiagnosticsTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: DiagnosticsTool) {
    super();
    this.logger = Logger.initialize("LangChainDiagnosticsTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "get_diagnostics";
  description =
    "Get compilation errors and warnings from the editor's Language Server Protocol (LSP). Use this to check for syntax errors or type issues without running a build.";
  schema = z.object({
    filePath: z
      .string()
      .optional()
      .describe(
        "Optional absolute path to filter diagnostics for a specific file. If omitted, returns all workspace diagnostics.",
      ),
  });

  async _call(input: { filePath?: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.filePath);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error getting diagnostics: ${error.message}`;
    }
  }
}
