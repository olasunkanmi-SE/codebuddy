import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { DeepTerminalTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainDeepTerminalTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: DeepTerminalTool) {
    super();
    this.logger = Logger.initialize("LangChainDeepTerminalTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "manage_terminal";
  description =
    "Manage persistent terminal sessions. Allows starting sessions, running interactive commands (input), reading streaming output, and terminating sessions. Use this for complex tasks requiring state (e.g. 'cd', env vars) or monitoring long-running processes.";
  schema = z.object({
    action: z
      .enum(["start", "execute", "read", "terminate"])
      .describe("The action to perform."),
    sessionId: z
      .string()
      .describe(
        "Unique identifier for the terminal session (e.g., 'main', 'test-server').",
      ),
    command: z
      .string()
      .optional()
      .describe("The shell command to execute (required for 'execute')."),
    waitMs: z
      .number()
      .optional()
      .describe(
        "Optional time (ms) to wait after executing before returning output. Useful to capture immediate response.",
      ),
  });

  async _call(input: {
    action: "start" | "execute" | "read" | "terminate";
    sessionId: string;
    command?: string;
    waitMs?: number;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(
        input.action,
        input.sessionId,
        input.command,
        input.waitMs,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error: ${error.message}`;
    }
  }
}
