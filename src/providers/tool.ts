import { IToolConfig } from "../application/interfaces/agent.interface";
import { ContextRetriever } from "../services/context-retriever";
import { CodeBuddyTool } from "../tools/base";
import { TOOL_CONFIGS } from "../tools/database/search-tool";

type Retriever = Pick<ContextRetriever, "retrieveContext">;

export class ToolFactory {
  private readonly tools: Map<string, IToolConfig> = new Map();
  constructor(private readonly contextRetriever: Retriever) {
    for (const [name, { tool, useContextRetriever }] of Object.entries(
      TOOL_CONFIGS,
    )) {
      this.register({
        ...tool.prototype.config,
        name,
        createInstance: useContextRetriever
          ? (_, contextRetriever) => {
              if (!contextRetriever) {
                throw new Error(`Context retriever is needed for ${name}`);
              }
              return new tool(contextRetriever);
            }
          : () => new tool(),
      });
    }
  }

  register(config: IToolConfig) {
    this.tools.set(config.name, config);
  }

  getInstances(): CodeBuddyTool[] {
    return Array.from(Object.values(this.tools)).map((tool) =>
      tool.createInstance(tool, this.contextRetriever),
    );
  }
}

export class CodeBuddyToolProvider {
  public factory: ToolFactory;

  private static instance: CodeBuddyToolProvider | undefined;

  private constructor(contextRetriever: Retriever) {
    this.factory = new ToolFactory(contextRetriever);
  }

  public static initialize(contextRetriever: Retriever) {
    if (!CodeBuddyToolProvider.instance) {
      CodeBuddyToolProvider.instance = new CodeBuddyToolProvider(
        contextRetriever,
      );
    }
  }

  public static getTools(): CodeBuddyTool[] {
    return CodeBuddyToolProvider.instance?.factory.getInstances() ?? [];
  }
}
