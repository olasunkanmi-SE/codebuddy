import {
  EmbedContentResponse,
  GenerateContentResult,
} from "@google/generative-ai";

export interface IBaseLLM {}

export interface ILlmConfig {
  model: string;
  tools?: any[];
  apiKey: string;
  baseUrl?: string;
  systemInstruction?: string;
  cachedContent?: any;
  additionalConfig?: Record<string, any>;
}

export type GeminiModelResponseType =
  | EmbedContentResponse
  | GenerateContentResult
  | undefined;

export type TSnapShot = {
  lastQuery?: any;
  lastCall?: any;
  lastResult?: any;
  chatHistory?: any;
  planSteps?: any;
  currentStepIndex?: any;
};

export type GeminiLLMSnapShot = GeminiModelResponseType & TSnapShot;
