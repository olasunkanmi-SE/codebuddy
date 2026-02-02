import {
  EmbedContentResponse,
  GenerateContentResult,
} from "@google/generative-ai";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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

export interface ICodeCompletionOptions {
  stopSequences?: string[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ICodeCompleter {
  completeCode(
    prompt: string,
    options?: ICodeCompletionOptions,
  ): Promise<string>;
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
