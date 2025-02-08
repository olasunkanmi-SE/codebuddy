import Anthropic from "@anthropic-ai/sdk";
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

export type LLMs = GenerativeModel | Groq | Anthropic;
