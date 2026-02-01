import { StructuredTool, Tool } from "@langchain/core/tools";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { MCPService } from "../../../MCP/service";
import { MCPTool } from "../../../MCP/types";
import { FileTool, ThinkTool, TravilySearchTool } from "../../../tools/tools";
import { ContextRetriever } from "./../../../services/context-retriever";
import { LangChainFileTool } from "./file";
import { LangChainMCPTool } from "./mcp";
import { LangChainThinkTool } from "./think";
import { LangChainTravilySearchTool } from "./travily";

const logger = Logger.initialize("ToolProvider", {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableTelemetry: true,
});

interface IToolFactory {
  createTool(): StructuredTool<any>;
}

class FileToolFactory implements IToolFactory {
  constructor(private contextRetriever: ContextRetriever) {}
  createTool(): StructuredTool<any> {
    return new LangChainFileTool(new FileTool(this.contextRetriever));
  }
}

// class WebToolFactory implements IToolFactory {
//   constructor(private contextRetriever: ContextRetriever) { }
//   createTool(): StructuredTool<any> {
//     return new LangChainWebTool(new WebTool(this.contextRetriever));
//   }
// }

class WebToolFactory implements IToolFactory {
  constructor(private contextRetriever: ContextRetriever) {}
  createTool(): StructuredTool<any> {
    return new LangChainTravilySearchTool(
      new TravilySearchTool(this.contextRetriever),
    );
  }
}

class ThinkToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainThinkTool(new ThinkTool());
  }
}

class MCPToolFactory implements IToolFactory {
  constructor(
    private readonly mcpService: MCPService,
    private readonly toolDef: MCPTool,
  ) {}
  createTool(): StructuredTool<any> {
    return new LangChainMCPTool(this.mcpService, this.toolDef);
  }
}

/**
 * Phase 4: Tool role mapping for subagent specialization
 * Maps subagent roles to relevant tool name patterns
 * '*' means all tools (for generalist agents like debugger)
 */
const TOOL_ROLE_MAPPING: Record<string, string[]> = {
  "code-analyzer": [
    "analyze",
    "lint",
    "security",
    "complexity",
    "quality",
    "ast",
    "parse",
    "check",
    "scan",
    "review",
    "travily",
    "search",
  ],
  "doc-writer": [
    "search",
    "read",
    "generate",
    "doc",
    "api",
    "reference",
    "travily",
    "web",
  ],
  debugger: ["*"], // Debugger gets ALL tools
  "file-organizer": [
    "file",
    "directory",
    "list",
    "read",
    "write",
    "move",
    "rename",
    "delete",
    "structure",
    "organize",
    "search",
  ],
};

export class ToolProvider {
  private tools: StructuredTool<any>[] = [];
  private static instance: ToolProvider | null = null;
  private contextRetriever: ContextRetriever;
  private toolFactories: IToolFactory[];
  private readonly mcpService: MCPService;
  private mcpInitialized = false;

  private constructor() {
    this.contextRetriever ??= ContextRetriever.initialize();
    this.mcpService = MCPService.getInstance();
    this.toolFactories = [
      // new FileToolFactory(this.contextRetriever),
      new WebToolFactory(this.contextRetriever),
      // new ThinkToolFactory(),
    ];
    this.tools = this.toolFactories.map(
      (factory): StructuredTool<any> => factory.createTool(),
    );
    logger.info(
      `ToolProvider initialized with ${this.tools.length} core tools.`,
    );

    // Phase 1: Load MCP tools lazily (non-blocking)
    // Don't await - let it load in background without blocking extension startup
    this.loadMCPToolsLazy();
  }

  public static initialize(): ToolProvider {
    if (!ToolProvider.instance) {
      ToolProvider.instance = new ToolProvider();
    }
    return ToolProvider.instance;
  }

  /**
   * Phase 1: Non-blocking MCP tool loading
   * Loads MCP tools in background without blocking extension startup
   */
  private loadMCPToolsLazy(): void {
    // Fire and forget - don't await
    this.loadMCPTools().catch((error: any) => {
      logger.info(
        `MCP tools will be loaded on-demand: ${error.message || "Docker gateway not yet started"}`,
      );
    });
  }

  private async loadMCPTools(): Promise<void> {
    try {
      logger.info("Initializing MCP service for tool discovery");
      const mcpTools = await this.mcpService.getAllTools();
      logger.info(`Discovered ${mcpTools.length} MCP tools`);
      mcpTools.forEach((tool) => {
        const factory = new MCPToolFactory(this.mcpService, tool);
        this.addTool(factory);
      });
      this.mcpInitialized = true;
      logger.info(`MCP integration complete: ${mcpTools.length} tools added`);
    } catch (error: any) {
      logger.warn(
        "MCP tools unavailable, continuing without them:",
        error.message,
      );
    }
  }

  public static getTools(): StructuredTool[] {
    if (!ToolProvider.instance) {
      logger.error("Attempted to get tools before initialization.");
      throw new Error("ToolProvider must be initialized before getting tools.");
    }
    return ToolProvider.instance.tools;
  }

  /**
   * Phase 4: Get tools filtered by subagent role
   * Returns only tools relevant to the specified role
   * @param role - The subagent role (e.g., 'code-analyzer', 'debugger')
   * @returns Filtered tools for the role, or all tools if role unknown
   */
  public static getToolsForRole(role: string): StructuredTool[] {
    if (!ToolProvider.instance) {
      logger.error("Attempted to get tools before initialization.");
      throw new Error("ToolProvider must be initialized before getting tools.");
    }

    const allowedPatterns = TOOL_ROLE_MAPPING[role];

    // Unknown role or no mapping - return all tools
    if (!allowedPatterns) {
      logger.debug(`No tool mapping for role "${role}", returning all tools`);
      return ToolProvider.instance.tools;
    }

    // '*' means all tools (for generalist roles like debugger)
    if (allowedPatterns.includes("*")) {
      logger.debug(
        `Role "${role}" has access to all ${ToolProvider.instance.tools.length} tools`,
      );
      return ToolProvider.instance.tools;
    }

    // Filter tools by matching name patterns
    const filteredTools = ToolProvider.instance.tools.filter((tool) => {
      const toolNameLower = tool.name.toLowerCase();
      return allowedPatterns.some((pattern) =>
        toolNameLower.includes(pattern.toLowerCase()),
      );
    });

    logger.debug(
      `Role "${role}" filtered to ${filteredTools.length}/${ToolProvider.instance.tools.length} tools: ${filteredTools.map((t) => t.name).join(", ")}`,
    );

    // Always return at least the core tools (non-MCP) even if no patterns match
    if (filteredTools.length === 0) {
      const coreTools = ToolProvider.instance.tools.filter(
        (t) => !(t instanceof LangChainMCPTool),
      );
      logger.debug(
        `No MCP tools matched for "${role}", returning ${coreTools.length} core tools`,
      );
      return coreTools;
    }

    return filteredTools;
  }

  // Method to add more tools at runtime - Open/Closed Principle
  public addTool(toolFactory: IToolFactory): void {
    const newTool = toolFactory.createTool();
    if (this.tools.some((t) => t.name === newTool.name)) {
      logger.debug(`Skipping duplicate tool: ${newTool.name}`);
      return;
    }
    this.toolFactories.push(toolFactory);
    this.tools.push(newTool);
    logger.info(`Added new tool: ${newTool.name}`);
  }
}
