import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { GitTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainGitTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: GitTool) {
    super();
    this.logger = Logger.initialize("LangChainGitTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "git_ops";
  description =
    "Perform Git version control operations. Use this to stage changes, commit work, check status, or switch branches.";
  schema = z.object({
    operation: z
      .enum(["status", "add", "commit", "log", "diff", "checkout"])
      .describe("The git operation to perform."),
    args: z
      .object({
        files: z
          .string()
          .optional()
          .describe("For 'add': File paths or '.' for all."),
        message: z
          .string()
          .optional()
          .describe("For 'commit': Commit message."),
        limit: z
          .number()
          .optional()
          .describe("For 'log': Number of commits to show."),
        staged: z
          .boolean()
          .optional()
          .describe("For 'diff': Show staged changes."),
        branch: z.string().optional().describe("For 'checkout': Branch name."),
        create: z
          .boolean()
          .optional()
          .describe("For 'checkout': Create new branch if true."),
      })
      .optional()
      .describe("Arguments for the operation."),
  });

  async _call(input: {
    operation: string;
    args?: {
      files?: string;
      message?: string;
      limit?: number;
      staged?: boolean;
      branch?: string;
      create?: boolean;
    };
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(
        input.operation,
        input.args,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error executing git operation: ${error.message}`;
    }
  }
}
