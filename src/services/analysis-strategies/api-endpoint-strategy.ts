import { BaseAnalysisStrategy } from "./base-analysis-strategy";
import * as ts from "typescript";

interface IApiEndpoint {
  method: string;
  path: string;
  handler: string;
  file: string;
  parameters?: string[];
  returnType?: string;
}

export class ApiEndpointStrategy extends BaseAnalysisStrategy {
  constructor() {
    super("ApiEndpoint");
  }

  async analyze(files: string[]): Promise<IApiEndpoint[]> {
    this.logger.info("Starting API endpoint analysis...");

    const endpoints: IApiEndpoint[] = [];
    const relevantFiles = this.filterRelevantFiles(files);

    // Process files in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize);
      const batchEndpoints = await Promise.all(
        batch.map((file) => this.analyzeFileForEndpoints(file)),
      );
      endpoints.push(...batchEndpoints.flat());
    }

    this.logger.info(`Found ${endpoints.length} API endpoints`);
    return endpoints;
  }

  private filterRelevantFiles(files: string[]): string[] {
    const patterns = [/controller/i, /route/i, /api/i, /endpoint/i, /handler/i];

    const extensions = [".ts", ".js", ".tsx", ".jsx"];

    return files.filter((file) => {
      const hasRelevantExtension = extensions.some((ext) => file.endsWith(ext));
      const hasRelevantPattern = patterns.some((pattern) => pattern.test(file));
      const isNotTest = !file.includes("test") && !file.includes("spec");

      return hasRelevantExtension && hasRelevantPattern && isNotTest;
    });
  }

  private async analyzeFileForEndpoints(
    filePath: string,
  ): Promise<IApiEndpoint[]> {
    const content = await this.readFileContent(filePath);
    if (!content) {
      return [];
    }

    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      const endpoints: IApiEndpoint[] = [];
      this.visitNodeForEndpoints(sourceFile, endpoints, filePath);

      return endpoints;
    } catch (error: any) {
      this.logger.warn(`Failed to parse TypeScript file ${filePath}`, error);
      return this.fallbackTextAnalysis(content, filePath);
    }
  }

  private visitNodeForEndpoints(
    node: ts.Node,
    endpoints: IApiEndpoint[],
    filePath: string,
  ): void {
    // Look for HTTP method decorators
    if (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) {
      const decorators = ts.getDecorators(node);
      if (decorators) {
        for (const decorator of decorators) {
          const endpoint = this.extractEndpointFromDecorator(
            decorator,
            node,
            filePath,
          );
          if (endpoint) {
            endpoints.push(endpoint);
          }
        }
      }
    }

    // Look for Express-style routing
    if (ts.isCallExpression(node)) {
      const endpoint = this.extractExpressEndpoint(node, filePath);
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }

    ts.forEachChild(node, (child) =>
      this.visitNodeForEndpoints(child, endpoints, filePath),
    );
  }

  private extractEndpointFromDecorator(
    decorator: ts.Decorator,
    node: ts.Node,
    filePath: string,
  ): IApiEndpoint | null {
    if (!ts.isCallExpression(decorator.expression)) {
      return null;
    }

    const decoratorName = decorator.expression.expression.getText();
    const httpMethods = [
      "Get",
      "Post",
      "Put",
      "Delete",
      "Patch",
      "Options",
      "Head",
    ];

    if (!httpMethods.includes(decoratorName)) {
      return null;
    }

    const args = decorator.expression.arguments;
    const path = args.length > 0 ? args[0].getText().replace(/['"]/g, "") : "";

    const methodName = ts.isMethodDeclaration(node)
      ? node.name?.getText() || "unknown"
      : "unknown";

    return {
      method: decoratorName.toUpperCase(),
      path,
      handler: methodName,
      file: filePath,
      parameters: this.extractParameters(node),
      returnType: this.extractReturnType(node),
    };
  }

  private extractExpressEndpoint(
    node: ts.CallExpression,
    filePath: string,
  ): IApiEndpoint | null {
    const expression = node.expression;

    if (!ts.isPropertyAccessExpression(expression)) {
      return null;
    }

    const method = expression.name.getText();
    const httpMethods = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
    ];

    if (!httpMethods.includes(method.toLowerCase())) {
      return null;
    }

    const args = node.arguments;
    if (args.length === 0) {
      return null;
    }

    const path = args[0].getText().replace(/['"]/g, "");
    const handler = args.length > 1 ? args[1].getText() : "anonymous";

    return {
      method: method.toUpperCase(),
      path,
      handler,
      file: filePath,
    };
  }

  private extractParameters(node: ts.Node): string[] {
    if (!ts.isMethodDeclaration(node)) {
      return [];
    }

    return node.parameters.map((param) => {
      const type = param.type ? param.type.getText() : "any";
      return `${param.name.getText()}: ${type}`;
    });
  }

  private extractReturnType(node: ts.Node): string {
    if (!ts.isMethodDeclaration(node)) {
      return "void";
    }

    return node.type ? node.type.getText() : "void";
  }

  private fallbackTextAnalysis(
    content: string,
    filePath: string,
  ): IApiEndpoint[] {
    const endpoints: IApiEndpoint[] = [];
    const lines = content.split("\n");

    // Simple regex patterns for common endpoint patterns
    const patterns = [
      /@(Get|Post|Put|Delete|Patch)\(['"]([^'"]*)['"]\)/gi,
      /\.(get|post|put|delete|patch)\(['"]([^'"]*)['"]\)/gi,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          endpoints.push({
            method: match[1].toUpperCase(),
            path: match[2],
            handler: `line_${i + 1}`,
            file: filePath,
          });
        }
      }
    }

    return endpoints;
  }
}
