import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { ContextRetriever } from "./../../../services/context-retriever";
import { StructuredTool } from "@langchain/core/tools";
import { FileTool, ThinkTool, WebTool } from "../../../tools/tools";
import { LangChainFileTool } from "./file";
import { LangChainThinkTool } from "./think";
import { LangChainWebTool } from "./web";

const logger = Logger.initialize("ToolProvider", { minLevel: LogLevel.INFO });

// Interface for tool creation.  Factory pattern
interface IToolFactory {
  createTool(): StructuredTool;
}

class FileToolFactory implements IToolFactory {
  constructor(private contextRetriever: ContextRetriever) {}
  createTool(): StructuredTool {
    return new LangChainFileTool(new FileTool(this.contextRetriever));
  }
}

class WebToolFactory implements IToolFactory {
  constructor(private contextRetriever: ContextRetriever) {}
  createTool(): StructuredTool {
    return new LangChainWebTool(new WebTool(this.contextRetriever));
  }
}

class ThinkToolFactory implements IToolFactory {
  createTool(): StructuredTool {
    return new LangChainThinkTool(new ThinkTool());
  }
}

export class ToolProvider {
  private tools: StructuredTool[] = [];
  private static instance: ToolProvider | null = null;
  private contextRetriever: ContextRetriever;
  private toolFactories: IToolFactory[];

  private constructor(contextRetriever?: ContextRetriever) {
    this.contextRetriever = contextRetriever ?? ContextRetriever.initialize();
    this.toolFactories = [
      new FileToolFactory(this.contextRetriever),
      new WebToolFactory(this.contextRetriever),
      new ThinkToolFactory(),
    ];
    this.tools = this.toolFactories.map((factory) => factory.createTool());
    logger.info(`ToolProvider initialized with ${this.tools.length} tools.`);
  }

  public static initialize(contextRetriever?: ContextRetriever): ToolProvider {
    if (!ToolProvider.instance) {
      ToolProvider.instance = new ToolProvider(contextRetriever);
    } else {
      logger.debug("ToolProvider already initialized.");
    }
    return ToolProvider.instance;
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
    this.toolFactories.push(toolFactory);
    this.tools.push(newTool);
    logger.info(`Added new tool: ${newTool.name}`);
  }
}
