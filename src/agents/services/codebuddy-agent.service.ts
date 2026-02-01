import { Command, InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { createAdvancedDeveloperAgent } from "../developer/agent";
import {
  ICodeBuddyAgentConfig,
  IToolActivity,
  StreamEventType,
} from "../interface/agent.interface";
import { StreamManager } from "./stream-manager.service";
import { ResultSynthesizerService } from "./result-synthesizer.service";
import { AgentRunningGuardService } from "../../services/agent-running-guard.service";

// Tool descriptions for user-friendly feedback
const TOOL_DESCRIPTIONS: Record<
  string,
  { name: string; description: string; activityType: string }
> = {
  run_command: {
    name: "Terminal",
    description: "Running command...",
    activityType: "executing",
  },
  run_terminal_command: {
    name: "Terminal",
    description: "Executing terminal command...",
    activityType: "executing",
  },
  command: {
    name: "Terminal",
    description: "Running command...",
    activityType: "executing",
  },
  web_search: {
    name: "Web Search",
    description: "Searching the web for relevant information...",
    activityType: "searching",
  },
  read_file: {
    name: "File Reader",
    description: "Reading file contents...",
    activityType: "reading",
  },
  analyze_files_for_question: {
    name: "Code Analyzer",
    description: "Analyzing code files...",
    activityType: "analyzing",
  },
  think: {
    name: "Reasoning",
    description: "Thinking through the problem...",
    activityType: "thinking",
  },
  write_file: {
    name: "File Writer",
    description: "Writing to file...",
    activityType: "working",
  },
  edit_file: {
    name: "File Editor",
    description: "Editing file contents...",
    activityType: "working",
  },
  search_codebase: {
    name: "Codebase Search",
    description: "Searching the codebase...",
    activityType: "searching",
  },
  git_diff: {
    name: "Git Diff",
    description: "Checking file changes...",
    activityType: "reviewing",
  },
  git_log: {
    name: "Git Log",
    description: "Reviewing commit history...",
    activityType: "reviewing",
  },
  git_branch: {
    name: "Git Branch",
    description: "Managing branches...",
    activityType: "working",
  },
  list_directory: {
    name: "Directory Listing",
    description: "Exploring directory structure...",
    activityType: "reading",
  },
  default: {
    name: "Tool",
    description: "Executing tool...",
    activityType: "working",
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
  // Queue of pending approvals; each resolver represents one requested action approval
  private consentWaiters: Array<() => void> = [];

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

  /**
   * Checks if any agent is currently running/streaming
   * Used for close confirmation dialogs
   */
  isAnyAgentRunning(): boolean {
    for (const [_, streamManager] of this.activeStreams) {
      if (streamManager.isActive()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets count of active agent streams
   */
  getActiveStreamCount(): number {
    let count = 0;
    for (const [_, streamManager] of this.activeStreams) {
      if (streamManager.isActive()) {
        count++;
      }
    }
    return count;
  }

  private getToolInfo(toolName: string): {
    name: string;
    description: string;
    activityType: string;
  } {
    return TOOL_DESCRIPTIONS[toolName] || TOOL_DESCRIPTIONS.default;
  }

  /**
   * Maps a tool name to its corresponding StreamEventType for activity streaming
   */
  private getActivityEventType(toolName: string): StreamEventType {
    const toolInfo = this.getToolInfo(toolName);
    switch (toolInfo.activityType) {
      case "reading":
        return StreamEventType.READING;
      case "searching":
        return StreamEventType.SEARCHING;
      case "analyzing":
        return StreamEventType.ANALYZING;
      case "executing":
        return StreamEventType.EXECUTING;
      case "reviewing":
        return StreamEventType.REVIEWING;
      case "thinking":
        return StreamEventType.THINKING;
      case "working":
      default:
        return StreamEventType.WORKING;
    }
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
    } else if (
      (toolName === "run_command" || toolName === "command") &&
      args?.command
    ) {
      const cmd = `${args.command}`;
      const trimmed = cmd.length > 80 ? `${cmd.slice(0, 77)}...` : cmd;
      description = `Command: ${trimmed}`;
    } else if (args && typeof args === "object") {
      const keys = Object.keys(args);
      if (keys.length > 0) {
        const shown = keys.slice(0, 3).join(", ");
        description = `${toolInfo.description} (inputs: ${shown}${keys.length > 3 ? "…" : ""})`;
      }
    }

    return {
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolName,
      status: "starting",
      description,
      startTime: Date.now(),
    };
  }

  private summarizeArgs(args: any): string | null {
    if (!args || typeof args !== "object") return null;
    const keys = Object.keys(args);
    if (keys.length === 0) return null;
    const shown = keys.slice(0, 3).join(", ");
    const suffix = keys.length > 3 ? "…" : "";
    return `inputs: ${shown}${suffix}`;
  }

  private summarizeArgPairs(args: any): string | null {
    if (!args || typeof args !== "object") return null;
    const entries = Object.entries(args).slice(0, 2);
    if (entries.length === 0) return null;
    const parts = entries.map(([key, value]) => {
      const raw = typeof value === "string" ? value : JSON.stringify(value);
      const trimmed = raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
      return `${key}=${trimmed}`;
    });
    const suffix = Object.keys(args).length > 2 ? ", …" : "";
    return `inputs: ${parts.join(", ")}${suffix}`;
  }

  private describeToolInvocation(
    toolNameRaw: string,
    args: any,
    fallbackDescription?: string,
  ): { friendlyName: string; summary: string } {
    const toolInfo = this.getToolInfo(toolNameRaw);
    const friendlyName = toolInfo.name || toolNameRaw;

    const argSummary = this.summarizeArgs(args);
    const argPairs = this.summarizeArgPairs(args);
    let descriptionBase =
      fallbackDescription || toolInfo.description || "Approval required.";

    // Avoid generic "Executing tool"; provide a clearer action statement
    if (descriptionBase === "Executing tool...") {
      descriptionBase = `Preparing to run ${friendlyName}`;
    }

    const summaryParts = [descriptionBase];
    if (argSummary) summaryParts.push(`(${argSummary})`);
    if (argPairs) summaryParts.push(`(${argPairs})`);
    const summary = summaryParts.join(" ");

    return { friendlyName, summary };
  }

  private async getAgent(config?: ICodeBuddyAgentConfig) {
    if (!this.agent) {
      this.agent = await createAdvancedDeveloperAgent({
        checkPointer: config?.checkPointer ?? this.checkpointer,
        store: config?.store ?? this.store,
        enableHITL: config?.enableHITL ?? true,
        interruptOn: config?.interruptOn,
      });
      this.logger.log(LogLevel.INFO, "Agent initialized");
    }
    return this.agent;
  }

  setUserConsent(granted: boolean) {
    // Treat consent as approving the next pending action only
    if (!granted) return;
    const resolver = this.consentWaiters.shift();
    resolver?.();
  }

  private async waitForActionConsent(): Promise<void> {
    await new Promise<void>((resolve) => this.consentWaiters.push(resolve));
  }

  async *streamResponse(
    userMessage: string,
    threadId?: string,
    onChunk?: (chunk: any) => void,
    requestId?: string,
  ) {
    const conversationId = threadId ?? `thread-${Date.now()}`;
    const streamManger = new StreamManager({
      maxBufferSize: 10,
      flushInterval: 50,
      enableBackPressure: true,
    });
    this.activeStreams.set(conversationId, streamManger);
    this.activeTools.clear();

    // Notify guard service that agent is starting (enables close confirmation)
    const guardService = AgentRunningGuardService.getInstance();
    await guardService.notifyAgentStarted();

    // Safety limits - increased from 50 to handle complex multi-step tasks
    // Event count is higher because agent emits many events per "turn"
    const maxEventCount = 500; // Total events from the stream
    const maxToolInvocations = 80; // Maximum agent-initiated tool calls (excludes middleware)
    const maxToolCallsPerType = 20; // Limit repeated calls to same tool (agent-initiated only)
    // Critical/mutating tools have stricter limits to prevent infinite loops
    const criticalToolLimits: Record<string, number> = {
      edit_file: 8, // Editing files - stricter limit
      write_file: 8,
      delete_file: 3,
      run_command: 10,
      web_search: 8,
    };
    // Read-only tools are allowed many more calls - gathering context is normal
    const readOnlyTools = new Set([
      "read_file",
      "list_directory",
      "search_codebase",
      "grep",
      "glob",
      "analyze_files_for_question",
      "git_log",
      "git_diff",
      "git_status",
      "think",
    ]);
    const maxDurationMs = 5 * 60 * 1000; // 5 minute timeout
    const startTime = Date.now();

    let eventCount = 0;
    let totalToolInvocations = 0;
    const pendingToolCalls = new Map<string, IToolActivity>();
    const toolCallCounts = new Map<string, number>(); // Track agent-initiated tool call frequency only
    const fileEditCounts = new Map<string, number>(); // Track edits per file to detect file-specific loops
    let hasErrored = false;
    let forceStopReason: "max_events" | "max_tools" | "timeout" | null = null;

    // Simple state machine to track phases
    type AgentState =
      | "planning"
      | "running"
      | "summarizing"
      | "completed"
      | "failed";
    let agentState: AgentState = "planning";

    try {
      const agent = await this.getAgent();
      const streamId = await streamManger.startStream(requestId);
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
      agentState = "running";

      const config = {
        configurable: { thread_id: conversationId },
        recursionLimit: 100,
      };
      let streamIterator = (
        await agent.stream(
          { messages: [{ role: "user", content: userMessage }] },
          config,
        )
      )[Symbol.asyncIterator]();
      let accumulatedContent = "";

      while (true) {
        const { value: event, done } = await streamIterator.next();
        if (done) break;
        // Stop immediately if we've already errored
        if (hasErrored) break;

        // DEBUG: Log raw events from agent (reduce verbosity in production)
        this.logger.debug(
          `[STREAM] Event #${eventCount + 1}: ${JSON.stringify(Object.keys(event || {}))}`,
        );

        eventCount++;

        // Check safety limits
        const elapsed = Date.now() - startTime;
        let shouldStop = false;

        if (eventCount >= maxEventCount) {
          forceStopReason = "max_events";
          this.logger.log(
            LogLevel.WARN,
            `Force stopping: exceeded ${maxEventCount} events (${totalToolInvocations} tool calls in ${Math.round(elapsed / 1000)}s)`,
          );
          shouldStop = true;
        } else if (totalToolInvocations >= maxToolInvocations) {
          forceStopReason = "max_tools";
          this.logger.log(
            LogLevel.WARN,
            `Force stopping: exceeded ${maxToolInvocations} tool invocations`,
          );
          shouldStop = true;
        } else if (elapsed >= maxDurationMs) {
          forceStopReason = "timeout";
          this.logger.log(
            LogLevel.WARN,
            `Force stopping: exceeded ${maxDurationMs / 1000}s timeout`,
          );
          shouldStop = true;
        }

        if (shouldStop) {
          // Mark pending tools as completed with no result to avoid losing context
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
          pendingToolCalls.clear();

          // Emit a warning chunk so UI can surface the partial state
          const reasonMessages: Record<string, string> = {
            max_events: `Processed ${eventCount} events`,
            max_tools: `Made ${totalToolInvocations} tool calls`,
            timeout: `Ran for ${Math.round(elapsed / 1000)} seconds`,
          };
          const reasonText = forceStopReason
            ? reasonMessages[forceStopReason]
            : "Safety limit reached";
          const warning = `⚠️ Stopping early (${reasonText}). Here's what I found so far:`;

          yield {
            type: StreamEventType.CHUNK,
            content: warning,
            metadata: { threadId: conversationId, reason: forceStopReason },
            accumulated: accumulatedContent
              ? `${accumulatedContent}\n\n${warning}`
              : warning,
          };

          // Break the loop but allow graceful END below
          break;
        }

        const entries = Object.entries(event as Record<string, any>);

        const interruptEntry = entries.find(
          ([nodeName]) => nodeName === "__interrupt__",
        );

        if (interruptEntry) {
          const [, interruptUpdates] = interruptEntry;
          const interrupts = Array.isArray(interruptUpdates)
            ? interruptUpdates
            : [interruptUpdates];

          for (const interrupt of interrupts) {
            const interruptId =
              interrupt?.value?.id ?? `interrupt-${Date.now()}`;
            const toolNameRaw =
              interrupt?.value?.name || interrupt?.value?.tool || "tool";
            const toolArgs =
              interrupt?.value?.input ||
              interrupt?.value?.args ||
              interrupt?.value?.parameters;
            const { friendlyName, summary } = this.describeToolInvocation(
              toolNameRaw,
              toolArgs,
              interrupt?.value?.description,
            );

            yield {
              type: StreamEventType.METADATA,
              content: "interrupt_waiting",
              metadata: {
                threadId: conversationId,
                status: "interrupt_waiting",
                toolName: friendlyName,
                description: summary,
              },
            };
            yield {
              type: StreamEventType.CHUNK,
              content: `Approval needed for ${friendlyName}: ${summary} Waiting for your approval...`,
              metadata: { threadId: conversationId, timestamp: Date.now() },
            };

            await this.waitForActionConsent();

            yield {
              type: StreamEventType.METADATA,
              content: "interrupt_approved",
              metadata: {
                threadId: conversationId,
                status: "interrupt_approved",
                toolName: friendlyName,
              },
            };
            yield {
              type: StreamEventType.CHUNK,
              content: `Approval received. Continuing with ${friendlyName}...`,
              metadata: { threadId: conversationId, timestamp: Date.now() },
            };

            // Resume the agent after approval using LangGraph Command
            // The resume value should match the interrupt's expected response format
            this.logger.debug(
              `[STREAM] Resuming from interrupt ${interruptId} with approval`,
            );

            // Create a proper Command object to resume the agent
            const resumeCommand = new Command({
              resume: "approve", // Simple approval - the agent will continue with the pending tool
            });

            try {
              streamIterator = (await agent.stream(resumeCommand, config))[
                Symbol.asyncIterator
              ]();
              this.logger.debug(
                `[STREAM] Successfully created new stream iterator after resume`,
              );
            } catch (resumeError: any) {
              this.logger.error(
                `[STREAM] Failed to resume: ${resumeError.message}`,
              );
              // Try alternative resume format as fallback
              const fallbackResume = { resume: { [interruptId]: "approve" } };
              streamIterator = (
                await agent.stream(fallbackResume as any, config)
              )[Symbol.asyncIterator]();
              this.logger.debug(`[STREAM] Used fallback resume format`);
            }
          }

          continue; // Skip normal processing for interrupt events
        }

        for (const [nodeName, update] of entries) {
          // Check for tool results in messages (indicates tool completion)
          if (update?.messages && Array.isArray(update.messages)) {
            for (const message of update.messages) {
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

                  // Emit a working event to show the agent is processing results
                  yield {
                    type: StreamEventType.WORKING,
                    content: `Finished ${this.getToolInfo(toolName).name} and processing results...`,
                    metadata: {
                      toolName,
                      node: nodeName,
                      result: toolActivity.result?.summary,
                      timestamp: Date.now(),
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

          // Handle tool calls - check messages for tool_calls property (LangChain format)
          // Tool calls can be in update.toolCalls OR in message.tool_calls
          const toolCallsToProcess: any[] = [];

          // Check update-level toolCalls (some frameworks put them here)
          if (update?.toolCalls && Array.isArray(update.toolCalls)) {
            toolCallsToProcess.push(...update.toolCalls);
          }

          // Check message-level tool_calls (LangChain/LangGraph standard format)
          if (update?.messages && Array.isArray(update.messages)) {
            for (const msg of update.messages) {
              // AI messages may have tool_calls array
              if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                toolCallsToProcess.push(...msg.tool_calls);
              }
              // Also check additional_kwargs for tool_calls (older format)
              if (
                msg.additional_kwargs?.tool_calls &&
                Array.isArray(msg.additional_kwargs.tool_calls)
              ) {
                toolCallsToProcess.push(...msg.additional_kwargs.tool_calls);
              }
              // Check content array for tool_use blocks (Anthropic format)
              if (Array.isArray(msg.content)) {
                for (const block of msg.content) {
                  if (block.type === "tool_use") {
                    toolCallsToProcess.push({
                      name: block.name,
                      args: block.input,
                      id: block.id,
                    });
                  }
                }
              }
            }
          }

          if (toolCallsToProcess.length > 0) {
            this.logger.debug(
              `[STREAM] Tool calls detected: ${toolCallsToProcess.length} tools - ${toolCallsToProcess.map((tc: any) => tc.name).join(", ")}`,
            );
            // Emit a decision event when agent decides to use tools
            // Deduplicate tool names and show counts for repeated tools
            const toolNameCounts = new Map<string, number>();
            for (const tc of toolCallsToProcess) {
              const name = this.getToolInfo(tc.name).name;
              toolNameCounts.set(name, (toolNameCounts.get(name) || 0) + 1);
            }
            const toolNamesFormatted = Array.from(toolNameCounts.entries())
              .map(([name, count]) =>
                count > 1 ? `${name} (x${count})` : name,
              )
              .join(", ");
            yield {
              type: StreamEventType.DECISION,
              content: `Using: ${toolNamesFormatted}`,
              metadata: {
                toolCount: toolCallsToProcess.length,
                tools: toolCallsToProcess.map((tc: any) => tc.name),
                node: nodeName,
                timestamp: Date.now(),
              },
            };

            for (const toolCall of toolCallsToProcess) {
              // Only count tool invocations from actual agent nodes, not middleware
              // Middleware nodes like "SummarizationMiddleware.before_model" are internal operations
              const isMiddlewareNode =
                nodeName.includes("Middleware") ||
                nodeName.includes("before_model");

              // Only track and limit agent-initiated tool calls
              let currentCount = 0;
              if (!isMiddlewareNode) {
                totalToolInvocations++;
                currentCount = toolCallCounts.get(toolCall.name) || 0;
                toolCallCounts.set(toolCall.name, currentCount + 1);
              }

              this.logger.debug(
                `[STREAM] Tool call: ${toolCall.name} from ${nodeName}${isMiddlewareNode ? " (middleware - not counted)" : ` (#${totalToolInvocations}, ${currentCount + 1}x for this tool)`}`,
              );

              // Check if this tool is being called too many times (looping)
              // Only apply loop detection for agent-initiated calls, not middleware
              if (!isMiddlewareNode) {
                // Read-only tools don't trigger loop stopping - they just gather context
                const isReadOnlyTool = readOnlyTools.has(toolCall.name);

                // Use stricter limits for critical/mutating tools only
                const toolLimit =
                  criticalToolLimits[toolCall.name] ?? maxToolCallsPerType;
                const isLooping = currentCount >= toolLimit;

                // Also track per-file edits to detect same-file loops
                if (
                  (toolCall.name === "edit_file" ||
                    toolCall.name === "write_file") &&
                  toolCall.args?.file_path
                ) {
                  const filePath = toolCall.args.file_path;
                  const fileCount = (fileEditCounts.get(filePath) || 0) + 1;
                  fileEditCounts.set(filePath, fileCount);

                  if (fileCount >= 4) {
                    this.logger.log(
                      LogLevel.WARN,
                      `Same file ${filePath} edited ${fileCount} times - stopping to prevent infinite loop`,
                    );

                    hasErrored = true;
                    yield {
                      type: StreamEventType.ERROR,
                      content: `I've tried to edit the same file (${filePath.split("/").pop()}) ${fileCount} times. The edit may not be matching correctly or there's an issue with the file content. I'll stop here - please try the edit manually or check if the file content matches what I expect.`,
                      metadata: {
                        threadId: conversationId,
                        reason: "same_file_loop",
                        toolName: toolCall.name,
                        filePath,
                        fileEditCount: fileCount,
                      },
                    };
                    break;
                  }
                }

                // Only stop for loops on mutating tools, not read-only ones
                if (isLooping && !isReadOnlyTool) {
                  this.logger.log(
                    LogLevel.WARN,
                    `Tool ${toolCall.name} called ${currentCount + 1} times (limit: ${toolLimit}) - loop detected, stopping`,
                  );

                  hasErrored = true;

                  // Provide specific error messages based on tool type
                  let errorMessage: string;
                  if (
                    toolCall.name === "edit_file" ||
                    toolCall.name === "write_file"
                  ) {
                    errorMessage = `I've attempted to edit this file ${currentCount + 1} times but the edit isn't completing successfully. This usually happens when the edit operation is interrupted or the file content doesn't match exactly. I'll stop here to avoid an infinite loop. You may need to make the change manually.`;
                  } else if (toolCall.name === "web_search") {
                    errorMessage = `I've searched for this information multiple times but couldn't find definitive results. For GitHub issues, try using the GitHub MCP tools directly or visit the repository issues page manually.`;
                  } else {
                    errorMessage = `I've called ${toolCall.name} ${currentCount + 1} times which indicates a loop. I'll stop here to prevent infinite processing.`;
                  }

                  yield {
                    type: StreamEventType.ERROR,
                    content: errorMessage,
                    metadata: {
                      threadId: conversationId,
                      reason: "tool_loop_detected",
                      toolName: toolCall.name,
                      callCount: currentCount + 1,
                      limit: toolLimit,
                    },
                  };
                  break;
                } else if (isLooping && isReadOnlyTool) {
                  // Just log a warning for read-only tools, don't stop
                  this.logger.debug(
                    `[STREAM] Read-only tool ${toolCall.name} called ${currentCount + 1} times - allowing to continue`,
                  );
                }
              }

              const toolActivity = this.createToolActivity(
                toolCall.name,
                toolCall.args,
              );
              toolActivity.status = "running";
              pendingToolCalls.set(toolCall.name, toolActivity);

              streamManger.addToolEvent(toolCall.name, true, toolCall);

              // Emit the generic TOOL_START event
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

              // Also emit an activity-specific event for detailed streaming
              const activityEventType = this.getActivityEventType(
                toolCall.name,
              );
              yield {
                type: activityEventType,
                content: toolActivity.description,
                metadata: {
                  toolName: toolCall.name,
                  node: nodeName,
                  toolId: toolActivity.id,
                  activityType: this.getToolInfo(toolCall.name).activityType,
                  timestamp: Date.now(),
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
          content: forceStopReason
            ? "Preparing partial response (stopped early for safety)..."
            : "Preparing response...",
          metadata: { threadId: conversationId, timestamp: Date.now() },
        };
        agentState = "summarizing";
      }

      streamManger.endStream(accumulatedContent);
      yield {
        type: StreamEventType.END,
        content: accumulatedContent,
        metadata: {
          threadId: conversationId,
          forceStopReason,
          state: forceStopReason ? "completed_with_warning" : "completed",
        },
      };
      agentState = forceStopReason ? "completed" : "completed";
    } catch (error: any) {
      agentState = "failed";
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
      // Notify guard service that agent has stopped
      const guardService = AgentRunningGuardService.getInstance();
      guardService.notifyAgentStopped();
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

    let cleaned = text;

    // Remove JSON objects that look like tool_use blocks
    // Pattern matches {"type":"tool_use",...} objects
    const toolUsePattern =
      /\{"type"\s*:\s*"tool_use"[^}]*"input"\s*:\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*\}/g;
    cleaned = cleaned.replace(toolUsePattern, "");

    // Remove tool_call objects: {"name":"...", "args":{...}, "type":"tool_call"...}
    const toolCallPattern =
      /\{"name"\s*:\s*"[^"]+"\s*,\s*"args"\s*:\s*\{[^}]*\}[^}]*\}/g;
    cleaned = cleaned.replace(toolCallPattern, "");

    // Remove command objects: {"command":"user-input",...}
    const commandPattern =
      /\{"command"\s*:\s*"[^"]+"\s*,\s*"message"\s*:\s*"[^"]*"[^}]*\}/g;
    cleaned = cleaned.replace(commandPattern, "");

    // Remove any remaining partial JSON that starts with tool_use or tool_call patterns
    cleaned = cleaned.replace(/\{"type"\s*:\s*"tool_use"[\s\S]*$/g, "");
    cleaned = cleaned.replace(/\{"type"\s*:\s*"tool_call"[\s\S]*$/g, "");
    cleaned = cleaned.replace(
      /\{"name"\s*:\s*"[^"]+"\s*,\s*"args"[\s\S]*$/g,
      "",
    );
    cleaned = cleaned.replace(/\{"command"\s*:\s*"user-input"[\s\S]*$/g, "");

    // Aggressive cleanup: remove consecutive JSON objects that start with {" and end with }
    // This catches concatenated tool call JSON that wasn't matched by specific patterns
    cleaned = cleaned.replace(/(\{"[^"]+"\s*:[^}]+\})+(?=\{"|$)/g, (match) => {
      // Only remove if it looks like tool/command metadata, not actual content
      if (
        match.includes('"type":"tool') ||
        match.includes('"name":"') ||
        match.includes('"command":"') ||
        match.includes('"args":') ||
        match.includes('"id":"toolu_')
      ) {
        return "";
      }
      return match;
    });

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
