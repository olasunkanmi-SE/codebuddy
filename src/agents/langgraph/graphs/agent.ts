import { BaseMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { agentPrompt } from "../../../utils/prompt";
import { Orchestrator } from "../../orchestrator";
import { LLMFactory } from "../llm/factory";
import { ToolProvider } from "../tools/provider";
import { GraphBuilder, IGraphBuilder } from "./builder";

export class langGraphAgent {
  private readonly compiledGraph: Runnable;
  private readonly orchestrator: Orchestrator;

  constructor(
    private readonly llm: Runnable,
    private readonly toolNode: ToolNode,
    private readonly globalSystemInstruction?: string,
    private readonly graphBuilder: IGraphBuilder = new GraphBuilder(),
    private readonly logger: Logger = Logger.initialize("langGraphAgent", {
      minLevel: LogLevel.DEBUG,
    })
  ) {
    this.llmCall = this.llmCall.bind(this);
    this.shouldContinue = this.shouldContinue.bind(this);
    this.compiledGraph = this.graphBuilder.build(
      this.llmCall,
      this.shouldContinue,
      this.toolNode
    );

    this.orchestrator = Orchestrator.getInstance();
  }

  async llmCall(state: typeof MessagesAnnotation.State) {
    const result = await this.llm.invoke(state.messages);
    return {
      messages: [result],
    };
  }

  /**
   * Decides whether the agent should retrieve more information or end the process.
   * This function checks the last message in the state for a function call. If a tool call is
   * present, the process continues to retrieve information. Otherwise, it ends the process.
   * @param {typeof GraphState.State} state - The current state of the agent, including all messages.
   * @returns {string} - A decision to either "continue" the retrieval process or "end" it.
   */
  shouldContinue(state: typeof MessagesAnnotation.State): string {
    const messages: BaseMessage[] = state.messages;
    const lastMessage: BaseMessage | undefined = messages.at(-1);
    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls.length
    ) {
      return "Action";
    }
    return END;
  }

  static create(config: {
    apiKey: string;
    model: string;
    systemInstruction?: string;
  }): langGraphAgent {
    ToolProvider.initialize();
    const tools = ToolProvider.getTools();
    const toolNode = new ToolNode(tools);

    const llmFactory = new LLMFactory({ ...config, tools });
    const llm = llmFactory.createModel();

    return new langGraphAgent(llm, toolNode, config.systemInstruction);
  }

  async *runx(userMessage: string) {
    try {
      const messages = [
        {
          role: "system",
          content: this.globalSystemInstruction ?? agentPrompt,
        },
        {
          role: "human",
          content: userMessage,
        },
      ];
      let finalState: typeof MessagesAnnotation.State = { messages: [] };
      const stream: IterableReadableStream<any> =
        await this.compiledGraph.stream({ messages });
      for await (const event of stream) {
        for (const [nodeName, update] of Object.entries(
          event as Record<string, any>
        )) {
          if (update && Array.isArray(update.messages)) {
            for (const message of update.messages) {
              if (
                message.contentBlocks &&
                Array.isArray(message.contentBlocks)
              ) {
                const reasoningSteps = message.contentBlocks.filter(
                  (b: { type: string }) => b.type === "reasoning"
                );
                if (reasoningSteps?.length > 0) {
                  this.orchestrator.publish("onQuery", message);
                }
              }
            }
          }

          if (update.messages) {
            finalState.messages.push(...update.messages);
          }

          yield { node: nodeName, update };
          this.logger.log(LogLevel.INFO, `Stream event from node: ${nodeName}`);
        }
        console.log(finalState.messages);
      }
    } catch (error: any) {
      this.logger.error("Agent execution failed:", error);
      throw error;
    }
  }
}
