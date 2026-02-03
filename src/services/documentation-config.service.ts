import { DocumentationConfig } from "../interfaces/documentation.interface";

/**
 * Configuration service for documentation generator
 * Manages messages, patterns, and settings
 */
export class DocumentationConfigService {
  private static instance: DocumentationConfigService;

  private readonly messages = {
    generation: {
      starting: "🚀 Starting documentation generation...",
      analyzingCodebase: "📊 Analyzing codebase structure...",
      generatingReadme: "📝 Generating README documentation...",
      generatingApi: "🔗 Generating API documentation...",
      generatingArchitecture: "🏗️ Generating architecture documentation...",
      generatingComponents: "🧩 Generating component documentation...",
      writingFiles: "💾 Writing documentation files...",
      completed: "✅ Documentation generation completed successfully!",
      cancelled: "❌ Documentation generation was cancelled",
      failed: "❌ Failed to generate documentation",
    },
    errors: {
      noWorkspace: "No workspace folder found. Please open a project folder.",
      noFiles: "No files found to analyze in the workspace.",
      writePermission: "Permission denied writing to documentation folder.",
      unknown: "An unknown error occurred during documentation generation",
      aiService:
        "AI service unavailable, falling back to pattern-based analysis",
      parsing: "Failed to parse code structure",
    },
    success: {
      docsGenerated: "📚 Documentation generated successfully!",
      filesCreated: "Created {count} documentation files",
      openDocs: "📖 Open Documentation Folder",
    },
  };

  private readonly apiPatterns: RegExp[] = [
    // Express.js patterns
    /app\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
    /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,

    // Decorator patterns (NestJS, etc.)
    /@(Get|Post|Put|Delete|Patch)\s*\(['"`]([^'"`]+)['"`]/gi,

    // Fastify patterns
    /fastify\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,

    // Spring Boot patterns
    /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\s*\(['"`]([^'"`]+)['"`]/gi,
  ];

  private readonly componentPatterns: RegExp[] = [
    /class\s+(\w+)Service/gi,
    /class\s+(\w+)Controller/gi,
    /class\s+(\w+)Model/gi,
    /class\s+(\w+)Repository/gi,
    /class\s+(\w+)Middleware/gi,
    /interface\s+(\w+)/gi,
    /function\s+(\w+)\s*\(/gi,
  ];

  private readonly defaultConfig = {
    includeReadme: true,
    includeAPI: true,
    includeArchitecture: true,
    includeComponents: true,
    includeUsage: true,
    includeContributing: false,
    includeLicense: false,
    outputFormat: "markdown" as const,
    diagramFormat: "mermaid" as const,
    outputDirectory: "docs",
  };

  public static getInstance(): DocumentationConfigService {
    if (!DocumentationConfigService.instance) {
      DocumentationConfigService.instance = new DocumentationConfigService();
    }
    return DocumentationConfigService.instance;
  }

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get localized message by key path
   */
  public getMessage(
    keyPath: string,
    replacements?: Record<string, string | number>,
  ): string {
    const keys = keyPath.split(".");
    let message = this.messages as any;

    for (const key of keys) {
      message = message[key];
      if (!message) {
        return keyPath; // Return key path if message not found
      }
    }

    if (typeof message !== "string") {
      return keyPath;
    }

    // Replace placeholders
    if (replacements) {
      return Object.entries(replacements).reduce(
        (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
        message,
      );
    }

    return message;
  }

  /**
   * Get API extraction patterns
   */
  public getAPIPatterns(): RegExp[] {
    return [...this.apiPatterns];
  }

  /**
   * Get component extraction patterns
   */
  public getComponentPatterns(): RegExp[] {
    return [...this.componentPatterns];
  }

  /**
   * Get default configuration
   */
  public getDefaultConfig() {
    return { ...this.defaultConfig };
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: any): config is DocumentationConfig {
    return (
      typeof config === "object" &&
      typeof config.includeReadme === "boolean" &&
      typeof config.includeAPI === "boolean" &&
      typeof config.includeArchitecture === "boolean" &&
      typeof config.includeComponents === "boolean" &&
      typeof config.includeUsage === "boolean" &&
      typeof config.includeContributing === "boolean" &&
      typeof config.includeLicense === "boolean" &&
      (config.outputFormat === "markdown" ||
        config.outputFormat === "html" ||
        config.outputFormat === "both") &&
      (config.diagramFormat === "mermaid" ||
        config.diagramFormat === "plantuml" ||
        config.diagramFormat === "ascii") &&
      typeof config.outputDirectory === "string"
    );
  }
}

/**
 * Documentation type configuration mapping
 */
export class DocumentationTypeHandler {
  private static readonly typeMap: Record<string, (config: any) => void> = {
    "📚 Complete Documentation Suite": (config) => {
      config.includeReadme = true;
      config.includeAPI = true;
      config.includeArchitecture = true;
      config.includeComponents = true;
      config.includeUsage = true;
      config.includeContributing = true;
      config.includeLicense = true;
    },
    "📖 README Only": (config) => {
      config.includeReadme = true;
      config.includeAPI = false;
      config.includeArchitecture = false;
      config.includeComponents = false;
      config.includeUsage = true;
      config.includeContributing = false;
      config.includeLicense = false;
    },
    "� API Documentation": (config) => {
      config.includeReadme = true;
      config.includeAPI = true;
      config.includeArchitecture = false;
      config.includeComponents = false;
      config.includeUsage = true;
      config.includeContributing = false;
      config.includeLicense = false;
    },
    "🏗️ Architecture Overview": (config) => {
      config.includeReadme = false;
      config.includeAPI = false;
      config.includeArchitecture = true;
      config.includeComponents = true;
      config.includeUsage = false;
      config.includeContributing = false;
      config.includeLicense = false;
    },
  };

  public static applyConfiguration(selection: string, config: any): void {
    const handler = this.typeMap[selection];
    if (handler) {
      handler(config);
    }
  }

  public static getAvailableTypes(): string[] {
    return Object.keys(this.typeMap);
  }
}
