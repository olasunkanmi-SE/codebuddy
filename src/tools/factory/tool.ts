import { IToolConfig } from "../../application/interfaces/agent.interface";
import { ContextRetriever } from "../../services/context-retriever";
import { CodeBuddyTool } from "../base";
import { TOOL_CONFIGS } from "../tools";

export class ToolFactory {
  private readonly tools: Map<string, IToolConfig> = new Map();
  private readonly contextRetriever: ContextRetriever;
  constructor() {
    this.contextRetriever = ContextRetriever.initialize();
    for (const [name, { tool, useContextRetriever }] of Object.entries(
      TOOL_CONFIGS
    )) {
      const toolConfig = tool.prototype.config();
      this.register({
        ...toolConfig,
        name,
        createInstance: useContextRetriever
          ? (_, contextRetriever) => {
              if (!contextRetriever) {
                throw new Error(`Context retriever is needed for ${name}`);
              }
              return new tool(this.contextRetriever);
            }
          : () => new tool(),
      });
    }
  }

  register(config: IToolConfig) {
    this.tools.set(config.name, config);
  }

  getInstances(): CodeBuddyTool[] {
    return Array.from(this.tools.values()).map((tool) =>
      tool.createInstance(tool, this.contextRetriever)
    );
  }
}

export class CodeBuddyToolProvider {
  public factory: ToolFactory;

  private static instance: CodeBuddyToolProvider | undefined;

  private constructor() {
    this.factory = new ToolFactory();
  }

  public static initialize() {
    if (!CodeBuddyToolProvider.instance) {
      CodeBuddyToolProvider.instance = new CodeBuddyToolProvider();
    }
  }

  public static getTools(): CodeBuddyTool[] {
    return CodeBuddyToolProvider.instance?.factory.getInstances() ?? [];
  }
}
