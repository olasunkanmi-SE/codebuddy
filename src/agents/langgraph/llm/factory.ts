import { ChatAnthropic } from "@langchain/anthropic";
import { Runnable } from "@langchain/core/runnables";
import { StructuredTool } from "@langchain/core/tools";

export interface ILLMProvider {
  createModel(): Runnable;
}

export class LLMFactory implements ILLMProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      tools: StructuredTool[];
    },
  ) {}

  createModel(): Runnable {
    return new ChatAnthropic({
      apiKey: this.config.apiKey,
      model: this.config.model,
      temperature: 0.7,
      stopSequences: ["stuck in a loop", "infinite loop detected"],
    }).bindTools(this.config.tools);
  }
}
