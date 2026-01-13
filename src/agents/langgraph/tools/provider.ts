import { StructuredTool } from "@langchain/core/tools";
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
      new TravilySearchTool(this.contextRetriever)
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
    private readonly toolDef: MCPTool
  ) {}
  createTool(): StructuredTool<any> {
    return new LangChainMCPTool(this.mcpService, this.toolDef);
  }
}

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
      (factory): StructuredTool<any> => factory.createTool()
    );
    logger.info(`ToolProvider initialized with ${this.tools.length} tools.`);
    this.loadMCPTools();
  }

  public static initialize(): ToolProvider {
    return (ToolProvider.instance ??= new ToolProvider());
  }

  private async loadMCPTools(): Promise<void> {
    if (this.mcpInitialized) {
      return;
    }

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
        error.message
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
