import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs";
import {
  Command,
  InMemoryStore,
  MemorySaver,
  BaseCheckpointSaver,
} from "@langchain/langgraph";
import { trace, context, Span, SpanStatusCode } from "@opentelemetry/api";
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
import {
  AgentSafetyGuard,
  readAgentSafetyLimits,
  type AgentSafetyLimits,
} from "./agent-safety-guard";
import { ConsentManager } from "./consent-manager";
import { ContentNormalizer } from "./content-normalizer";
import { TOOL_NAMES } from "../constants/tool-names";

/** Typed alias for the async iterator from a LangGraph agent stream. */
type AgentStreamIterator = AsyncIterator<unknown>;

// Guaranteed fallback — extracted as a named constant for compile-time safety
const DEFAULT_TOOL_DESCRIPTION: IToolDescription = Object.freeze({
  name: "Tool",
  description: "Executing tool...",
  activityType: "working",
});

// Tool descriptions for user-friendly feedback
const TOOL_DESCRIPTIONS: Record<string, IToolDescription> = {
  [TOOL_NAMES.RUN_COMMAND]: {
    name: "Terminal",
    description: "Running command...",
    activityType: "executing",
  },
  [TOOL_NAMES.RUN_TERMINAL_COMMAND]: {
    name: "Terminal",
    description: "Executing terminal command...",
    activityType: "executing",
  },
  [TOOL_NAMES.COMMAND]: {
    name: "Terminal",
    description: "Running command...",
    activityType: "executing",
  },
  [TOOL_NAMES.WEB_SEARCH]: {
    name: "Web Search",
    description: "Searching the web for relevant information...",
    activityType: "searching",
  },
  [TOOL_NAMES.READ_FILE]: {
    name: "File Reader",
    description: "Reading file contents...",
    activityType: "reading",
  },
  [TOOL_NAMES.ANALYZE_FILES]: {
    name: "Code Analyzer",
    description: "Analyzing code files...",
    activityType: "analyzing",
  },
  [TOOL_NAMES.THINK]: {
    name: "Reasoning",
    description: "Thinking through the problem...",
    activityType: "thinking",
  },
  [TOOL_NAMES.WRITE_FILE]: {
    name: "File Writer",
    description: "Writing to file...",
    activityType: "working",
  },
  [TOOL_NAMES.EDIT_FILE]: {
    name: "File Editor",
    description: "Editing file contents...",
    activityType: "working",
  },
  [TOOL_NAMES.SEARCH_CODEBASE]: {
    name: "Codebase Search",
    description: "Searching the codebase...",
    activityType: "searching",
  },
  [TOOL_NAMES.MANAGE_TASKS]: {
    name: "Task Manager",
    description: "Managing tasks...",
    activityType: "working",
  },
  [TOOL_NAMES.MANAGE_CORE_MEMORY]: {
    name: "Core Memory",
    description: "Managing memory...",
    activityType: "working",
  },
  [TOOL_NAMES.GIT_DIFF]: {
    name: "Git Diff",
    description: "Checking file changes...",
    activityType: "reviewing",
  },
  [TOOL_NAMES.GIT_LOG]: {
    name: "Git Log",
    description: "Reviewing commit history...",
    activityType: "reviewing",
  },
  [TOOL_NAMES.GIT_BRANCH]: {
    name: "Git Branch",
    description: "Managing branches...",
    activityType: "working",
  },
  [TOOL_NAMES.RUN_TESTS]: {
    name: "Test Runner",
    description: "Running tests...",
    activityType: "executing",
  },
  [TOOL_NAMES.LIST_DIRECTORY]: {
    name: "Directory Listing",
    description: "Exploring directory structure...",
    activityType: "reading",
  },
};

/**
 * Extract and deduplicate tool calls from a LangGraph node update.
 * Exported as a module-level pure function for direct testability.
 */
export function collectToolCallsFromUpdate(
  update: IAgentNodeUpdate,
): IAgentToolCall[] {
  const calls: IAgentToolCall[] = [];
  const seenIds = new Set<string>();

  const push = (tc: IAgentToolCall) => {
    if (tc.id) {
      if (seenIds.has(tc.id)) return;
      seenIds.add(tc.id);
    }
    calls.push(tc);
  };

  if (update?.toolCalls && Array.isArray(update.toolCalls)) {
    for (const tc of update.toolCalls) push(tc);
  }

  if (update?.messages && Array.isArray(update.messages)) {
    for (const msg of update.messages) {
      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls) push(tc);
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
            push({
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
            push({
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

/**
 * Summarize tool output for user-facing display.
 * Exported as a module-level pure function for direct testability.
 */
export function summarizeToolResultContent(
  content: unknown,
  toolName: string,
): string {
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
      raw.length > MAX_CONTENT_LENGTH ? raw.slice(0, MAX_CONTENT_LENGTH) : raw;
  }

  if (toolName === TOOL_NAMES.READ_FILE) {
    const lines = contentStr.split("\n").length;
    return `Read ${lines} lines`;
  }

  if (toolName === TOOL_NAMES.SEARCH_CODEBASE) {
    const matchCount = (contentStr.match(/match/gi) || []).length;
    return matchCount > 0 ? `Found ${matchCount} matches` : "Search complete";
  }

  if (contentStr.length > 100) {
    return `Processed ${Math.ceil(contentStr.length / 1000)}KB of data`;
  }

  return "Completed successfully";
}

export class CodeBuddyAgentService {
  /**
   * Agents are keyed by `provider:model` but intentionally share a single
   * `store` and `checkpointer` so conversation history persists across
   * model switches within the same workspace session.
   */
  private agentCache = new Map<string, IStreamableAgent>();
  private store = new InMemoryStore();
  private checkpointerPromise: Promise<BaseCheckpointSaver> | null = null;
  private checkpointer: BaseCheckpointSaver | null = null;
  private readonly logger: Logger;
  private static instance: CodeBuddyAgentService | null = null;
  private disposed = false;
  private activeStreams = new Map<string, StreamManager>();
  private readonly synthesizer: ResultSynthesizerService;
  private readonly safetyGuard: AgentSafetyGuard;
  private readonly consentManager: ConsentManager;
  private readonly contentNormalizer: ContentNormalizer;
  private readonly modelChangeDisposable: { dispose(): void };
  private static readonly MAX_WARNED_TOOLS = 100;
  private static readonly MAX_CACHED_AGENTS = 3;
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
   *
   * Uses promise memoization to prevent a check-then-act race when
   * multiple concurrent calls arrive before initialization completes.
   */
  private getCheckpointer(): Promise<BaseCheckpointSaver> {
    return (this.checkpointerPromise ??= this.initCheckpointer());
  }

  private async initCheckpointer(): Promise<BaseCheckpointSaver> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspacePath) {
      try {
        // Dynamic import to avoid native module loading issues when bundled
        const { SqliteSaver } =
          await import("@langchain/langgraph-checkpoint-sqlite");
        const codeBuddyDir = path.join(workspacePath, ".codebuddy");
        await fs.promises.mkdir(codeBuddyDir, { recursive: true });
        const dbPath = path.join(codeBuddyDir, "checkpoints.db");
        const saver = SqliteSaver.fromConnString(dbPath);
        this.checkpointer = saver;
        this.logger.log(
          LogLevel.INFO,
          `Persistent checkpointer initialized at ${dbPath}`,
        );
        return saver;
      } catch (error) {
        this.logger.warn(
          "Failed to initialize SQLite checkpointer, falling back to in-memory",
          error,
        );
        // Fall through to MemorySaver below
      }
    }

    // Fallback: use in-memory checkpointer (conversation state won't persist)
    const memorySaver = new MemorySaver();
    this.checkpointer = memorySaver;
    this.logger.log(LogLevel.INFO, "Using in-memory checkpointer");
    return memorySaver;
  }

  /**
   * Listen for file‐change events from DiffReviewService and register
   * each touched path with CheckpointService for future snapshots.
   * Returns void synchronously — the async import is fire-and-forget
   * with an explicit .catch() for observability.
   */
  private initFileTracking(): void {
    Promise.resolve()
      .then(() => import("../../services/diff-review.service"))
      .then(({ DiffReviewService }) => {
        const diffService = DiffReviewService.getInstance();
        diffService.onChangeEvent((evt) => {
          try {
            CheckpointService.getInstance().trackFile(evt.change.filePath);
          } catch (trackError) {
            this.logger.warn("Failed to track file change", trackError);
          }
        });
        this.logger.log(LogLevel.DEBUG, "File tracking initialized");
      })
      .catch((importError) => {
        this.logger.warn(
          "Could not initialize file tracking for checkpoints",
          importError,
        );
      });
  }

  static getInstance(): CodeBuddyAgentService {
    if (
      !CodeBuddyAgentService.instance ||
      CodeBuddyAgentService.instance.disposed
    ) {
      CodeBuddyAgentService.instance = new CodeBuddyAgentService();
    }
    return CodeBuddyAgentService.instance;
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
    if (
      !this.warnedUnknownTools.has(toolName) &&
      this.warnedUnknownTools.size < CodeBuddyAgentService.MAX_WARNED_TOOLS
    ) {
      this.warnedUnknownTools.add(toolName);
      this.logger.warn(
        `Unknown tool "${toolName}" not in TOOL_DESCRIPTIONS — using default`,
      );
    }
    return DEFAULT_TOOL_DESCRIPTION;
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
    if (toolName === TOOL_NAMES.WEB_SEARCH && typeof args?.query === "string") {
      const q = args.query;
      description = `Searching the web for: "${q.substring(0, 50)}${q.length > 50 ? "..." : ""}"`;
    } else if (
      toolName === TOOL_NAMES.THINK &&
      typeof args?.thought === "string"
    ) {
      description = args.thought;
    } else if (
      toolName === TOOL_NAMES.READ_FILE &&
      typeof args?.path === "string"
    ) {
      const fileName = (args.path as string).split("/").pop();
      description = `Reading ${fileName}`;
    } else if (
      toolName === TOOL_NAMES.READ_FILE &&
      typeof args?.file_path === "string"
    ) {
      const fileName = (args.file_path as string).split("/").pop();
      description = `Reading ${fileName}`;
    } else if (
      toolName === TOOL_NAMES.ANALYZE_FILES &&
      Array.isArray(args?.files)
    ) {
      const names = (args.files as string[])
        .slice(0, 3)
        .map((f: string) => f.split("/").pop())
        .join(", ");
      const suffix =
        args.files.length > 3 ? ` +${args.files.length - 3} more` : "";
      description = `Analyzing ${names}${suffix}`;
    } else if (
      (toolName === TOOL_NAMES.RUN_COMMAND ||
        toolName === TOOL_NAMES.RUN_TERMINAL_COMMAND ||
        toolName === TOOL_NAMES.COMMAND) &&
      args?.command
    ) {
      const cmd = `${args.command}`;
      const trimmed = cmd.length > 80 ? `${cmd.slice(0, 77)}...` : cmd;
      description = `Running: ${trimmed}`;
    } else if (
      (toolName === TOOL_NAMES.WRITE_FILE ||
        toolName === TOOL_NAMES.EDIT_FILE) &&
      typeof args?.file_path === "string"
    ) {
      const fileName = (args.file_path as string).split("/").pop();
      const verb = toolName === TOOL_NAMES.WRITE_FILE ? "Writing" : "Editing";
      description = `${verb} ${fileName}`;
    } else if (
      toolName === TOOL_NAMES.SEARCH_CODEBASE &&
      typeof args?.query === "string"
    ) {
      const q = args.query as string;
      description = `Searching for: "${q.substring(0, 50)}${q.length > 50 ? "..." : ""}"`;
    } else if (
      toolName === TOOL_NAMES.LIST_DIRECTORY &&
      typeof args?.path === "string"
    ) {
      const dirName = (args.path as string).split("/").pop() || args.path;
      description = `Listing ${dirName}/`;
    } else if (toolName === TOOL_NAMES.GIT_DIFF) {
      description = "Checking file changes";
    } else if (toolName === TOOL_NAMES.GIT_LOG) {
      description = "Reviewing commit history";
    } else if (
      toolName === TOOL_NAMES.GIT_BRANCH &&
      typeof args?.branch_name === "string"
    ) {
      description = `Branch: ${args.branch_name}`;
    } else if (
      toolName === "run_tests" &&
      typeof args?.test_file === "string"
    ) {
      const testFile = (args.test_file as string).split("/").pop();
      description = `Testing ${testFile}`;
    } else if (
      toolName === "manage_tasks" &&
      typeof args?.operation === "string"
    ) {
      description = `Tasks: ${args.operation}`;
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
    if (!cacheKey) {
      throw new Error(
        "Agent configuration is invalid. Please check your API key and model settings.",
      );
    }
    if (!this.agentCache.has(cacheKey)) {
      this.evictAgentCacheIfNeeded();
      const checkpointer = await this.getCheckpointer();
      const agent: unknown = await createAdvancedDeveloperAgent({
        checkPointer: checkpointer,
        store: this.store,
        enableHITL: true,
      });
      this.agentCache.set(cacheKey, agent as IStreamableAgent);
      this.logger.log(LogLevel.INFO, `Agent initialized (key: ${cacheKey})`);
    }
    return this.agentCache.get(cacheKey)!;
  }

  /**
   * Evict the oldest agent from cache if at capacity.
   * Map preserves insertion order, so the first key is the oldest.
   */
  private evictAgentCacheIfNeeded(): void {
    if (this.agentCache.size < CodeBuddyAgentService.MAX_CACHED_AGENTS) return;
    const oldestKey = this.agentCache.keys().next().value;
    if (oldestKey) {
      this.agentCache.delete(oldestKey);
      this.logger.log(
        LogLevel.DEBUG,
        `Evicted agent cache entry: ${oldestKey} (cache at max ${CodeBuddyAgentService.MAX_CACHED_AGENTS})`,
      );
    }
  }

  /**
   * Build a cache key for the current provider/model configuration.
   * Returns `null` if configuration is invalid (missing API key, etc.),
   * causing getAgent() to fail fast with a user-readable error.
   */
  private buildAgentCacheKey(): string | null {
    const provider = getGenerativeAiModel() ?? "unknown";
    try {
      const cfg = getAPIKeyAndModel(provider.toLowerCase());
      const model = cfg.model ?? provider;
      return `agent:${provider}:${model}`;
    } catch (e) {
      this.logger.warn(
        `getAPIKeyAndModel failed for "${provider}" — agent cannot be created until config is valid`,
        e,
      );
      return null;
    }
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

    // Snapshot safety limits once per stream session (O(1) config reads)
    const limits = readAgentSafetyLimits();

    const tracer = trace.getTracer("codebuddy-agent-service");
    const span = tracer.startSpan("streamAgent", {
      attributes: {
        thread_id: conversationId,
        user_message: sanitizedMessage.substring(0, 500),
      },
    });
    const parentCtx = trace.setSpan(context.active(), span);

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

    // Enrich root span with model metadata for the trace detail panel
    span.setAttribute("llm.provider", providerName);
    span.setAttribute("llm.model", currentModelName);

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
      let streamIterator: AgentStreamIterator = (
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
          limits,
        );

        if (safetyResult.shouldStop) {
          const limitLabel = this.safetyGuard.buildStopMessage(
            safetyResult.reason!,
            ctx.eventCount,
            ctx.totalToolInvocations,
            elapsed,
          );

          // Ask the user whether to continue or stop
          yield {
            type: StreamEventType.METADATA,
            content: "interrupt_waiting",
            metadata: {
              threadId: conversationId,
              status: "interrupt_waiting",
              toolName: "Safety limit reached",
              description: `${limitLabel} Would you like me to continue?`,
            },
          };
          yield {
            type: StreamEventType.CHUNK,
            content: `${limitLabel} Would you like me to continue?`,
            metadata: { threadId: conversationId, timestamp: Date.now() },
          };

          const continueGranted =
            await this.waitForActionConsent(conversationId);

          if (continueGranted) {
            // User chose to continue — extend the limits and keep going
            yield {
              type: StreamEventType.METADATA,
              content: "interrupt_approved",
              metadata: {
                threadId: conversationId,
                status: "interrupt_approved",
                toolName: "Safety limit reached",
              },
            };
            yield {
              type: StreamEventType.CHUNK,
              content: "Continuing...",
              metadata: { threadId: conversationId, timestamp: Date.now() },
            };

            this.safetyGuard.extendLimits(ctx);
            Object.assign(ctx, this.safetyGuard.buildLimitReset());
            this.logger.debug(
              `[STREAM] Limits extended for thread ${conversationId}: counters reset`,
            );
            continue;
          }

          // User denied — stop gracefully
          ctx.forceStopReason = safetyResult.reason;

          yield {
            type: StreamEventType.METADATA,
            content: "interrupt_denied",
            metadata: {
              threadId: conversationId,
              status: "interrupt_denied",
              toolName: "Safety limit reached",
            },
          };

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

          yield {
            type: StreamEventType.CHUNK,
            content: limitLabel,
            metadata: { threadId: conversationId, reason: ctx.forceStopReason },
            accumulated: ctx.accumulatedContent
              ? `${ctx.accumulatedContent}\n\n${limitLabel}`
              : limitLabel,
          };

          break;
        }

        const entries = Object.entries(event as Record<string, unknown>);

        const interruptEntry = entries.find(
          ([nodeName]) => nodeName === "__interrupt__",
        );

        if (interruptEntry) {
          const interruptGen = this.handleInterrupt(
            interruptEntry as [string, IInterruptValue | IInterruptValue[]],
            ctx,
            agent,
            config,
          );
          let interruptNext = await interruptGen.next();
          while (!interruptNext.done) {
            yield interruptNext.value;
            interruptNext = await interruptGen.next();
          }
          // The generator's return value carries the new iterator (if any)
          const newIter = interruptNext.value;
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
          limits,
          onChunk,
          tracer,
          parentCtx,
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
      ctx.hasErrored = true;
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
      // Centralize span finalization so it always fires exactly once
      if (ctx.hasErrored) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.setAttribute("agent.final_state", ctx.agentState);
      span.setAttribute("agent.event_count", ctx.eventCount);
      span.setAttribute("agent.tool_count", ctx.totalToolInvocations);
      span.end();
      this.activeStreams.delete(conversationId);
      this.consentManager.clearThread(conversationId);
      const guardService = AgentRunningGuardService.getInstance();
      guardService.notifyAgentStopped();
    }
  }

  // ── Stream sub-generators ────────────────────────────────

  /**
   * Create a new stream iterator from the agent, trying `primary` input first,
   * then `fallback` if the primary throws. Returns null if both fail.
   */
  private async createStreamIterator(
    agent: IStreamableAgent,
    primary: unknown,
    config: Record<string, unknown>,
    fallback?: unknown,
  ): Promise<AgentStreamIterator | null> {
    try {
      const iter = (await agent.stream(primary, config))[
        Symbol.asyncIterator
      ]() as AgentStreamIterator;
      this.logger.debug("[STREAM] Created new stream iterator");
      return iter;
    } catch (primaryError) {
      this.logger.error(
        `[STREAM] Primary resume failed: ${primaryError instanceof Error ? primaryError.message : primaryError}`,
      );
      if (fallback !== undefined) {
        try {
          const iter = (await agent.stream(fallback, config))[
            Symbol.asyncIterator
          ]() as AgentStreamIterator;
          this.logger.debug("[STREAM] Used fallback resume format");
          return iter;
        } catch (fallbackError) {
          this.logger.error(
            `[STREAM] Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`,
          );
        }
      }
      return null;
    }
  }

  private async *handleInterrupt(
    interruptEntry: [string, IInterruptValue | IInterruptValue[]],
    ctx: IStreamContext,
    agent: IStreamableAgent,
    config: Record<string, unknown>,
  ): AsyncGenerator<IStreamEvent, AgentStreamIterator | null> {
    const [, interruptUpdates] = interruptEntry;
    const interrupts = Array.isArray(interruptUpdates)
      ? interruptUpdates
      : [interruptUpdates];

    // Process only the first interrupt — subsequent ones will be emitted
    // in the resumed stream. Handling multiple at once would require
    // sequential stream creation which leaks intermediate iterators.
    const [interrupt] = interrupts;
    if (interrupts.length > 1) {
      this.logger.warn(
        `[STREAM] Received ${interrupts.length} interrupts in one event — processing only first`,
      );
    }

    const interruptId = interrupt?.value?.id ?? `interrupt-${randomUUID()}`;
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

    let newIterator: AgentStreamIterator | null = null;

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
      const fallbackResume = { resume: { [interruptId]: "approve" } };
      newIterator = await this.createStreamIterator(
        agent,
        resumeCommand,
        config,
        fallbackResume,
      );
      if (!newIterator) {
        ctx.hasErrored = true;
        yield {
          type: StreamEventType.ERROR,
          content: `Failed to resume after approval for ${friendlyName}.`,
          metadata: {
            threadId: ctx.conversationId,
            toolName: friendlyName,
          },
        };
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
      const fallbackDeny = { resume: { [interruptId]: "deny" } };
      newIterator = await this.createStreamIterator(
        agent,
        denyCommand,
        config,
        fallbackDeny,
      );
      if (!newIterator) {
        ctx.hasErrored = true;
        yield {
          type: StreamEventType.ERROR,
          content: `Failed to process denial for ${friendlyName}. The agent may be in an inconsistent state.`,
          metadata: {
            threadId: ctx.conversationId,
            toolName: friendlyName,
          },
        };
      }
    }

    return newIterator;
  }

  private async *processNodeEntries(
    entries: [string, IAgentNodeUpdate][],
    ctx: IStreamContext,
    span: Span,
    streamManager: StreamManager,
    costTracker: CostTrackingService,
    conversationId: string,
    providerName: string,
    currentModelName: string,
    limits: AgentSafetyLimits,
    onChunk?: (chunk: IStreamEvent) => void,
    tracer?: ReturnType<typeof trace.getTracer>,
    parentCtx?: ReturnType<typeof context.active>,
  ): AsyncGenerator<IStreamEvent> {
    for (const [nodeName, update] of entries) {
      // Create a child span per graph node for hierarchical tracing
      const nodeSpan =
        tracer && parentCtx
          ? tracer.startSpan(
              nodeName,
              { attributes: { "graph.node": nodeName } },
              parentCtx,
            )
          : undefined;
      const nodeCtx = nodeSpan
        ? trace.setSpan(parentCtx!, nodeSpan)
        : parentCtx;

      if (update?.messages && Array.isArray(update.messages)) {
        for (const message of update.messages) {
          if (
            message.usage_metadata &&
            (message.usage_metadata.input_tokens ||
              message.usage_metadata.output_tokens)
          ) {
            const usage = message.usage_metadata;

            // Record LLM usage on the node span for per-node token visibility
            if (nodeSpan) {
              nodeSpan.setAttribute("llm.provider", providerName);
              nodeSpan.setAttribute("llm.model", currentModelName);
              nodeSpan.setAttribute(
                "llm.input_tokens",
                usage.input_tokens ?? 0,
              );
              nodeSpan.setAttribute(
                "llm.output_tokens",
                usage.output_tokens ?? 0,
              );
              nodeSpan.setAttribute(
                "llm.total_tokens",
                (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
              );
            }

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

              // End the child span for this tool
              const toolSpans = (ctx as any).__toolSpans as
                | Map<string, Span>
                | undefined;
              const toolSpan = toolSpans?.get(toolName);
              if (toolSpan) {
                toolSpan.setAttribute(
                  "tool.result_summary",
                  toolActivity.result.summary ?? "",
                );
                toolSpan.setAttribute(
                  "tool.duration_ms",
                  toolActivity.endTime! - toolActivity.startTime,
                );
                toolSpan.setStatus({ code: SpanStatusCode.OK });
                toolSpan.end();
                toolSpans!.delete(toolName);
              }

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
          limits,
          tracer,
          nodeCtx,
        );
        if (ctx.hasErrored) {
          nodeSpan?.setStatus({ code: SpanStatusCode.ERROR });
          nodeSpan?.end();
          return;
        }
      }

      // End the node span
      nodeSpan?.setStatus({ code: SpanStatusCode.OK });
      nodeSpan?.end();
    }
  }

  private collectToolCalls(update: IAgentNodeUpdate): IAgentToolCall[] {
    return collectToolCallsFromUpdate(update);
  }

  private async *processToolCalls(
    toolCalls: IAgentToolCall[],
    nodeName: string,
    ctx: IStreamContext,
    span: Span,
    streamManager: StreamManager,
    limits: AgentSafetyLimits,
    tracer?: ReturnType<typeof trace.getTracer>,
    parentCtx?: ReturnType<typeof context.active>,
  ): AsyncGenerator<IStreamEvent> {
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
      if (ctx.hasErrored) return;

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
          (toolCall.name === TOOL_NAMES.EDIT_FILE ||
            toolCall.name === TOOL_NAMES.WRITE_FILE) &&
          toolCall.args?.file_path
        ) {
          const filePath = toolCall.args.file_path as string;
          const fileLoop = this.safetyGuard.detectFileLoop(
            filePath,
            ctx.fileEditCounts,
            limits,
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
            return;
          }
        }

        const loopResult = this.safetyGuard.detectToolLoop(
          toolCall.name,
          currentCount,
          limits,
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
          return;
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

      // Create a child span for this tool invocation
      const toolSpan =
        tracer && parentCtx
          ? tracer.startSpan(
              `tool:${toolCall.name}`,
              {
                attributes: {
                  "tool.name": toolCall.name,
                  "tool.args": JSON.stringify(toolCall.args).substring(0, 1000),
                  "node.name": nodeName,
                  "tool.is_middleware": isMiddlewareNode,
                },
              },
              parentCtx,
            )
          : undefined;
      if (toolSpan) {
        // Store the span so it can be ended when the tool result arrives
        (ctx as any).__toolSpans =
          (ctx as any).__toolSpans || new Map<string, Span>();
        (ctx as any).__toolSpans.set(toolCall.name, toolSpan);
      }

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

      if (toolCall.name === TOOL_NAMES.THINK) {
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

  private async *emitCompletion(
    ctx: IStreamContext,
    span: Span,
    streamManager: StreamManager,
    costTracker: CostTrackingService,
    conversationId: string,
  ): AsyncGenerator<IStreamEvent> {
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
      if (toolName === TOOL_NAMES.THINK) {
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

    // Enrich root span with final cost/token data
    if (finalCost) {
      span.setAttribute("cost.total_usd", finalCost.estimatedCostUSD ?? 0);
      span.setAttribute("cost.input_tokens", finalCost.inputTokens ?? 0);
      span.setAttribute("cost.output_tokens", finalCost.outputTokens ?? 0);
      span.setAttribute("cost.total_tokens", finalCost.totalTokens ?? 0);
      span.setAttribute("cost.request_count", finalCost.requestCount ?? 0);
    }

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
  }

  private summarizeToolResult(content: unknown, toolName: string): string {
    if (!content) return "Completed";

    // Handle web_search via synthesizer (requires `this`)
    if (toolName === TOOL_NAMES.WEB_SEARCH) {
      const contentStr =
        typeof content === "string" ? content : JSON.stringify(content);
      try {
        const parsed =
          typeof content === "string" ? JSON.parse(content) : content;
        if (parsed?.results) {
          const result = this.synthesizer.synthesizeWebSearch(parsed);
          return result.sources
            ? `Found ${result.sources.length} relevant sources`
            : result.summary;
        }
      } catch {
        const resultMatch = contentStr.match(/Found (\d+) results/);
        if (resultMatch) {
          return `Found ${resultMatch[1]} search results`;
        }
      }
      return "Search completed";
    }

    // Handle analyze_files_for_question (extracts first sentence insight)
    if (toolName === "analyze_files_for_question") {
      const contentStr =
        typeof content === "string" ? content : JSON.stringify(content);
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

    // Delegate all other tools to the exported pure function
    return summarizeToolResultContent(content, toolName);
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
    let finalContent = "";

    try {
      for await (const chunk of this.streamResponse(
        userInput,
        threadId,
        onChunk,
      )) {
        if (chunk.type === StreamEventType.ERROR) {
          onError(new Error(chunk.content));
          if (threadId) this.cancelStream(threadId);
          break;
        }
        if (chunk.type === StreamEventType.END) {
          finalContent = chunk.content;
          break;
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Always call onComplete so callers can reset loading states, etc.
      // Callers can check if content is empty to distinguish error from success.
      onComplete(finalContent);
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

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

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
    this.warnedUnknownTools.clear();

    // Unsubscribe from model-change events
    this.modelChangeDisposable.dispose();

    // Wait for pending initialization before closing, to avoid race condition
    // where dispose() is called while initCheckpointer() is still running
    const checkpointerToClose =
      this.checkpointer ??
      (this.checkpointerPromise
        ? await this.checkpointerPromise.catch(() => null)
        : null);

    this.checkpointerPromise = null;

    // Close the SQLite handle if it was opened
    if (
      checkpointerToClose &&
      typeof (checkpointerToClose as unknown as Record<string, unknown>)
        .close === "function"
    ) {
      try {
        (checkpointerToClose as unknown as { close(): void }).close();
      } catch (e) {
        this.logger.warn("Failed to close checkpointer", e);
      }
    }
    this.checkpointer = null;

    // Do NOT null the singleton — let the next getInstance() check `.disposed`
    // This avoids a race where concurrent getInstance() calls could create duplicates

    this.logger.log(LogLevel.INFO, "CodeBuddyAgentService disposed");
  }
}
