import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { ThinkTool } from "../../../tools/tools";

interface ThinkToolResult {
  plan: string;
}

export class LangChainThinkTool extends StructuredTool<any> {
  private readonly logger: Logger;

  constructor(private readonly toolInstance: ThinkTool) {
    super();
    this.logger = Logger.initialize("LangChainThinkTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  name = "think";
  description =
    "Use this tool to think through complex problems, analyze information, or plan multi-step solutions before taking action. This creates space for structured reasoning about code architecture, debugging approaches, or implementation strategies. Use when analyzing tool outputs, making sequential decisions, or following complex guidelines. This tool does not execute code or retrieve new information. The output should be a detailed, numbered plan of action if multi-step, or a clear single thought.";
  schema = z.object({
    thought: z
      .string()
      .describe(
        "Describe your detailed analysis, thought process, reasoning steps, or plan of action.",
      ),
  });

  async _call(input: { thought: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with thought: ${input.thought.substring(0, 100)}...`,
    );
    try {
      const result = await this.executeThinkTool(input.thought);
      return JSON.stringify(result);
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      throw new Error(`Tool ${this.name} failed: ${error.message}`);
    }
  }

  private async executeThinkTool(thought: string): Promise<ThinkToolResult> {
    try {
      const plan = await this.toolInstance.execute(thought);
      return { plan: plan };
    } catch (error: any) {
      this.logger.error(`Error executing ThinkTool: ${error.message}`, {
        thought,
        error,
      });
      throw error;
    }
  }
}
