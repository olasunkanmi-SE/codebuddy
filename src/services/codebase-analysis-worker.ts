/**
 * @fileoverview Codebase Analysis Worker
 *
 * This module provides a simulated web worker implementation for performing
 * intensive codebase analysis operations without blocking the main VS Code thread.
 * It analyzes codebases to extract frameworks, dependencies, file structures,
 * API endpoints, data models, and other architectural information.
 *
 * The worker simulates asynchronous processing with progress reporting and
 * cancellation support, making it suitable for analyzing large codebases
 * without freezing the VS Code interface.
 *
 * @author CodeBuddy Team
 * @version 1.0.0
 * @since 2025-01-24
 */

// Web Worker for codebase analysis to avoid blocking the main thread
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Message types for communication between main thread and worker
 *
 * - ANALYZE_CODEBASE: Start analysis operation
 * - ANALYSIS_COMPLETE: Analysis finished successfully
 * - ANALYSIS_ERROR: Analysis failed with error
 * - ANALYSIS_PROGRESS: Progress update during analysis
 */
export interface WorkerMessage {
  /** Message type identifier */
  type: "ANALYZE_CODEBASE" | "ANALYSIS_COMPLETE" | "ANALYSIS_ERROR" | "ANALYSIS_PROGRESS";
  /** Message payload data */
  payload?: any;
  /** Error message if applicable */
  error?: string;
  /** Progress information for long-running operations */
  progress?: {
    /** Current progress value */
    current: number;
    /** Total expected progress value */
    total: number;
    /** Human-readable progress message */
    message: string;
  };
}

/**
 * Configuration data for codebase analysis operations
 *
 * @interface CodebaseAnalysisWorkerData
 */
/**
 * Configuration data for codebase analysis operations
 *
 * @interface CodebaseAnalysisWorkerData
 */
export interface CodebaseAnalysisWorkerData {
  /** Absolute path to the workspace directory to analyze */
  workspacePath: string;
  /** Glob patterns for files to include in analysis */
  filePatterns: string[];
  /** Glob patterns for files/directories to exclude from analysis */
  excludePatterns: string[];
  /** Maximum number of files to analyze (performance limit) */
  maxFiles: number;
}

/**
 * Comprehensive analysis result containing all extracted information
 *
 * @interface AnalysisResult
 */
export interface AnalysisResult {
  /** Detected frameworks and libraries in the codebase */
  frameworks: string[];
  /** Package dependencies with versions */
  dependencies: Record<string, string>;
  /** List of analyzed file paths */
  files: string[];
  /** Detected API endpoints with metadata */
  apiEndpoints: any[];
  /** Identified data models and structures */
  dataModels: any[];
  /** Database schema information if available */
  databaseSchema: any;
  /** Relationships between domain entities */
  domainRelationships: any[];
  /** File contents for further processing */
  fileContents: Map<string, string>;
  /** Statistical summary of the analysis */
  summary: {
    /** Total number of files analyzed */
    totalFiles: number;
    /** Total lines of code */
    totalLines: number;
    /** Distribution of programming languages */
    languageDistribution: Record<string, number>;
    /** Assessed complexity level */
    complexity: "low" | "medium" | "high";
  };
}

/**
 * Simulated Web Worker for codebase analysis
 *
 * This class simulates web worker behavior for performing intensive codebase
 * analysis operations. It provides non-blocking execution with progress reporting
 * and cancellation support.
 *
 * Key features:
 * - Non-blocking analysis execution
 * - Progress reporting with custom callbacks
 * - Cancellation token support
 * - Comprehensive framework detection
 * - Dependency extraction
 * - File content analysis
 * - Statistical summaries
 *
 * @example
 * ```typescript
 * const worker = new CodebaseAnalysisWorker();
 * const result = await worker.analyzeCodebase(
 *   {
 *     workspacePath: '/path/to/project',
 *     maxFiles: 1000
 *   },
 *   (progress) => console.log(`Progress: ${progress.current}/${progress.total}`),
 *   cancellationToken
 * );
 * ```
 *
 * @class CodebaseAnalysisWorker
 */
export class CodebaseAnalysisWorker {
  /** Flag indicating if analysis is currently running */
  private isRunning = false;

  /** Flag indicating if current analysis should be cancelled */
  private shouldCancel = false;
  private currentCancellationToken?: vscode.CancellationToken;

  /**
   * Start codebase analysis in a "background" process
   * This simulates web worker behavior using async processing
   */
  async analyzeCodebase(
    data: CodebaseAnalysisWorkerData,
    onProgress: (progress: { current: number; total: number; message: string }) => void,
    cancellationToken?: vscode.CancellationToken
  ): Promise<AnalysisResult> {
    if (this.isRunning) {
      throw new Error("Analysis already in progress");
    }

    this.isRunning = true;
    this.currentCancellationToken = cancellationToken;

    try {
      const result = await this.performAnalysis(data, onProgress);
      return result;
    } finally {
      this.isRunning = false;
      this.currentCancellationToken = undefined;
    }
  }

  /**
   * Perform the actual codebase analysis
   */
  private async performAnalysis(
    data: CodebaseAnalysisWorkerData,
    onProgress: (progress: { current: number; total: number; message: string }) => void
  ): Promise<AnalysisResult> {
    onProgress({
      current: 0,
      total: 100,
      message: "Starting codebase analysis...",
    });

    // Step 1: Find all relevant files
    const files = await this.findRelevantFiles(data);
    onProgress({
      current: 10,
      total: 100,
      message: `Found ${files.length} files to analyze...`,
    });

    if (this.currentCancellationToken?.isCancellationRequested) {
      throw new Error("Analysis cancelled");
    }

    // Step 2: Analyze package.json and dependencies
    const dependencies = await this.analyzeDependencies(data.workspacePath);
    onProgress({
      current: 20,
      total: 100,
      message: "Analyzing dependencies...",
    });

    // Step 3: Detect frameworks
    const frameworks = await this.detectFrameworks(files, dependencies);
    onProgress({ current: 30, total: 100, message: "Detecting frameworks..." });

    // Step 4: Analyze file contents
    const fileContents = new Map<string, string>();
    const apiEndpoints: any[] = [];
    const dataModels: any[] = [];
    let totalLines = 0;
    const languageDistribution: Record<string, number> = {};

    for (let i = 0; i < files.length; i++) {
      if (this.currentCancellationToken?.isCancellationRequested) {
        throw new Error("Analysis cancelled");
      }

      const file = files[i];
      const progress = 30 + (i / files.length) * 50; // 30-80% of total progress
      onProgress({
        current: Math.round(progress),
        total: 100,
        message: `Analyzing ${path.basename(file)}...`,
      });

      try {
        const content = await fs.promises.readFile(file, "utf-8");
        fileContents.set(file, content);

        // Count lines
        const lines = content.split("\n").length;
        totalLines += lines;

        // Language distribution
        const ext = path.extname(file).toLowerCase();
        languageDistribution[ext] = (languageDistribution[ext] || 0) + 1;

        // Extract API endpoints
        const endpoints = this.extractApiEndpoints(file, content);
        apiEndpoints.push(...endpoints);

        // Extract data models
        const models = this.extractDataModels(file, content);
        dataModels.push(...models);

        // Yield control to prevent blocking
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      } catch (error) {
        console.warn(`Failed to analyze file ${file}:`, error);
      }
    }

    onProgress({
      current: 80,
      total: 100,
      message: "Analyzing database schema...",
    });

    // Step 5: Analyze database schema
    const databaseSchema = await this.analyzeDatabaseSchema(files, fileContents);

    onProgress({
      current: 90,
      total: 100,
      message: "Building domain relationships...",
    });

    // Step 6: Build domain relationships
    const domainRelationships = this.buildDomainRelationships(dataModels, apiEndpoints);

    // Step 7: Calculate complexity
    const complexity = this.calculateComplexity(files.length, totalLines, Object.keys(dependencies).length);

    onProgress({ current: 100, total: 100, message: "Analysis complete!" });

    return {
      frameworks,
      dependencies,
      files,
      apiEndpoints,
      dataModels,
      databaseSchema,
      domainRelationships,
      fileContents,
      summary: {
        totalFiles: files.length,
        totalLines,
        languageDistribution,
        complexity,
      },
    };
  }

  /**
   * Find all relevant files in the workspace
   */
  private async findRelevantFiles(data: CodebaseAnalysisWorkerData): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of data.filePatterns) {
      try {
        const uris = await vscode.workspace.findFiles(pattern, `{${data.excludePatterns.join(",")}}`, data.maxFiles);

        files.push(...uris.map((uri) => uri.fsPath));
      } catch (error) {
        console.warn(`Failed to find files with pattern ${pattern}:`, error);
      }
    }

    // Remove duplicates and sort
    return [...new Set(files)].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Analyze package.json and other dependency files
   */
  private async analyzeDependencies(workspacePath: string): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {};

    // Analyze package.json
    const packageJsonPath = path.join(workspacePath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf-8"));
        Object.assign(dependencies, packageJson.dependencies || {});
        Object.assign(dependencies, packageJson.devDependencies || {});
      } catch (error) {
        console.warn("Failed to analyze package.json:", error);
      }
    }

    // Analyze requirements.txt (Python)
    const requirementsPath = path.join(workspacePath, "requirements.txt");
    if (fs.existsSync(requirementsPath)) {
      try {
        const content = await fs.promises.readFile(requirementsPath, "utf-8");
        const lines = content.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
        for (const line of lines) {
          const [name, version] = line.split("==");
          if (name && version) {
            dependencies[name.trim()] = version.trim();
          }
        }
      } catch (error) {
        console.warn("Failed to analyze requirements.txt:", error);
      }
    }

    return dependencies;
  }

  /**
   * Detect frameworks based on files and dependencies
   */
  private async detectFrameworks(files: string[], dependencies: Record<string, string>): Promise<string[]> {
    const frameworks: Set<string> = new Set();

    // Framework detection based on dependencies
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

    // Framework detection based on file patterns
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

  /**
   * Extract API endpoints from file content
   */
  private extractApiEndpoints(filePath: string, content: string): any[] {
    const endpoints: any[] = [];

    // Simple regex patterns for common API patterns
    const patterns = [
      // Express.js routes
      /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      // FastAPI/Flask routes
      /@app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      // NestJS controllers
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

  /**
   * Extract data models from file content
   */
  private extractDataModels(filePath: string, content: string): any[] {
    const models: any[] = [];

    // TypeScript/JavaScript interfaces and classes
    const interfaceRegex = /interface\s+(\w+)\s*{([^}]+)}/gi;
    const classRegex = /class\s+(\w+)\s*(?:extends\s+\w+)?\s*{([^}]+)}/gi;

    let match;

    // Extract interfaces
    while ((match = interfaceRegex.exec(content)) !== null) {
      models.push({
        name: match[1],
        type: "interface",
        file: filePath,
        properties: this.extractProperties(match[2]),
      });
    }

    // Extract classes
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

  /**
   * Extract properties from type definitions
   */
  private extractProperties(content: string): any[] {
    const properties: any[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
        const propMatch = /(\w+)\s*\?\s*:\s*([^;,]+)/g.exec(trimmed);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            type: propMatch[2].trim(),
            optional: true,
          });
        } else {
          const requiredMatch = /(\w+)\s*:\s*([^;,]+)/g.exec(trimmed);
          if (requiredMatch) {
            properties.push({
              name: requiredMatch[1],
              type: requiredMatch[2].trim(),
              optional: false,
            });
          }
        }
      }
    }

    return properties;
  }

  /**
   * Analyze database schema from files
   */
  private async analyzeDatabaseSchema(files: string[], fileContents: Map<string, string>): Promise<any> {
    const schema = {
      tables: [] as any[],
      relationships: [] as any[],
      migrations: [] as string[],
    };

    // Look for common database patterns
    for (const [filePath, content] of fileContents) {
      const filename = path.basename(filePath).toLowerCase();

      // SQL migration files
      if (filename.includes("migration") || filename.endsWith(".sql")) {
        schema.migrations.push(filePath);
      }

      // Prisma schema
      if (filename === "schema.prisma") {
        // Parse Prisma models (simplified)
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

  /**
   * Extract Prisma columns (simplified)
   */
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

  /**
   * Build domain relationships between entities
   */
  private buildDomainRelationships(dataModels: any[], apiEndpoints: any[]): any[] {
    const relationships: any[] = [];

    // Simple relationship detection based on naming patterns
    for (const model of dataModels) {
      const relatedEntities: string[] = [];

      // Look for properties that reference other entities
      for (const prop of model.properties || []) {
        for (const otherModel of dataModels) {
          if (
            otherModel.name !== model.name &&
            (prop.type.includes(otherModel.name) || prop.name.toLowerCase().includes(otherModel.name.toLowerCase()))
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

  /**
   * Calculate codebase complexity
   */
  private calculateComplexity(
    fileCount: number,
    lineCount: number,
    dependencyCount: number
  ): "low" | "medium" | "high" {
    const complexityScore = fileCount * 0.3 + lineCount * 0.0001 + dependencyCount * 0.5;

    if (complexityScore > 100) return "high";
    if (complexityScore > 50) return "medium";
    return "low";
  }

  /**
   * Cancel the current analysis
   */
  cancel(): void {
    // In a real web worker, this would terminate the worker
    // For now, we rely on the cancellation token
  }

  /**
   * Check if analysis is currently running
   */
  isAnalysisRunning(): boolean {
    return this.isRunning;
  }
}
