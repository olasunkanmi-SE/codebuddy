import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import type { IStreamContext } from "../interface/agent.interface";
import { TOOL_NAMES, READ_ONLY_TOOLS } from "../constants/tool-names";

export interface AgentSafetyLimits {
  readonly maxEventCount: number;
  readonly maxToolInvocations: number;
  readonly maxToolCallsPerType: number;
  readonly maxDurationMs: number;
  readonly fileEditLoopThreshold: number;
  readonly criticalToolLimits: Record<string, number>;
  readonly readOnlyTools: ReadonlySet<string>;
}

/**
 * Reads agent safety limits from VS Code config exactly once.
 * Call at the start of each stream session, not in a hot loop.
 */
export function readAgentSafetyLimits(): AgentSafetyLimits {
  const cfg = vscode.workspace.getConfiguration("codebuddy.agent");
  return Object.freeze({
    maxEventCount: cfg.get<number>("maxEventCount", 2000),
    maxToolInvocations: cfg.get<number>("maxToolInvocations", 400),
    maxToolCallsPerType: 20,
    maxDurationMs: cfg.get<number>("maxDurationMinutes", 10) * 60_000,
    fileEditLoopThreshold: 4,
    criticalToolLimits: {
      [TOOL_NAMES.EDIT_FILE]: 8,
      [TOOL_NAMES.WRITE_FILE]: 8,
      [TOOL_NAMES.DELETE_FILE]: 3,
      [TOOL_NAMES.RUN_COMMAND]: 10,
      [TOOL_NAMES.RUN_TERMINAL_COMMAND]: 100,
      [TOOL_NAMES.WEB_SEARCH]: 8,
    } as Record<string, number>,
    readOnlyTools: READ_ONLY_TOOLS,
  });
}

export type ForceStopReason = "max_events" | "max_tools" | "timeout";

export interface SafetyCheckResult {
  shouldStop: boolean;
  reason: ForceStopReason | null;
  message?: string;
}

export interface ToolLoopResult {
  isLooping: boolean;
  isReadOnly: boolean;
  limit: number;
  currentCount: number;
}

export interface FileLoopResult {
  isLooping: boolean;
  filePath: string;
  editCount: number;
}

/** Value object returned by buildLimitReset() for immutable limit extension. */
export interface SafetyLimitReset {
  readonly eventCount: 0;
  readonly totalToolInvocations: 0;
  readonly startTime: number;
}

/**
 * Encapsulates all safety-limit and loop-detection logic for agent streams.
 * Stateless — operates on the caller-provided counters and maps.
 */
export class AgentSafetyGuard {
  private readonly logger: Pick<Logger, "log" | "warn" | "debug">;

  constructor(logger?: Pick<Logger, "log" | "warn" | "debug">) {
    this.logger =
      logger ??
      Logger.initialize("AgentSafetyGuard", {
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableFile: true,
        enableTelemetry: true,
      });
  }

  /**
   * Check whether the safety limits have been exceeded.
   */
  checkLimits(
    eventCount: number,
    totalToolInvocations: number,
    elapsedMs: number,
    limits: AgentSafetyLimits,
  ): SafetyCheckResult {
    if (eventCount >= limits.maxEventCount) {
      this.logger.log(
        LogLevel.WARN,
        `Force stopping: exceeded ${limits.maxEventCount} events (${totalToolInvocations} tool calls in ${Math.round(elapsedMs / 1000)}s)`,
      );
      return { shouldStop: true, reason: "max_events" };
    }

    if (totalToolInvocations >= limits.maxToolInvocations) {
      this.logger.log(
        LogLevel.WARN,
        `Force stopping: exceeded ${limits.maxToolInvocations} tool invocations`,
      );
      return { shouldStop: true, reason: "max_tools" };
    }

    if (elapsedMs >= limits.maxDurationMs) {
      this.logger.log(
        LogLevel.WARN,
        `Force stopping: exceeded ${limits.maxDurationMs / 1000}s timeout`,
      );
      return { shouldStop: true, reason: "timeout" };
    }

    return { shouldStop: false, reason: null };
  }

  /**
   * Detect whether a specific tool is in a call-count loop.
   */
  detectToolLoop(
    toolName: string,
    currentCount: number,
    limits: AgentSafetyLimits,
  ): ToolLoopResult {
    const isReadOnly = limits.readOnlyTools.has(toolName);
    const limit =
      limits.criticalToolLimits[toolName] ?? limits.maxToolCallsPerType;
    const isLooping = currentCount >= limit;

    return { isLooping, isReadOnly, limit, currentCount };
  }

  /**
   * Detect whether the same file is being edited in a loop.
   */
  detectFileLoop(
    filePath: string,
    fileEditCounts: Map<string, number>,
    limits: AgentSafetyLimits,
  ): FileLoopResult {
    const editCount = (fileEditCounts.get(filePath) || 0) + 1;
    return {
      isLooping: editCount >= limits.fileEditLoopThreshold,
      filePath,
      editCount,
    };
  }

  /**
   * Build a user-facing reason message for a forced stop.
   */
  buildStopMessage(
    reason: ForceStopReason,
    eventCount: number,
    totalToolInvocations: number,
    elapsedMs: number,
  ): string {
    const reasonMessages: Record<ForceStopReason, string> = {
      max_events: `Processed ${eventCount} events`,
      max_tools: `Made ${totalToolInvocations} tool calls`,
      timeout: `Ran for ${Math.round(elapsedMs / 1000)} seconds`,
    };
    return `⚠️ Stopping early (${reasonMessages[reason]}). Here's what I found so far:`;
  }

  /**
   * Build a reset object for extending safety limits.
   * Returns an immutable value object — caller applies it via Object.assign().
   * This pattern keeps AgentSafetyGuard stateless while making the mutation
   * visible at the call site.
   */
  buildLimitReset(): SafetyLimitReset {
    return {
      eventCount: 0,
      totalToolInvocations: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Extend limits by resetting the stream context counters, giving the
   * agent another full quota of events, tool calls, and wall-clock time.
   * Called when the user approves continuation after a safety limit is hit.
   *
   * @deprecated Use buildLimitReset() and Object.assign(ctx, guard.buildLimitReset())
   *   to make the mutation explicit at the call site.
   */
  extendLimits(
    ctx: Pick<
      IStreamContext,
      "eventCount" | "totalToolInvocations" | "startTime"
    >,
  ): void {
    this.logger.log(
      LogLevel.INFO,
      `Extending limits: resetting counters (was events=${ctx.eventCount}, tools=${ctx.totalToolInvocations})`,
    );
    const reset = this.buildLimitReset();
    ctx.eventCount = reset.eventCount;
    ctx.totalToolInvocations = reset.totalToolInvocations;
    ctx.startTime = reset.startTime;
  }

  /**
   * Build a user-facing error message for a looping tool.
   */
  buildToolLoopErrorMessage(toolName: string, callCount: number): string {
    if (
      toolName === TOOL_NAMES.EDIT_FILE ||
      toolName === TOOL_NAMES.WRITE_FILE
    ) {
      return `I've attempted to edit this file ${callCount} times but the edit isn't completing successfully. This usually happens when the edit operation is interrupted or the file content doesn't match exactly. I'll stop here to avoid an infinite loop. You may need to make the change manually.`;
    }
    if (toolName === TOOL_NAMES.WEB_SEARCH) {
      return `I've searched for this information multiple times but couldn't find definitive results. For GitHub issues, try using the GitHub MCP tools directly or visit the repository issues page manually.`;
    }
    return `I've called ${toolName} ${callCount} times which indicates a loop. I'll stop here to prevent infinite processing.`;
  }
}
