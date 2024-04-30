export const USER_MESSAGE = " ☕️ Hold on while Ola ";
export enum OLA_ACTIONS {
  comment = "ola.commentCode",
  review = "ola.reviewCode",
  refactor = "ola.codeRefactor",
  optimize = "ola.codeOptimize",
  fix = "ola.codeFix",
  explain = "ola.explain",
}

export const GROQ_CONFIG = {
  temperature: 0.1,
  max_tokens: 1024,
  top_p: 1,
  stream: false,
  stop: null,
};

export const appConfig = {
  geminiKey: "google.gemini.apiKeys",
  geminiModel: "google.gemini.model",
  groqKey: "groq.llama3.apiKey",
  groqModel: "groq.llama3.model",
  generativeAi: "generativeAi.option",
};

export enum generativeModel {
  GEMINI = "Gemini",
  GROQ = "Groq",
}
