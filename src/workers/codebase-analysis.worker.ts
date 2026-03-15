import { parentPort, isMainThread } from "worker_threads";
import * as fs from "fs";
import * as path from "path";
import { AnalyzerFactory } from "../services/analyzers/analyzer-factory";
import { AnalysisResult as FileAnalysisResult } from "../services/analyzers/index";
import {
  TreeSitterAnalyzer,
  TreeSitterAnalysisResult,
} from "../services/analyzers/tree-sitter-analyzer";
import { WorkerLogger } from "../infrastructure/logger/worker-logger";
import type {
  CodeSnippet,
  AnalysisResult,
  WorkerInputData,
} from "../interfaces/analysis.interface";

// Re-export for backward compatibility
export type { CodeSnippet, AnalysisResult, WorkerInputData };

// Module-level constants for memory bounds
const MAX_SNIPPETS = 30;
const MAX_SNIPPET_LINES = 75;
const MAX_SNIPPET_CHARS = 3000;

// Important file patterns for code snippet collection
// Defined at module level to avoid re-instantiation on each call
const IMPORTANT_FILE_PATTERNS = [
  // Entry points (must be in project source, not node_modules)
  /(?:^|[\\/])src[\\/].*index\.(ts|js|tsx|jsx)$/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*main\.(ts|js|py|go|rs|java|php)$/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*app\.(ts|js|tsx|jsx|py)$/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*server\.(ts|js)$/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*routes?\.(ts|js)$/i,
  // Controllers, services, etc. - only in project dirs
  /(?:^|[\\/])(?:src|lib|app)[\\/].*controllers?[\\/]/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*services?[\\/]/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*handlers?[\\/]/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*models?[\\/]/i,
  /(?:^|[\\/])(?:src|lib|app)[\\/].*schemas?[\\/]/i,
  // README files (root only, not from dependencies)
  /(?:^|[\\/])readme\.(md|txt|rst)?$/i,
  // Manifest files (root only)
  /(?:^|[\\/])package\.json$/i,
  /(?:^|[\\/])tsconfig\.json$/i,
  /(?:^|[\\/])pyproject\.toml$/i,
  /(?:^|[\\/])setup\.py$/i,
  /(?:^|[\\/])requirements\.txt$/i,
  /(?:^|[\\/])Pipfile$/i,
  /(?:^|[\\/])go\.mod$/i,
  /(?:^|[\\/])Cargo\.toml$/i,
  /(?:^|[\\/])pom\.xml$/i,
  /(?:^|[\\/])build\.gradle$/i,
  /(?:^|[\\/])composer\.json$/i,
];

/**
 * Safely extract lines from a TOML section without full comment stripping.
 * Uses line-by-line state machine to avoid breaking URLs and quoted values containing '#'.
 */
function extractTomlSection(content: string, sectionName: string): string[] {
  const lines = content.split("\n");
  const result: string[] = [];
  let inSection = false;
  const escapedName = sectionName.replace(/\./g, "\\.");
  const sectionHeader = new RegExp(`^\\[${escapedName}\\]\\s*$`);
  const anyHeader = /^\[/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (sectionHeader.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection && anyHeader.test(trimmed)) {
      break; // Next section started
    }
    if (inSection) {
      result.push(line);
    }
  }
  return result;
}

/**
 * Strip XML comments from content
 */
function stripXmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, "");
}

class CodebaseAnalysisTask {
  private readonly logger = WorkerLogger.initialize("CodebaseAnalysisWorker");
  private readonly analyzerFactory = new AnalyzerFactory();
  private treeSitterAnalyzer: TreeSitterAnalyzer | null = null;
  private isCancelled = false;

  async performAnalysis(data: WorkerInputData): Promise<AnalysisResult> {
    this.reportProgress(0, 100, "Starting codebase analysis...");

    // Initialize Tree-sitter analyzer
    if (data.grammarsPath) {
      this.treeSitterAnalyzer = new TreeSitterAnalyzer(
        data.grammarsPath,
        this.logger,
      );
      try {
        await this.treeSitterAnalyzer.initialize();
        this.logger.info("Tree-sitter analyzer initialized");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to initialize Tree-sitter, falling back to regex: ${errorMessage}`,
        );
        this.treeSitterAnalyzer = null;
      }
    }

    try {
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
        fileContents: Object.fromEntries(analysisResults.fileContents),
        codeSnippets: analysisResults.codeSnippets,
        summary: {
          totalFiles: files.length,
          totalLines: analysisResults.totalLines,
          languageDistribution: analysisResults.languageDistribution,
          complexity,
        },
      };
    } finally {
      // Dispose Tree-sitter analyzer to release WASM memory
      if (this.treeSitterAnalyzer) {
        this.treeSitterAnalyzer.dispose();
        this.treeSitterAnalyzer = null;
        this.logger.debug("Tree-sitter analyzer disposed");
      }
    }
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
    codeSnippets: CodeSnippet[];
    apiEndpoints: any[];
    dataModels: any[];
    totalLines: number;
    languageDistribution: Record<string, number>;
  }> {
    const fileContents = new Map<string, string>();
    const codeSnippets: CodeSnippet[] = [];
    const apiEndpoints: any[] = [];
    const dataModels: any[] = [];
    let totalLines = 0;
    const languageDistribution: Record<string, number> = {};

    // Track important files for code snippets
    // Uses module-level IMPORTANT_FILE_PATTERNS constant

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

        // Process analysis results - prefer Tree-sitter, fallback to regex
        if (fileAnalysis.treeSitterAnalysis) {
          // Tree-sitter provided accurate results
          this.processTreeSitterAnalysis(
            fileAnalysis.treeSitterAnalysis,
            file,
            dataModels,
            apiEndpoints,
          );
        } else {
          // Fallback: collect regex-extracted endpoints and models
          if (fileAnalysis.endpoints.length > 0) {
            apiEndpoints.push(...fileAnalysis.endpoints);
          }
          if (fileAnalysis.models.length > 0) {
            dataModels.push(...fileAnalysis.models);
          }
          // Process structured analysis for additional model info
          if (fileAnalysis.analysis) {
            this.processStructuredAnalysis(
              fileAnalysis.analysis,
              file,
              dataModels,
            );
          }
        }

        // Collect code snippets for important files (bounded collection)
        // node_modules/vendor already excluded by file list filtering,
        // but patterns already require src/lib/app prefix so they won't match
        if (
          codeSnippets.length < MAX_SNIPPETS &&
          fileAnalysis.content.length > 0 &&
          IMPORTANT_FILE_PATTERNS.some((p) => p.test(file))
        ) {
          const language = this.getLanguageFromExt(ext);
          // Truncate at collection time to bound memory usage
          const truncatedContent =
            fileAnalysis.content.length > MAX_SNIPPET_CHARS
              ? this.truncateContent(fileAnalysis.content, MAX_SNIPPET_LINES)
              : fileAnalysis.content;

          codeSnippets.push({
            file,
            content: truncatedContent,
            language,
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze file ${file}: ${errorMessage}`);
      }
    }

    // Log analysis summary
    this.logger.info(
      `File analysis complete: ${files.length} files, ${apiEndpoints.length} endpoints, ${dataModels.length} models, ${codeSnippets.length} code snippets`,
    );

    return {
      fileContents,
      codeSnippets,
      apiEndpoints,
      dataModels,
      totalLines,
      languageDistribution,
    };
  }

  /**
   * Get language identifier from file extension
   */
  private getLanguageFromExt(ext: string): string {
    const extMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".php": "php",
    };
    return extMap[ext] || "plaintext";
  }

  /**
   * Truncate content to first N lines
   */
  private truncateContent(content: string, maxLines: number): string {
    const lines = content.split("\n");
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join("\n") + "\n// ... (truncated)";
  }

  /**
   * Process Tree-sitter analysis results
   */
  private processTreeSitterAnalysis(
    analysis: TreeSitterAnalysisResult,
    filePath: string,
    dataModels: any[],
    apiEndpoints: any[],
  ): void {
    const fileName = path.basename(filePath);
    let extractedCount = 0;

    // Extract classes as data models
    if (analysis.classes) {
      for (const classInfo of analysis.classes) {
        dataModels.push({
          name: classInfo.name,
          type: classInfo.type,
          file: filePath,
          properties: classInfo.properties || [],
          methods: classInfo.methods?.map((m) => m.name) || [],
          extends: classInfo.extends,
          implements: classInfo.implements || [],
          startLine: classInfo.startLine,
        });
        extractedCount++;
      }
    }

    // Extract React components
    if (analysis.components) {
      for (const component of analysis.components) {
        dataModels.push({
          name: component.name,
          type: "react_component",
          file: filePath,
          startLine: component.startLine,
        });
        extractedCount++;
      }
    }

    // Extract API endpoints from Tree-sitter analysis
    if (analysis.endpoints) {
      for (const endpoint of analysis.endpoints) {
        apiEndpoints.push({
          method: endpoint.method,
          path: endpoint.path,
          file: endpoint.file,
          line: endpoint.line,
        });
      }
    }

    // Extract functions as potential utilities
    if (analysis.functions) {
      for (const func of analysis.functions) {
        if (func.isExported) {
          dataModels.push({
            name: func.name,
            type: "function",
            file: filePath,
            isExported: true,
            startLine: func.startLine,
          });
          extractedCount++;
        }
      }
    }

    if (extractedCount > 0) {
      this.logger.debug(
        `Tree-sitter extracted ${extractedCount} models and ${analysis.endpoints?.length || 0} endpoints from ${fileName}`,
      );
    }
  }

  private async analyzeSingleFile(filePath: string): Promise<{
    content: string;
    lines: number;
    endpoints: any[];
    models: any[];
    analysis?: FileAnalysisResult;
    treeSitterAnalysis?: TreeSitterAnalysisResult;
  }> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const lines = content.split("\n").length;

      // Try Tree-sitter analysis first (more accurate)
      let treeSitterAnalysis: TreeSitterAnalysisResult | undefined;
      if (this.treeSitterAnalyzer?.canAnalyze(filePath)) {
        try {
          treeSitterAnalysis = await this.treeSitterAnalyzer.analyze(
            content,
            filePath,
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Tree-sitter analysis failed for ${filePath}, falling back to regex: ${errorMessage}`,
          );
        }
      }

      // Fallback to regex-based analyzer factory
      let analysis: FileAnalysisResult | undefined;
      if (!treeSitterAnalysis) {
        try {
          const analyzer = this.analyzerFactory.getAnalyzer(filePath);
          if (analyzer) {
            analysis = analyzer.analyze(content, filePath);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Failed to run structured analysis on ${filePath}: ${errorMessage}`,
          );
        }
      }

      // Extract API endpoints and data models with error handling
      // (regex-based fallback for endpoints not caught by Tree-sitter)
      let endpoints: any[] = [];
      let models: any[] = [];

      if (!treeSitterAnalysis) {
        try {
          endpoints = this.extractApiEndpoints(filePath, content);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Failed to extract API endpoints from ${filePath}: ${errorMessage}`,
          );
        }

        try {
          models = this.extractDataModels(filePath, content);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Failed to extract data models from ${filePath}: ${errorMessage}`,
          );
        }
      }

      return {
        content,
        lines,
        endpoints,
        models,
        analysis,
        treeSitterAnalysis,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to analyze file ${filePath}: ${errorMessage}`);
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

    // === JavaScript/TypeScript: package.json ===
    const packageJsonPath = path.join(workspacePath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          await fs.promises.readFile(packageJsonPath, "utf-8"),
        );
        Object.assign(dependencies, packageJson.dependencies || {});
        Object.assign(dependencies, packageJson.devDependencies || {});
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze package.json: ${errorMessage}`);
      }
    }

    // === Python: requirements.txt ===
    const requirementsPath = path.join(workspacePath, "requirements.txt");
    if (fs.existsSync(requirementsPath)) {
      try {
        const content = await fs.promises.readFile(requirementsPath, "utf-8");
        const lines = content
          .split("\n")
          .filter(
            (line) =>
              line.trim() && !line.startsWith("#") && !line.startsWith("-"),
          );
        for (const line of lines) {
          // Handle various formats: pkg==1.0, pkg>=1.0, pkg~=1.0, pkg[extra]>=1.0
          const match = line.match(
            /^([a-zA-Z0-9_-]+)(?:\[.*?\])?(?:([=<>~!]+)(.+))?/,
          );
          if (match) {
            const name = match[1].trim();
            const version = match[3]?.trim() || "*";
            dependencies[name] = version;
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze requirements.txt: ${errorMessage}`);
      }
    }

    // === Python: pyproject.toml ===
    const pyprojectPath = path.join(workspacePath, "pyproject.toml");
    if (fs.existsSync(pyprojectPath)) {
      try {
        const rawContent = await fs.promises.readFile(pyprojectPath, "utf-8");
        // Use section extraction instead of full comment stripping to avoid breaking URLs/hashes
        const depsLines = extractTomlSection(
          rawContent,
          "project.dependencies",
        );
        for (const line of depsLines) {
          const match = line.match(
            /["']([a-zA-Z0-9_-]+)(?:\[.*?\])?(?:([=<>~!]+)(.+?))?["']/,
          );
          if (match) {
            dependencies[match[1]] = match[3]?.trim() || "*";
          }
        }
        // Also check [tool.poetry.dependencies] for Poetry projects
        const poetryLines = extractTomlSection(
          rawContent,
          "tool.poetry.dependencies",
        );
        for (const line of poetryLines) {
          const match = line.match(
            /^([a-zA-Z0-9_-]+)\s*=\s*["']?([^"'\n]+)["']?/,
          );
          if (match && match[1] !== "python") {
            dependencies[match[1]] = match[2].trim();
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze pyproject.toml: ${errorMessage}`);
      }
    }

    // === Go: go.mod ===
    const goModPath = path.join(workspacePath, "go.mod");
    if (fs.existsSync(goModPath)) {
      try {
        const content = await fs.promises.readFile(goModPath, "utf-8");
        // Extract module name for logging context (not stored in dependencies to avoid polluting framework detection)
        const moduleMatch = content.match(/^module\s+(.+)$/m);
        if (moduleMatch) {
          this.logger.debug(`Go module detected: ${moduleMatch[1].trim()}`);
        }
        // Extract require statements
        const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
        if (requireBlock) {
          const lines = requireBlock[1].split("\n");
          for (const line of lines) {
            const match = line.match(/^\s*([^\s]+)\s+v?([^\s/]+)/);
            if (match) {
              dependencies[match[1]] = match[2];
            }
          }
        }
        // Also handle single-line requires
        const singleRequires = content.matchAll(
          /^require\s+([^\s]+)\s+v?([^\s]+)$/gm,
        );
        for (const match of singleRequires) {
          dependencies[match[1]] = match[2];
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze go.mod: ${errorMessage}`);
      }
    }

    // === Rust: Cargo.toml ===
    const cargoPath = path.join(workspacePath, "Cargo.toml");
    if (fs.existsSync(cargoPath)) {
      try {
        const rawContent = await fs.promises.readFile(cargoPath, "utf-8");
        // Use section extraction instead of full comment stripping
        const depsLines = extractTomlSection(rawContent, "dependencies");
        for (const line of depsLines) {
          // Handle: pkg = "1.0" or pkg = { version = "1.0", ... }
          const simpleMatch = line.match(
            /^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/,
          );
          const complexMatch = line.match(
            /^([a-zA-Z0-9_-]+)\s*=\s*\{.*version\s*=\s*["']([^"']+)["']/,
          );
          if (simpleMatch) {
            dependencies[simpleMatch[1]] = simpleMatch[2];
          } else if (complexMatch) {
            dependencies[complexMatch[1]] = complexMatch[2];
          }
        }
        // Also check [dev-dependencies]
        const devDepsLines = extractTomlSection(rawContent, "dev-dependencies");
        for (const line of devDepsLines) {
          const simpleMatch = line.match(
            /^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/,
          );
          if (simpleMatch) {
            dependencies[simpleMatch[1]] = simpleMatch[2];
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze Cargo.toml: ${errorMessage}`);
      }
    }

    // === Java: pom.xml (Maven) ===
    const pomPath = path.join(workspacePath, "pom.xml");
    if (fs.existsSync(pomPath)) {
      try {
        const rawContent = await fs.promises.readFile(pomPath, "utf-8");
        // Strip XML comments before parsing
        const content = stripXmlComments(rawContent);
        // Extract dependencies using regex (simple XML parsing)
        const depMatches = content.matchAll(
          /<dependency>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?(?:<version>([^<]+)<\/version>)?[\s\S]*?<\/dependency>/g,
        );
        for (const match of depMatches) {
          const name = `${match[1]}:${match[2]}`;
          dependencies[name] = match[3] || "*";
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze pom.xml: ${errorMessage}`);
      }
    }

    // === Java: build.gradle (Gradle) ===
    const gradlePath = path.join(workspacePath, "build.gradle");
    if (fs.existsSync(gradlePath)) {
      try {
        const content = await fs.promises.readFile(gradlePath, "utf-8");
        // Extract implementation/compile dependencies
        const depMatches = content.matchAll(
          /(?:implementation|compile|api|testImplementation)\s*[("']([^"'()]+)[)"']/g,
        );
        for (const match of depMatches) {
          const dep = match[1];
          // Parse group:artifact:version format
          const parts = dep.split(":");
          if (parts.length >= 2) {
            const name = `${parts[0]}:${parts[1]}`;
            dependencies[name] = parts[2] || "*";
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze build.gradle: ${errorMessage}`);
      }
    }

    // === PHP: composer.json ===
    const composerPath = path.join(workspacePath, "composer.json");
    if (fs.existsSync(composerPath)) {
      try {
        const composer = JSON.parse(
          await fs.promises.readFile(composerPath, "utf-8"),
        );
        Object.assign(dependencies, composer.require || {});
        Object.assign(dependencies, composer["require-dev"] || {});
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to analyze composer.json: ${errorMessage}`);
      }
    }

    return dependencies;
  }

  private async detectFrameworks(
    files: string[],
    dependencies: Record<string, string>,
  ): Promise<string[]> {
    const frameworks: Set<string> = new Set();

    // JavaScript/TypeScript frameworks
    const jsFrameworks: Record<string, string> = {
      react: "React",
      vue: "Vue.js",
      "@angular/core": "Angular",
      svelte: "Svelte",
      next: "Next.js",
      nuxt: "Nuxt.js",
      express: "Express.js",
      fastify: "Fastify",
      "@nestjs/core": "NestJS",
      hono: "Hono",
      koa: "Koa",
      "@hapi/hapi": "Hapi",
      "socket.io": "Socket.io",
      prisma: "Prisma",
      typeorm: "TypeORM",
      mongoose: "Mongoose",
      sequelize: "Sequelize",
      drizzle: "Drizzle ORM",
      webpack: "Webpack",
      vite: "Vite",
      esbuild: "esbuild",
      rollup: "Rollup",
      electron: "Electron",
      "react-native": "React Native",
    };

    // Python frameworks (by package name)
    const pyFrameworks: Record<string, string> = {
      django: "Django",
      flask: "Flask",
      fastapi: "FastAPI",
      starlette: "Starlette",
      tornado: "Tornado",
      pyramid: "Pyramid",
      aiohttp: "aiohttp",
      sqlalchemy: "SQLAlchemy",
      alembic: "Alembic",
      celery: "Celery",
      pytest: "pytest",
      pandas: "pandas",
      numpy: "NumPy",
      tensorflow: "TensorFlow",
      torch: "PyTorch",
      scikit_learn: "scikit-learn",
    };

    // Go frameworks (by module path patterns)
    const goFrameworks: Record<string, string> = {
      "github.com/gin-gonic/gin": "Gin",
      "github.com/labstack/echo": "Echo",
      "github.com/go-chi/chi": "Chi",
      "github.com/gofiber/fiber": "Fiber",
      "github.com/gorilla/mux": "Gorilla Mux",
      "gorm.io/gorm": "GORM",
      "github.com/jmoiron/sqlx": "sqlx",
    };

    // Rust frameworks (by crate name)
    const rustFrameworks: Record<string, string> = {
      actix_web: "Actix-web",
      axum: "Axum",
      rocket: "Rocket",
      warp: "Warp",
      tokio: "Tokio",
      diesel: "Diesel",
      sqlx: "SQLx",
      serde: "Serde",
    };

    // Java frameworks (by artifact patterns)
    const javaFrameworks: Record<string, string> = {
      "spring-boot": "Spring Boot",
      "spring-webmvc": "Spring MVC",
      "spring-data": "Spring Data",
      hibernate: "Hibernate",
      "jakarta.persistence": "JPA",
      "javax.persistence": "JPA",
      quarkus: "Quarkus",
      micronaut: "Micronaut",
      "jersey-server": "Jersey (JAX-RS)",
    };

    // PHP frameworks (by package name)
    const phpFrameworks: Record<string, string> = {
      "laravel/framework": "Laravel",
      "symfony/framework-bundle": "Symfony",
      "slim/slim": "Slim",
      "cakephp/cakephp": "CakePHP",
      "yiisoft/yii2": "Yii",
      "doctrine/orm": "Doctrine ORM",
    };

    // Check JS/TS dependencies
    for (const [dep, framework] of Object.entries(jsFrameworks)) {
      if (dependencies[dep] || dependencies[`@${dep}`]) {
        frameworks.add(framework);
      }
    }

    // Check Python dependencies (case insensitive, underscore/hyphen agnostic)
    for (const [dep, framework] of Object.entries(pyFrameworks)) {
      const normalizedDep = dep.toLowerCase().replace(/_/g, "-");
      const found = Object.keys(dependencies).some(
        (d) => d.toLowerCase().replace(/_/g, "-") === normalizedDep,
      );
      if (found) {
        frameworks.add(framework);
      }
    }

    // Check Go dependencies
    for (const [dep, framework] of Object.entries(goFrameworks)) {
      if (Object.keys(dependencies).some((d) => d.includes(dep))) {
        frameworks.add(framework);
      }
    }

    // Check Rust dependencies
    for (const [dep, framework] of Object.entries(rustFrameworks)) {
      const normalizedDep = dep.toLowerCase().replace(/_/g, "-");
      if (
        Object.keys(dependencies).some(
          (d) => d.toLowerCase().replace(/_/g, "-") === normalizedDep,
        )
      ) {
        frameworks.add(framework);
      }
    }

    // Check Java dependencies
    for (const [dep, framework] of Object.entries(javaFrameworks)) {
      if (
        Object.keys(dependencies).some((d) => d.toLowerCase().includes(dep))
      ) {
        frameworks.add(framework);
      }
    }

    // Check PHP dependencies
    for (const [dep, framework] of Object.entries(phpFrameworks)) {
      if (dependencies[dep]) {
        frameworks.add(framework);
      }
    }

    // File-based framework detection
    const filePatterns: Record<string, string> = {
      // JavaScript/TypeScript
      "next.config.js": "Next.js",
      "next.config.ts": "Next.js",
      "next.config.mjs": "Next.js",
      "nuxt.config.js": "Nuxt.js",
      "nuxt.config.ts": "Nuxt.js",
      "vue.config.js": "Vue.js",
      "angular.json": "Angular",
      "svelte.config.js": "Svelte",
      "svelte.config.ts": "Svelte",
      "vite.config.js": "Vite",
      "vite.config.ts": "Vite",
      "webpack.config.js": "Webpack",
      "tailwind.config.js": "Tailwind CSS",
      "tailwind.config.ts": "Tailwind CSS",
      // Python
      "manage.py": "Django",
      "wsgi.py": "WSGI Application",
      "asgi.py": "ASGI Application",
      // PHP
      artisan: "Laravel",
      "composer.json": "PHP/Composer",
      // Go
      "go.mod": "Go Modules",
      // Rust
      "Cargo.toml": "Rust/Cargo",
      // Java
      "pom.xml": "Maven",
      "build.gradle": "Gradle",
      "settings.gradle": "Gradle",
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

  parentPort.on(
    "message",
    async (message: { type: string; payload: unknown }) => {
      if (message.type === "ANALYZE_CODEBASE") {
        try {
          const result = await task.performAnalysis(
            message.payload as WorkerInputData,
          );
          parentPort?.postMessage({
            type: "ANALYSIS_COMPLETE",
            payload: result,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          parentPort?.postMessage({
            type: "ANALYSIS_ERROR",
            error: errorMessage,
          });
        }
      } else if (message.type === "CANCEL") {
        task.cancel();
      }
    },
  );
}
