import { StructuredTool } from "@langchain/core/tools";
import { BaseStore } from "@langchain/langgraph";
import { IEditorHost } from "../../interfaces/editor-host";

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
  host?: IEditorHost;
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
