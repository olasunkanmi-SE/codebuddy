import { z } from "zod";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { ComposerTool } from "../../../tools/tools";
import { StructuredTool } from "@langchain/core/tools";

export class LangChainComposerTool extends StructuredTool<any> {
  private readonly logger: Logger;
  constructor(private readonly toolInstance: ComposerTool) {
    super();
    this.logger = Logger.initialize("LangChainComposerTool", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  name = "compose_files";
  description =
    "Edit multiple files in a single atomic operation (Composer-style). " +
    "Use this when a task requires coordinated changes across several files. " +
    "Each edit can overwrite a file or do a search-and-replace. " +
    "All changes are staged for grouped review — the user can apply or reject them together.";
  schema = z.object({
    label: z
      .string()
      .describe(
        "A short label describing this batch of changes (e.g. 'Add user authentication').",
      ),
    edits: z
      .array(
        z.object({
          filePath: z.string().describe("Absolute path to the file."),
          mode: z
            .enum(["overwrite", "replace"])
            .describe(
              "'overwrite' replaces the whole file. 'replace' substitutes a string.",
            ),
          content: z
            .string()
            .optional()
            .describe("The new content (required for 'overwrite' mode)."),
          search: z
            .string()
            .optional()
            .describe("Exact text to find (required for 'replace' mode)."),
          replace: z
            .string()
            .optional()
            .describe(
              "Text to replace search with (required for 'replace' mode).",
            ),
        }),
      )
      .describe("Array of file edits to apply as a group."),
  });

  async _call(input: {
    label: string;
    edits: Array<{
      filePath: string;
      mode: "overwrite" | "replace";
      content?: string;
      search?: string;
      replace?: string;
    }>;
  }): Promise<string> {
    this.logger.info(
      `Executing tool: ${this.name} — label="${input.label}", ${input.edits.length} edits`,
    );
    try {
      const result = await this.toolInstance.execute(input.label, input.edits);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in tool ${this.name}: ${error.message}`, {
        input,
        error,
      });
      return `Error in multi-file compose: ${error.message}`;
    }
  }
}
