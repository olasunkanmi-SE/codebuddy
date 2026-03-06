import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { TestRunnerTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

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

  name = "run_tests";
  description =
    "Run the project's test suite and return structured results. " +
    "Auto-detects the test framework (Jest, Vitest, Mocha, Pytest, Go, Cargo). " +
    "Use after making code changes to verify correctness. " +
    "If tests fail, read the failure details and fix the code, then re-run. " +
    "Supports filtering by file path and test name.";
  schema = z.object({
    testPath: z
      .string()
      .optional()
      .describe(
        "Optional path or glob to run specific test files (e.g. 'src/test/suite/my.test.ts').",
      ),
    testName: z
      .string()
      .optional()
      .describe(
        "Optional test name or pattern to filter which tests run (e.g. 'should create user').",
      ),
  });

  async _call(input: {
    testPath?: string;
    testName?: string;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(
        input.testPath,
        input.testName,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error running tests: ${error.message}`;
    }
  }
}
