import Anthropic from "@anthropic-ai/sdk";
import { GenerativeModel } from "@google/generative-ai";
import Groq from "groq-sdk";
import { CodeBuddyTool } from "../../tools/base";

export interface ProcessInputResult {
  queries: string[];
  tokens: number;
  prompt: string;
  thought: string;
  toolName: string;
  finalAnswer: string;
}

export type LLMs = GenerativeModel | Groq | Anthropic;

export interface ICodeBuddyToolConfig {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    example?: unknown;
    enum?: string[];
    items?: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface IToolConfig extends ICodeBuddyToolConfig {
  createInstance: (
    config: ICodeBuddyToolConfig,
    retriever?: any,
  ) => CodeBuddyTool;
}
