// import { Logger, LogLevel } from "../infrastructure/logger/logger";

// export class QuestionClassifierService {
//   private static instance: QuestionClassifierService;
//   private readonly logger: Logger;

//   // Keywords that indicate codebase-related questions
//   private readonly codebaseKeywords = [
//     // Implementation questions
//     "how is",
//     "how does",
//     "how are",
//     "how do",
//     "where is",
//     "where are",
//     "where do",
//     "what is",
//     "what are",
//     "what does",
//     "which files",
//     "which components",
//     "which services",

//     // Architecture questions
//     "architecture",
//     "structure",
//     "organization",
//     "pattern",
//     "patterns",
//     "design",
//     "framework",
//     "frameworks",
//     "technology",
//     "technologies",

//     // Authentication/Security
//     "authentication",
//     "authorization",
//     "security",
//     "login",
//     "auth",
//     "permissions",
//     "roles",
//     "access control",
//     "jwt",
//     "oauth",
//     "passport",

//     // API/Endpoints
//     "api",
//     "apis",
//     "endpoint",
//     "endpoints",
//     "routes",
//     "controllers",
//     "rest",
//     "graphql",
//     "swagger",
//     "openapi",

//     // Database
//     "database",
//     "db",
//     "schema",
//     "models",
//     "entities",
//     "tables",
//     "migration",
//     "migrations",
//     "orm",
//     "prisma",
//     "typeorm",
//     "sequelize",

//     // Code organization
//     "services",
//     "components",
//     "modules",
//     "classes",
//     "functions",
//     "interfaces",
//     "types",
//     "dependencies",
//     "imports",

//     // Configuration
//     "configuration",
//     "config",
//     "environment",
//     "settings",
//     "variables",
//     ".env",
//     "docker",
//     "deployment",

//     // Building/Development
//     "build",
//     "create",
//     "implement",
//     "add",
//     "develop",
//     "integrate",
//     "dashboard",
//     "admin",
//     "panel",
//     "interface",
//     "ui",
//     "frontend",

//     // Analysis
//     "analyze",
//     "review",
//     "understand",
//     "explain",
//     "describe",
//     "overview",
//     "summary",
//     "breakdown",
//   ];

//   // Patterns that strongly indicate codebase questions
//   private readonly codebasePatterns = [
//     /how\s+is\s+\w+\s+handled/i,
//     /what\s+are\s+the\s+main\s+\w+/i,
//     /where\s+can\s+i\s+find/i,
//     /how\s+do\s+i\s+build/i,
//     /what\s+apis?\s+do\s+i\s+need/i,
//     /show\s+me\s+the\s+\w+/i,
//     /explain\s+the\s+\w+/i,
//     /what\s+is\s+the\s+structure/i,
//     /how\s+does\s+the\s+\w+\s+work/i,
//     /what\s+frameworks?\s+are\s+used/i,
//     /in\s+this\s+codebase/i,
//     /within\s+this\s+project/i,
//     /in\s+this\s+application/i,
//   ];

//   private constructor() {
//     this.logger = Logger.initialize("QuestionClassifierService", {
//       minLevel: LogLevel.DEBUG,
//     });
//   }

//   public static getInstance(): QuestionClassifierService {
//     if (!QuestionClassifierService.instance) {
//       QuestionClassifierService.instance = new QuestionClassifierService();
//     }
//     return QuestionClassifierService.instance;
//   }

//   /**
//    * Determines if a question is related to codebase understanding
//    */
//   public isCodebaseQuestion(question: string): boolean {
//     const normalizedQuestion = question.toLowerCase().trim();

//     // Check for strong patterns first
//     for (const pattern of this.codebasePatterns) {
//       if (pattern.test(normalizedQuestion)) {
//         this.logger.debug(
//           `Question matched pattern: ${pattern} - "${question}"`,
//         );
//         return true;
//       }
//     }

//     // Check for keyword combinations
//     const words = normalizedQuestion.split(/\s+/);
//     const keywordMatches = words.filter((word) =>
//       this.codebaseKeywords.some(
//         (keyword) => word.includes(keyword) || keyword.includes(word),
//       ),
//     );

//     // If we have multiple keyword matches, it's likely a codebase question
//     if (keywordMatches.length >= 2) {
//       this.logger.debug(
//         `Question matched ${keywordMatches.length} keywords: ${keywordMatches.join(", ")} - "${question}"`,
//       );
//       return true;
//     }

//     // Special case: single strong indicator keywords
//     const strongIndicators = [
//       "architecture",
//       "authentication",
//       "endpoints",
//       "database",
//       "codebase",
//       "implementation",
//     ];
//     const hasStrongIndicator = strongIndicators.some((indicator) =>
//       normalizedQuestion.includes(indicator),
//     );

//     if (hasStrongIndicator) {
//       this.logger.debug(`Question has strong indicator - "${question}"`);
//       return true;
//     }

//     return false;
//   }

//   /**
//    * Analyzes the question and provides context about what type of codebase information is needed
//    */
//   public categorizeQuestion(question: string): {
//     isCodebaseRelated: boolean;
//     categories: string[];
//     confidence: "high" | "medium" | "low";
//   } {
//     const isCodebaseRelated = this.isCodebaseQuestion(question);
//     const categories: string[] = [];
//     const normalizedQuestion = question.toLowerCase();

//     if (!isCodebaseRelated) {
//       return { isCodebaseRelated: false, categories: [], confidence: "low" };
//     }

//     // Categorize the type of codebase question
//     if (
//       this.matchesCategory(normalizedQuestion, [
//         "auth",
//         "login",
//         "security",
//         "jwt",
//         "passport",
//         "permission",
//       ])
//     ) {
//       categories.push("authentication");
//     }

//     if (
//       this.matchesCategory(normalizedQuestion, [
//         "api",
//         "endpoint",
//         "route",
//         "controller",
//         "rest",
//       ])
//     ) {
//       categories.push("api");
//     }

//     if (
//       this.matchesCategory(normalizedQuestion, [
//         "database",
//         "db",
//         "schema",
//         "model",
//         "entity",
//         "table",
//       ])
//     ) {
//       categories.push("database");
//     }

//     if (
//       this.matchesCategory(normalizedQuestion, [
//         "architecture",
//         "structure",
//         "pattern",
//         "design",
//         "framework",
//       ])
//     ) {
//       categories.push("architecture");
//     }

//     if (
//       this.matchesCategory(normalizedQuestion, [
//         "config",
//         "environment",
//         "setting",
//         "docker",
//         "deployment",
//       ])
//     ) {
//       categories.push("configuration");
//     }

//     if (
//       this.matchesCategory(normalizedQuestion, [
//         "build",
//         "create",
//         "implement",
//         "develop",
//         "add",
//       ])
//     ) {
//       categories.push("implementation");
//     }

//     // Determine confidence based on pattern matching and keyword density
//     let confidence: "high" | "medium" | "low" = "low";

//     if (
//       this.codebasePatterns.some((pattern) => pattern.test(normalizedQuestion))
//     ) {
//       confidence = "high";
//     } else if (categories.length >= 2) {
//       confidence = "high";
//     } else if (categories.length === 1) {
//       confidence = "medium";
//     }

//     return { isCodebaseRelated, categories, confidence };
//   }

//   private matchesCategory(text: string, keywords: string[]): boolean {
//     return keywords.some((keyword) => text.includes(keyword));
//   }
// }
