import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { TerminalTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainTerminalTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: TerminalTool) {
    super();
    this.logger = Logger.initialize("LangChainTerminalTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "run_terminal_command";
  description =
    "Execute a shell command in the terminal. Use this to run tests, build scripts, check file status, or perform other system operations. The output will be returned and also displayed to the user.";
  schema = z.object({
    command: z.string().describe("The shell command to execute."),
  });

  async _call(input: { command: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.command);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error executing command: ${error.message}`;
    }
  }
}
