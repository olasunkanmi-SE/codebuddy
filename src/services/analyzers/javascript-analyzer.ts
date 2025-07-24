import { FileAnalyzer, AnalysisResult } from "./index";

export class JavaScriptAnalyzer implements FileAnalyzer {
  private readonly importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/gi;
  private readonly exportRegex =
    /(?:export|module\.exports)\s*[=.]?\s*(?:default\s+)?(?:class|function|const)?\s*(\w+)?/gi;
  private readonly functionRegex = /function\s+(\w+)\s*\([^)]*\)/gi;
  private readonly classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/gi;

  canAnalyze(filePath: string): boolean {
    return /\.(js|jsx|mjs|cjs)$/.test(filePath);
  }

  analyze(content: string, filePath: string): AnalysisResult {
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const functions = this.extractFunctions(content);
    const classes = this.extractClasses(content);
    const components = filePath.includes(".jsx") ? this.extractReactComponents(content) : [];

    return {
      imports,
      exports,
      functions,
      classes,
      components,
    };
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    this.importRegex.lastIndex = 0;
    let match;
    while ((match = this.importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    this.exportRegex.lastIndex = 0;
    let match;
    while ((match = this.exportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      }
    }
    return exports;
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

  private extractClasses(content: string): any[] {
    const classes: any[] = [];
    this.classRegex.lastIndex = 0;
    let match;
    while ((match = this.classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2] || null,
      });
    }
    return classes;
  }

  private extractReactComponents(content: string): any[] {
    const components: any[] = [];
    const componentRegex = /(?:const|function)\s+([A-Z]\w*)\s*[=:]/gi;

    componentRegex.lastIndex = 0;
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      components.push({
        name: match[1],
        type: "component",
      });
    }
    return components;
  }
}
