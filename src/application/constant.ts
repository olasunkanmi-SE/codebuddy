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
  GEMINI_SNAPSHOT = "GeminiSnapshot",
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
  NODE_MODULES_PATTERN = "**/node_modules/**",
}

export const EmbeddingsConfig = {
  batchSize: 5,
  maxRetries: 3,
  retryDelay: 1000,
  rateLimit: 1500,
  embeddingModel: "text-embedding-004",
  textModel: "gemini-1.5-flash",
};
export enum HTTP_STATUS_CODE {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLYHINTS = 103,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  AMBIGUOUS = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  REQUESTED_RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  I_AM_A_TEAPOT = 418,
  MISDIRECTED = 421,
  UNPROCESSABLE_ENTITY = 422,
  FAILED_DEPENDENCY = 424,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
}

export enum RequestHeader {
  AUTHORIZATION = "authorization",
  CONTENT_TYPE = "Content-Type",
  ACCEPT = "accept",
  CONNECTION = "connection",
}

export enum HTTP_VERBS {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
}

export const HTTPS_DEFAULT_TIMEOUT = 10000;
export const generateQuerySting = (query: string) =>
  `q=${encodeURIComponent(query)}`;
export enum WEB_SEARCH_CONFIG {
  baseUrl = "https://www.startpage.com/sp/search?",
  userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
}
