import { Logger, LogLevel } from "../../infrastructure/logger/logger";

/** Safety limits for agent stream execution. */
export const AGENT_SAFETY_LIMITS = {
  maxEventCount: 1000,
  maxToolInvocations: 200,
  maxToolCallsPerType: 20,
  maxDurationMs: 5 * 60 * 1000,
  fileEditLoopThreshold: 4,
  criticalToolLimits: {
    edit_file: 8,
    write_file: 8,
    delete_file: 3,
    run_command: 10,
    run_terminal_command: 100,
    web_search: 8,
  } as Record<string, number>,
  readOnlyTools: new Set([
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
    "run_tests",
  ]),
} as const;

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

/**
 * Encapsulates all safety-limit and loop-detection logic for agent streams.
 * Stateless — operates on the caller-provided counters and maps.
 */
export class AgentSafetyGuard {
  private readonly logger: Logger;

  constructor() {
    this.logger = Logger.initialize("AgentSafetyGuard", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  /**
   * Check whether the global safety limits have been exceeded.
   */
  checkLimits(
    eventCount: number,
    totalToolInvocations: number,
    elapsedMs: number,
  ): SafetyCheckResult {
    if (eventCount >= AGENT_SAFETY_LIMITS.maxEventCount) {
      this.logger.log(
        LogLevel.WARN,
        `Force stopping: exceeded ${AGENT_SAFETY_LIMITS.maxEventCount} events (${totalToolInvocations} tool calls in ${Math.round(elapsedMs / 1000)}s)`,
      );
      return { shouldStop: true, reason: "max_events" };
    }

    if (totalToolInvocations >= AGENT_SAFETY_LIMITS.maxToolInvocations) {
      this.logger.log(
        LogLevel.WARN,
        `Force stopping: exceeded ${AGENT_SAFETY_LIMITS.maxToolInvocations} tool invocations`,
      );
      return { shouldStop: true, reason: "max_tools" };
    }

    if (elapsedMs >= AGENT_SAFETY_LIMITS.maxDurationMs) {
      this.logger.log(
        LogLevel.WARN,
        `Force stopping: exceeded ${AGENT_SAFETY_LIMITS.maxDurationMs / 1000}s timeout`,
      );
      return { shouldStop: true, reason: "timeout" };
    }

    return { shouldStop: false, reason: null };
  }

  /**
   * Detect whether a specific tool is in a call-count loop.
   */
  detectToolLoop(toolName: string, currentCount: number): ToolLoopResult {
    const isReadOnly = AGENT_SAFETY_LIMITS.readOnlyTools.has(toolName);
    const limit =
      AGENT_SAFETY_LIMITS.criticalToolLimits[toolName] ??
      AGENT_SAFETY_LIMITS.maxToolCallsPerType;
    const isLooping = currentCount >= limit;

    return { isLooping, isReadOnly, limit, currentCount };
  }

  /**
   * Detect whether the same file is being edited in a loop.
   */
  detectFileLoop(
    filePath: string,
    fileEditCounts: Map<string, number>,
  ): FileLoopResult {
    const editCount = (fileEditCounts.get(filePath) || 0) + 1;
    return {
      isLooping: editCount >= AGENT_SAFETY_LIMITS.fileEditLoopThreshold,
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
   * Build a user-facing error message for a looping tool.
   */
  buildToolLoopErrorMessage(toolName: string, callCount: number): string {
    if (toolName === "edit_file" || toolName === "write_file") {
      return `I've attempted to edit this file ${callCount} times but the edit isn't completing successfully. This usually happens when the edit operation is interrupted or the file content doesn't match exactly. I'll stop here to avoid an infinite loop. You may need to make the change manually.`;
    }
    if (toolName === "web_search") {
      return `I've searched for this information multiple times but couldn't find definitive results. For GitHub issues, try using the GitHub MCP tools directly or visit the repository issues page manually.`;
    }
    return `I've called ${toolName} ${callCount} times which indicates a loop. I'll stop here to prevent infinite processing.`;
  }
}
