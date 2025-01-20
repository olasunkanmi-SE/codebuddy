export const USER_MESSAGE = " ☕️ Hold on while CodeBuddy ";
export enum OLA_ACTIONS {
  comment = "CodeBuddy.commentCode",
  review = "CodeBuddy.reviewCode",
  refactor = "CodeBuddy.codeRefactor",
  optimize = "CodeBuddy.codeOptimize",
  fix = "CodeBuddy.codeFix",
  explain = "CodeBuddy.explain",
  pattern = "CodeBuddy.savePattern",
  knowledge = "CodeBuddy.readFromKnowledgeBase",
  commitMessage = "CodeBuddy.generateCommitMessage",
  interviewMe = "CodeBuddy.interviewMe",
  generateUnitTest = "CodeBuddy.generateUnitTest",
  generateCodeChart = "CodeBuddy.generateCodeChart",
  inlineChat = "CodeBuddy.inLineChat",
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

export enum FSPROPS {
  SRC_DIRECTORY = "src",
  TS_FILE_PATTERN = "**/*.ts",
  TSCONFIG_FILE = "tsconfig.json",
}

export const EmbeddingsConfig = {
  batchSize: 5,
  maxRetries: 3,
  retryDelay: 1000,
  rateLimit: 1500,
  embeddingModel: "Xenova/all-MiniLM-L6-v2",
  textModel: "gemini-1.5-flash",
};
