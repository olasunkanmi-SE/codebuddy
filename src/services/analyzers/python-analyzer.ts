import { FileAnalyzer, AnalysisResult } from "./index";

export class PythonAnalyzer implements FileAnalyzer {
  private static readonly importRegex =
    /(?:from\s+([^\s]+)\s+import|import\s+([^\s,]+))/gi;
  private static readonly classRegex = /class\s+(\w+)(?:\([^)]*\))?\s*:/gi;
  private static readonly functionRegex = /def\s+(\w+)\s*\([^)]*\)\s*:/gi;

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
    PythonAnalyzer.importRegex.lastIndex = 0;
    let match;
    while ((match = PythonAnalyzer.importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }
    return imports;
  }

  private extractClasses(content: string): any[] {
    const classes: any[] = [];
    PythonAnalyzer.classRegex.lastIndex = 0;
    let match;
    while ((match = PythonAnalyzer.classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        type: "class",
      });
    }
    return classes;
  }

  private extractFunctions(content: string): any[] {
    const functions: any[] = [];
    PythonAnalyzer.functionRegex.lastIndex = 0;
    let match;
    while ((match = PythonAnalyzer.functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: "function",
      });
    }
    return functions;
  }
}
