// src/agents/factory/agent.factory.ts
import {
  AnnotationRoot,
  InMemoryStore,
  MemorySaver,
} from "@langchain/langgraph";
import { createAdvancedDeveloperAgent } from "../developer/agent";
import { ICodeBuddyAgentConfig } from "../interface/agent.interface";

interface IAgentFactory {
  createAgent(): Promise<any>;
}

export interface AgentFactoryConfig {
  enableHITL?: boolean;
}

export class AgentFactory implements IAgentFactory {
  private agent: any = null;
  private readonly config: AgentFactoryConfig;

  private readonly checkpointer = new MemorySaver();
  private readonly store = new InMemoryStore();

  constructor(config: AgentFactoryConfig = {}) {
    this.config = { enableHITL: false, ...config };
  }

  public async createAgent(config?: ICodeBuddyAgentConfig): Promise<any> {
    if (!this.agent) {
      this.agent = await createAdvancedDeveloperAgent({
        checkPointer: config?.checkPointer ?? this.checkpointer,
        store: config?.store ?? this.store,
        enableHITL: this.config.enableHITL,
      });
    }
    return this.agent;
  }
}
