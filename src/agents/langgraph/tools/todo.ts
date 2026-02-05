import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { TodoTool } from "../../../tools/todo";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainTodoTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: TodoTool) {
    super();
    this.logger = Logger.initialize("LangChainTodoTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "manage_tasks";
  description =
    "Manage a persistent list of tasks (todos) for the project. Use this to plan complex workflows and track progress.";
  schema = z.object({
    action: z
      .enum(["add", "update", "list"])
      .describe("The action to perform: 'add', 'update', or 'list'."),
    task: z
      .object({
        id: z.string().optional().describe("Task ID (required for update)"),
        content: z.string().optional().describe("Task description"),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      })
      .optional()
      .describe("Task details (required for 'add' and 'update')."),
  });

  async _call(input: { action: string; task?: any }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.action, input.task);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error executing todo tool: ${error.message}`;
    }
  }
}
