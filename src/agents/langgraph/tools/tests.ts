import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { TestRunnerTool } from "../../../tools/tools";

export class LangChainTestRunnerTool extends StructuredTool<any> {
  private readonly logger: Logger;

  constructor(private readonly toolInstance: TestRunnerTool) {
    super();
    this.logger = Logger.initialize("LangChainTestRunnerTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  name = "run_workspace_tests";
  description =
    "Execute automated tests for the current workspace using the appropriate framework (e.g., Jest, Pytest, Go test).";
  schema = z.object({
    language: z
      .string()
      .optional()
      .describe("Language of the code under test (e.g., typescript, python)."),
    framework: z
      .string()
      .optional()
      .describe("Testing framework to prioritize (e.g., jest, pytest)."),
    command: z
      .string()
      .optional()
      .describe("Override command to execute directly."),
    args: z
      .array(z.string())
      .optional()
      .describe("Arguments to pass when command is provided."),
    watch: z
      .boolean()
      .optional()
      .default(false)
      .describe("Run in watch mode when supported by the framework."),
    testTarget: z
      .string()
      .optional()
      .describe("Specific test suite, package, or file to run."),
    cwd: z
      .string()
      .optional()
      .describe("Working directory override for executing tests."),
  });

  async _call(input: {
    language?: string;
    framework?: string;
    command?: string;
    args?: string[];
    watch?: boolean;
    testTarget?: string;
    cwd?: string;
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
