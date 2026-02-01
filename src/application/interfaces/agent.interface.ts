import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GenerativeModel } from "@google/generative-ai";
import Groq from "groq-sdk";

export interface ProcessInputResult {
  queries: string[];
  tokens: number;
  prompt: string;
  thought: string;
  toolName: string;
  finalAnswer: string;
}

export type LLMs = GenerativeModel | Groq | Anthropic | OpenAI;

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
  createInstance: (config: ICodeBuddyToolConfig, retriever?: any) => any;
}

export interface IFileToolConfig {
  class_name: string;
  function_name: string;
  file_path: string;
}

export interface IFileToolResponse {
  function: string;
  content: string;
}
