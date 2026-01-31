import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { createAdvancedDeveloperAgent } from "../developer/agent";
import {
  ICodeBuddyAgentConfig,
  StreamEventType,
} from "../interface/agent.interface";
import { StreamManager } from "./stream-manager.service";

export class CodeBuddyAgentService {
  private agent: any = null;
  private store = new InMemoryStore();
  private checkpointer = new MemorySaver();
  private readonly logger: Logger;
  private static instance: CodeBuddyAgentService;
  private activeStreams = new Map<string, StreamManager>();

  constructor() {
    this.logger = Logger.initialize("CodeBuddyAgentService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): CodeBuddyAgentService {
    return (CodeBuddyAgentService.instance ??= new CodeBuddyAgentService());
  }

  private async getAgent(config?: ICodeBuddyAgentConfig) {
    if (!this.agent) {
      this.agent = await createAdvancedDeveloperAgent({
        checkPointer: config?.checkPointer ?? this.checkpointer,
        store: config?.store ?? this.store,
        enableHITL: config?.enableHITL ?? false,
      });
      this.logger.log(LogLevel.INFO, "Agent initialized");
    }
    return this.agent;
  }

  async *streamResponse(
    userMessage: string,
    threadId?: string,
    onChunk?: (chunk: any) => void,
  ) {
    const conversationId = threadId ?? `thread-${Date.now()}`;
    const streamManger = new StreamManager({
      maxBufferSize: 10,
      flushInterval: 50,
      enableBackPressure: true,
    });
    this.activeStreams.set(conversationId, streamManger);
    const maxIterations = 50;
    let iterationCount = 0;
    try {
      const agent = await this.getAgent();
      const streamId = streamManger.startStream();
      this.logger.log(
        LogLevel.INFO,
        `Starting stream ${streamId} for thread ${conversationId}`,
      );
      const config = {
        configurable: { thread_id: conversationId },
        recursionLimit: 100,
      };
      let result = await agent.stream(
        { messages: [{ role: "user", content: userMessage }] },
        config,
      );
      let accumulatedContent = "";
      for await (const event of result) {
        iterationCount++;
        if (iterationCount >= maxIterations) {
          this.logger.log(
            LogLevel.ERROR,
            `Force stopping: exceeded ${maxIterations} iterations`,
          );

          yield {
            type: StreamEventType.ERROR,
            content:
              "The agent exceeded maximum iterations. Please rephrase your question or try a simpler query.",
            metadata: { threadId: conversationId, reason: "max_iterations" },
          };
          break;
        }
        for (const [nodeName, update] of Object.entries(
          event as Record<string, any>,
        )) {
          if (update?.messages && Array.isArray(update.messages)) {
            const lastMessage = update.messages[update.messages.length - 1];
            if (lastMessage?.content) {
              const newContent = this.normalizeMessageContent(
                lastMessage.content,
              );
              const delta = newContent.slice(accumulatedContent.length);
              if (delta) {
                accumulatedContent = newContent;
                streamManger.addChunk(delta, {
                  node: nodeName,
                  messageType: lastMessage.type,
                });

                yield {
                  type: StreamEventType.CHUNK,
                  content: delta,
                  metadata: { node: nodeName, messageType: lastMessage.type },
                  accumulated: accumulatedContent,
                };
                onChunk?.({
                  type: StreamEventType.CHUNK,
                  content: delta,
                  metadata: { node: nodeName, messageType: lastMessage.type },
                  accumulated: accumulatedContent,
                });
              }
            }
          }
          if (update?.toolCalls) {
            for (const toolCall of update.toolCalls) {
              streamManger.addToolEvent(toolCall.name, true, toolCall);
              yield {
                type: StreamEventType.TOOL_START,
                content: JSON.stringify(toolCall),
                metadata: {
                  toolName: toolCall.name,
                  node: nodeName,
                },
              };
            }
          }
        }
      }
      streamManger.endStream(accumulatedContent);
      yield {
        type: StreamEventType.END,
        content: accumulatedContent,
        metadata: { threadId: conversationId },
      };
    } catch (error: any) {
      yield {
        type: StreamEventType.ERROR,
        content: "An unexpected error occurred while processing your request.",
        metadata: { threadId: conversationId },
      };
      this.logger.log(
        LogLevel.ERROR,
        `Stream failed for thread ${conversationId}`,
        error,
      );

      throw error;
    } finally {
      this.activeStreams.delete(conversationId);
    }
  }

  // Convert various message content shapes into plain text.
  // Handles: string, array of content blocks, single object with `text` or `content`.
  // Falls back to JSON.stringify for unknown objects.
  private normalizeMessageContent(content: any): string {
    if (content == null) return "";
    if (typeof content === "string") return content;

    // Array of blocks (e.g., [{type:'text', text: '...'}, ...])
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (item == null) return "";
          if (typeof item === "string") return item;
          if (typeof item === "object") {
            if (typeof item.text === "string") return item.text;
            if (typeof item.content === "string") return item.content;
            // Some tool outputs use nested arrays/objects
            return JSON.stringify(item);
          }
          return String(item);
        })
        .join("");
    }

    if (typeof content === "object") {
      if (typeof content.text === "string") return content.text;
      if (typeof content.content === "string") return content.content;
      return JSON.stringify(content);
    }

    return String(content);
  }

  async processUserQuery(
    userInput: string,
    onChunk: (chunk: any) => void,
    onComplete: (finalContent: string) => void,
    onError: (error: Error) => void,
    threadId?: string,
  ) {
    try {
      let finalContent = "";
      for await (const chunk of this.streamResponse(
        userInput,
        threadId,
        onChunk,
      )) {
        if (chunk.type === StreamEventType.END) {
          finalContent = chunk.content;
        }
      }
      onComplete(finalContent);
    } catch (error: any) {
      onError(error);
    }
  }

  cancelStream(threadId: string) {
    const streamManager = this.activeStreams.get(threadId);
    if (streamManager && streamManager.isActive()) {
      streamManager.endStream();
      this.activeStreams.delete(threadId);
      this.logger.log(LogLevel.INFO, `Stream cancelled for thread ${threadId}`);
    }
  }
}
