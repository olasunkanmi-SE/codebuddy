/**
 * Configuration interface for documentation generation
 */
export interface DocumentationConfig {
  includeReadme: boolean;
  includeAPI: boolean;
  includeArchitecture: boolean;
  includeComponents: boolean;
  includeUsage: boolean;
  includeContributing: boolean;
  includeLicense: boolean;
  outputFormat: "markdown" | "html" | "both";
  diagramFormat: "mermaid" | "plantuml" | "ascii";
  outputDirectory: string;
}

/**
 * Interface for different documentation sections
 */
export interface IDocumentationSection {
  readonly sectionName: string;
  generate(
    context: CodebaseContext,
    config: DocumentationConfig,
  ): Promise<DocumentationResult>;
}

/**
 * Codebase context interface
 */
export interface CodebaseContext {
  files: FileInfo[];
  structure: ProjectStructure;
  dependencies: DependencyInfo[];
  patterns: DetectedPattern[];
  technologies: string[];
}

/**
 * File information interface
 */
export interface FileInfo {
  path: string;
  content: string;
  type: string;
  size: number;
}

/**
 * Project structure interface
 */
export interface ProjectStructure {
  directories: string[];
  mainFiles: string[];
  configFiles: string[];
  testFiles: string[];
}

/**
 * Dependency information interface
 */
export interface DependencyInfo {
  name: string;
  version: string;
  type: "dependency" | "devDependency" | "peerDependency";
}

/**
 * Detected pattern interface
 */
export interface DetectedPattern {
  name: string;
  confidence: number;
  files: string[];
  description: string;
}

/**
 * Documentation result interface
 */
export interface DocumentationResult {
  fileName: string;
  content: string;
  metadata: DocumentationMetadata;
}

/**
 * Documentation metadata interface
 */
export interface DocumentationMetadata {
  generatedAt: Date;
  version: string;
  sections: string[];
  wordCount: number;
}

/**
 * Pattern extraction service interface
 */
export interface IPatternExtractionService {
  extractAPIEndpoints(content: string): Promise<APIEndpoint[]>;
  extractComponents(content: string): Promise<ComponentInfo[]>;
  extractArchitecturePatterns(content: string): Promise<DetectedPattern[]>;
}

/**
 * API endpoint interface
 */
export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: Parameter[];
  responses: Response[];
}

/**
 * Parameter interface
 */
export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/**
 * Response interface
 */
export interface Response {
  status: number;
  description: string;
  schema?: string;
}

/**
 * Component information interface
 */
export interface ComponentInfo {
  name: string;
  type: string;
  description: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
}

/**
 * Method information interface
 */
export interface MethodInfo {
  name: string;
  parameters: string[];
  returnType: string;
  description: string;
}

/**
 * Property information interface
 */
export interface PropertyInfo {
  name: string;
  type: string;
  description: string;
}
