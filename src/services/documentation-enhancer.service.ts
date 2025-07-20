import { GeminiLLM } from "../llms/gemini/gemini";
import { getAPIKeyAndModel } from "../utils/utils";

/**
 * Enhanced service for API and architecture extraction
 * Provides LLM-powered extraction with fallback to pattern-based analysis
 */
export class DocumentationEnhancerService {
  private readonly gemini: GeminiLLM | null = null;

  constructor() {
    try {
      const { apiKey, model } = getAPIKeyAndModel("gemini");
      if (apiKey && model) {
        this.gemini = new GeminiLLM({ apiKey, model });
      }
    } catch (error) {
      console.warn(
        "Failed to initialize Gemini for documentation enhancement:",
        error,
      );
    }
  }

  async enhanceAPIExtraction(codebaseContext: string): Promise<{
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      parameters?: Array<{ name: string; type: string; required: boolean }>;
    }>;
    models: Array<{
      name: string;
      properties: Array<{ name: string; type: string; description: string }>;
    }>;
  }> {
    try {
      if (this.gemini) {
        return await this.llmExtractAPIs(codebaseContext);
      }
    } catch (error) {
      console.warn(
        "LLM API extraction failed, falling back to pattern-based:",
        error,
      );
    }

    return this.patternBasedAPIExtraction(codebaseContext);
  }

  async enhanceArchitectureAnalysis(codebaseContext: string): Promise<{
    components: Array<{
      name: string;
      type: string;
      dependencies: string[];
      description: string;
    }>;
    patterns: string[];
    technologies: string[];
    architecture: string;
  }> {
    try {
      if (this.gemini) {
        return await this.llmAnalyzeArchitecture(codebaseContext);
      }
    } catch (error) {
      console.warn(
        "LLM architecture analysis failed, falling back to pattern-based:",
        error,
      );
    }

    return this.patternBasedArchitectureAnalysis(codebaseContext);
  }

  private async llmExtractAPIs(codebaseContext: string): Promise<any> {
    const prompt = `Analyze this codebase and extract API information in JSON format:

${codebaseContext}

Please provide a JSON response with:
{
  "endpoints": [
    {
      "path": "/api/example",
      "method": "GET|POST|PUT|DELETE",
      "description": "Brief description",
      "parameters": [{"name": "param", "type": "string", "required": true}]
    }
  ],
  "models": [
    {
      "name": "ModelName",
      "properties": [{"name": "field", "type": "string", "description": "Field description"}]
    }
  ]
}

Focus on:
- REST endpoints and routes
- GraphQL schemas
- Database models
- TypeScript interfaces
- Request/response types`;

    const response = await this.gemini!.generateText(prompt);
    return JSON.parse(this.extractJSONFromResponse(response));
  }

  private async llmAnalyzeArchitecture(codebaseContext: string): Promise<any> {
    const prompt = `Analyze this codebase architecture and provide insights in JSON format:

${codebaseContext}

Please provide a JSON response with:
{
  "components": [
    {
      "name": "ComponentName",
      "type": "service|controller|model|utility|middleware",
      "dependencies": ["dependency1", "dependency2"],
      "description": "Component description"
    }
  ],
  "patterns": ["pattern1", "pattern2"],
  "technologies": ["tech1", "tech2"],
  "architecture": "Brief architecture description"
}

Focus on:
- Main architectural components
- Design patterns used
- Technology stack
- Component relationships
- Overall architecture style`;

    const response = await this.gemini!.generateText(prompt);
    return JSON.parse(this.extractJSONFromResponse(response));
  }

  private extractJSONFromResponse(response: string): string {
    const jsonRegex1 = /```(?:json)?\n?([\s\S]*?)\n?```/;
    const jsonRegex2 = /\{[\s\S]*\}/;

    const jsonMatch = jsonRegex1.exec(response) || jsonRegex2.exec(response);
    return jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
  }

  private patternBasedAPIExtraction(codebaseContext: string): any {
    const endpoints: any[] = [];
    const models: any[] = [];

    // Extract REST endpoints with simple patterns
    const routePatterns = [
      /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /@(Get|Post|Put|Delete|Patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ];

    routePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(codebaseContext)) !== null) {
        endpoints.push({
          path: match[2],
          method: match[1].toUpperCase(),
          description: `${match[1].toUpperCase()} endpoint for ${match[2]}`,
        });
      }
    });

    // Extract interfaces/models
    const interfacePattern = /interface\s+(\w+)\s*{([^}]+)}/gi;
    let match;
    while ((match = interfacePattern.exec(codebaseContext)) !== null) {
      const properties = this.extractInterfaceProperties(match[2]);
      if (properties.length > 0) {
        models.push({
          name: match[1],
          properties,
        });
      }
    }

    return { endpoints, models };
  }

  private patternBasedArchitectureAnalysis(codebaseContext: string): any {
    const components: any[] = [];
    const patterns: string[] = [];
    const technologies: string[] = [];

    // Detect components by file patterns
    const componentPatterns = [
      { pattern: /class\s+(\w+)Service/gi, type: "service" },
      { pattern: /class\s+(\w+)Controller/gi, type: "controller" },
      { pattern: /class\s+(\w+)Model/gi, type: "model" },
      { pattern: /class\s+(\w+)Repository/gi, type: "repository" },
      { pattern: /class\s+(\w+)Middleware/gi, type: "middleware" },
    ];

    componentPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(codebaseContext)) !== null) {
        components.push({
          name: match[1] + type.charAt(0).toUpperCase() + type.slice(1),
          type,
          dependencies: this.extractDependencies(match[0]),
          description: `${type} component for ${match[1]}`,
        });
      }
    });

    // Detect patterns - simplified to reduce complexity
    patterns.push(...this.detectArchitecturePatterns(codebaseContext));

    // Detect technologies
    const techPatterns = [
      { pattern: /import.*express/i, tech: "Express.js" },
      { pattern: /import.*react/i, tech: "React" },
      { pattern: /import.*vue/i, tech: "Vue.js" },
      { pattern: /import.*angular/i, tech: "Angular" },
      { pattern: /import.*typescript/i, tech: "TypeScript" },
      { pattern: /import.*mongoose/i, tech: "MongoDB" },
      { pattern: /import.*prisma/i, tech: "Prisma" },
      { pattern: /import.*sequelize/i, tech: "Sequelize" },
    ];

    techPatterns.forEach(({ pattern, tech }) => {
      if (pattern.test(codebaseContext) && !technologies.includes(tech)) {
        technologies.push(tech);
      }
    });

    return {
      components,
      patterns,
      technologies,
      architecture: this.determineArchitecture(patterns, technologies),
    };
  }

  private extractInterfaceProperties(
    interfaceBody: string,
  ): Array<{ name: string; type: string; description: string }> {
    const properties: Array<{
      name: string;
      type: string;
      description: string;
    }> = [];
    const propertyPattern = /(\w+)(\?)?:\s*([^;,\n]+)/g;

    let match;
    while ((match = propertyPattern.exec(interfaceBody)) !== null) {
      properties.push({
        name: match[1],
        type: match[3].trim(),
        description: `Property ${match[1]} of type ${match[3].trim()}`,
      });
    }

    return properties;
  }

  private extractDependencies(classDefinition: string): string[] {
    const dependencies: string[] = [];
    const importPattern = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;

    let match;
    while ((match = importPattern.exec(classDefinition)) !== null) {
      if (!match[1].startsWith(".") && !match[1].startsWith("/")) {
        dependencies.push(match[1]);
      }
    }

    return dependencies;
  }

  private detectArchitecturePatterns(codebaseContext: string): string[] {
    const patterns: string[] = [];

    // Simplified pattern detection
    const patternChecks = [
      { pattern: /class\s+\w+Factory/i, name: "Factory Pattern" },
      { pattern: /class\s+\w+Singleton/i, name: "Singleton Pattern" },
      { pattern: /class\s+\w+Observer/i, name: "Observer Pattern" },
      { pattern: /class\s+\w+Strategy/i, name: "Strategy Pattern" },
      { pattern: /class\s+\w+Builder/i, name: "Builder Pattern" },
      { pattern: /Repository/i, name: "Repository Pattern" },
      { pattern: /Service/i, name: "Service Layer Pattern" },
      { pattern: /Middleware/i, name: "Middleware Pattern" },
    ];

    patternChecks.forEach(({ pattern, name }) => {
      if (pattern.test(codebaseContext)) {
        patterns.push(name);
      }
    });

    return [...new Set(patterns)]; // Remove duplicates
  }

  private determineArchitecture(
    patterns: string[],
    technologies: string[],
  ): string {
    if (
      technologies.includes("Express.js") ||
      technologies.includes("Node.js")
    ) {
      return "Node.js/Express Backend Architecture";
    }
    if (technologies.includes("React")) {
      return "React Frontend Architecture";
    }
    if (technologies.includes("Vue.js")) {
      return "Vue.js Frontend Architecture";
    }
    if (technologies.includes("Angular")) {
      return "Angular Frontend Architecture";
    }
    return "Custom Architecture";
  }
}
