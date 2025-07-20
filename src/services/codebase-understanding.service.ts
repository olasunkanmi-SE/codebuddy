import * as vscode from "vscode";
import * as ts from "typescript";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";
import { WorkspaceService } from "./workspace-service";
import { CodebaseAnalysisCache } from "./codebase-analysis-cache";
import {
  AnalysisStrategyFactory,
  AnalysisType,
} from "./analysis-strategies/analysis-strategy-factory";

interface IApiEndpoint {
  method: string;
  path: string;
  handler: string;
  file: string;
  parameters?: string[];
  returnType?: string;
}

interface IDataModel {
  name: string;
  file: string;
  properties: { name: string; type: string; optional: boolean }[];
  relationships: string[];
  decorators: string[];
}

interface IDatabaseSchema {
  tables: { name: string; columns: string[]; file: string }[];
  relationships: { from: string; to: string; type: string }[];
  migrations: string[];
}

interface ICodebaseAnalysis {
  frameworks: string[];
  dependencies: Record<string, string>;
  files: string[];
  apiEndpoints: IApiEndpoint[];
  dataModels: IDataModel[];
  databaseSchema: IDatabaseSchema;
  domainRelationships: { entity: string; relatedEntities: string[] }[];
}

export class CodebaseUnderstandingService {
  private static instance: CodebaseUnderstandingService;
  private readonly logger: Logger;
  private readonly workspaceService: WorkspaceService;
  private readonly cache: CodebaseAnalysisCache;
  private readonly fileReferenceIndex: Map<string, number> = new Map();
  private fileReferenceCounter: number = 0;
  private isWebviewMode: boolean = true;

  private constructor() {
    this.logger = Logger.initialize("CodebaseUnderstandingService", {
      minLevel: LogLevel.DEBUG,
    });
    this.workspaceService = WorkspaceService.getInstance();
    this.cache = CodebaseAnalysisCache.getInstance();
  }

  public static getInstance(): CodebaseUnderstandingService {
    if (!CodebaseUnderstandingService.instance) {
      CodebaseUnderstandingService.instance =
        new CodebaseUnderstandingService();
    }
    return CodebaseUnderstandingService.instance;
  }

  public async analyzeWorkspace(): Promise<ICodebaseAnalysis | null> {
    this.logger.info("Starting comprehensive workspace analysis...");

    // Check cache first
    const cacheKey = "workspace-analysis";
    const cachedResult = await this.cache.get<ICodebaseAnalysis>(cacheKey);
    if (cachedResult) {
      this.logger.info("Returning cached workspace analysis");
      return cachedResult;
    }

    const packageJsonPath = await this.findFile("package.json");
    let dependencies: Record<string, string> = {};

    if (packageJsonPath) {
      try {
        const packageJsonContent =
          await vscode.workspace.fs.readFile(packageJsonPath);
        const packageJsonString =
          Buffer.from(packageJsonContent).toString("utf8");
        const packageJson = JSON.parse(packageJsonString);
        dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
      } catch (error) {
        this.logger.error("Error parsing package.json", error);
      }
    } else {
      this.logger.warn("Could not find package.json in the workspace.");
    }

    const frameworks = this.identifyFrameworks(dependencies);
    const allFiles =
      (await this.workspaceService.getAllFiles())?.map(
        (file: vscode.Uri) => file.fsPath,
      ) || [];

    // Advanced analysis using strategy pattern
    this.logger.info("Performing AST analysis for API endpoints...");
    const apiStrategy = AnalysisStrategyFactory.getStrategy(
      AnalysisType.API_ENDPOINTS,
    );
    const apiEndpoints = await apiStrategy.analyze(allFiles);

    this.logger.info("Analyzing data models and relationships...");
    const modelStrategy = AnalysisStrategyFactory.getStrategy(
      AnalysisType.DATA_MODELS,
    );
    const dataModels = await modelStrategy.analyze(allFiles);

    this.logger.info("Introspecting database schema...");
    const databaseSchema = await this.introspectDatabaseSchema(allFiles);

    this.logger.info("Mapping domain relationships...");
    const domainRelationships = await this.mapDomainRelationships(dataModels);

    this.logger.info(
      `Analysis complete. Found ${frameworks.length} frameworks, ${apiEndpoints.length} endpoints, ${dataModels.length} models`,
    );

    const result = {
      frameworks,
      dependencies,
      files: allFiles,
      apiEndpoints,
      dataModels,
      databaseSchema,
      domainRelationships,
    };

    // Cache the result for 30 minutes
    await this.cache.set(cacheKey, result, 30 * 60 * 1000, true);

    return result;
  }

  private identifyFrameworks(dependencies: Record<string, string>): string[] {
    const frameworks: string[] = [];
    if (dependencies["@nestjs/core"]) frameworks.push("NestJS");
    if (dependencies["express"]) frameworks.push("Express");
    if (dependencies["react"]) frameworks.push("React");
    if (dependencies["@angular/core"]) frameworks.push("Angular");
    if (dependencies["vue"]) frameworks.push("Vue");
    if (dependencies["next"]) frameworks.push("Next.js");
    if (dependencies["@sveltejs/kit"]) frameworks.push("SvelteKit");
    return frameworks;
  }

  private async findFile(fileName: string): Promise<vscode.Uri | undefined> {
    const files = await vscode.workspace.findFiles(
      `**/${fileName}`,
      "**/node_modules/**",
      1,
    );
    return files.length > 0 ? files[0] : undefined;
  }

  /**
   * Helper method to read file content from file path string
   */
  private async readFileContent(filePath: string): Promise<string> {
    try {
      const fileUri = vscode.Uri.file(filePath);
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      return Buffer.from(fileContent).toString("utf8");
    } catch (error) {
      this.logger.debug(`Could not read file: ${filePath}`, error);
      throw error;
    }
  }

  public async getCodebaseContext(isWebview: boolean = true): Promise<string> {
    // Reset file reference tracking for each analysis
    this.fileReferenceIndex.clear();
    this.fileReferenceCounter = 0;
    this.isWebviewMode = isWebview;

    const analysis = await this.analyzeWorkspace();

    if (!analysis) {
      return "Could not analyze the codebase.";
    }

    const allFiles =
      (await this.workspaceService.getAllFiles())?.map(
        (file: vscode.Uri) => file.fsPath,
      ) || [];

    return await this.formatComprehensiveContext(analysis, allFiles);
  }

  private async formatComprehensiveContext(
    analysis: any,
    files: string[],
  ): Promise<string> {
    const authAnalysis = await this.formatAuthenticationAnalysis(
      files,
      analysis,
    );
    const configAnalysis = await this.formatConfigurationAnalysis(files);
    const codePatterns = await this.formatCodePatterns(files, analysis);

    return `
## Comprehensive Codebase Analysis

### 🏗️ **Architecture & Technology Stack**
${this.formatTechnologies(analysis)}

### 🔐 **Authentication & Security Patterns**
${authAnalysis}

### 🛣️ **API Endpoints & Routes**
${this.formatApiEndpoints(analysis.apiEndpoints)}

### 💾 **Data Models & Database Schema**
${this.formatDataModels(analysis.dataModels)}
${this.formatDatabaseSchema(analysis.databaseSchema)}

### 🔗 **Domain Relationships**
${this.formatDomainRelationships(analysis.domainRelationships)}

### 📁 **File Structure & Organization**
${this.formatFileStructure(analysis)}

### ⚙️ **Configuration & Environment**
${configAnalysis}

### 🧩 **Key Patterns & Conventions**
${codePatterns}

### 📦 **Dependencies & External Services**
${this.formatDependencyAnalysis(analysis)}

${this.formatFileReferenceIndex()}
    `.trim();
  }

  private formatTechnologies(analysis: any): string {
    const frameworks = analysis.frameworks || [];
    const dependencies = analysis.dependencies || {};

    let result = `**Detected Frameworks**: ${frameworks.join(", ")}\n`;
    result += `**Key Dependencies**: ${Object.keys(dependencies).slice(0, 10).join(", ")}\n`;

    return result;
  }

  private async formatAuthenticationAnalysis(
    files: string[],
    analysis: any,
  ): Promise<string> {
    const authPatterns = await this.analyzeAuthenticationPatterns(files);
    const securityPatterns = await this.analyzeSecurityPatterns(files);

    let result = "";

    if (authPatterns.length > 0) {
      result += "**Authentication Methods Found**:\n";
      result += authPatterns.map((pattern) => `- ${pattern}`).join("\n") + "\n";
    }

    if (securityPatterns.length > 0) {
      result += "**Security Patterns**:\n";
      result +=
        securityPatterns.map((pattern) => `- ${pattern}`).join("\n") + "\n";
    }

    if (!authPatterns.length && !securityPatterns.length) {
      result = "No explicit authentication patterns detected in codebase\n";
    }

    return result;
  }

  private formatApiEndpoints(endpoints: any[]): string {
    if (!endpoints || endpoints.length === 0) {
      return "No API endpoints detected\n";
    }

    return (
      endpoints
        .map((endpoint, index) => {
          const fileReference = this.createFileReference(
            endpoint.file,
            this.isWebviewMode,
          );
          return `- ${endpoint.method} ${endpoint.path} → ${endpoint.handler} ${fileReference}`;
        })
        .join("\n") + "\n"
    );
  }

  private formatDataModels(models: any[]): string {
    if (!models || models.length === 0) {
      return "**Data Models**: No explicit data models detected\n";
    }

    let result = "**Data Models**:\n";
    models.forEach((model, index) => {
      const properties = model.properties
        .map((p: any) => `${p.name}: ${p.type}`)
        .join(", ");

      // Create clickable file reference
      const fileReference = this.createFileReference(
        model.file,
        this.isWebviewMode,
      );

      result += `- **${model.name}**: ${properties} ${fileReference}\n`;
      if (model.relationships.length > 0) {
        result += `  - Relationships: ${model.relationships.join(", ")}\n`;
      }
    });

    return result;
  }

  private createFileReference(
    filePath: string,
    isWebview: boolean = true,
  ): string {
    if (!filePath) return "";

    // Use global indexing for consistent reference numbers
    if (!this.fileReferenceIndex.has(filePath)) {
      this.fileReferenceCounter++;
      this.fileReferenceIndex.set(filePath, this.fileReferenceCounter);
    }

    const index = this.fileReferenceIndex.get(filePath)!;
    const workspaceRelativePath = this.getWorkspaceRelativePath(filePath);

    if (isWebview) {
      // Use VS Code command URI for webview compatibility
      const encodedPath = encodeURIComponent(filePath);
      const commandUri = `command:vscode.open?${encodedPath}`;
      return `[[${index}]](${commandUri} "Click to open ${workspaceRelativePath}")`;
    } else {
      // Use direct file URI for command palette/panels
      return `[[${index}]](vscode://file/${filePath} "Click to open ${workspaceRelativePath}")`;
    }
  }

  private getWorkspaceRelativePath(filePath: string): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return filePath;

    for (const folder of workspaceFolders) {
      if (filePath.startsWith(folder.uri.fsPath)) {
        return filePath.replace(folder.uri.fsPath, "").replace(/^\//, "");
      }
    }

    return filePath;
  }

  private formatFileReferenceIndex(): string {
    if (this.fileReferenceIndex.size === 0) {
      return "";
    }

    let result = "\n### 📄 **File References**\n";
    result +=
      "Click on any [[number]] reference above to navigate directly to the source file:\n\n";

    // Sort by reference number
    const sortedRefs = Array.from(this.fileReferenceIndex.entries()).sort(
      (a, b) => a[1] - b[1],
    );

    sortedRefs.forEach(([filePath, index]) => {
      const relativePath = this.getWorkspaceRelativePath(filePath);
      result += `[[${index}]] ${relativePath}\n`;
    });

    return result;
  }

  private formatDatabaseSchema(schema: any): string {
    if (!schema || schema.tables.length === 0) {
      return "**Database Schema**: No database schema detected\n";
    }

    let result = "**Database Schema**:\n";

    // Format tables with file references
    if (schema.tables && schema.tables.length > 0) {
      result += "- **Tables**:\n";
      schema.tables.forEach((table: any, index: number) => {
        const fileReference = table.file
          ? this.createFileReference(table.file, this.isWebviewMode)
          : "";
        result += `  - ${table.name}: [${table.columns.join(", ")}] ${fileReference}\n`;
      });
    }

    result += `- **Migration files**: ${schema.migrations.length}\n`;

    return result;
  }

  private formatDomainRelationships(relationships: any[]): string {
    if (!relationships || relationships.length === 0) {
      return "No explicit domain relationships detected\n";
    }

    return (
      relationships
        .map((rel) => `- ${rel.entity} → [${rel.relatedEntities.join(", ")}]`)
        .join("\n") + "\n"
    );
  }

  private formatFileStructure(analysis: any): string {
    const files = analysis.files || [];
    const structureFiles = files
      .filter(
        (f: any) =>
          !f.includes("node_modules") &&
          !f.includes(".git") &&
          (f.includes("src/") ||
            f.includes("lib/") ||
            f.includes("app/") ||
            f.includes("controllers/")),
      )
      .slice(0, 20);

    const fileList = structureFiles.map((f: any) => `- ${f}`).join("\n");
    return fileList + "\n";
  }

  private async formatConfigurationAnalysis(files: string[]): Promise<string> {
    const configPatterns = await this.analyzeConfigurationPatterns(files);
    const envPatterns = await this.analyzeEnvironmentPatterns(files);

    let result = "";

    if (configPatterns.length > 0) {
      result += "**Configuration Files**:\n";
      result +=
        configPatterns.map((pattern) => `- ${pattern}`).join("\n") + "\n";
    }

    if (envPatterns.length > 0) {
      result += "**Environment Configuration**:\n";
      result += envPatterns.map((pattern) => `- ${pattern}`).join("\n") + "\n";
    }

    return result || "No specific configuration patterns detected\n";
  }

  private async formatCodePatterns(
    files: string[],
    analysis: any,
  ): Promise<string> {
    const patterns = await this.analyzeCodePatterns(files);

    if (patterns.length === 0) {
      return "No specific code patterns detected\n";
    }

    return patterns.map((pattern) => `- ${pattern}`).join("\n") + "\n";
  }

  private formatDependencyAnalysis(analysis: any): string {
    const dependencies = analysis.dependencies || {};
    const keyDeps = Object.keys(dependencies);

    let result = `**Total Dependencies**: ${keyDeps.length}\n`;

    // Categorize dependencies
    const webFrameworks = keyDeps.filter((dep) =>
      ["express", "fastify", "koa", "nestjs", "next", "nuxt", "sveltekit"].some(
        (fw) => dep.includes(fw),
      ),
    );

    const databases = keyDeps.filter((dep) =>
      [
        "prisma",
        "typeorm",
        "sequelize",
        "mongoose",
        "knex",
        "pg",
        "mysql",
        "sqlite",
      ].some((db) => dep.includes(db)),
    );

    const auth = keyDeps.filter((dep) =>
      ["passport", "jwt", "auth", "oauth", "bcrypt", "crypto"].some((a) =>
        dep.includes(a),
      ),
    );

    if (webFrameworks.length > 0) {
      result += `**Web Frameworks**: ${webFrameworks.join(", ")}\n`;
    }

    if (databases.length > 0) {
      result += `**Database/ORM**: ${databases.join(", ")}\n`;
    }

    if (auth.length > 0) {
      result += `**Authentication/Security**: ${auth.join(", ")}\n`;
    }

    return result;
  }

  private async analyzeModelFiles(files: string[]): Promise<string[]> {
    const modelRegex = /\/(models|entities|schemas)\//i;
    const modelFiles = files.filter(
      (f) =>
        f.includes("model") ||
        f.includes("entity") ||
        f.includes("schema") ||
        modelRegex.test(f),
    );

    const models: string[] = [];
    for (const file of modelFiles.slice(0, 10)) {
      // Limit to avoid overwhelming context
      try {
        const content = await this.readFileContent(file);
        // Extract class/interface names that might be models
        const classMatches = content.match(/(?:class|interface|type)\s+(\w+)/g);
        if (classMatches) {
          models.push(`- ${file}: ${classMatches.slice(0, 3).join(", ")}`);
        }
      } catch (error) {
        this.logger.debug(`Could not read model file: ${file}`, error);
      }
    }
    return models;
  }

  private async analyzeRouteFiles(files: string[]): Promise<string[]> {
    const routeRegex = /\/(routes|controllers|api)\//i;
    const routeFiles = files.filter(
      (f) =>
        f.includes("route") ||
        f.includes("controller") ||
        f.includes("api") ||
        routeRegex.test(f),
    );

    const routes: string[] = [];
    for (const file of routeFiles.slice(0, 10)) {
      try {
        const content = await this.readFileContent(file);
        // Extract HTTP method patterns - simplified regex
        const getMatches = content.match(/@Get\(['"]([^'"]*)['"]\)/gi) || [];
        const postMatches = content.match(/@Post\(['"]([^'"]*)['"]\)/gi) || [];
        const routerMatches =
          content.match(
            /router\.(get|post|put|delete)\(['"]([^'"]*)['"]\)/gi,
          ) || [];

        const allMatches = [...getMatches, ...postMatches, ...routerMatches];
        if (allMatches.length > 0) {
          routes.push(`- ${file}: ${allMatches.slice(0, 5).join(", ")}`);
        }
      } catch (error) {
        this.logger.debug(`Could not read route file: ${file}`, error);
      }
    }
    return routes;
  }

  private async analyzeConfigFiles(files: string[]): Promise<string[]> {
    const configFiles = files.filter(
      (f) =>
        f.includes("config") ||
        f.includes(".env") ||
        f.includes("database") ||
        f.endsWith("package.json"),
    );

    return configFiles.slice(0, 5).map((f) => `- ${f}`);
  }

  /**
   * AST-based API endpoint discovery
   */
  private async discoverApiEndpoints(files: string[]): Promise<IApiEndpoint[]> {
    const endpoints: IApiEndpoint[] = [];
    const tsFiles = files.filter(
      (f) => f.endsWith(".ts") && !f.includes("node_modules"),
    );

    for (const file of tsFiles) {
      try {
        const content = await this.readFileContent(file);
        const sourceFile = ts.createSourceFile(
          file,
          content,
          ts.ScriptTarget.Latest,
          true,
        );

        ts.forEachChild(sourceFile, (node) => {
          this.extractEndpointsFromNode(node, file, endpoints);
        });
      } catch (error) {
        this.logger.debug(`Could not parse TypeScript file: ${file}`, error);
      }
    }

    return endpoints;
  }

  private extractEndpointsFromNode(
    node: ts.Node,
    file: string,
    endpoints: IApiEndpoint[],
  ): void {
    this.extractNestJSEndpoints(node, file, endpoints);
    this.extractExpressEndpoints(node, file, endpoints);

    // Recursively check child nodes
    ts.forEachChild(node, (child) => {
      this.extractEndpointsFromNode(child, file, endpoints);
    });
  }

  private extractNestJSEndpoints(
    node: ts.Node,
    file: string,
    endpoints: IApiEndpoint[],
  ): void {
    if (!ts.isMethodDeclaration(node) || !ts.canHaveDecorators(node)) return;

    const decorators = ts.getDecorators(node);
    if (!decorators) return;

    for (const decorator of decorators) {
      this.processHttpDecorator(decorator, node, file, endpoints);
    }
  }

  private processHttpDecorator(
    decorator: ts.Decorator,
    node: ts.MethodDeclaration,
    file: string,
    endpoints: IApiEndpoint[],
  ): void {
    if (!ts.isCallExpression(decorator.expression)) return;

    const decoratorName = this.getDecoratorName(decorator.expression);
    const httpMethods = ["Get", "Post", "Put", "Delete", "Patch"];

    if (httpMethods.includes(decoratorName)) {
      const path = this.extractRoutePathFromDecorator(decorator.expression);
      const methodName = node.name?.getText() || "unknown";
      const parameters = this.extractMethodParameters(node);
      const returnType = this.extractReturnType(node);

      endpoints.push({
        method: decoratorName.toUpperCase(),
        path: path || "/",
        handler: methodName,
        file,
        parameters,
        returnType,
      });
    }
  }

  private extractExpressEndpoints(
    node: ts.Node,
    file: string,
    endpoints: IApiEndpoint[],
  ): void {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isPropertyAccessExpression(expression)) {
        const methodName = expression.name.text;
        const httpMethods = ["get", "post", "put", "delete", "patch"];

        if (httpMethods.includes(methodName) && node.arguments.length >= 2) {
          const pathArg = node.arguments[0];
          let path = "/";

          if (ts.isStringLiteral(pathArg)) {
            path = pathArg.text;
          }

          endpoints.push({
            method: methodName.toUpperCase(),
            path,
            handler: "express-handler",
            file,
            parameters: [],
          });
        }
      }
    }
  }

  private getDecoratorName(expression: ts.CallExpression): string {
    if (ts.isIdentifier(expression.expression)) {
      return expression.expression.text;
    }
    return "";
  }

  private extractRoutePathFromDecorator(expression: ts.CallExpression): string {
    if (expression.arguments.length > 0) {
      const firstArg = expression.arguments[0];
      if (ts.isStringLiteral(firstArg)) {
        return firstArg.text;
      }
    }
    return "/";
  }

  private extractMethodParameters(node: ts.MethodDeclaration): string[] {
    return node.parameters.map((param) => {
      const name = param.name.getText();
      const type = param.type?.getText() || "any";
      return `${name}: ${type}`;
    });
  }

  private extractReturnType(node: ts.MethodDeclaration): string {
    return node.type?.getText() || "any";
  }

  /**
   * AST-based data model analysis
   */
  private async analyzeDataModels(files: string[]): Promise<IDataModel[]> {
    const models: IDataModel[] = [];
    const modelFiles = files.filter(
      (f) =>
        f.includes("model") ||
        f.includes("entity") ||
        f.includes("dto") ||
        f.includes("interface") ||
        f.endsWith(".entity.ts"),
    );

    for (const file of modelFiles) {
      try {
        const content = await this.readFileContent(file);
        const sourceFile = ts.createSourceFile(
          file,
          content,
          ts.ScriptTarget.Latest,
          true,
        );

        ts.forEachChild(sourceFile, (node) => {
          if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
            const model = this.extractDataModel(node, file);
            if (model) {
              models.push(model);
            }
          }
        });
      } catch (error) {
        this.logger.debug(`Could not parse model file: ${file}`, error);
      }
    }

    return models;
  }

  private extractDataModel(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration,
    file: string,
  ): IDataModel | null {
    if (!node.name) return null;

    const name = node.name.text;
    const properties: { name: string; type: string; optional: boolean }[] = [];
    const decorators: string[] = [];
    const relationships: string[] = [];

    // Extract decorators
    this.extractEntityDecorators(node, decorators);

    // Extract properties
    this.extractEntityProperties(node, properties, relationships);

    return {
      name,
      file,
      properties,
      relationships,
      decorators,
    };
  }

  private extractEntityDecorators(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration,
    decorators: string[],
  ): void {
    if (ts.canHaveDecorators(node)) {
      const nodeDecorators = ts.getDecorators(node);
      if (nodeDecorators) {
        for (const decorator of nodeDecorators) {
          if (
            ts.isCallExpression(decorator.expression) &&
            ts.isIdentifier(decorator.expression.expression)
          ) {
            decorators.push(decorator.expression.expression.text);
          }
        }
      }
    }
  }

  private extractEntityProperties(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration,
    properties: { name: string; type: string; optional: boolean }[],
    relationships: string[],
  ): void {
    if (node.members) {
      for (const member of node.members) {
        if (
          ts.isPropertyDeclaration(member) ||
          ts.isPropertySignature(member)
        ) {
          const propName = member.name?.getText() || "unknown";
          const propType = member.type?.getText() || "any";
          const optional = !!member.questionToken;

          properties.push({
            name: propName,
            type: propType,
            optional,
          });

          this.extractPropertyRelationships(member, propName, relationships);
        }
      }
    }
  }

  private extractPropertyRelationships(
    member: ts.PropertyDeclaration | ts.PropertySignature,
    propName: string,
    relationships: string[],
  ): void {
    if (!ts.canHaveDecorators(member)) return;

    const memberDecorators = ts.getDecorators(member);
    if (!memberDecorators) return;

    const relationshipDecorators = [
      "OneToMany",
      "ManyToOne",
      "OneToOne",
      "ManyToMany",
    ];

    for (const decorator of memberDecorators) {
      const decoratorName = this.getDecoratorNameFromDecorator(decorator);
      if (decoratorName && relationshipDecorators.includes(decoratorName)) {
        relationships.push(`${propName}: ${decoratorName}`);
      }
    }
  }

  private getDecoratorNameFromDecorator(
    decorator: ts.Decorator,
  ): string | null {
    if (
      ts.isCallExpression(decorator.expression) &&
      ts.isIdentifier(decorator.expression.expression)
    ) {
      return decorator.expression.expression.text;
    }
    return null;
  }

  /**
   * Database schema introspection
   */
  private async introspectDatabaseSchema(
    files: string[],
  ): Promise<IDatabaseSchema> {
    const schema: IDatabaseSchema = {
      tables: [],
      relationships: [],
      migrations: [],
    };

    // Look for migration files
    const migrationRegex = /\d+.*\.(ts|js|sql)$/i;
    const migrationFiles = files.filter(
      (f) =>
        f.includes("migration") ||
        f.includes("migrate") ||
        migrationRegex.exec(f),
    );
    schema.migrations = migrationFiles;

    // Look for Prisma schema files
    const prismaFiles = files.filter((f) => f.endsWith("schema.prisma"));
    for (const file of prismaFiles) {
      try {
        const content = await this.readFileContent(file);
        this.extractPrismaSchema(content, schema);
      } catch (error) {
        this.logger.debug(`Could not read Prisma schema: ${file}`, error);
      }
    }

    // Look for TypeORM entity files
    const entityFiles = files.filter(
      (f) => f.includes("entity") || f.endsWith(".entity.ts"),
    );
    for (const file of entityFiles) {
      try {
        const content = await this.readFileContent(file);
        this.extractTypeORMSchema(content, file, schema);
      } catch (error) {
        this.logger.debug(`Could not parse entity file: ${file}`, error);
      }
    }

    return schema;
  }

  private extractPrismaSchema(content: string, schema: IDatabaseSchema): void {
    const modelMatches = content.match(/model\s+(\w+)\s*{([^}]*)}/g);
    if (modelMatches) {
      for (const match of modelMatches) {
        const modelRegex = /model\s+(\w+)/;
        const modelMatch = modelRegex.exec(match);
        const modelName = modelMatch?.[1];
        if (modelName) {
          const columns = this.extractPrismaColumns(match);
          schema.tables.push({
            name: modelName,
            columns,
            file: "schema.prisma",
          });
        }
      }
    }
  }

  private extractPrismaColumns(modelContent: string): string[] {
    const lines = modelContent.split("\n");
    const columns: string[] = [];
    const columnRegex = /(\w+)\s+(\w+)/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith("model") &&
        !trimmed.startsWith("{") &&
        !trimmed.startsWith("}")
      ) {
        const columnMatch = columnRegex.exec(trimmed);
        if (columnMatch) {
          columns.push(`${columnMatch[1]}: ${columnMatch[2]}`);
        }
      }
    }

    return columns;
  }

  private extractTypeORMSchema(
    content: string,
    file: string,
    schema: IDatabaseSchema,
  ): void {
    const entityRegex = /@Entity\(['"]?(\w+)['"]?\)/;
    const entityMatch = entityRegex.exec(content);
    if (entityMatch) {
      const tableName = entityMatch[1];

      // Extract columns
      const columnMatches = content.match(/@Column\([^)]*\)[^;]*(\w+):/g);
      const columnRegex = /(\w+):$/;
      const columns =
        columnMatches?.map((match) => {
          const columnMatch = columnRegex.exec(match);
          return columnMatch?.[1] || "unknown";
        }) || [];

      schema.tables.push({
        name: tableName,
        columns,
        file,
      });
    }
  }

  /**
   * Domain relationship mapping
   */
  private async mapDomainRelationships(
    dataModels: IDataModel[],
  ): Promise<{ entity: string; relatedEntities: string[] }[]> {
    const relationships: { entity: string; relatedEntities: string[] }[] = [];

    for (const model of dataModels) {
      const relatedEntities = this.extractEntityRelationships(
        model,
        dataModels,
      );

      if (relatedEntities.length > 0) {
        relationships.push({
          entity: model.name,
          relatedEntities: [...new Set(relatedEntities)], // Remove duplicates
        });
      }
    }

    return relationships;
  }

  private extractEntityRelationships(
    model: IDataModel,
    dataModels: IDataModel[],
  ): string[] {
    const relatedEntities: string[] = [];

    // Extract relationships from property types
    this.extractPropertyTypeRelationships(model, dataModels, relatedEntities);

    // Extract relationships from relationship decorators
    this.extractDecoratorRelationships(model, relatedEntities);

    return relatedEntities;
  }

  private extractPropertyTypeRelationships(
    model: IDataModel,
    dataModels: IDataModel[],
    relatedEntities: string[],
  ): void {
    for (const property of model.properties) {
      // Look for array types (OneToMany relationships)
      if (property.type.includes("[]")) {
        const entityType = property.type.replace("[]", "").trim();
        if (this.isEntityType(entityType, dataModels)) {
          relatedEntities.push(entityType);
        }
      }

      // Look for single entity references
      if (this.isEntityType(property.type, dataModels)) {
        relatedEntities.push(property.type);
      }
    }
  }

  private extractDecoratorRelationships(
    model: IDataModel,
    relatedEntities: string[],
  ): void {
    const relationshipRegex =
      /(\w+):\s*(OneToMany|ManyToOne|OneToOne|ManyToMany)/;

    for (const relationship of model.relationships) {
      const entityMatch = relationshipRegex.exec(relationship);
      if (entityMatch) {
        const relatedEntity = this.inferEntityFromProperty(
          entityMatch[1],
          model.properties,
        );
        if (relatedEntity && !relatedEntities.includes(relatedEntity)) {
          relatedEntities.push(relatedEntity);
        }
      }
    }
  }

  private isEntityType(type: string, dataModels: IDataModel[]): boolean {
    return dataModels.some((model) => model.name === type);
  }

  private inferEntityFromProperty(
    propertyName: string,
    properties: { name: string; type: string; optional: boolean }[],
  ): string | null {
    const property = properties.find((p) => p.name === propertyName);
    if (property) {
      // Remove array notation and common suffixes
      let type = property.type.replace("[]", "").trim();
      if (type.endsWith("Entity")) {
        return type;
      }
      // Check if first character is uppercase (entity naming convention)
      if (type.length > 0 && type.startsWith(type.charAt(0).toUpperCase())) {
        return type;
      }
    }
    return null;
  }

  /**
   * Authentication pattern analysis
   */
  private async analyzeAuthenticationPatterns(
    files: string[],
  ): Promise<string[]> {
    const patterns: string[] = [];
    const authFiles = files.filter(
      (f) =>
        f.includes("auth") ||
        f.includes("login") ||
        f.includes("jwt") ||
        f.includes("passport") ||
        f.includes("guard") ||
        f.includes("middleware"),
    );

    for (const file of authFiles) {
      try {
        const content = await this.readFileContent(file);
        const filePatterns = this.extractAuthPatterns(content, file);
        patterns.push(...filePatterns);
      } catch (error) {
        this.logger.debug(`Could not read auth file: ${file}`, error);
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  private extractAuthPatterns(content: string, file: string): string[] {
    const patterns: string[] = [];

    const authChecks = [
      { pattern: "passport", message: "Passport.js authentication strategy" },
      { pattern: ["jwt", "JWT"], message: "JWT token authentication" },
      {
        pattern: ["@UseGuards", "AuthGuard"],
        message: "NestJS Guards authentication",
      },
      { pattern: "session", message: "Session-based authentication" },
      { pattern: ["bcrypt", "hash"], message: "Password hashing/encryption" },
      { pattern: ["OAuth", "oauth"], message: "OAuth authentication" },
      {
        pattern: ["middleware", "authenticate"],
        message: "Authentication middleware",
      },
    ];

    for (const check of authChecks) {
      const searchPatterns = Array.isArray(check.pattern)
        ? check.pattern
        : [check.pattern];
      if (searchPatterns.some((pattern) => content.includes(pattern))) {
        patterns.push(`${check.message} found in ${file}`);
      }
    }

    return patterns;
  }

  /**
   * Security pattern analysis
   */
  private async analyzeSecurityPatterns(files: string[]): Promise<string[]> {
    const patterns: string[] = [];

    for (const file of files.slice(0, 50)) {
      // Limit to avoid performance issues
      try {
        const content = await this.readFileContent(file);

        // Check for security patterns
        if (content.includes("cors") || content.includes("CORS")) {
          patterns.push(`CORS configuration found in ${file}`);
        }

        if (content.includes("helmet")) {
          patterns.push(`Helmet security middleware found in ${file}`);
        }

        if (content.includes("rate-limit") || content.includes("rateLimit")) {
          patterns.push(`Rate limiting found in ${file}`);
        }

        if (
          content.includes("@Roles") ||
          content.includes("role") ||
          content.includes("permission")
        ) {
          patterns.push(`Role-based access control found in ${file}`);
        }

        if (content.includes("csrf") || content.includes("CSRF")) {
          patterns.push(`CSRF protection found in ${file}`);
        }

        if (content.includes("sanitize") || content.includes("validate")) {
          patterns.push(`Input validation/sanitization found in ${file}`);
        }
      } catch (error) {
        this.logger.debug(`Could not read security file: ${file}`, error);
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Configuration pattern analysis
   */
  private async analyzeConfigurationPatterns(
    files: string[],
  ): Promise<string[]> {
    const patterns: string[] = [];
    const configFiles = files.filter(
      (f) =>
        f.includes("config") ||
        f.endsWith(".env") ||
        f.includes("settings") ||
        f.endsWith(".json") ||
        f.endsWith(".yml") ||
        f.endsWith(".yaml"),
    );

    for (const file of configFiles) {
      if (file.includes(".env")) {
        patterns.push(`Environment variables file: ${file}`);
      } else if (file.endsWith("package.json")) {
        patterns.push(`Package configuration: ${file}`);
      } else if (file.includes("config")) {
        patterns.push(`Configuration file: ${file}`);
      } else if (file.endsWith(".json")) {
        patterns.push(`JSON configuration: ${file}`);
      } else if (file.includes("docker")) {
        patterns.push(`Docker configuration: ${file}`);
      }
    }

    return patterns;
  }

  /**
   * Environment pattern analysis
   */
  private async analyzeEnvironmentPatterns(files: string[]): Promise<string[]> {
    const patterns: string[] = [];

    // Check for environment-related files
    const envFiles = files.filter(
      (f) =>
        f.includes(".env") || f.includes("environment") || f.includes("config"),
    );

    for (const file of envFiles) {
      try {
        const content = await this.readFileContent(file);

        if (content.includes("DATABASE_URL") || content.includes("DB_")) {
          patterns.push(`Database configuration detected in ${file}`);
        }

        if (content.includes("API_KEY") || content.includes("SECRET")) {
          patterns.push(`API keys/secrets configuration in ${file}`);
        }

        if (content.includes("PORT") || content.includes("HOST")) {
          patterns.push(`Server configuration in ${file}`);
        }

        if (content.includes("REDIS") || content.includes("CACHE")) {
          patterns.push(`Cache configuration in ${file}`);
        }
      } catch (error) {
        this.logger.debug(`Could not read env file: ${file}`, error);
      }
    }

    return [...new Set(patterns)];
  }

  /**
   * Code pattern analysis
   */
  private async analyzeCodePatterns(files: string[]): Promise<string[]> {
    const patterns: string[] = [];

    // Analyze architectural patterns
    const hasControllers = files.some((f) => f.includes("controller"));
    const hasServices = files.some((f) => f.includes("service"));
    const hasRepositories = files.some(
      (f) => f.includes("repository") || f.includes("repo"),
    );
    const hasMiddleware = files.some((f) => f.includes("middleware"));
    const hasGuards = files.some((f) => f.includes("guard"));
    const hasDecorators = files.some((f) => f.includes("decorator"));
    const hasInterceptors = files.some((f) => f.includes("interceptor"));

    if (hasControllers && hasServices) {
      patterns.push("MVC/Controller-Service architecture pattern");
    }

    if (hasRepositories) {
      patterns.push("Repository pattern for data access");
    }

    if (hasMiddleware) {
      patterns.push("Middleware pattern for request processing");
    }

    if (hasGuards) {
      patterns.push("Guard pattern for route protection");
    }

    if (hasDecorators) {
      patterns.push("Decorator pattern (likely NestJS)");
    }

    if (hasInterceptors) {
      patterns.push("Interceptor pattern for cross-cutting concerns");
    }

    // Check for testing patterns
    const hasTests = files.some(
      (f) => f.includes("test") || f.includes("spec"),
    );
    if (hasTests) {
      patterns.push("Test-driven development pattern");
    }

    // Check for modular structure
    const hasModules = files.some((f) => f.includes("module"));
    if (hasModules) {
      patterns.push("Modular architecture pattern");
    }

    return patterns;
  }

  /**
   * Clear analysis cache - useful when workspace changes significantly
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info("Codebase analysis cache cleared");
  }

  /**
   * Clear specific cache patterns
   */
  public clearCachePattern(pattern: string): void {
    this.cache.clearPattern(pattern);
    this.logger.info(`Cache cleared for pattern: ${pattern}`);
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): any {
    return this.cache.getStats();
  }
}
