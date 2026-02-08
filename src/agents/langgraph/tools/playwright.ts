import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { PlaywrightTool } from "../../../tools/playwright";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainPlaywrightTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: PlaywrightTool) {
    super();
    this.logger = Logger.initialize("LangChainPlaywrightTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "playwright";
  description =
    "Control a real browser to navigate, interact, and test web pages. Supports navigating, clicking, filling forms, screenshots, and running scripts.";

  schema = z.object({
    action: z
      .enum([
        "start",
        "navigate",
        "click",
        "fill",
        "screenshot",
        "evaluate",
        "close",
      ])
      .describe("Action to perform"),
    url: z
      .string()
      .optional()
      .describe("URL to navigate to (required for 'navigate')"),
    selector: z
      .string()
      .optional()
      .describe("CSS selector to interact with (required for 'click', 'fill')"),
    value: z
      .string()
      .optional()
      .describe("Value to fill (required for 'fill')"),
    path: z
      .string()
      .optional()
      .describe("Path to save screenshot (optional for 'screenshot')"),
    script: z
      .string()
      .optional()
      .describe("JavaScript code to evaluate (required for 'evaluate')"),
    storageState: z
      .string()
      .optional()
      .describe("Path to storage state JSON file (optional for 'start')"),
  });

  async _call(input: any): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.action, input);
      return result || "Success";
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error executing playwright action: ${error.message}`;
    }
  }
}
