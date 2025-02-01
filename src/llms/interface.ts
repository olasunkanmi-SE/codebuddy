import {
  EmbedContentResponse,
  GenerateContentResult,
} from "@google/generative-ai";

export interface IBaseLLM {}

export interface ILlmConfig {
  model: string;
  tools?: any[];
  apiKey: string;
  baseUrl: string;
  systemInstruction?: string;
  cachedContent?: any;
  additionalConfig?: Record<string, any>;
}

export type GeminiModelResponseType =
  | EmbedContentResponse
  | GenerateContentResult;
