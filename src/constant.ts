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
  CHAT_HISTORY = "chatHistory",
}

export const GROQ_CONFIG = {
  temperature: 0.1,
  max_tokens: 1024,
  top_p: 1,
  stream: false,
  stop: null,
};

export const APP_CONFIG = {
  geminiKey: "google.gemini.apiKeys",
  geminiModel: "google.gemini.model",
  groqKey: "groq.llama3.apiKey",
  groqModel: "groq.llama3.model",
  generativeAi: "generativeAi.option",
  claudeModel: "claude.model",
  claudeApiKey: "claude.apiKey",
};

export enum generativeAiModel {
  GEMINI = "Gemini",
  GROQ = "Groq",
  CLAUDE = "Claude",
}
