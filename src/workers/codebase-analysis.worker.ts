import { parentPort, isMainThread } from "worker_threads";
import * as fs from "fs";
import * as path from "path";
import { AnalyzerFactory } from "../services/analyzers/analyzer-factory";
import { AnalysisResult as FileAnalysisResult } from "../services/analyzers/index";

// Types matching the ones in the service, but adapted for Worker context
export interface WorkerInputData {
  workspacePath: string;
  files: string[];
}

export interface AnalysisResult {
  frameworks: string[];
  dependencies: Record<string, string>;
  files: string[];
  apiEndpoints: any[];
  dataModels: any[];
  databaseSchema: any;
  domainRelationships: any[];
  fileContents: Map<string, string>;
  summary: {
    totalFiles: number;
    totalLines: number;
    languageDistribution: Record<string, number>;
    complexity: "low" | "medium" | "high";
  };
}

class WorkerLogger {
  debug(msg: string, data?: any) {
    this.log("DEBUG", msg, data);
  }
  info(msg: string, data?: any) {
    this.log("INFO", msg, data);
  }
  warn(msg: string, data?: any) {
    this.log("WARN", msg, data);
  }
  error(msg: string, data?: any) {
    this.log("ERROR", msg, data);
  }

  private log(level: string, message: string, data?: any) {
    if (parentPort) {
      parentPort.postMessage({ type: "LOG", level, message, data });
    }
  }
}

class CodebaseAnalysisTask {
  private readonly logger = new WorkerLogger();
  private readonly analyzerFactory = new AnalyzerFactory();
  private isCancelled = false;

  async performAnalysis(data: WorkerInputData): Promise<AnalysisResult> {
    this.reportProgress(0, 100, "Starting codebase analysis...");

    const files = data.files;
    this.reportProgress(10, 100, `Found ${files.length} files to analyze...`);

    this.checkCancellation();

    // Step 2: Analyze dependencies
    const dependencies = await this.analyzeDependencies(data.workspacePath);
    this.reportProgress(20, 100, "Analyzing dependencies...");

    // Step 3: Detect frameworks
    const frameworks = await this.detectFrameworks(files, dependencies);
    this.reportProgress(30, 100, "Detecting frameworks...");

    // Step 4: Analyze file contents
    const analysisResults = await this.analyzeFileContents(files);

    this.reportProgress(80, 100, "Analyzing database schema...");

    // Step 5: Analyze database schema
    const databaseSchema = await this.analyzeDatabaseSchema(
      files,
      analysisResults.fileContents,
    );

    this.reportProgress(90, 100, "Building domain relationships...");

    // Step 6: Build domain relationships
    const domainRelationships = this.buildDomainRelationships(
      analysisResults.dataModels,
      analysisResults.apiEndpoints,
    );

    // Step 7: Calculate complexity
    const complexity = this.calculateComplexity(
      files.length,
      analysisResults.totalLines,
      Object.keys(dependencies).length,
    );

    this.reportProgress(100, 100, "Analysis complete!");

    return {
      frameworks,
      dependencies,
      files,
      apiEndpoints: analysisResults.apiEndpoints,
      dataModels: analysisResults.dataModels,
      databaseSchema,
      domainRelationships,
      fileContents: analysisResults.fileContents,
      summary: {
        totalFiles: files.length,
        totalLines: analysisResults.totalLines,
        languageDistribution: analysisResults.languageDistribution,
        complexity,
      },
    };
  }

  cancel() {
    this.isCancelled = true;
  }

  private reportProgress(current: number, total: number, message: string) {
    if (parentPort) {
      parentPort.postMessage({
        type: "ANALYSIS_PROGRESS",
        progress: { current, total, message },
      });
    }
  }

  private checkCancellation(): void {
    if (this.isCancelled) {
      throw new Error("Analysis cancelled");
    }
  }

  private async analyzeFileContents(files: string[]): Promise<{
    fileContents: Map<string, string>;
    apiEndpoints: any[];
    dataModels: any[];
    totalLines: number;
    languageDistribution: Record<string, number>;
  }> {
    const fileContents = new Map<string, string>();
    const apiEndpoints: any[] = [];
    const dataModels: any[] = [];
    let totalLines = 0;
    const languageDistribution: Record<string, number> = {};

    for (let i = 0; i < files.length; i++) {
      this.checkCancellation();

      const file = files[i];
      const progress = 30 + (i / files.length) * 50; // 30-80% of total progress

      // Throttle progress updates to avoid flooding
      if (i % 10 === 0) {
        this.reportProgress(
          Math.round(progress),
          100,
          `Analyzing ${path.basename(file)}...`,
        );
      }

      try {
        const fileAnalysis = await this.analyzeSingleFile(file);

        fileContents.set(file, fileAnalysis.content);
        totalLines += fileAnalysis.lines;

        // Update language distribution
        const ext = path.extname(file).toLowerCase();
        languageDistribution[ext] = (languageDistribution[ext] || 0) + 1;

        // Collect endpoints and models from legacy analysis
        apiEndpoints.push(...fileAnalysis.endpoints);
        dataModels.push(...fileAnalysis.models);

        // Process structured analysis results
        if (fileAnalysis.analysis) {
          this.processStructuredAnalysis(
            fileAnalysis.analysis,
            file,
            dataModels,
          );
        }
      } catch (error: any) {
        this.logger.warn(`Failed to analyze file ${file}:`, error);
      }
    }

    return {
      fileContents,
      apiEndpoints,
      dataModels,
      totalLines,
      languageDistribution,
    };
  }

  private async analyzeSingleFile(filePath: string): Promise<{
    content: string;
    lines: number;
    endpoints: any[];
    models: any[];
    analysis?: FileAnalysisResult;
  }> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const lines = content.split("\n").length;

      // Use analyzer factory for structured analysis
      let analysis: FileAnalysisResult | undefined;
      try {
        const analyzer = this.analyzerFactory.getAnalyzer(filePath);
        if (analyzer) {
          analysis = analyzer.analyze(content, filePath);
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to run structured analysis on ${filePath}:`,
          error,
        );
      }

      // Extract API endpoints and data models with error handling
      let endpoints: any[] = [];
      let models: any[] = [];

      try {
        endpoints = this.extractApiEndpoints(filePath, content);
      } catch (error: any) {
        this.logger.warn(
          `Failed to extract API endpoints from ${filePath}:`,
          error,
        );
      }

      try {
        models = this.extractDataModels(filePath, content);
      } catch (error: any) {
        this.logger.warn(
          `Failed to extract data models from ${filePath}:`,
          error,
        );
      }

      return {
        content,
        lines,
        endpoints,
        models,
        analysis,
      };
    } catch (error: any) {
      // simplified error handling for worker
      if (error instanceof Error) {
        // ... keep logic if needed or simplify ...
      }
      throw new Error(`Failed to analyze file ${filePath}`);
    }
  }

  private processStructuredAnalysis(
    analysis: FileAnalysisResult,
    filePath: string,
    dataModels: any[],
  ): void {
    // Extract classes as data models if they have properties
    if (analysis.classes) {
      for (const classInfo of analysis.classes) {
        dataModels.push({
          name: classInfo.name,
          type: "class",
          file: filePath,
          properties: classInfo.methods || [],
          extends: classInfo.extends,
          implements: classInfo.implements || [],
        });
      }
    }

    // Extract React components as models
    if (analysis.components) {
      for (const component of analysis.components) {
        dataModels.push({
          name: component.name,
          type: "react_component",
          file: filePath,
          properties: [],
        });
      }
    }

    // Extract functions as potential API endpoints or utilities
    if (analysis.functions) {
      for (const func of analysis.functions) {
        // Only include functions that might be API endpoints
        if (this.isPotentialApiEndpoint(func.name, filePath)) {
          dataModels.push({
            name: func.name,
            type: "function",
            file: filePath,
            properties: [],
          });
        }
      }
    }
  }

  private isPotentialApiEndpoint(
    functionName: string,
    filePath: string,
  ): boolean {
    const apiKeywords = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "handler",
      "controller",
      "route",
      "api",
    ];
    const lowerName = functionName.toLowerCase();
    const lowerPath = filePath.toLowerCase();

    return apiKeywords.some(
      (keyword) =>
        lowerName.includes(keyword) ||
        lowerPath.includes(keyword) ||
        lowerPath.includes("api") ||
        lowerPath.includes("route") ||
        lowerPath.includes("controller"),
    );
  }

  private async analyzeDependencies(
    workspacePath: string,
  ): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {};

    // Analyze package.json
    const packageJsonPath = path.join(workspacePath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          await fs.promises.readFile(packageJsonPath, "utf-8"),
        );
        Object.assign(dependencies, packageJson.dependencies || {});
        Object.assign(dependencies, packageJson.devDependencies || {});
      } catch (error: any) {
        this.logger.warn("Failed to analyze package.json:", error);
      }
    }

    // Analyze requirements.txt (Python)
    const requirementsPath = path.join(workspacePath, "requirements.txt");
    if (fs.existsSync(requirementsPath)) {
      try {
        const content = await fs.promises.readFile(requirementsPath, "utf-8");
        const lines = content
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#"));
        for (const line of lines) {
          const [name, version] = line.split("==");
          if (name && version) {
            dependencies[name.trim()] = version.trim();
          }
        }
      } catch (error: any) {
        this.logger.warn("Failed to analyze requirements.txt:", error);
      }
    }

    return dependencies;
  }

  private async detectFrameworks(
    files: string[],
    dependencies: Record<string, string>,
  ): Promise<string[]> {
    const frameworks: Set<string> = new Set();
    const frameworkMap: Record<string, string> = {
      react: "React",
      vue: "Vue.js",
      angular: "Angular",
      svelte: "Svelte",
      next: "Next.js",
      nuxt: "Nuxt.js",
      express: "Express.js",
      fastify: "Fastify",
      nestjs: "NestJS",
      django: "Django",
      flask: "Flask",
      spring: "Spring Boot",
      laravel: "Laravel",
      symfony: "Symfony",
    };

    for (const [dep, framework] of Object.entries(frameworkMap)) {
      if (dependencies[dep] || dependencies[`@${dep}`]) {
        frameworks.add(framework);
      }
    }

    const filePatterns: Record<string, string> = {
      "next.config.js": "Next.js",
      "nuxt.config.js": "Nuxt.js",
      "vue.config.js": "Vue.js",
      "angular.json": "Angular",
      "svelte.config.js": "Svelte",
      "manage.py": "Django",
      artisan: "Laravel",
      "composer.json": "PHP/Composer",
    };

    for (const file of files) {
      const filename = path.basename(file);
      if (filePatterns[filename]) {
        frameworks.add(filePatterns[filename]);
      }
    }

    return Array.from(frameworks);
  }

  private extractApiEndpoints(filePath: string, content: string): any[] {
    const endpoints: any[] = [];
    const patterns = [
      /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /@app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /@(Get|Post|Put|Delete|Patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: filePath,
          line: content.substring(0, match.index).split("\n").length,
        });
      }
    }
    return endpoints;
  }

  private extractDataModels(filePath: string, content: string): any[] {
    const models: any[] = [];
    const interfaceRegex = /interface\s+(\w+)\s*{([^}]+)}/gi;
    const classRegex = /class\s+(\w+)\s*(?:extends\s+\w+)?\s*{([^}]+)}/gi;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      models.push({
        name: match[1],
        type: "interface",
        file: filePath,
        properties: this.extractProperties(match[2]),
      });
    }

    while ((match = classRegex.exec(content)) !== null) {
      models.push({
        name: match[1],
        type: "class",
        file: filePath,
        properties: this.extractProperties(match[2]),
      });
    }
    return models;
  }

  private extractProperties(content: string): any[] {
    const properties: any[] = [];
    const lines = content.split("\n");
    const propertyRegex = /(\w+)\s*\?\s*:\s*([^;,]+)/g;
    const requiredRegex = /(\w+)\s*:\s*([^;,]+)/g;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        continue;
      }

      propertyRegex.lastIndex = 0;
      requiredRegex.lastIndex = 0;

      let match = propertyRegex.exec(trimmed);
      if (match) {
        properties.push({
          name: match[1],
          type: match[2].trim(),
          optional: true,
        });
        continue;
      }

      match = requiredRegex.exec(trimmed);
      if (match) {
        properties.push({
          name: match[1],
          type: match[2].trim(),
          optional: false,
        });
      }
    }
    return properties;
  }

  private async analyzeDatabaseSchema(
    files: string[],
    fileContents: Map<string, string>,
  ): Promise<any> {
    const schema = {
      tables: [] as any[],
      relationships: [] as any[],
      migrations: [] as string[],
    };

    for (const [filePath, content] of fileContents) {
      const filename = path.basename(filePath).toLowerCase();

      if (filename.includes("migration") || filename.endsWith(".sql")) {
        schema.migrations.push(filePath);
      }

      if (filename === "schema.prisma") {
        const modelRegex = /model\s+(\w+)\s*{([^}]+)}/gi;
        let match;
        while ((match = modelRegex.exec(content)) !== null) {
          schema.tables.push({
            name: match[1],
            file: filePath,
            columns: this.extractPrismaColumns(match[2]),
          });
        }
      }
    }
    return schema;
  }

  private extractPrismaColumns(content: string): string[] {
    const columns: string[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("@@")) {
        const match = /(\w+)\s+(\w+)/g.exec(trimmed);
        if (match) {
          columns.push(`${match[1]} ${match[2]}`);
        }
      }
    }
    return columns;
  }

  private buildDomainRelationships(
    dataModels: any[],
    apiEndpoints: any[],
  ): any[] {
    const relationships: any[] = [];
    for (const model of dataModels) {
      const relatedEntities: string[] = [];
      for (const prop of model.properties || []) {
        for (const otherModel of dataModels) {
          if (
            otherModel.name !== model.name &&
            (prop.type.includes(otherModel.name) ||
              prop.name.toLowerCase().includes(otherModel.name.toLowerCase()))
          ) {
            relatedEntities.push(otherModel.name);
          }
        }
      }
      if (relatedEntities.length > 0) {
        relationships.push({
          entity: model.name,
          relatedEntities: [...new Set(relatedEntities)],
        });
      }
    }
    return relationships;
  }

  private calculateComplexity(
    fileCount: number,
    lineCount: number,
    dependencyCount: number,
  ): "low" | "medium" | "high" {
    const complexityScore =
      fileCount * 0.3 + lineCount * 0.0001 + dependencyCount * 0.5;

    if (complexityScore > 100) return "high";
    if (complexityScore > 50) return "medium";
    return "low";
  }
}

// Logic to handle messages
if (!isMainThread && parentPort) {
  const task = new CodebaseAnalysisTask();

  parentPort.on("message", async (message: { type: string; payload: any }) => {
    if (message.type === "ANALYZE_CODEBASE") {
      try {
        const result = await task.performAnalysis(message.payload);
        parentPort?.postMessage({
          type: "ANALYSIS_COMPLETE",
          payload: result,
        });
      } catch (error: any) {
        parentPort?.postMessage({
          type: "ANALYSIS_ERROR",
          error: error.message || String(error),
        });
      }
    } else if (message.type === "CANCEL") {
      task.cancel();
    }
  });
}
