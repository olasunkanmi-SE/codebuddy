import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { WebPreviewTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainWebPreviewTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: WebPreviewTool) {
    super();
    this.logger = Logger.initialize("LangChainWebPreviewTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "open_web_preview";
  description =
    "Open a web preview in the editor (Simple Browser). Use this to view localhost servers or external URLs.";
  schema = z.object({
    url: z
      .string()
      .describe("The URL to preview (e.g., http://localhost:3000)."),
  });

  async _call(input: { url: string }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(input.url);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error opening preview: ${error.message}`;
    }
  }
}
