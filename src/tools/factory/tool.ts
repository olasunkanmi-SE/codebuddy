import {
  IToolConfig,
  ICodeBuddyToolConfig,
} from "../../application/interfaces/agent.interface";
import { ContextRetriever } from "../../services/context-retriever";
import { CodeBuddyTool } from "../base";
import { TOOL_CONFIGS } from "../tools";
import { GenerativeModel } from "@google/generative-ai";

export class ToolFactory {
  private readonly tools: Map<string, IToolConfig> = new Map();
  private readonly contextRetriever: ContextRetriever;
  private readonly model?: GenerativeModel;

  constructor(model?: GenerativeModel) {
    this.contextRetriever = ContextRetriever.initialize();
    this.model = model;

    for (const [
      name,
      { tool, useContextRetriever, useModel },
    ] of Object.entries(TOOL_CONFIGS)) {
      const toolConfig = tool.prototype.config();
      this.register({
        ...toolConfig,
        name,
        createInstance: (config: ICodeBuddyToolConfig, retriever?: any) => {
          if (useModel && this.model) {
            return new (tool as any)(this.model);
          } else if (useContextRetriever) {
            return new (tool as any)(retriever || this.contextRetriever);
          } else {
            return new (tool as any)();
          }
        },
      });
    }
  }

  register(config: IToolConfig) {
    this.tools.set(config.name, config);
  }

  getInstances(): CodeBuddyTool[] {
    return Array.from(this.tools.values()).map((tool) =>
      tool.createInstance(tool, this.contextRetriever),
    );
  }
}

export class CodeBuddyToolProvider {
  public factory: ToolFactory;

  private static instance: CodeBuddyToolProvider | undefined;

  private constructor(model?: GenerativeModel) {
    this.factory = new ToolFactory(model);
  }

  public static initialize(model?: GenerativeModel) {
    CodeBuddyToolProvider.instance ??= new CodeBuddyToolProvider(model);
  }

  public static getTools(): CodeBuddyTool[] {
    return CodeBuddyToolProvider.instance?.factory.getInstances() ?? [];
  }
}
