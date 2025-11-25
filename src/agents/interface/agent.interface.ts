import { StructuredTool } from "@langchain/core/tools";
import { BaseStore } from "@langchain/langgraph";

export enum AGENT_NODES {
  LLM_CALL = "llmCall",
  TOOL_NODE = "tools",
}
export enum AGENT_EDGES {
  CONTINUE = "Action",
}

export interface ICodeBuddyAgentConfig {
  model?: string;
  workspaceRoot?: string;
  store?: BaseStore;
  assistantId?: string;
  additionalTools?: StructuredTool[];
  customSystemPrompt?: string;
  enableWebSearch?: boolean;
  checkPointer?: any;
  enableSubAgent?: boolean;
  maxFileSizeMb?: number;
  interruptOn?: Record<string, any>;
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
