export const USER_MESSAGE = " ☕️ Hold on while CodeBuddy ";
export enum OLA_ACTIONS {
  comment = "ola.commentCode",
  review = "ola.reviewCode",
  refactor = "ola.codeRefactor",
  optimize = "ola.codeOptimize",
  fix = "ola.codeFix",
  explain = "ola.explain",
  pattern = "ola.savePattern",
  knowledge = "ola.readFromKnowledgeBase",
  commitMessage = "ola.generateCommitMessage",
  interviewMe = "ola.interviewMe",
  generateUnitTest = "ola.generateUnitTest",
  generateCodeChart = "ola.generateCodeChart",
}

export enum COMMON {
  GROQ_CHAT_HISTORY = "groqChatHistory",
  GEMINI_CHAT_HISTORY = "geminiChatHistory",
  ANTHROPIC_CHAT_HISTORY = "anthropicChatHistory",
  USER_INPUT = "user-input",
  BOT = "bot",
}

export const GROQ_CONFIG = {
  temperature: 0.1,
  max_tokens: 5024,
  top_p: 1,
  stream: false,
  stop: null,
};

export const APP_CONFIG = {
  geminiKey: "google.gemini.apiKeys",
  geminiModel: "google.gemini.model",
  groqApiKey: "groq.llama3.apiKey",
  groqModel: "groq.llama3.model",
  generativeAi: "generativeAi.option",
  anthropicModel: "anthropic.model",
  anthropicApiKey: "anthropic.apiKey",
  grokApiKey: "grok.apiKey",
  grokModel: "grok.model",
};

export enum generativeAiModels {
  GEMINI = "Gemini",
  GROQ = "Groq",
  ANTHROPIC = "Anthropic",
  GROK = "XGrok",
}

export const MEMORY_CACHE_OPTIONS = {
  sessionTTL: 24 * 60 * 60 * 1000,
};

export type aIProviderConfig = {
  apiKey: string;
  model: string;
  providerName: string;
};
