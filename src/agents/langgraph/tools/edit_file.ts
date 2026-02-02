import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { EditFileTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainEditFileTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: EditFileTool) {
    super();
    this.logger = Logger.initialize("LangChainEditFileTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "edit_file";
  description =
    "Edit a file. Supports overwriting the entire file or replacing a specific text segment. CAUTION: Use 'replace' mode whenever possible to preserve other parts of the file.";
  schema = z.object({
    filePath: z.string().describe("The absolute path to the file to edit."),
    mode: z
      .enum(["overwrite", "replace"])
      .describe(
        "The editing mode. 'overwrite' replaces the whole file. 'replace' substitutes a string.",
      ),
    content: z
      .string()
      .optional()
      .describe(
        "The new content for the file (required for 'overwrite' mode).",
      ),
    search: z
      .string()
      .optional()
      .describe("The exact text to search for (required for 'replace' mode)."),
    replace: z
      .string()
      .optional()
      .describe(
        "The text to replace the search text with (required for 'replace' mode).",
      ),
  });

  async _call(input: {
    filePath: string;
    mode: "overwrite" | "replace";
    content?: string;
    search?: string;
    replace?: string;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} with args: ${JSON.stringify(input)}`,
    );
    try {
      const result = await this.toolInstance.execute(
        input.filePath,
        input.mode,
        input.content || "",
        input.search,
        input.replace,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error editing file: ${error.message}`;
    }
  }
}
