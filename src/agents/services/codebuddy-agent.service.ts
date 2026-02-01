import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { createAdvancedDeveloperAgent } from "../developer/agent";
import {
  ICodeBuddyAgentConfig,
  IToolActivity,
  StreamEventType,
} from "../interface/agent.interface";
import { StreamManager } from "./stream-manager.service";
import { ResultSynthesizerService } from "./result-synthesizer.service";

// Tool descriptions for user-friendly feedback
const TOOL_DESCRIPTIONS: Record<string, { name: string; description: string }> =
  {
    web_search: {
      name: "Web Search",
      description: "Searching the web for relevant information...",
    },
    read_file: {
      name: "File Reader",
      description: "Reading file contents...",
    },
    analyze_files_for_question: {
      name: "Code Analyzer",
      description: "Analyzing code files...",
    },
    think: {
      name: "Reasoning",
      description: "Thinking through the problem...",
    },
    write_file: {
      name: "File Writer",
      description: "Writing to file...",
    },
    edit_file: {
      name: "File Editor",
      description: "Editing file contents...",
    },
    search_codebase: {
      name: "Codebase Search",
      description: "Searching the codebase...",
    },
    default: {
      name: "Tool",
      description: "Executing tool...",
    },
  };

export class CodeBuddyAgentService {
  private agent: any = null;
  private store = new InMemoryStore();
  private checkpointer = new MemorySaver();
  private readonly logger: Logger;
  private static instance: CodeBuddyAgentService;
  private activeStreams = new Map<string, StreamManager>();
  private activeTools = new Map<string, IToolActivity>();
  private readonly synthesizer: ResultSynthesizerService;

  constructor() {
    this.logger = Logger.initialize("CodeBuddyAgentService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.synthesizer = ResultSynthesizerService.getInstance();
  }

  static getInstance(): CodeBuddyAgentService {
    return (CodeBuddyAgentService.instance ??= new CodeBuddyAgentService());
  }

  private getToolInfo(toolName: string): { name: string; description: string } {
    return TOOL_DESCRIPTIONS[toolName] || TOOL_DESCRIPTIONS.default;
  }

  private createToolActivity(toolName: string, args?: any): IToolActivity {
    const toolInfo = this.getToolInfo(toolName);
    let description = toolInfo.description;

    // Customize description based on tool args
    if (toolName === "web_search" && args?.query) {
      description = `Searching the web for: "${args.query.substring(0, 50)}${args.query.length > 50 ? "..." : ""}"`;
    } else if (toolName === "read_file" && args?.path) {
      description = `Reading file: ${args.path.split("/").pop()}`;
    } else if (toolName === "analyze_files_for_question" && args?.files) {
      description = `Analyzing ${args.files.length} file(s)...`;
    }

    return {
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolName,
      status: "starting",
      description,
      startTime: Date.now(),
    };
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
    this.activeTools.clear();
    const maxIterations = 50;
    const maxToolCallsPerType = 5; // Limit repeated calls to same tool
    let iterationCount = 0;
    let pendingToolCalls = new Map<string, IToolActivity>();
    let toolCallCounts = new Map<string, number>(); // Track tool call frequency
    let hasErrored = false;

    try {
      const agent = await this.getAgent();
      const streamId = streamManger.startStream();
      this.logger.log(
        LogLevel.INFO,
        `Starting stream ${streamId} for thread ${conversationId}`,
      );

      // Emit planning event at start
      yield {
        type: StreamEventType.PLANNING,
        content: "Analyzing your request...",
        metadata: { threadId: conversationId, timestamp: Date.now() },
      };

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
        // Stop immediately if we've already errored
        if (hasErrored) break;

        iterationCount++;
        if (iterationCount >= maxIterations) {
          this.logger.log(
            LogLevel.ERROR,
            `Force stopping: exceeded ${maxIterations} iterations`,
          );

          hasErrored = true;

          // Mark pending tools as failed
          for (const [toolName, activity] of pendingToolCalls) {
            activity.status = "failed";
            activity.endTime = Date.now();
            yield {
              type: StreamEventType.TOOL_END,
              content: JSON.stringify(activity),
              metadata: { toolName, error: true },
            };
          }
          pendingToolCalls.clear();

          yield {
            type: StreamEventType.ERROR,
            content:
              "The agent exceeded maximum iterations. Please rephrase your question or try a simpler query.",
            metadata: { threadId: conversationId, reason: "max_iterations" },
          };

          // Stop the loop immediately
          break;
        }

        for (const [nodeName, update] of Object.entries(
          event as Record<string, any>,
        )) {
          // Check for tool results in messages (indicates tool completion)
          if (update?.messages && Array.isArray(update.messages)) {
            for (const message of update.messages) {
              // Detect tool result messages
              if (message.type === "tool" || message.name) {
                const toolName = message.name || "unknown";
                const toolActivity = pendingToolCalls.get(toolName);

                if (toolActivity) {
                  toolActivity.status = "completed";
                  toolActivity.endTime = Date.now();
                  toolActivity.result = {
                    summary: this.summarizeToolResult(
                      message.content,
                      toolName,
                    ),
                    itemCount: this.countResultItems(message.content),
                  };

                  yield {
                    type: StreamEventType.TOOL_END,
                    content: JSON.stringify(toolActivity),
                    metadata: {
                      toolName,
                      node: nodeName,
                      duration: toolActivity.endTime - toolActivity.startTime,
                    },
                  };

                  pendingToolCalls.delete(toolName);
                }
              }
            }

            const lastMessage = update.messages[update.messages.length - 1];
            if (lastMessage?.content && lastMessage.type !== "tool") {
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

          // Handle tool calls
          if (update?.toolCalls) {
            for (const toolCall of update.toolCalls) {
              // Track how many times this tool has been called
              const currentCount = toolCallCounts.get(toolCall.name) || 0;
              toolCallCounts.set(toolCall.name, currentCount + 1);

              // Check if this tool is being called too many times (looping)
              if (currentCount >= maxToolCallsPerType) {
                this.logger.log(
                  LogLevel.WARN,
                  `Tool ${toolCall.name} called ${currentCount + 1} times - possible loop detected`,
                );

                // If web_search is looping, this is usually because the agent
                // can't find what it needs. Emit a helpful message.
                if (
                  toolCall.name === "web_search" &&
                  currentCount >= maxToolCallsPerType
                ) {
                  hasErrored = true;

                  yield {
                    type: StreamEventType.ERROR,
                    content: `I've searched for this information multiple times but couldn't find definitive results. For GitHub issues, try using the GitHub MCP tools directly or visit the repository issues page manually.`,
                    metadata: {
                      threadId: conversationId,
                      reason: "tool_loop_detected",
                      toolName: toolCall.name,
                    },
                  };
                  break;
                }
              }

              const toolActivity = this.createToolActivity(
                toolCall.name,
                toolCall.args,
              );
              toolActivity.status = "running";
              pendingToolCalls.set(toolCall.name, toolActivity);

              streamManger.addToolEvent(toolCall.name, true, toolCall);

              yield {
                type: StreamEventType.TOOL_START,
                content: JSON.stringify({
                  ...toolActivity,
                  args: toolCall.args,
                }),
                metadata: {
                  toolName: toolCall.name,
                  node: nodeName,
                  toolId: toolActivity.id,
                },
              };
            }
          }
        }
      }

      // Don't emit END if we errored
      if (hasErrored) {
        streamManger.endStream();
        return;
      }

      // Mark any remaining pending tools as completed
      for (const [toolName, activity] of pendingToolCalls) {
        activity.status = "completed";
        activity.endTime = Date.now();
        yield {
          type: StreamEventType.TOOL_END,
          content: JSON.stringify(activity),
          metadata: {
            toolName,
            duration: activity.endTime - activity.startTime,
          },
        };
      }

      // Emit summarizing event before final response
      if (accumulatedContent) {
        yield {
          type: StreamEventType.SUMMARIZING,
          content: "Preparing response...",
          metadata: { threadId: conversationId, timestamp: Date.now() },
        };
      }

      streamManger.endStream(accumulatedContent);
      yield {
        type: StreamEventType.END,
        content: accumulatedContent,
        metadata: { threadId: conversationId },
      };
    } catch (error: any) {
      // Mark pending tools as failed
      for (const [toolName, activity] of pendingToolCalls) {
        activity.status = "failed";
        activity.endTime = Date.now();
        yield {
          type: StreamEventType.TOOL_END,
          content: JSON.stringify(activity),
          metadata: { toolName, error: true },
        };
      }

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
      this.activeTools.clear();
    }
  }

  private summarizeToolResult(content: any, toolName: string): string {
    if (!content) return "Completed";

    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    // Use synthesizer for web search results
    if (toolName === "web_search") {
      try {
        // Try to parse as search response
        const parsed =
          typeof content === "string" ? JSON.parse(content) : content;
        if (parsed?.results) {
          const result = this.synthesizer.synthesizeWebSearch(parsed);
          return result.sources
            ? `Found ${result.sources.length} relevant sources`
            : result.summary;
        }
      } catch {
        // Fall back to regex extraction
        const resultMatch = contentStr.match(/Found (\d+) results/);
        if (resultMatch) {
          return `Found ${resultMatch[1]} search results`;
        }
      }
      return "Search completed";
    }

    if (toolName === "read_file") {
      const lines = contentStr.split("\n").length;
      return `Read ${lines} lines`;
    }

    if (toolName === "analyze_files_for_question") {
      // Extract key insight from analysis
      const firstSentence = contentStr.match(/^[^.!?]+[.!?]/)?.[0];
      if (
        firstSentence &&
        firstSentence.length > 10 &&
        firstSentence.length < 150
      ) {
        return firstSentence.trim();
      }
      return "Code analysis complete";
    }

    if (toolName === "search_codebase") {
      const matchCount = (contentStr.match(/match/gi) || []).length;
      return matchCount > 0 ? `Found ${matchCount} matches` : "Search complete";
    }

    if (contentStr.length > 100) {
      return `Processed ${Math.ceil(contentStr.length / 1000)}KB of data`;
    }

    return "Completed successfully";
  }

  private countResultItems(content: any): number | undefined {
    if (!content) return undefined;

    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    // Try to extract count from search results
    const countMatch = contentStr.match(/Found (\d+) results/);
    if (countMatch) {
      return parseInt(countMatch[1], 10);
    }

    // Count lines for file content
    if (typeof content === "string") {
      return content.split("\n").length;
    }

    // Count array items
    if (Array.isArray(content)) {
      return content.length;
    }

    return undefined;
  }

  // Convert various message content shapes into plain text.
  // Handles: string, array of content blocks, single object with `text` or `content`.
  // Filters out tool_use blocks that shouldn't be displayed to users.
  private normalizeMessageContent(content: any): string {
    if (content == null) return "";
    if (typeof content === "string") {
      // Filter out JSON tool_use blocks that may appear in string content
      return this.filterToolUseFromString(content);
    }

    // Array of blocks (e.g., [{type:'text', text: '...'}, ...])
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (item == null) return "";
          if (typeof item === "string")
            return this.filterToolUseFromString(item);
          if (typeof item === "object") {
            // Skip tool_use blocks entirely - these are internal
            if (item.type === "tool_use") return "";
            if (item.type === "tool_result") return "";
            if (typeof item.text === "string") return item.text;
            if (typeof item.content === "string") return item.content;
            // Skip unknown tool-related objects
            if (item.name && item.input) return "";
            return "";
          }
          return String(item);
        })
        .filter(Boolean)
        .join("");
    }

    if (typeof content === "object") {
      // Skip tool_use objects
      if (content.type === "tool_use") return "";
      if (content.type === "tool_result") return "";
      if (typeof content.text === "string") return content.text;
      if (typeof content.content === "string") return content.content;
      return "";
    }

    return String(content);
  }

  // Remove embedded JSON tool_use blocks from string content
  private filterToolUseFromString(text: string): string {
    if (!text) return "";

    // Remove JSON objects that look like tool_use blocks
    // Pattern matches {"type":"tool_use",...} objects
    const toolUsePattern =
      /\{"type"\s*:\s*"tool_use"[^}]*"input"\s*:\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*\}/g;
    let cleaned = text.replace(toolUsePattern, "");

    // Also remove any remaining partial JSON that starts with tool_use pattern
    cleaned = cleaned.replace(/\{"type"\s*:\s*"tool_use"[\s\S]*$/g, "");

    // Clean up multiple newlines left behind
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    return cleaned.trim();
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
