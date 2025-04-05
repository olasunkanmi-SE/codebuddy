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
  DEEPSEEK_CHAT_HISTORY = "deepseekChatHistory",
  USER_INPUT = "user-input",
  BOT = "bot",
  GEMINI_SNAPSHOT = "GeminiSnapshot",
}
export const GROQ_CONFIG = {
  temperature: 0.1,
  max_tokens: 500024,
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
  deepseekApiKey: "deepseek.apiKey",
  deepseekModel: "deepseek.model",
};
export enum generativeAiModels {
  GEMINI = "Gemini",
  GROQ = "Groq",
  ANTHROPIC = "Anthropic",
  GROK = "XGrok",
  DEEPSEEK = "Deepseek",
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
export enum WEB_SEARCH_CONFIG {
  baseUrl = "https://www.startpage.com/sp/search?",
  userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
}

export const URL_RERANKING_CONFIG = {
  titleRelevanceWeight: 0.3,
  sourceReputationWeight: 0.6,
  contentQualityWeight: 0.4,
  userContextWeight: 0.15,
  contentFreshnessWeight: 0.1,
  diversityWeight: 0.05,
};

export const RELEVANT_CODING_KEY_WORDS = [
  "Algorithm",
  "Data structure",
  "Programming language",
  "Framework",
  "Library",
  "Tool",
  "Methodology",
  "Pattern",
  "Paradigm",
  "Architecture",
  "Protocol",
  "Standard",
  "API",
  "Interface",
  "Database",
  "Operating system",
  "Network",
  "Security",
  "Testing",
  "Debugging",
  "Optimization",
  "Performance",
  "Scalability",
  "Reliability",
  "Maintainability",
  "Usability",
  "Accessibility",
  "Internationalization",
  "Localization",
  "Concurrency",
  "Parallelism",
  "Distributed systems",
  "Cloud computing",
  "Machine learning",
  "Artificial intelligence",
  "Web development",
  "Mobile development",
  "Game development",
  "Embedded systems",
  "IoT",
  "DevOps",
  "CI/CD",
  "Version control",
  "Code review",
  "Refactoring",
  "Documentation",
  "Requirements",
  "Specification",
  "Design",
  "Implementation",
  "Verification",
  "Validation",
  "Deployment",
  "Maintenance",
  "Implement",
  "Develop",
  "Build",
  "Compile",
  "Interpret",
  "Execute",
  "Run",
  "Install",
  "Configure",
  "Setup",
  "Integrate",
  "Migrate",
  "Upgrade",
  "Maintain",
  "Support",
  "Document",
  "Comment",
  "Refactor",
  "Optimize",
  "Scale",
  "Secure",
  "Encrypt",
  "Decrypt",
  "Authenticate",
  "Authorize",
  "Tutorial",
  "Guide",
  "Introduction",
  "Overview",
  "Explanation",
  "Implementation",
  "Example",
  "Code snippet",
  "Project",
  "Application",
  "System",
  "Case study",
  "Best practice",
  "Tip",
  "Trick",
  "Technique",
  "Method",
  "Approach",
  "Solution",
  "Problem",
  "Challenge",
  "Issue",
  "Bug",
  "Fix",
  "Patch",
  "Update",
  "Release",
  "Version",
  "Documentation",
  "Reference",
  "Manual",
  "Handbook",
  "Textbook",
  "Course",
  "Lecture",
  "Lesson",
  "Module",
  "Unit",
  "Chapter",
  "Section",
];

export const REPUTATION_RANK_MAP = {
  "stackoverflow.com": 0.95,
  "stackexchange.com": 0.95,
  "github.com": 0.9,
  "docs.python.org": 0.85,
  "developer.mozilla.org": 0.9,
  "geeksforgeeks.org": 0.6,
  "interviewkickstart.com": 0.7,
  "en.wikipedia.org": 0.75,
  "docs.microsoft.com": 0.8,
  "reactjs.org": 0.8,
  "docs.docker.com": 0.8,
  "git-scm.com": 0.75,
  "w3schools.com": 0.55,
  "freecodecamp.org": 0.65,
  "devdocs.io": 0.7,
  "news.ycombinator.com": 0.4,
  "docs.oracle.com": 0.75,
  "docs.aws.amazon.com": 0.75,
  "cloud.google.com": 0.75,
  "tensorflow.org": 0.75,
  "tutorialspoint.com": 0.5,
  "dev.to": 0.4,
  "dzone.com": 0.35,
  "infoq.com": 0.3,
  "highscalability.com": 0.3,
  "arxiv.org": 0.25,
  "visualgo.net": 0.2,
  "refactoring.guru": 0.6,
  default: 0,
};

export const URL_CATEGORIES = {
  "stackoverflow.com": { type: "Forum", score: 0.5 },
  "stackexchange.com": { type: "Forum", score: 0.5 },
  "github.com": { type: "Repository", score: 0.8 },
  "docs.python.org": { type: "Documentation", score: 0.95 },
  "developer.mozilla.org": { type: "Documentation", score: 0.9 },
  "geeksforgeeks.org": { type: "Tutorial", score: 0.6 },
  "interviewkickstart.com": { type: "Tutorial", score: 0.7 },
  "en.wikipedia.org": { type: "Tutorial", score: 0.5 },
  "docs.microsoft.com": { type: "Documentation", score: 0.8 },
  "reactjs.org": { type: "Documentation", score: 0.85 },
  "docs.docker.com": { type: "Documentation", score: 0.8 },
  "git-scm.com": { type: "Documentation", score: 0.75 },
  "w3schools.com": { type: "Tutorial", score: 0.5 },
  "freecodecamp.org": { type: "Tutorial", score: 0.6 },
  "devdocs.io": { type: "Documentation", score: 0.7 },
  "news.ycombinator.com": { type: "News", score: 0.2 },
  "docs.oracle.com": { type: "Documentation", score: 0.75 },
  "docs.aws.amazon.com": { type: "Documentation", score: 0.75 },
  "cloud.google.com": { type: "Documentation", score: 0.75 },
  "tensorflow.org": { type: "Documentation", score: 0.75 },
  "tutorialspoint.com": { type: "Tutorial", score: 0.5 },
  "dev.to": { type: "Community", score: 0.3 },
  "dzone.com": { type: "Community", score: 0.3 },
  "infoq.com": { type: "Community", score: 0.3 },
  "highscalability.com": { type: "Community", score: 0.3 },
  "arxiv.org": { type: "Research", score: 0.3 },
  "visualgo.net": { type: "Tutorial", score: 0.2 },
  "refactoring.guru": { type: "Tutorial", score: 0.6 },
};

export const PRIORITY_URLS = [
  "stackoverflow.com",
  "stackexchange.com",
  "github.com",
  "developer.mozilla.org",
  "geeksforgeeks.org",
  "en.wikipedia.org",
  "refactoring.guru",
  "interviewkickstart.com",
  "dev.to",
  "devdocs.io",
  "docs.aws.amazon.com",
  "cloud.google.com",
  "docs.oracle.com",
  "git-scm.com",
];

const FILE_TYPE_PROMPTS: Record<string, string> = {
  pdf: "Extract the main information and key points from this PDF document:",
  docx: "Summarize the content of this Word document:",
  csv: "Analyze this CSV data and provide key insights:",
  txt: "Process this text file and extract the relevant information:",
  json: "Parse this JSON file and provide a structured analysis:",
  default: "Extract all relevant information from this file:",
};
