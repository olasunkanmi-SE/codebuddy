import { IPosition, IRange } from "./editor-host";

export enum CompletionTriggerMode {
  Automatic = "automatic",
  Manual = "manual",
}

export enum CompletionProviderType {
  Gemini = "Gemini",
  Groq = "Groq",
  Anthropic = "Anthropic",
  Deepseek = "Deepseek",
  OpenAI = "OpenAI",
  Qwen = "Qwen",
  GLM = "GLM",
  Local = "Local",
}

export interface ICompletionConfig {
  enabled: boolean;
  provider: CompletionProviderType;
  model: string;
  apiKey?: string;
  debounceMs: number;
  maxTokens: number;
  temperature: number;
  triggerMode: CompletionTriggerMode;
  multiLine: boolean;
}

export interface IImportSignature {
  name: string;
  signature: string;
  file: string;
}

export interface ICompletionContext {
  prefix: string;
  suffix: string;
  languageId: string;
  imports: IImportSignature[];
  cursorPosition: IPosition;
}

export interface ICompletionResult {
  text: string;
  range?: IRange;
  confidence?: number;
}
