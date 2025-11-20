import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { Logger, LogLevel } from "../../../infrastructure/logger/logger";
import { agentPrompt } from "../../../utils/prompt";
import { Orchestrator } from "../../orchestrator";
import { LLMFactory } from "../llm/factory";
import { ToolProvider } from "../tools/provider";
import { GraphBuilder, IGraphBuilder } from "./builder";
import { Memory } from "../../../memory/base";
import { generateUUID } from "../../../utils/utils";

export class langGraphAgent {
  private readonly compiledGraph: Runnable;
  private readonly orchestrator: Orchestrator;

  private conversationHistory: BaseMessage[] = [];
  private readonly maxHistoryLength = 3;
  private readonly threadId: string;

  constructor(
    private readonly llm: Runnable,
    private readonly toolNode: ToolNode,
    private readonly globalSystemInstruction?: string,
    private readonly graphBuilder: IGraphBuilder = new GraphBuilder(),
    private readonly logger: Logger = Logger.initialize("langGraphAgent", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    }),
  ) {
    this.llmCall = this.llmCall.bind(this);
    this.shouldContinue = this.shouldContinue.bind(this);
    this.compiledGraph = this.graphBuilder.build(
      this.llmCall,
      this.shouldContinue,
      this.toolNode,
    );

    this.orchestrator = Orchestrator.getInstance();
    this.initializeHistory();
    this.threadId = generateUUID();
  }

  private initializeHistory() {
    const savedHistory = Memory.get(`agent-state-${this.threadId}`);
    if (savedHistory?.length) {
      this.conversationHistory = savedHistory;
    } else {
      this.conversationHistory = [
        new SystemMessage(this.globalSystemInstruction ?? agentPrompt),
      ];
    }
  }

  private pruneHistory(): void {
    if (this.conversationHistory.length > this.maxHistoryLength) {
      const systemMessage = this.conversationHistory[0];
      const recentMessages = this.conversationHistory.slice(
        -this.maxHistoryLength,
      );
      this.conversationHistory = [systemMessage, ...recentMessages];
      Memory.set(`agent-state-${this.threadId}`, this.conversationHistory);
    }
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

  updateAgentConversations(userMessage: string) {
    this.conversationHistory.push(new HumanMessage(userMessage));
  }

  async *runx(userMessage: string) {
    try {
      this.updateAgentConversations(userMessage);
      const config: RunnableConfig = {
        configurable: { thread_id: this.threadId },
      };
      const stream: IterableReadableStream<any> =
        await this.compiledGraph.stream(
          { messages: this.conversationHistory },
          config,
        );
      for await (const event of stream) {
        for (const [nodeName, update] of Object.entries(
          event as Record<string, any>,
        )) {
          if (update?.messages) {
            this.conversationHistory.push(...update.messages);
          }
          yield { node: nodeName, update };
          this.logger.log(LogLevel.INFO, `Stream event from node: ${nodeName}`);
        }
      }
      this.pruneHistory();
    } catch (error: any) {
      this.conversationHistory.pop();
      Memory.set(`agent-state-${this.threadId}`, this.conversationHistory);
      this.logger.error("Agent execution failed:", error);
      throw error;
    }
  }
}
