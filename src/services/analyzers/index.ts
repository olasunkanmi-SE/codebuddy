/**
 * File-specific analyzers for different file types
 * Implements Strategy Pattern for maintainable and testable code analysis
 */

export interface FileAnalyzer {
  canAnalyze(filePath: string): boolean;
  analyze(content: string, filePath: string): any;
}

export interface AnalysisResult {
  imports?: string[];
  exports?: string[];
  classes?: any[];
  functions?: any[];
  components?: any[];
  properties?: any[];
  dependencies?: string[];
  models?: any[];
  routes?: any[];
  schema?: any;
  [key: string]: any;
}
