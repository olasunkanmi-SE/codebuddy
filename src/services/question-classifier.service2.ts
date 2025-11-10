import levenshtein from "fast-levenshtein";
import { PorterStemmer } from "natural";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

interface KeywordConfig {
  categories: Record<string, string[]>;
  patterns: RegExp[];
  strongIndicators: string[];
}

export class QuestionClassifierService {
  private static instance: QuestionClassifierService;
  private readonly logger: Logger;
  private readonly config: KeywordConfig;
  private readonly negationWords = ["not", "no", "without", "exclude", "avoid"];
  private readonly fuzzyThreshold = 2;

  constructor() {
    this.logger = Logger.initialize("QuestionClassifierService", {
      minLevel: LogLevel.DEBUG,
    });
    this.config = this.loadConfig();
  }

  static getInstance() {
    return (QuestionClassifierService.instance ??=
      new QuestionClassifierService());
  }

  private loadConfig(): KeywordConfig {
    const config = this.getDefaultConfig();
    return {
      categories: config.categories,
      patterns: config.patterns.map((p) => new RegExp(p, "i")),
      strongIndicators: config.strongIndicators,
    };
  }

  private getDefaultConfig(): KeywordConfig {
    return {
      categories: {
        authentication: [
          "authentication",
          "authorization",
          "security",
          "login",
          "auth",
          "permissions",
          "roles",
          "access control",
          "jwt",
          "oauth",
          "passport",
          "authn",
        ],
        api: [
          "api",
          "apis",
          "endpoint",
          "endpoints",
          "routes",
          "controllers",
          "rest",
          "graphql",
          "swagger",
          "openapi",
        ],
        database: [
          "database",
          "db",
          "schema",
          "models",
          "entities",
          "tables",
          "migration",
          "migrations",
          "orm",
          "prisma",
          "typeorm",
          "sequelize",
        ],
        architecture: [
          "architecture",
          "structure",
          "organization",
          "pattern",
          "patterns",
          "design",
          "framework",
          "frameworks",
          "technology",
          "technologies",
          "monorepo",
          "microservices",
        ],
        configuration: [
          "configuration",
          "config",
          "environment",
          "settings",
          "variables",
          ".env",
          "docker",
          "deployment",
        ],
        implementation: [
          "implementation",
          "build",
          "create",
          "implement",
          "add",
          "develop",
          "integrate",
          "dashboard",
          "admin",
          "panel",
          "interface",
          "ui",
          "frontend",
        ],
        testing: [
          "testing",
          "test",
          "jest",
          "mocha",
          "unit tests",
          "integration",
          "ci/cd",
          "pipeline",
        ],
        frontend: ["frontend", "react", "vue", "ui", "component"],
        backend: ["backend", "node", "express", "server"],
        general: [
          "how is",
          "how does",
          "how are",
          "how do",
          "where is",
          "where are",
          "where do",
          "what is",
          "what are",
          "what does",
          "which files",
          "which components",
          "which services",
          "services",
          "components",
          "modules",
          "classes",
          "functions",
          "interfaces",
          "types",
          "dependencies",
          "imports",
          "repo",
          "repository",
          "code",
          "project",
          "analyze",
          "review",
          "understand",
          "explain",
          "describe",
          "overview",
          "summary",
          "breakdown",
        ],
      },
      patterns: [
        /how\s+is\s+\w+\s+handled/i,
        /what\s+are\s+the\s+main\s+\w+/i,
        /where\s+can\s+i\s+find/i,
        /how\s+do\s+i\s+build/i,
        /what\s+apis?\s+do\s+i\s+need/i,
        /show\s+me\s+the\s+\w+/i,
        /explain\s+the\s+\w+/i,
        /what\s+is\s+the\s+structure/i,
        /how\s+does\s+the\s+\w+\s+work/i,
        /what\s+frameworks?\s+are\s+used/i,
        /in\s+this\s+codebase/i,
        /within\s+this\s+project/i,
        /in\s+this\s+application/i,
        /how\s+to\s+(implement|add|integrate)\s+\w+/i,
        /what\s+is\s+the\s+(flow|workflow|process)\s+for/i,
        /difference\s+between\s+\w+\s+and\s+\w+/i,
      ],
      strongIndicators: [
        "architecture",
        "authentication",
        "authorization",
        "security",
        "performance",
        "api",
        "endpoints",
        "database",
        "codebase",
        "implementation",
        "repo",
      ],
    };
  }

  isCodeBaseQuestion(question: string): boolean {
    if (!question || typeof question !== "string") {
      return false;
    }

    const normalizedQuestion = question.toLowerCase().trim();
    const words = normalizedQuestion.split(/\s+/);
    const stemmedWords = words.map((word) => PorterStemmer.stem(word));

    if (this.hasNegation(normalizedQuestion)) {
      this.logger.debug(`Question contains negation - "${question}"`);
      return false;
    }

    for (const pattern of this.config.patterns) {
      if (pattern.test(normalizedQuestion)) {
        this.logger.debug(
          `Question matched pattern: ${pattern} - "${question}"`,
        );
        return true;
      }
    }

    const allKeywords = new Set(
      Object.values(this.config.categories)
        .flat()
        .map((k) => PorterStemmer.stem(k)),
    );

    const keywordMatches = stemmedWords.filter((stemmedWord) =>
      Array.from(allKeywords).some((stemmedKeyword) => {
        const exactMatch =
          stemmedKeyword.includes(stemmedWord) ||
          stemmedWord.includes(stemmedKeyword);
        const fuzzyMatch =
          levenshtein.get(stemmedWord, stemmedKeyword) <= this.fuzzyThreshold;
        return exactMatch || fuzzyMatch;
      }),
    );

    if (keywordMatches?.length >= 2) {
      this.logger.debug(
        `Question matched ${keywordMatches.length} keywords: ${keywordMatches.join(", ")} - "${question}"`,
      );
      return true;
    }

    const stemmedStrong = this.config.strongIndicators.map((s) =>
      PorterStemmer.stem(s),
    );
    const hasStrongIndicator = stemmedWords.some((stemmedWord) =>
      stemmedStrong.some((stemmedIndicator) => {
        const exact = normalizedQuestion.includes(stemmedIndicator);
        const fuzzy =
          levenshtein.get(stemmedWord, stemmedIndicator) <= this.fuzzyThreshold;
        return exact || fuzzy;
      }),
    );

    if (hasStrongIndicator) {
      this.logger.debug(`Question has strong indicator - "${question}"`);
      return true;
    }

    return false;
  }

  private hasNegation(text: string): boolean {
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (this.negationWords.includes(words[i])) {
        const nextWords = words.splice(i + 1, i + 4).join(" ");
        if (this.matchesAnyCategory(nextWords)) {
          return true;
        }
      }
    }
    return false;
  }

  private matchesAnyCategory(text: string): boolean {
    const stemmedText = PorterStemmer.stem(text);
    return Object.values(this.config.categories)
      .flat()
      .some((keyword) => {
        const stemmedKeyword = PorterStemmer.stem(keyword);
        return (
          levenshtein.get(stemmedText, stemmedKeyword) <= this.fuzzyThreshold ||
          text.includes(keyword)
        );
      });
  }

  /**
   * Analyzes the question and provides context about what type of codebase information is needed
   * @param question The question to categorize
   * @returns Object with isCodebaseRelated, categories, and confidence
   */
  public categorizeQuestion(question: string): {
    isCodebaseRelated: boolean;
    categories: string[];
    confidence: "high" | "medium" | "low";
  } {
    const isCodebaseRelated = this.isCodeBaseQuestion(question);
    const categories: string[] = [];
    let score = 0;

    if (!isCodebaseRelated) {
      return { isCodebaseRelated: false, categories: [], confidence: "low" };
    }

    const normalizedQuestion = question.toLowerCase().trim();
    const stemmedQuestion = PorterStemmer.stem(normalizedQuestion);

    // Pattern matches add 3 points each
    score +=
      3 * this.config.patterns.filter((p) => p.test(normalizedQuestion)).length;

    // Categorize and score keywords (1 point per match, fuzzy-aware)
    for (const [category, keywords] of Object.entries(this.config.categories)) {
      const matches = keywords.filter((keyword) => {
        const stemmedKeyword = PorterStemmer.stem(keyword);
        const exact = normalizedQuestion.includes(keyword);
        const fuzzy =
          levenshtein.get(stemmedQuestion, stemmedKeyword) <=
          this.fuzzyThreshold;
        return exact || fuzzy;
      });
      if (matches.length > 0) {
        categories.push(category);
        score += matches.length; // Add points based on match count
      }
    }

    // Strong indicators add 2 points each
    score +=
      2 *
      this.config.strongIndicators.filter(
        (indicator) =>
          normalizedQuestion.includes(indicator) ||
          levenshtein.get(stemmedQuestion, PorterStemmer.stem(indicator)) <=
            this.fuzzyThreshold,
      ).length;

    // Determine confidence based on score
    const confidence: "high" | "medium" | "low" =
      score >= 5 ? "high" : score >= 3 ? "medium" : "low";

    // Sort categories by relevance (match count descending)
    categories.sort((a, b) => {
      const countA = this.countMatches(
        normalizedQuestion,
        this.config.categories[a],
      );
      const countB = this.countMatches(
        normalizedQuestion,
        this.config.categories[b],
      );
      return countB - countA;
    });

    return { isCodebaseRelated, categories, confidence };
  }

  private countMatches(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      return text.includes(keyword) ? count + 1 : count;
    }, 0);
  }
}
