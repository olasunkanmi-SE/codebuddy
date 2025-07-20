import {
  IPatternExtractionService,
  APIEndpoint,
  ComponentInfo,
  DetectedPattern,
  Parameter,
  Response,
} from "../interfaces/documentation.interface";
import { DocumentationConfigService } from "./documentation-config.service";

/**
 * Pattern-based extraction service
 * Handles code analysis using regular expressions and pattern matching
 */
export class PatternExtractionService implements IPatternExtractionService {
  private static instance: PatternExtractionService;
  private readonly configService: DocumentationConfigService;

  private constructor() {
    this.configService = DocumentationConfigService.getInstance();
  }

  public static getInstance(): PatternExtractionService {
    if (!PatternExtractionService.instance) {
      PatternExtractionService.instance = new PatternExtractionService();
    }
    return PatternExtractionService.instance;
  }

  /**
   * Extract API endpoints from code content
   */
  public async extractAPIEndpoints(content: string): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = [];
    const patterns = this.configService.getAPIPatterns();

    for (const pattern of patterns) {
      pattern.lastIndex = 0; // Reset regex state
      let match;

      while ((match = pattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2] || "/";

        // Skip duplicates
        if (endpoints.some((ep) => ep.method === method && ep.path === path)) {
          continue;
        }

        const endpoint: APIEndpoint = {
          method,
          path,
          description: this.generateEndpointDescription(method, path),
          parameters: this.extractParametersFromPath(path),
          responses: this.generateDefaultResponses(),
        };

        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  /**
   * Extract component information from code content
   */
  public async extractComponents(content: string): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    const patterns = this.configService.getComponentPatterns();

    for (const pattern of patterns) {
      pattern.lastIndex = 0; // Reset regex state
      let match;

      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const type = this.determineComponentType(pattern, name);

        // Skip duplicates
        if (
          components.some((comp) => comp.name === name && comp.type === type)
        ) {
          continue;
        }

        const component: ComponentInfo = {
          name,
          type,
          description: `${type} component: ${name}`,
          methods: await this.extractMethods(content, name),
          properties: await this.extractProperties(content, name),
        };

        components.push(component);
      }
    }

    return components;
  }

  /**
   * Extract architecture patterns from code content
   */
  public async extractArchitecturePatterns(
    content: string,
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    const patternDefinitions = [
      {
        name: "Singleton Pattern",
        regex: /class\s+\w+.*{[^}]*static\s+instance[^}]*}/gi,
        confidence: 0.8,
      },
      {
        name: "Factory Pattern",
        regex: /class\s+\w*Factory/gi,
        confidence: 0.7,
      },
      {
        name: "Observer Pattern",
        regex: /class\s+\w*Observer|addEventListener|on\w+/gi,
        confidence: 0.6,
      },
      {
        name: "Repository Pattern",
        regex: /class\s+\w*Repository/gi,
        confidence: 0.8,
      },
      {
        name: "Service Layer Pattern",
        regex: /class\s+\w*Service/gi,
        confidence: 0.7,
      },
      {
        name: "Middleware Pattern",
        regex: /middleware|app\.use\(|\.use\(/gi,
        confidence: 0.6,
      },
      {
        name: "MVC Pattern",
        regex: /class\s+\w*Controller.*class\s+\w*Model|Model.*Controller/gi,
        confidence: 0.8,
      },
    ];

    for (const patternDef of patternDefinitions) {
      patternDef.regex.lastIndex = 0; // Reset regex state
      const matches = content.match(patternDef.regex);

      if (matches && matches.length > 0) {
        patterns.push({
          name: patternDef.name,
          confidence: patternDef.confidence,
          files: [], // Would be populated with actual file paths in real usage
          description: `Detected ${patternDef.name} with ${matches.length} occurrences`,
        });
      }
    }

    return patterns;
  }

  /**
   * Extract parameters from API path
   */
  private extractParametersFromPath(path: string): Parameter[] {
    const parameters: Parameter[] = [];
    const pathParamRegex = /:(\w+)/g;
    let match;

    while ((match = pathParamRegex.exec(path)) !== null) {
      parameters.push({
        name: match[1],
        type: "string",
        required: true,
        description: `Path parameter: ${match[1]}`,
      });
    }

    // Extract query parameters from common patterns
    if (path.includes("?")) {
      const queryPart = path.split("?")[1];
      const queryParams = queryPart.split("&");

      for (const param of queryParams) {
        const [key] = param.split("=");
        if (key && !parameters.some((p) => p.name === key)) {
          parameters.push({
            name: key,
            type: "string",
            required: false,
            description: `Query parameter: ${key}`,
          });
        }
      }
    }

    return parameters;
  }

  /**
   * Generate default HTTP responses
   */
  private generateDefaultResponses(): Response[] {
    return [
      { status: 200, description: "Success" },
      { status: 400, description: "Bad Request" },
      { status: 401, description: "Unauthorized" },
      { status: 404, description: "Not Found" },
      { status: 500, description: "Internal Server Error" },
    ];
  }

  /**
   * Generate endpoint description
   */
  private generateEndpointDescription(method: string, path: string): string {
    const action = this.getActionFromMethod(method);
    const resource = this.getResourceFromPath(path);
    return `${action} ${resource}`;
  }

  /**
   * Get action verb from HTTP method
   */
  private getActionFromMethod(method: string): string {
    const actionMap: Record<string, string> = {
      GET: "Retrieve",
      POST: "Create",
      PUT: "Update",
      PATCH: "Partially update",
      DELETE: "Delete",
    };
    return actionMap[method] || "Process";
  }

  /**
   * Extract resource name from path
   */
  private getResourceFromPath(path: string): string {
    const parts = path
      .split("/")
      .filter((part) => part && !part.startsWith(":"));
    const lastPart = parts[parts.length - 1];
    return lastPart || "resource";
  }

  /**
   * Determine component type from pattern
   */
  private determineComponentType(pattern: RegExp, name: string): string {
    const patternStr = pattern.source.toLowerCase();

    if (patternStr.includes("service")) return "service";
    if (patternStr.includes("controller")) return "controller";
    if (patternStr.includes("model")) return "model";
    if (patternStr.includes("repository")) return "repository";
    if (patternStr.includes("middleware")) return "middleware";
    if (patternStr.includes("interface")) return "interface";
    if (patternStr.includes("function")) return "function";

    return "component";
  }

  /**
   * Extract methods from component
   */
  private async extractMethods(
    content: string,
    componentName: string,
  ): Promise<any[]> {
    const methods: any[] = [];
    const methodRegex = new RegExp(
      `class\\s+${componentName}[^{]*{([^}]*)}`,
      "gi",
    );
    const match = methodRegex.exec(content);

    if (match) {
      const classContent = match[1];
      const methodMatches = classContent.match(/(\w+)\s*\([^)]*\)\s*{/g);

      if (methodMatches) {
        for (const methodMatch of methodMatches) {
          const methodRegex = /(\w+)\s*\(/;
          const methodNameMatch = methodRegex.exec(methodMatch);
          const methodName = methodNameMatch?.[1];
          if (methodName && methodName !== "constructor") {
            methods.push({
              name: methodName,
              parameters: [],
              returnType: "unknown",
              description: `Method ${methodName} of ${componentName}`,
            });
          }
        }
      }
    }

    return methods;
  }

  /**
   * Extract properties from component
   */
  private async extractProperties(
    content: string,
    componentName: string,
  ): Promise<any[]> {
    const properties: any[] = [];
    const propertyRegex = new RegExp(
      `class\\s+${componentName}[^{]*{([^}]*)}`,
      "gi",
    );
    const match = propertyRegex.exec(content);

    if (match) {
      const classContent = match[1];
      const propertyMatches = classContent.match(
        /(?:private|public|protected)?\s*(\w+)\s*:/g,
      );

      if (propertyMatches) {
        for (const propertyMatch of propertyMatches) {
          const propertyRegex = /(\w+)\s*:/;
          const propertyNameMatch = propertyRegex.exec(propertyMatch);
          const propertyName = propertyNameMatch?.[1];
          if (propertyName) {
            properties.push({
              name: propertyName,
              type: "unknown",
              description: `Property ${propertyName} of ${componentName}`,
            });
          }
        }
      }
    }

    return properties;
  }
}
