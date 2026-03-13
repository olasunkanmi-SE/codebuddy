import { StructuredTool } from "@langchain/core/tools";
import { BaseStore } from "@langchain/langgraph";

export enum AGENT_NODES {
  LLM_CALL = "llmCall",
  TOOL_NODE = "tools",
}
export enum AGENT_EDGES {
  CONTINUE = "Action",
}

/**
 * Human-in-the-loop interrupt decision types
 */
export type InterruptDecision = "approve" | "edit" | "reject";

/**
 * Configuration for a specific tool interrupt
 */
export interface IToolInterruptConfig {
  allowedDecisions: InterruptDecision[];
}

/**
 * Interrupt configuration for human-in-the-loop approval
 * Maps tool names to their interrupt configurations
 */
export type InterruptConfiguration = Record<string, IToolInterruptConfig>;

export interface ICodeBuddyAgentConfig {
  model?: string;
  workspaceRoot?: string;
  store?: BaseStore;
  assistantId?: string;
  additionalTools?: StructuredTool[];
  customSystemPrompt?: string;
  enableWebSearch?: boolean;
  checkPointer?: any;
  enableSubAgents?: boolean;
  maxFileSizeMb?: number;
  enableHITL?: boolean;
  interruptOn?: InterruptConfiguration;
  streamOptions?: IStreamOptions;
}

export interface ISubAgentConfig {
  model?: string;
  enableWebSearch?: boolean;
}

export interface IBackendRoute {
  path: string;
  description: string;
  persistent?: boolean;
}

export interface IAgentResult {
  messages: any[];
  state?: any;
  error?: any;
}

export interface IStorageStats {
  stateFiles: number;
  storeFiles: number;
  workspaceFiles: number;
  totalSize: number;
}

export interface IWebsearchConfig {
  maxResults?: number;
  includeRawContent?: boolean;
  timeout?: number;
}

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export enum StreamEventType {
  START = "onStreamStart",
  END = "onStreamEnd",
  CHUNK = "onStreamChunk",
  TOOL_START = "onToolStart",
  TOOL_END = "onToolEnd",
  TOOL_PROGRESS = "onToolProgress",
  THINKING = "onThinking",
  THINKING_START = "onThinkingStart",
  THINKING_UPDATE = "onThinkingUpdate",
  THINKING_END = "onThinkingEnd",
  PLANNING = "onPlanning",
  SUMMARIZING = "onSummarizing",
  ERROR = "onStreamError",
  METADATA = "streamMetadata",
  // New activity types for detailed streaming
  DECISION = "onDecision",
  READING = "onReading",
  SEARCHING = "onSearching",
  REVIEWING = "onReviewing",
  ANALYZING = "onAnalyzing",
  EXECUTING = "onExecuting",
  WORKING = "onWorking",
  TERMINAL_OUTPUT = "onTerminalOutput",
}

export interface IToolActivity {
  id: string;
  toolName: string;
  invocationId?: string;
  status: "starting" | "running" | "completed" | "failed";
  description: string;
  startTime: number;
  endTime?: number;
  result?: {
    summary?: string;
    itemCount?: number;
    preview?: string;
  };
}

export interface IStreamEvent {
  type: StreamEventType;
  content: string;
  metadata?: IStreamMetadata;
  accumulated?: string;
}

interface IStreamMetadata {
  node?: string;
  toolName?: string;
  timestamp?: number;
  tokens?: number;
  [key: string]: unknown;
}

export interface IStreamChunk {
  id: string;
  content: string;
  type: StreamEventType;
  metadata?: IStreamMetadata;
}

export interface IStreamMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming: boolean;
  metadata?: Record<string, any>;
}

export interface IVSCodeMessage {
  type: string;
  payload: any;
  requestId?: string;
}

export interface IStreamOptions {
  maxBufferSize: number;
  flushInterval: number;
  enableBackPressure: boolean;
}

// ─── Domain Types for Agent Stream Processing ───────────────

/** A tool call extracted from agent stream events (LangChain, Anthropic, or legacy). */
export interface IAgentToolCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

/** Structured content block from an LLM message. */
export interface IContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  id?: string;
}

/** Token / cost usage metadata attached to AI messages. */
export interface IUsageMetadata {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

/** An agent message extracted from a stream event update. */
export interface IAgentMessage {
  type?: "human" | "ai" | "tool" | string;
  content: string | IContentBlock[];
  tool_calls?: IAgentToolCall[];
  usage_metadata?: IUsageMetadata;
  name?: string;
  additional_kwargs?: Record<string, unknown>;
}

/** A single node update from the agent stream (entry of the event object). */
export interface IAgentNodeUpdate {
  messages?: IAgentMessage[];
  toolCalls?: IAgentToolCall[];
}

/** Mutable state scoped to a single stream invocation. */
export interface IStreamContext {
  conversationId: string;
  pendingToolCalls: Map<string, IToolActivity>;
  toolCallCounts: Map<string, number>;
  fileEditCounts: Map<string, number>;
  accumulatedContent: string;
  eventCount: number;
  totalToolInvocations: number;
  startTime: number;
  hasErrored: boolean;
  forceStopReason: "max_events" | "max_tools" | "timeout" | null;
  agentState: "planning" | "running" | "summarizing" | "completed" | "failed";
  /** Opaque handles for in-flight tracing spans. Keys are invocationIds. */
  toolSpans: Map<string, unknown>;
}

/** Tool description registry entry. */
export interface IToolDescription {
  name: string;
  description: string;
  activityType: string;
}

/** An interrupt payload from a LangGraph agent stream. */
export interface IInterruptValue {
  value?: {
    id?: string;
    name?: string;
    tool?: string;
    input?: Record<string, unknown>;
    args?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    description?: string;
  };
}

/** Minimal contract for a compiled LangGraph agent that supports streaming. */
export interface IStreamableAgent {
  stream(
    input: unknown,
    config: Record<string, unknown>,
  ): Promise<AsyncIterable<unknown>>;
}
