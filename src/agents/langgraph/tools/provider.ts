import { StructuredTool, Tool } from "@langchain/core/tools";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { MCPService } from "../../../MCP/service";
import { MCPTool } from "../../../MCP/types";
import {
  FileTool,
  TerminalTool,
  ThinkTool,
  TravilySearchTool,
  RipgrepSearchTool,
  DiagnosticsTool,
  GitTool,
  SymbolSearchTool,
  ListFilesTool,
  EditFileTool,
  WebPreviewTool,
  SearchTool,
  DeepTerminalTool,
  TodoTool,
  MemoryTool,
} from "../../../tools/tools";
import { ContextRetriever } from "./../../../services/context-retriever";
import { LangChainFileTool } from "./file";
import { LangChainMCPTool } from "./mcp";
import { LangChainTerminalTool } from "./terminal";
import { LangChainDeepTerminalTool } from "./deep-terminal";
import { LangChainThinkTool } from "./think";
import { LangChainTravilySearchTool } from "./travily";
import { LangChainRipgrepTool } from "./ripgrep";
import { LangChainDiagnosticsTool } from "./diagnostics";
import { LangChainGitTool } from "./git";
import { LangChainSymbolSearchTool } from "./symbol";
import { LangChainListFilesTool } from "./list_files";
import { LangChainEditFileTool } from "./edit_file";
import { LangChainWebPreviewTool } from "./web_preview";
import { LangChainSearchTool } from "./search";
import { LangChainTodoTool } from "./todo";
import { LangChainMemoryTool } from "./memory";

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

class TerminalToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainTerminalTool(new TerminalTool());
  }
}

class DeepTerminalToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainDeepTerminalTool(new DeepTerminalTool());
  }
}

class RipgrepToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainRipgrepTool(new RipgrepSearchTool());
  }
}

class DiagnosticsToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainDiagnosticsTool(new DiagnosticsTool());
  }
}

class GitToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainGitTool(new GitTool());
  }
}

class SymbolSearchToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainSymbolSearchTool(new SymbolSearchTool());
  }
}

class ListFilesToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainListFilesTool(new ListFilesTool());
  }
}

class EditFileToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainEditFileTool(new EditFileTool());
  }
}

class WebPreviewToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainWebPreviewTool(new WebPreviewTool());
  }
}

class TodoToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainTodoTool(new TodoTool());
  }
}

class MemoryToolFactory implements IToolFactory {
  createTool(): StructuredTool<any> {
    return new LangChainMemoryTool(new MemoryTool());
  }
}

class SearchToolFactory implements IToolFactory {
  constructor(private contextRetriever: ContextRetriever) {}
  createTool(): StructuredTool<any> {
    return new LangChainSearchTool(new SearchTool(this.contextRetriever));
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
    "terminal",
    "run",
    "command",
    "ripgrep_search",
    "get_diagnostics",
    "git",
    "search_symbols",
    "list_files",
    "search_vector_db",
    "manage_tasks",
    "manage_core_memory",
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
    "ripgrep_search",
    "git",
    "search_symbols",
    "list_files",
    "edit_file",
    "search_vector_db",
  ],
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
    "terminal",
    "run",
    "command",
    "ripgrep_search",
    "git",
    "list_files",
    "edit_file",
    "manage_terminal",
  ],
  architect: [
    "search",
    "read",
    "structure",
    "analyze",
    "web",
    "travily",
    "list",
    "directory",
    "think",
    "ripgrep_search",
    "git",
    "search_symbols",
    "list_files",
    "open_web_preview",
    "search_vector_db",
    "manage_core_memory",
    "manage_tasks",
  ],
  reviewer: [
    "analyze",
    "lint",
    "review",
    "check",
    "read",
    "search",
    "git",
    "scan",
    "complexity",
    "quality",
    "ripgrep_search",
    "get_diagnostics",
    "search_symbols",
    "list_files",
    "search_vector_db",
  ],
  tester: [
    "terminal",
    "run",
    "command",
    "test",
    "write",
    "read",
    "file",
    "search",
    "ripgrep_search",
    "get_diagnostics",
    "git",
    "list_files",
    "edit_file",
    "open_web_preview",
    "search_vector_db",
    "manage_terminal",
  ],
};

export class ToolProvider {
  private tools: StructuredTool<any>[] = [];
  private static instance: ToolProvider | null = null;
  private contextRetriever: ContextRetriever;
  private toolFactories: IToolFactory[];
  private readonly mcpService: MCPService;
  private mcpInitialized = false;
  private mcpLoadAttempted = false; // Track if load was attempted (separate from success)
  private mcpLoadPromise: Promise<void> | null = null;

  private constructor() {
    this.contextRetriever ??= ContextRetriever.initialize();
    this.mcpService = MCPService.getInstance();
    this.toolFactories = [
      new FileToolFactory(this.contextRetriever),
      new WebToolFactory(this.contextRetriever),
      new ThinkToolFactory(),
      new TerminalToolFactory(),
      new DeepTerminalToolFactory(),
      // new RipgrepToolFactory(), // Provided by DeepAgent backend
      new DiagnosticsToolFactory(),
      new GitToolFactory(),
      new SymbolSearchToolFactory(),
      // new ListFilesToolFactory(), // Provided by DeepAgent backend
      // new EditFileToolFactory(), // Provided by DeepAgent backend
      new WebPreviewToolFactory(),
      new SearchToolFactory(this.contextRetriever),
      new TodoToolFactory(),
      new MemoryToolFactory(),
    ];

    // Deduplicate tools during initialization
    const uniqueToolsMap = new Map<string, StructuredTool<any>>();
    this.toolFactories.forEach((factory) => {
      const tool = factory.createTool();
      if (uniqueToolsMap.has(tool.name)) {
        logger.warn(
          `Duplicate core tool detected in ToolProvider: ${tool.name}. Skipping.`,
        );
      } else {
        uniqueToolsMap.set(tool.name, tool);
      }
    });

    this.tools = Array.from(uniqueToolsMap.values());

    logger.info(
      `ToolProvider initialized with ${this.tools.length} unique core tools.`,
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
    // Store the promise so we can await it later if needed
    this.mcpLoadPromise = this.loadMCPTools().catch((error: any) => {
      logger.info(
        `MCP tools will be loaded on-demand: ${error.message || "Docker gateway not yet started"}`,
      );
    });
  }

  private async loadMCPTools(): Promise<void> {
    try {
      logger.info("Initializing MCP service for tool discovery");
      logger.debug("loadMCPTools called");

      const mcpTools = await this.mcpService.getAllTools();
      logger.debug(`getAllTools returned ${mcpTools.length} tools`);
      logger.info(`Discovered ${mcpTools.length} MCP tools`);

      if (mcpTools.length === 0) {
        logger.warn(
          "No MCP tools discovered. Check that your MCP server is running and accessible. " +
            "For SSE: ensure the server is running at the configured URL. " +
            "For Docker: run 'docker mcp gateway run' or check Docker Desktop MCP is enabled.",
        );
        this.mcpLoadAttempted = true;
        return; // Don't set mcpInitialized, allow retry
      }

      mcpTools.forEach((tool) => {
        const factory = new MCPToolFactory(this.mcpService, tool);
        this.addTool(factory);
        logger.debug(`Added MCP tool: ${tool.name}`);
      });

      this.mcpInitialized = true;
      this.mcpLoadAttempted = true;
      logger.debug(`MCP tools successfully loaded: ${mcpTools.length} tools`);
      logger.info(
        `MCP integration complete: ${mcpTools.length} tools added. Total tools: ${this.tools.length}`,
      );
    } catch (error: any) {
      logger.debug(`loadMCPTools error: ${error.message}`);
      logger.error(
        `MCP tools unavailable: ${error.message}. ` +
          `The agent will continue with core tools only (${this.tools.length} available).`,
      );
      // Mark as attempted but NOT initialized - allows retry
      this.mcpLoadAttempted = true;
    }
  }

  /**
   * Ensure MCP tools are loaded before returning tools
   * This is used when the caller needs to guarantee MCP tools are available
   */
  public static async ensureMCPToolsLoaded(): Promise<void> {
    if (!ToolProvider.instance) {
      ToolProvider.initialize();
    }

    const instance = ToolProvider.instance!;
    logger.debug(
      `ensureMCPToolsLoaded: initialized=${instance.mcpInitialized}, attempted=${instance.mcpLoadAttempted}`,
    );

    // If already successfully loaded, return immediately
    if (instance.mcpInitialized) {
      logger.debug(
        `MCP already initialized with ${instance.tools.length} tools`,
      );
      return;
    }

    // Wait for the initial load attempt to complete
    if (instance.mcpLoadPromise) {
      logger.debug("Waiting for mcpLoadPromise...");
      await instance.mcpLoadPromise;
    }

    // If not initialized yet (either failed or returned 0 tools), retry
    // FIX: Do not retry if we already attempted and failed. Docker should be optional.
    // If we retry here, every call to getTools() will trigger the 6-second timeout loop,
    // causing the application to "break" or become unresponsive when Docker is down.
    if (!instance.mcpInitialized && !instance.mcpLoadAttempted) {
      logger.debug("Retrying MCP tool loading (attempt after lazy load)...");
      logger.info("Retrying MCP tool loading...");
      await instance.loadMCPTools();
    } else if (!instance.mcpInitialized && instance.mcpLoadAttempted) {
      logger.debug(
        "MCP tools not initialized (attempted but failed or 0 tools). Continuing with core tools.",
      );
    }

    logger.debug(
      `ensureMCPToolsLoaded complete: ${instance.tools.length} total tools available`,
    );
  }

  /**
   * Get tools asynchronously, ensuring MCP tools are loaded first
   * Use this when you need to guarantee all tools are available
   */
  public static async getToolsAsync(): Promise<StructuredTool[]> {
    await ToolProvider.ensureMCPToolsLoaded();
    return ToolProvider.getTools();
  }

  /**
   * Get tools for a role asynchronously, ensuring MCP tools are loaded first
   */
  public static async getToolsForRoleAsync(
    role: string,
  ): Promise<StructuredTool[]> {
    await ToolProvider.ensureMCPToolsLoaded();
    return ToolProvider.getToolsForRole(role);
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
