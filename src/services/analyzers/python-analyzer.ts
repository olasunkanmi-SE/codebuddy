import { FileAnalyzer, AnalysisResult } from "./index";

export class PythonAnalyzer implements FileAnalyzer {
  private readonly importRegex = /(?:from\s+([^\s]+)\s+import|import\s+([^\s,]+))/gi;
  private readonly classRegex = /class\s+(\w+)(?:\([^)]*\))?\s*:/gi;
  private readonly functionRegex = /def\s+(\w+)\s*\([^)]*\)\s*:/gi;

  canAnalyze(filePath: string): boolean {
    return filePath.endsWith(".py");
  }

  analyze(content: string, filePath: string): AnalysisResult {
    const imports = this.extractImports(content);
    const classes = this.extractClasses(content);
    const functions = this.extractFunctions(content);

    return {
      imports,
      classes,
      functions,
    };
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    this.importRegex.lastIndex = 0;
    let match;
    while ((match = this.importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }
    return imports;
  }

  private extractClasses(content: string): any[] {
    const classes: any[] = [];
    this.classRegex.lastIndex = 0;
    let match;
    while ((match = this.classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        type: "class",
      });
    }
    return classes;
  }

  private extractFunctions(content: string): any[] {
    const functions: any[] = [];
    this.functionRegex.lastIndex = 0;
    let match;
    while ((match = this.functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: "function",
      });
    }
    return functions;
  }
}
