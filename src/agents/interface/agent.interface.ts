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
  streamOptions?: IStreamOptions
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
  START = "streamStart",
  END = "streamEnd",
  CHUNK = "streamChunk",
  TOOL_START = "toolStart",
  TOOL_END = "toolEnd",
  ERROR = "streamError",
  METADATA = "streamMetadata"
}

export interface IStreamEvent {
  type: StreamEventType;
  content: string;
  metadata?: IStreamMetadata;
  accumulated?: string
}

interface IStreamMetadata {
  node?: string;
  toolName?: string;
  timestamp?: number;
  tokens?: number
}

export interface IStreamChunk {
  id: string;
  content: string;
  type: StreamEventType
  metadata?: IStreamMetadata
}

export interface IStreamMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number
  isStreaming: boolean
  metadata?: Record<string, any>
}

export interface IVSCodeMessage {
  type: string;
  payload: any
  requestId?: string
}

export interface IWebviewMessage {
  id: string;
  type: "user" | "bot"
  content: string;
  language?: string;
  senderInitial?: string;
  isStreaming?: boolean;
  timestamp?: number
}

export interface IStreamOptions {
  maxBufferSize: number
  flushInterval: number
  enableBackPressure: boolean
}