/**
 * Shared types for codebase analysis
 * Single source of truth for analysis-related interfaces
 */

/**
 * Code snippet extracted from important files
 */
export interface CodeSnippet {
  file: string;
  content: string;
  language: string;
  summary?: string;
  priority?: number;
}

/**
 * API endpoint detected in the codebase
 */
export interface EndpointData {
  method: string;
  path: string;
  file?: string;
  line?: number;
  handler?: string;
}

/**
 * Data model/class/interface detected in the codebase
 */
export interface ModelData {
  name: string;
  type: string;
  file?: string;
  extends?: string;
  implements?: string[];
  methods?: string[];
  properties?: string[];
  isExported?: boolean;
  startLine?: number;
}

/**
 * Dependency information
 */
export interface DependencyData {
  name: string;
  version: string;
}

/**
 * Domain relationship between entities
 */
export interface RelationshipData {
  entity: string;
  relatedEntities?: string[];
}

/**
 * Directory structure data
 */
export interface DirectoryData {
  dir: string;
  files: string[];
}

/**
 * Summary statistics for the analysis
 */
export interface AnalysisSummary {
  totalFiles: number;
  totalLines: number;
  languageDistribution: Record<string, number>;
  complexity: "low" | "medium" | "high";
}

/**
 * Git state information
 */
export interface GitState {
  branch: string;
  commitHash?: string;
  isDirty?: boolean;
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  createdAt: string;
  duration?: number;
  version?: string;
}

/**
 * Complete analysis result from the worker
 */
export interface AnalysisResult {
  frameworks: string[];
  dependencies: Record<string, string>;
  files: string[];
  apiEndpoints: EndpointData[];
  dataModels: ModelData[];
  databaseSchema: any;
  domainRelationships: RelationshipData[];
  fileContents: Map<string, string>;
  codeSnippets: CodeSnippet[];
  summary: AnalysisSummary;
}

/**
 * Cached analysis with additional metadata
 * Used by context generation - some fields may be optional depending on cache source
 */
export interface CachedAnalysis {
  // Required fields
  summary: AnalysisSummary;
  files: string[];

  // Optional fields (may not exist in older cached data)
  frameworks?: string[];
  dependencies?: Record<string, string>;
  apiEndpoints?: EndpointData[];
  dataModels?: ModelData[];
  databaseSchema?: any;
  domainRelationships?: RelationshipData[];
  codeSnippets?: CodeSnippet[];
  gitState?: GitState;
  analysisMetadata?: AnalysisMetadata;
}

/**
 * Budget item for token allocation
 */
export interface BudgetItem<T> {
  data: T;
  size: number;
  priority: number;
}

/**
 * Worker input data for analysis
 */
export interface WorkerInputData {
  workspacePath: string;
  files: string[];
  grammarsPath?: string;
}

/**
 * Worker message for communication
 */
export interface WorkerMessage {
  type:
    | "ANALYZE_CODEBASE"
    | "ANALYSIS_COMPLETE"
    | "ANALYSIS_ERROR"
    | "ANALYSIS_PROGRESS"
    | "LOG";
  payload?: any;
  error?: string;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  level?: string;
  message?: string;
  data?: any;
}

/**
 * Codebase analysis worker data
 */
export interface CodebaseAnalysisWorkerData {
  workspacePath: string;
  filePatterns: string[];
  excludePatterns: string[];
  maxFiles: number;
  grammarsPath?: string;
}
