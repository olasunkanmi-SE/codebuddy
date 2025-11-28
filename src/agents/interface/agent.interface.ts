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
  /**
   * Human-in-the-loop interrupt configuration
   * Defines which tools require user approval before execution
   *
   * Example:
   * ```typescript
   * interruptOn: {
   *   write_file: { allowedDecisions: ["approve", "edit", "reject"] },
   *   edit_file: { allowedDecisions: ["approve", "edit", "reject"] }
   * }
   * ```
   */
  interruptOn?: InterruptConfiguration;
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
