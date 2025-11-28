/**
 * Streaming event types for WebView UI
 * Matches the backend streaming.types.ts
 */

export enum StreamEventType {
  // Planning & Thinking
  THINKING_START = "thinking_start",
  THINKING_UPDATE = "thinking_update",
  THINKING_END = "thinking_end",

  // Task Planning
  PLAN_START = "plan_start",
  PLAN_STEP_ADDED = "plan_step_added",
  PLAN_COMPLETE = "plan_complete",

  // Tool Execution
  TOOL_CALL_START = "tool_call_start",
  TOOL_CALL_PROGRESS = "tool_call_progress",
  TOOL_CALL_END = "tool_call_end",
  TOOL_CALL_ERROR = "tool_call_error",

  // Content Generation
  CONTENT_START = "content_start",
  CONTENT_DELTA = "content_delta",
  CONTENT_END = "content_end",

  // File Operations
  FILE_OPERATION_START = "file_operation_start",
  FILE_OPERATION_COMPLETE = "file_operation_complete",

  // Error Handling
  ERROR = "error",

  // Completion
  DONE = "done",
}

export interface BaseStreamEvent {
  type: StreamEventType;
  timestamp: number;
  threadId?: string;
}

export interface ThinkingEvent extends BaseStreamEvent {
  type:
    | StreamEventType.THINKING_START
    | StreamEventType.THINKING_UPDATE
    | StreamEventType.THINKING_END;
  content?: string;
}

export interface PlanStep {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  order: number;
}

export interface PlanStepEvent extends BaseStreamEvent {
  type: StreamEventType.PLAN_STEP_ADDED;
  step: PlanStep;
}

export interface PlanEvent extends BaseStreamEvent {
  type: StreamEventType.PLAN_START | StreamEventType.PLAN_COMPLETE;
  totalSteps?: number;
  steps?: PlanStep[];
}

export interface ToolCallEvent extends BaseStreamEvent {
  type:
    | StreamEventType.TOOL_CALL_START
    | StreamEventType.TOOL_CALL_PROGRESS
    | StreamEventType.TOOL_CALL_END
    | StreamEventType.TOOL_CALL_ERROR;
  toolName: string;
  toolInput?: any;
  toolOutput?: any;
  progress?: number;
  error?: string;
}

export interface ContentEvent extends BaseStreamEvent {
  type:
    | StreamEventType.CONTENT_START
    | StreamEventType.CONTENT_DELTA
    | StreamEventType.CONTENT_END;
  content: string;
  role?: "assistant" | "system";
}

export interface FileOperationEvent extends BaseStreamEvent {
  type:
    | StreamEventType.FILE_OPERATION_START
    | StreamEventType.FILE_OPERATION_COMPLETE;
  operation: "create" | "update" | "delete" | "read";
  filePath: string;
  status?: "success" | "failed";
}

export interface ErrorEvent extends BaseStreamEvent {
  type: StreamEventType.ERROR;
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export interface DoneEvent extends BaseStreamEvent {
  type: StreamEventType.DONE;
  summary?: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    filesModified: number;
  };
}

export type StreamEvent =
  | ThinkingEvent
  | PlanEvent
  | PlanStepEvent
  | ToolCallEvent
  | ContentEvent
  | FileOperationEvent
  | ErrorEvent
  | DoneEvent;
