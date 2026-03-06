import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs";
import { Command, InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { trace, Span, SpanStatusCode } from "@opentelemetry/api";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { createAdvancedDeveloperAgent } from "../developer/agent";
import {
  IToolActivity,
  IStreamContext,
  IAgentToolCall,
  IAgentNodeUpdate,
  IToolDescription,
  IStreamEvent,
  IStreamableAgent,
  IInterruptValue,
  StreamEventType,
} from "../interface/agent.interface";
import { StreamManager } from "./stream-manager.service";
import { ResultSynthesizerService } from "./result-synthesizer.service";
import { AgentRunningGuardService } from "../../services/agent-running-guard.service";
import { InputValidator } from "../../services/input-validator";
import { CostTrackingService } from "../../services/cost-tracking.service";
import { CheckpointService } from "../../services/checkpoint.service";
import { getGenerativeAiModel, getAPIKeyAndModel } from "../../utils/utils";
import { Orchestrator } from "../../orchestrator";
import { AgentSafetyGuard } from "./agent-safety-guard";
import { ConsentManager } from "./consent-manager";
import { ContentNormalizer } from "./content-normalizer";

// Tool descriptions for user-friendly feedback
const TOOL_DESCRIPTIONS: Record<string, IToolDescription> = {
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
  manage_tasks: {
    name: "Task Manager",
    description: "Managing tasks...",
    activityType: "working",
  },
  manage_core_memory: {
    name: "Core Memory",
    description: "Managing memory...",
    activityType: "working",
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
  run_tests: {
    name: "Test Runner",
    description: "Running tests...",
    activityType: "executing",
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
  private agentCache = new Map<string, IStreamableAgent>();
  private store = new InMemoryStore();
  private checkpointer: MemorySaver | SqliteSaver | undefined;
  private readonly logger: Logger;
  private static instance: CodeBuddyAgentService;
  private activeStreams = new Map<string, StreamManager>();
  private readonly synthesizer: ResultSynthesizerService;
  private readonly safetyGuard: AgentSafetyGuard;
  private readonly consentManager: ConsentManager;
  private readonly contentNormalizer: ContentNormalizer;
  private readonly modelChangeDisposable: { dispose(): void };
  private readonly warnedUnknownTools = new Set<string>();

  constructor() {
    this.logger = Logger.initialize("CodeBuddyAgentService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.synthesizer = ResultSynthesizerService.getInstance();
    this.safetyGuard = new AgentSafetyGuard();
    this.consentManager = new ConsentManager();
    this.contentNormalizer = new ContentNormalizer();

    // Invalidate cached agents when the user switches model/provider
    this.modelChangeDisposable =
      Orchestrator.getInstance().onModelChangeSuccess(() => {
        if (this.agentCache.size > 0) {
          this.agentCache.clear();
          this.logger.log(
            LogLevel.INFO,
            "Agent cache cleared after model change",
          );
        }
      });

    // Track every file the agent edits so checkpoints cover them
    this.initFileTracking();
  }

  /**
   * Lazily initializes a persistent SQLite-backed checkpointer.
   * Falls back to an ephemeral MemorySaver if the workspace path
   * is unavailable or SQLite initialization fails.
   */
  private async getCheckpointer(): Promise<MemorySaver | SqliteSaver> {
    if (this.checkpointer) return this.checkpointer;

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspacePath) {
      try {
        const codeBuddyDir = path.join(workspacePath, ".codebuddy");
        if (!fs.existsSync(codeBuddyDir)) {
          fs.mkdirSync(codeBuddyDir, { recursive: true });
        }
        const dbPath = path.join(codeBuddyDir, "checkpoints.db");
        const saver = SqliteSaver.fromConnString(dbPath);
        this.checkpointer = saver;
        this.logger.log(
          LogLevel.INFO,
          `Persistent checkpointer initialized at ${dbPath}`,
        );
        return this.checkpointer;
      } catch (error) {
        this.logger.warn(
          "Failed to initialize SQLite checkpointer, falling back to in-memory",
          error,
        );
      }
    }

    this.checkpointer = new MemorySaver();
    return this.checkpointer;
  }

  /**
   * Listen for file‐change events from DiffReviewService and register
   * each touched path with CheckpointService for future snapshots.
   */
  private async initFileTracking(): Promise<void> {
    try {
      const { DiffReviewService } =
        await import("../../services/diff-review.service");
      const diffService = DiffReviewService.getInstance();
      diffService.onChangeEvent((evt) => {
        try {
          CheckpointService.getInstance().trackFile(evt.change.filePath);
        } catch (trackError) {
          this.logger.warn("Failed to track file change", trackError);
        }
      });
    } catch (importError) {
      this.logger.warn(
        "Could not initialize file tracking for checkpoints",
        importError,
      );
    }
  }

  static getInstance(): CodeBuddyAgentService {
    return (CodeBuddyAgentService.instance ??= new CodeBuddyAgentService());
  }

  /**
   * Checks if any agent is currently running/streaming.
   */
  isAnyAgentRunning(): boolean {
    for (const sm of this.activeStreams.values()) {
      if (sm.isActive()) return true;
    }
    return false;
  }

  /**
   * Gets count of active agent streams.
   */
  getActiveStreamCount(): number {
    let count = 0;
    for (const sm of this.activeStreams.values()) {
      if (sm.isActive()) count++;
    }
    return count;
  }

  private getToolInfo(toolName: string): IToolDescription {
    const info = TOOL_DESCRIPTIONS[toolName];
    if (info) return info;
    if (!this.warnedUnknownTools.has(toolName)) {
      this.warnedUnknownTools.add(toolName);
      this.logger.warn(
        `Unknown tool "${toolName}" not in TOOL_DESCRIPTIONS — using default`,
      );
    }
    return TOOL_DESCRIPTIONS.default;
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

  private createToolActivity(
    toolName: string,
    args?: Record<string, unknown>,
  ): IToolActivity {
    const toolInfo = this.getToolInfo(toolName);
    let description = toolInfo.description;

    // Customize description based on tool args
    if (toolName === "web_search" && typeof args?.query === "string") {
      const q = args.query;
      description = `Searching the web for: "${q.substring(0, 50)}${q.length > 50 ? "..." : ""}"`;
    } else if (toolName === "think" && typeof args?.thought === "string") {
      description = args.thought;
    } else if (toolName === "read_file" && typeof args?.path === "string") {
      description = `Reading file: ${args.path.split("/").pop()}`;
    } else if (
      toolName === "analyze_files_for_question" &&
      Array.isArray(args?.files)
    ) {
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
      id: `tool-${randomUUID()}`,
      toolName,
      status: "starting",
      description,
      startTime: Date.now(),
    };
  }

  private summarizeArgs(
    args: Record<string, unknown> | null | undefined,
    style: "keys" | "pairs" = "keys",
  ): string | null {
    if (!args || typeof args !== "object") return null;
    const keys = Object.keys(args);
    if (keys.length === 0) return null;

    if (style === "pairs") {
      const entries = Object.entries(args).slice(0, 2);
      const parts = entries.map(([key, value]) => {
        const raw = typeof value === "string" ? value : JSON.stringify(value);
        const trimmed = raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
        return `${key}=${trimmed}`;
      });
      const suffix = keys.length > 2 ? ", …" : "";
      return `inputs: ${parts.join(", ")}${suffix}`;
    }

    const shown = keys.slice(0, 3).join(", ");
    const suffix = keys.length > 3 ? "…" : "";
    return `inputs: ${shown}${suffix}`;
  }

  private describeToolInvocation(
    toolNameRaw: string,
    args: Record<string, unknown> | undefined,
    fallbackDescription?: string,
  ): { friendlyName: string; summary: string } {
    const toolInfo = this.getToolInfo(toolNameRaw);
    const friendlyName = toolInfo.name || toolNameRaw;

    const argSummary = this.summarizeArgs(args);
    const argPairs = this.summarizeArgs(args, "pairs");
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

  private async getAgent(): Promise<IStreamableAgent> {
    const cacheKey = this.buildAgentCacheKey();
    if (!this.agentCache.has(cacheKey)) {
      const checkpointer = await this.getCheckpointer();
      const agent = await createAdvancedDeveloperAgent({
        checkPointer: checkpointer,
        store: this.store,
        enableHITL: true,
      });
      this.agentCache.set(cacheKey, agent as unknown as IStreamableAgent);
      this.logger.log(LogLevel.INFO, `Agent initialized (key: ${cacheKey})`);
    }
    return this.agentCache.get(cacheKey)!;
  }

  private buildAgentCacheKey(): string {
    const provider = getGenerativeAiModel() ?? "unknown";
    let model = provider;
    try {
      const cfg = getAPIKeyAndModel(provider.toLowerCase());
      model = cfg.model ?? provider;
    } catch {
      // Use provider name as fallback
    }
    return `agent:${provider}:${model}`;
  }

  /**
   * Respond to a pending consent request.
   * Delegates to ConsentManager.
   */
  setUserConsent(granted: boolean, threadId?: string) {
    this.consentManager.respond(granted, threadId);
  }

  private waitForActionConsent(threadId: string): Promise<boolean> {
    return this.consentManager.waitForConsent(threadId);
  }

  async *streamResponse(
    userMessage: string,
    threadId?: string,
    onChunk?: (chunk: IStreamEvent) => void,
    requestId?: string,
  ): AsyncGenerator<IStreamEvent> {
    // Validate input for prompt injection and other security issues
    const validation = InputValidator.getInstance().validateInput(userMessage);

    if (validation.blocked) {
      yield {
        type: StreamEventType.ERROR,
        content:
          "Your message was blocked because it contains potentially unsafe instructions. Please rephrase your request.",
        metadata: { reason: "input_blocked", warnings: validation.warnings },
      };
      return;
    }

    // Use the sanitized input for processing
    const sanitizedMessage = validation.sanitizedInput;
    if (validation.warnings.length > 0) {
      this.logger.warn(
        `Input validation warnings: ${validation.warnings.join("; ")}`,
      );
    }

    const conversationId = threadId ?? `thread-${Date.now()}`;
    const streamManager = new StreamManager({
      maxBufferSize: 10,
      flushInterval: 50,
      enableBackPressure: true,
    });
    this.activeStreams.set(conversationId, streamManager);

    // Notify guard service that agent is starting (enables close confirmation)
    const guardService = AgentRunningGuardService.getInstance();
    await guardService.notifyAgentStarted();

    // Stream-scoped mutable state — never shared across concurrent streams
    const ctx: IStreamContext = {
      conversationId,
      pendingToolCalls: new Map(),
      toolCallCounts: new Map(),
      fileEditCounts: new Map(),
      accumulatedContent: "",
      eventCount: 0,
      totalToolInvocations: 0,
      startTime: Date.now(),
      hasErrored: false,
      forceStopReason: null,
      agentState: "planning",
    };

    const tracer = trace.getTracer("codebuddy-agent-service");
    const span = tracer.startSpan("streamAgent", {
      attributes: {
        thread_id: conversationId,
        user_message: sanitizedMessage.substring(0, 500),
      },
    });

    // Cost tracking — resolve current provider/model for pricing lookup
    const costTracker = CostTrackingService.getInstance();
    const providerName = getGenerativeAiModel() ?? "unknown";
    let currentModelName = "unknown";
    try {
      const cfg = getAPIKeyAndModel(providerName.toLowerCase());
      currentModelName = cfg.model ?? providerName;
    } catch {
      // Non-critical — fallback pricing will be used
    }

    try {
      const agent = await this.getAgent();
      const streamId = await streamManager.startStream(requestId);
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

      // Create a checkpoint before the agent starts modifying files
      try {
        const checkpointSvc = CheckpointService.getInstance();
        await checkpointSvc.createCheckpoint(
          conversationId,
          `Before: ${sanitizedMessage.slice(0, 60)}${sanitizedMessage.length > 60 ? "…" : ""}`,
        );
      } catch (cpError) {
        this.logger.warn(
          `Failed to create checkpoint: ${cpError instanceof Error ? cpError.message : cpError}`,
        );
      }

      ctx.agentState = "running";

      const config = {
        configurable: { thread_id: conversationId },
        recursionLimit: 100,
      };
      let streamIterator = (
        await agent.stream(
          { messages: [{ role: "user", content: sanitizedMessage }] },
          config,
        )
      )[Symbol.asyncIterator]();

      while (true) {
        const { value: event, done } = await streamIterator.next();
        if (done) break;
        // Stop immediately if we've already errored
        if (ctx.hasErrored) break;

        // DEBUG: Log raw events from agent (reduce verbosity in production)
        this.logger.debug(
          `[STREAM] Event #${ctx.eventCount + 1}: ${JSON.stringify(Object.keys(event || {}))}`,
        );

        ctx.eventCount++;

        // Check safety limits
        const elapsed = Date.now() - ctx.startTime;
        const safetyResult = this.safetyGuard.checkLimits(
          ctx.eventCount,
          ctx.totalToolInvocations,
          elapsed,
        );

        if (safetyResult.shouldStop) {
          ctx.forceStopReason = safetyResult.reason;

          // Mark pending tools as completed
          for (const [toolName, activity] of ctx.pendingToolCalls) {
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
          ctx.pendingToolCalls.clear();

          const warning = this.safetyGuard.buildStopMessage(
            ctx.forceStopReason!,
            ctx.eventCount,
            ctx.totalToolInvocations,
            elapsed,
          );

          yield {
            type: StreamEventType.CHUNK,
            content: warning,
            metadata: { threadId: conversationId, reason: ctx.forceStopReason },
            accumulated: ctx.accumulatedContent
              ? `${ctx.accumulatedContent}\n\n${warning}`
              : warning,
          };

          break;
        }

        const entries = Object.entries(event as Record<string, unknown>);

        const interruptEntry = entries.find(
          ([nodeName]) => nodeName === "__interrupt__",
        );

        if (interruptEntry) {
          const newIter = yield* this.handleInterrupt(
            interruptEntry as [string, IInterruptValue | IInterruptValue[]],
            ctx,
            agent,
            config,
          );
          if (newIter) streamIterator = newIter;
          continue;
        }

        yield* this.processNodeEntries(
          entries as [string, IAgentNodeUpdate][],
          ctx,
          span,
          streamManager,
          costTracker,
          conversationId,
          providerName,
          currentModelName,
          onChunk,
        );
      }

      yield* this.emitCompletion(
        ctx,
        span,
        streamManager,
        costTracker,
        conversationId,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ctx.agentState = "failed";
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      span.recordException(err);

      // Mark pending tools as failed
      for (const [toolName, activity] of ctx.pendingToolCalls) {
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
        err,
      );

      throw err;
    } finally {
      span.end();
      this.activeStreams.delete(conversationId);
      this.consentManager.clearThread(conversationId);
      const guardService = AgentRunningGuardService.getInstance();
      guardService.notifyAgentStopped();
    }
  }

  // ── Stream sub-generators ────────────────────────────────

  private async *handleInterrupt(
    interruptEntry: [string, IInterruptValue | IInterruptValue[]],
    ctx: IStreamContext,
    agent: IStreamableAgent,
    config: Record<string, unknown>,
  ): AsyncGenerator<IStreamEvent, AsyncIterator<unknown> | null> {
    const [, interruptUpdates] = interruptEntry;
    const interrupts = Array.isArray(interruptUpdates)
      ? interruptUpdates
      : [interruptUpdates];

    let newIterator: AsyncIterator<unknown> | null = null;

    for (const interrupt of interrupts) {
      const interruptId = interrupt?.value?.id ?? `interrupt-${Date.now()}`;
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
          threadId: ctx.conversationId,
          status: "interrupt_waiting",
          toolName: friendlyName,
          description: summary,
        },
      };
      yield {
        type: StreamEventType.CHUNK,
        content: `Approval needed for ${friendlyName}: ${summary} Waiting for your approval...`,
        metadata: { threadId: ctx.conversationId, timestamp: Date.now() },
      };

      const granted = await this.waitForActionConsent(ctx.conversationId);

      if (granted) {
        yield {
          type: StreamEventType.METADATA,
          content: "interrupt_approved",
          metadata: {
            threadId: ctx.conversationId,
            status: "interrupt_approved",
            toolName: friendlyName,
          },
        };
        yield {
          type: StreamEventType.CHUNK,
          content: `Approval received. Continuing with ${friendlyName}...`,
          metadata: { threadId: ctx.conversationId, timestamp: Date.now() },
        };

        this.logger.debug(
          `[STREAM] Resuming from interrupt ${interruptId} with approval`,
        );

        const resumeCommand = new Command({ resume: "approve" });
        try {
          newIterator = (await agent.stream(resumeCommand, config))[
            Symbol.asyncIterator
          ]();
          this.logger.debug(
            `[STREAM] Successfully created new stream iterator after resume`,
          );
        } catch (resumeError) {
          this.logger.error(
            `[STREAM] Failed to resume: ${resumeError instanceof Error ? resumeError.message : resumeError}`,
          );
          const fallbackResume = { resume: { [interruptId]: "approve" } };
          newIterator = (await agent.stream(fallbackResume, config))[
            Symbol.asyncIterator
          ]();
          this.logger.debug(`[STREAM] Used fallback resume format`);
        }
      } else {
        yield {
          type: StreamEventType.METADATA,
          content: "interrupt_denied",
          metadata: {
            threadId: ctx.conversationId,
            status: "interrupt_denied",
            toolName: friendlyName,
          },
        };
        yield {
          type: StreamEventType.CHUNK,
          content: `Action denied. Skipping ${friendlyName}.`,
          metadata: { threadId: ctx.conversationId, timestamp: Date.now() },
        };

        this.logger.debug(
          `[STREAM] User denied interrupt ${interruptId}, resuming with deny`,
        );

        const denyCommand = new Command({ resume: "deny" });
        try {
          newIterator = (await agent.stream(denyCommand, config))[
            Symbol.asyncIterator
          ]();
        } catch (denyError) {
          this.logger.error(
            `[STREAM] Failed to resume with deny: ${denyError instanceof Error ? denyError.message : denyError}`,
          );
          const fallbackDeny = { resume: { [interruptId]: "deny" } };
          newIterator = (await agent.stream(fallbackDeny, config))[
            Symbol.asyncIterator
          ]();
        }
      }
    }

    return newIterator;
  }

  private *processNodeEntries(
    entries: [string, IAgentNodeUpdate][],
    ctx: IStreamContext,
    span: Span,
    streamManager: StreamManager,
    costTracker: CostTrackingService,
    conversationId: string,
    providerName: string,
    currentModelName: string,
    onChunk?: (chunk: IStreamEvent) => void,
  ) {
    for (const [nodeName, update] of entries) {
      if (update?.messages && Array.isArray(update.messages)) {
        for (const message of update.messages) {
          if (
            message.usage_metadata &&
            (message.usage_metadata.input_tokens ||
              message.usage_metadata.output_tokens)
          ) {
            const usage = message.usage_metadata;
            const costData = costTracker.recordUsage(
              conversationId,
              providerName,
              currentModelName,
              usage.input_tokens ?? 0,
              usage.output_tokens ?? 0,
            );
            yield {
              type: StreamEventType.METADATA,
              content: "cost_update",
              metadata: {
                threadId: conversationId,
                status: "cost_update",
                costData,
              },
            };
          }

          if (message.type === "tool" || message.name) {
            const toolName = message.name || "unknown";
            const toolActivity = ctx.pendingToolCalls.get(toolName);

            if (toolActivity) {
              toolActivity.status = "completed";
              toolActivity.endTime = Date.now();
              toolActivity.result = {
                summary: this.summarizeToolResult(message.content, toolName),
                itemCount: this.countResultItems(message.content),
              };

              span.addEvent("tool_end", {
                "tool.name": toolName,
                "tool.result_summary": toolActivity.result.summary,
                "node.name": nodeName,
                duration_ms: toolActivity.endTime - toolActivity.startTime,
              });

              yield {
                type: StreamEventType.TOOL_END,
                content: JSON.stringify(toolActivity),
                metadata: {
                  toolName,
                  node: nodeName,
                  duration: toolActivity.endTime - toolActivity.startTime,
                },
              };

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

              ctx.pendingToolCalls.delete(toolName);
            }
          }
        }

        const lastMessage = update.messages[update.messages.length - 1];
        if (lastMessage?.content && lastMessage.type !== "tool") {
          const newContent = this.contentNormalizer.normalize(
            lastMessage.content,
          );
          const delta = newContent.slice(ctx.accumulatedContent.length);
          if (delta) {
            ctx.accumulatedContent = newContent;
            const chunkMeta: Record<string, unknown> = { node: nodeName };
            if (lastMessage.type) {
              chunkMeta.messageType = lastMessage.type;
            }
            streamManager.addChunk(delta, chunkMeta);

            const chunkEvent = {
              type: StreamEventType.CHUNK,
              content: delta,
              metadata: chunkMeta,
              accumulated: ctx.accumulatedContent,
            };
            yield chunkEvent;
            onChunk?.(chunkEvent);
          }
        }
      }

      const toolCalls = this.collectToolCalls(update);
      if (toolCalls.length > 0) {
        yield* this.processToolCalls(
          toolCalls,
          nodeName,
          ctx,
          span,
          streamManager,
        );
      }
    }
  }

  private collectToolCalls(update: IAgentNodeUpdate): IAgentToolCall[] {
    const calls: IAgentToolCall[] = [];

    if (update?.toolCalls && Array.isArray(update.toolCalls)) {
      calls.push(...update.toolCalls);
    }

    if (update?.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          calls.push(...msg.tool_calls);
        }
        if (
          msg.additional_kwargs?.tool_calls &&
          Array.isArray(msg.additional_kwargs.tool_calls)
        ) {
          for (const tc of msg.additional_kwargs.tool_calls) {
            if (
              tc &&
              typeof tc === "object" &&
              typeof (tc as Record<string, unknown>).name === "string"
            ) {
              const raw = tc as Record<string, unknown>;
              calls.push({
                name: raw.name as string,
                args:
                  raw.args && typeof raw.args === "object"
                    ? (raw.args as Record<string, unknown>)
                    : {},
                id: typeof raw.id === "string" ? raw.id : undefined,
              });
            }
          }
        }
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "tool_use") {
              calls.push({
                name: block.name ?? "unknown",
                args: block.input ?? {},
                id: block.id,
              });
            }
          }
        }
      }
    }

    return calls;
  }

  private *processToolCalls(
    toolCalls: IAgentToolCall[],
    nodeName: string,
    ctx: IStreamContext,
    span: Span,
    streamManager: StreamManager,
  ) {
    this.logger.debug(
      `[STREAM] Tool calls detected: ${toolCalls.length} tools - ${toolCalls.map((tc) => tc.name).join(", ")}`,
    );

    const toolNameCounts = new Map<string, number>();
    for (const tc of toolCalls) {
      const name = this.getToolInfo(tc.name).name;
      toolNameCounts.set(name, (toolNameCounts.get(name) || 0) + 1);
    }
    const toolNamesFormatted = Array.from(toolNameCounts.entries())
      .map(([name, count]) => (count > 1 ? `${name} (x${count})` : name))
      .join(", ");
    yield {
      type: StreamEventType.DECISION,
      content: `Using: ${toolNamesFormatted}`,
      metadata: {
        toolCount: toolCalls.length,
        tools: toolCalls.map((tc) => tc.name),
        node: nodeName,
        timestamp: Date.now(),
      },
    };

    for (const toolCall of toolCalls) {
      const isMiddlewareNode =
        nodeName.includes("Middleware") || nodeName.includes("before_model");

      let currentCount = 0;
      if (!isMiddlewareNode) {
        ctx.totalToolInvocations++;
        currentCount = ctx.toolCallCounts.get(toolCall.name) || 0;
        ctx.toolCallCounts.set(toolCall.name, currentCount + 1);
      }

      this.logger.debug(
        `[STREAM] Tool call: ${toolCall.name} from ${nodeName}${isMiddlewareNode ? " (middleware - not counted)" : ` (#${ctx.totalToolInvocations}, ${currentCount + 1}x for this tool)`}`,
      );

      if (!isMiddlewareNode) {
        if (
          (toolCall.name === "edit_file" || toolCall.name === "write_file") &&
          toolCall.args?.file_path
        ) {
          const filePath = toolCall.args.file_path as string;
          const fileLoop = this.safetyGuard.detectFileLoop(
            filePath,
            ctx.fileEditCounts,
          );
          ctx.fileEditCounts.set(filePath, fileLoop.editCount);
          if (fileLoop.isLooping) {
            this.logger.log(
              LogLevel.WARN,
              `Same file ${filePath} edited ${fileLoop.editCount} times - stopping`,
            );
            ctx.hasErrored = true;
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Infinite loop detected editing file: ${filePath}`,
            });
            span.setAttribute("error.reason", "file_edit_loop");
            span.setAttribute("error.file_path", filePath);

            yield {
              type: StreamEventType.ERROR,
              content: `I've tried to edit the same file (${filePath.split("/").pop()}) ${fileLoop.editCount} times. The edit may not be matching correctly or there's an issue with the file content. I'll stop here - please try the edit manually or check if the file content matches what I expect.`,
              metadata: {
                threadId: ctx.conversationId,
                reason: "same_file_loop",
                toolName: toolCall.name,
                filePath,
                fileEditCount: fileLoop.editCount,
              },
            };
            break;
          }
        }

        const loopResult = this.safetyGuard.detectToolLoop(
          toolCall.name,
          currentCount,
        );
        if (loopResult.isLooping && !loopResult.isReadOnly) {
          this.logger.log(
            LogLevel.WARN,
            `Tool ${toolCall.name} called ${currentCount + 1} times (limit: ${loopResult.limit}) - loop detected`,
          );
          ctx.hasErrored = true;
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `Tool loop detected for ${toolCall.name}`,
          });
          span.setAttribute("error.reason", "tool_loop_detected");
          span.setAttribute("error.tool", toolCall.name);

          yield {
            type: StreamEventType.ERROR,
            content: this.safetyGuard.buildToolLoopErrorMessage(
              toolCall.name,
              currentCount + 1,
            ),
            metadata: {
              threadId: ctx.conversationId,
              reason: "tool_loop_detected",
              toolName: toolCall.name,
              callCount: currentCount + 1,
              limit: loopResult.limit,
            },
          };
          break;
        } else if (loopResult.isLooping && loopResult.isReadOnly) {
          this.logger.debug(
            `[STREAM] Read-only tool ${toolCall.name} called ${currentCount + 1} times - allowing`,
          );
        }
      }

      const toolActivity = this.createToolActivity(
        toolCall.name,
        toolCall.args,
      );
      toolActivity.status = "running";
      ctx.pendingToolCalls.set(toolCall.name, toolActivity);

      span.addEvent("tool_start", {
        "tool.name": toolCall.name,
        "tool.args": JSON.stringify(toolCall.args),
        "node.name": nodeName,
        is_middleware: isMiddlewareNode,
      });

      streamManager.addToolEvent(toolCall.name, true, toolCall);

      yield {
        type: StreamEventType.TOOL_START,
        content: JSON.stringify({ ...toolActivity, args: toolCall.args }),
        metadata: {
          toolName: toolCall.name,
          node: nodeName,
          toolId: toolActivity.id,
        },
      };

      if (toolCall.name === "think") {
        yield {
          type: StreamEventType.THINKING_START,
          content: toolActivity.description,
          metadata: {
            toolName: toolCall.name,
            node: nodeName,
            toolId: toolActivity.id,
            activityType: this.getToolInfo(toolCall.name).activityType,
            timestamp: Date.now(),
          },
        };
      } else {
        yield {
          type: this.getActivityEventType(toolCall.name),
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

  private *emitCompletion(
    ctx: IStreamContext,
    span: Span,
    streamManager: StreamManager,
    costTracker: CostTrackingService,
    conversationId: string,
  ) {
    if (ctx.hasErrored) {
      streamManager.endStream();
      return;
    }

    for (const [toolName, activity] of ctx.pendingToolCalls) {
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
      if (toolName === "think") {
        yield {
          type: StreamEventType.THINKING_END,
          content: activity.description,
          metadata: { toolName, timestamp: Date.now() },
        };
      }
    }

    if (ctx.accumulatedContent) {
      yield {
        type: StreamEventType.SUMMARIZING,
        content: ctx.forceStopReason
          ? "Preparing partial response (stopped early for safety)..."
          : "Preparing response...",
        metadata: { threadId: conversationId, timestamp: Date.now() },
      };
      ctx.agentState = "summarizing";
    }

    streamManager.endStream(ctx.accumulatedContent);

    const finalCost = costTracker.getConversationCost(conversationId);
    yield {
      type: StreamEventType.END,
      content: ctx.accumulatedContent,
      metadata: {
        threadId: conversationId,
        forceStopReason: ctx.forceStopReason,
        state: ctx.forceStopReason ? "completed_with_warning" : "completed",
        costData: finalCost ?? undefined,
      },
    };
    ctx.agentState = "completed";

    if (ctx.hasErrored) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }
    span.setAttribute("agent.final_state", ctx.agentState);
    span.setAttribute("agent.event_count", ctx.eventCount);
    span.setAttribute("agent.tool_count", ctx.totalToolInvocations);
  }

  private summarizeToolResult(content: unknown, toolName: string): string {
    if (!content) return "Completed";

    const MAX_CONTENT_LENGTH = 512_000; // 512 KB cap
    let contentStr: string;
    if (typeof content === "string") {
      contentStr =
        content.length > MAX_CONTENT_LENGTH
          ? content.slice(0, MAX_CONTENT_LENGTH)
          : content;
    } else {
      const raw = JSON.stringify(content);
      contentStr =
        raw.length > MAX_CONTENT_LENGTH
          ? raw.slice(0, MAX_CONTENT_LENGTH)
          : raw;
    }

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

  private countResultItems(content: unknown): number | undefined {
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

  async processUserQuery(
    userInput: string,
    onChunk: (chunk: IStreamEvent) => void,
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
        if (chunk.type === StreamEventType.ERROR) {
          onError(new Error(chunk.content));
          return;
        }
        if (chunk.type === StreamEventType.END) {
          finalContent = chunk.content;
        }
      }
      onComplete(finalContent);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  cancelStream(threadId: string) {
    const streamManager = this.activeStreams.get(threadId);
    if (streamManager && streamManager.isActive()) {
      streamManager.endStream();
      this.activeStreams.delete(threadId);
      this.consentManager.clearThread(threadId);
      this.logger.log(LogLevel.INFO, `Stream cancelled for thread ${threadId}`);
    }
  }

  dispose() {
    // End all active streams and clear consent waiters
    for (const [threadId, streamManager] of this.activeStreams) {
      if (streamManager.isActive()) {
        streamManager.endStream();
      }
      this.consentManager.clearThread(threadId);
    }
    this.activeStreams.clear();

    // Clear cached agents
    this.agentCache.clear();

    // Unsubscribe from model-change events
    this.modelChangeDisposable.dispose();

    // Reset singleton so a fresh instance is created if needed
    CodeBuddyAgentService.instance =
      undefined as unknown as CodeBuddyAgentService;

    this.logger.log(LogLevel.INFO, "CodeBuddyAgentService disposed");
  }
}
