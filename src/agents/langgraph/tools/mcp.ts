import { StructuredTool } from "@langchain/core/tools";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { z, ZodTypeAny } from "zod";
import { MCPService } from "../../../MCP/service";
import { MCPTool } from "../../../MCP/types";

export class LangChainMCPTool extends StructuredTool<any> {
  private readonly logger: Logger;
  readonly name: string;
  readonly description: string;
  readonly schema: ZodTypeAny;

  constructor(
    private readonly mcpService: MCPService,
    private readonly tool: MCPTool,
  ) {
    super();
    this.name = tool.name;
    this.description =
      tool.description ?? `External MCP tool from ${tool.serverName}`;
    this.schema = this.buildZodSchema(tool.inputSchema);
    this.logger = Logger.initialize(`MCPTool:${tool.name}`, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  async _call(input: unknown): Promise<string> {
    this.logger.info(`Executing MCP tool: ${this.tool.name}`);

    try {
      const result = await this.mcpService.callTool(
        this.tool.serverName,
        this.tool.name,
        input,
      );
      if (result.isError) {
        const errorText = result.content
          .map((c) => c.text ?? JSON.stringify(c))
          .join(`\n`);
        throw new Error(errorText ?? `MCP tool ${this.tool.name} failed`);
      }
      return result.content.map((c) => c.text ?? JSON.stringify(c)).join(`\n`);
    } catch (error) {
      this.logger.error(`MCP tool ${this.tool.name} failed:`, error);
      try {
        const available = await this.mcpService.getAllTools();
        const names = available.map((t) => t.name).sort();
        const msg = `Tool "${this.tool.name}" failed: ${String(
          (error as any)?.message ?? error,
        )}. Available MCP tools: ${names.join(", ")}`;
        this.logger.debug(`MCP available tools: ${names.join(", ")}`);
        throw new Error(msg);
      } catch (innerErr) {
        // If fetching available tools also fails, throw original error
        this.logger.debug(
          "Failed to fetch available MCP tools:",
          innerErr as any,
        );
        throw error;
      }
    }
  }

  private buildZodSchema(schema: MCPTool["inputSchema"]): ZodTypeAny {
    if (schema.type === "object") {
      if (schema.properties) {
        const required = new Set(schema.required ?? []);
        const shape: Record<string, ZodTypeAny> = {};

        for (const [key, value] of Object.entries(schema.properties)) {
          const fieldSchema = this.convertJsonSchemaToZod(value);
          shape[key] = required.has(key) ? fieldSchema : fieldSchema.optional();
        }

        return z.object(shape).passthrough();
      }
      // Object without properties - allow any keys
      return z.record(z.string(), z.any());
    }
    return this.convertJsonSchemaToZod(schema);
  }

  private convertJsonSchemaToZod(node: any): ZodTypeAny {
    if (!node) {
      return z.any();
    }

    const description = node.description ?? "";

    switch (node.type) {
      case "string":
        return z.string().describe(description);
      case "number":
        return z.number().describe(description);
      case "integer":
        return z.number().int().describe(description);
      case "boolean":
        return z.boolean().describe(description);
      case "array":
        return z.array(
          node.items ? this.convertJsonSchemaToZod(node.items) : z.any(),
        );
      case "object":
        return this.buildZodSchema(node);
      default:
        this.logger.warn(
          `Unknown or missing schema type: '${node.type}'. Defaulting to z.any().`,
        );
        return z.any().describe(description);
    }
  }
}
