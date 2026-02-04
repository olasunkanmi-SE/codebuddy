import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { MemoryTool } from "../../../tools/memory";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainMemoryTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: MemoryTool) {
    super();
    this.logger = Logger.initialize("LangChainMemoryTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "manage_core_memory";
  description =
    "Manage persistent core memories (Knowledge, Rules, Experience) to maintain context across sessions. Use this to remember user preferences, architectural patterns, and lessons learned.";
  schema = z.object({
    action: z
      .enum(["add", "update", "delete", "search"])
      .describe(
        "The action to perform: 'add', 'update', 'delete', or 'search'.",
      ),
    memory: z
      .object({
        id: z
          .string()
          .optional()
          .describe("Memory ID (required for update/delete)"),
        category: z.enum(["Knowledge", "Rule", "Experience"]).optional(),
        content: z.string().optional().describe("Main content/rule"),
        title: z.string().optional().describe("Short title"),
        keywords: z.string().optional().describe("Keywords separated by |"),
        scope: z.enum(["user", "project"]).optional(),
      })
      .optional()
      .describe("Memory details (required for add/update/delete)."),
    query: z
      .string()
      .optional()
      .describe("Search query string (used only with 'search' action)."),
  });

  async _call(input: {
    action: string;
    memory?: any;
    query?: string;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(
        input.action,
        input.memory,
        input.query,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error executing memory tool: ${error.message}`;
    }
  }
}
