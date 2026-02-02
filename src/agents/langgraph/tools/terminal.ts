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
    "Execute a shell command in the terminal. Use this to run tests, build scripts, check file status, or perform other system operations. The output will be returned and also displayed to the user. Set 'background' to true for long-running processes like servers.";
  schema = z.object({
    command: z.string().describe("The shell command to execute."),
    background: z
      .boolean()
      .optional()
      .describe(
        "Set to true if the command starts a long-running process (e.g., a server) that should run in the background. Returns immediately with PID.",
      ),
  });

  async _call(input: {
    command: string;
    background?: boolean;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(
        input.command,
        input.background,
      );
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
