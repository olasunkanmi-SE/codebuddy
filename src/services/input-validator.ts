import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";

export class InputValidator {
  private static instance: InputValidator;
  private readonly logger: Logger;

  // Patterns that might indicate prompt injection attempts
  private readonly suspiciousPatterns = [
    /ignore\s+(?:all\s+)?(?:previous\s+)?(?:system\s+)?(?:instructions?|prompts?|commands?)/i,
    /forget\s+(?:everything\s+)?(?:above|before|previous)/i,
    /you\s+are\s+now\s+(?:a\s+)?(?:different\s+)?(?:ai|assistant|bot)/i,
    /system:\s*|user:\s*|assistant:\s*/i,
    /\[SYSTEM\]|\[USER\]|\[ASSISTANT\]/i,
    /roleplay\s+as|act\s+as\s+if|pretend\s+(?:to\s+be|you\s+are)/i,
    /execute\s+(?:code|script|command)/i,
    /\{(?:system|user|assistant)\}/i,
    /<(?:system|user|assistant)>/i,
  ];

  private readonly maxInputLength = 10000; // Maximum input length
  private readonly maxCodebaseQuestionLength = 5000; // Max for codebase questions

  private constructor() {
    this.logger = Logger.initialize("InputValidator", {
      minLevel: LogLevel.DEBUG,
    });
  }

  public static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate user input for potential prompt injection and other security issues
   */
  public validateInput(
    input: string,
    context: "chat" | "codebase-analysis" | "pr-review" = "chat",
  ): {
    isValid: boolean;
    sanitizedInput: string;
    warnings: string[];
    blocked: boolean;
  } {
    const warnings: string[] = [];
    let sanitizedInput = input;
    let blocked = false;

    // Check input length
    const maxLength =
      context === "codebase-analysis"
        ? this.maxCodebaseQuestionLength
        : this.maxInputLength;
    if (input.length > maxLength) {
      warnings.push(
        `Input too long (${input.length} chars). Truncated to ${maxLength} chars.`,
      );
      sanitizedInput = input.substring(0, maxLength);
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        this.logger.warn(
          `Potential prompt injection detected: ${pattern.source}`,
        );
        warnings.push(
          "Input contains potentially unsafe instructions and has been modified.",
        );

        // For high-risk patterns, block entirely
        if (this.isHighRiskPattern(pattern)) {
          blocked = true;
          this.logger.error(
            `High-risk prompt injection blocked: ${pattern.source}`,
          );
          break;
        }

        // For medium-risk patterns, sanitize
        sanitizedInput = sanitizedInput.replace(pattern, "[FILTERED]");
      }
    }

    // Additional sanitization
    sanitizedInput = this.sanitizeInput(sanitizedInput);

    return {
      isValid: !blocked && warnings.length < 3, // Block if too many warnings
      sanitizedInput,
      warnings,
      blocked,
    };
  }

  private isHighRiskPattern(pattern: RegExp): boolean {
    const highRiskPatterns = [
      /ignore\s+(?:all\s+)?(?:previous\s+)?(?:system\s+)?(?:instructions?|prompts?|commands?)/i,
      /you\s+are\s+now\s+(?:a\s+)?(?:different\s+)?(?:ai|assistant|bot)/i,
      /execute\s+(?:code|script|command)/i,
    ];

    return highRiskPatterns.some(
      (highRisk) => highRisk.source === pattern.source,
    );
  }

  private sanitizeInput(input: string): string {
    // Remove excessive whitespace
    let sanitized = input.replace(/\s+/g, " ").trim();

    // Remove potential control characters using character codes
    sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    // Limit consecutive special characters
    sanitized = sanitized.replace(/([^\w\s])\1{5,}/g, "$1$1$1$1$1");

    return sanitized;
  }

  /**
   * Validate codebase-related questions specifically
   */
  public validateCodebaseQuestion(question: string): {
    isValid: boolean;
    sanitizedQuestion: string;
    warnings: string[];
  } {
    const validation = this.validateInput(question, "codebase-analysis");

    // Additional checks for codebase questions
    const codebaseKeywords = [
      "api",
      "endpoint",
      "function",
      "class",
      "method",
      "database",
      "model",
      "service",
      "component",
      "authentication",
      "authorization",
      "architecture",
      "pattern",
      "dependency",
      "framework",
    ];

    const hasCodebaseKeywords = codebaseKeywords.some((keyword) =>
      validation.sanitizedInput.toLowerCase().includes(keyword),
    );

    if (!hasCodebaseKeywords && validation.sanitizedInput.length > 100) {
      validation.warnings.push(
        "Question may not be codebase-related. Consider being more specific about code, architecture, or technical aspects.",
      );
    }

    return {
      isValid: validation.isValid,
      sanitizedQuestion: validation.sanitizedInput,
      warnings: validation.warnings,
    };
  }
}
