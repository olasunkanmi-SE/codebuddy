import { FileAnalyzer, AnalysisResult } from "./index";

export class TypeScriptAnalyzer implements FileAnalyzer {
  private readonly importRegex = /import\s+[^'"]*from\s+['"]([^'"]+)['"]/gi;
  private readonly exportRegex = /export\s+(?:default\s+)?(?:class|function|const|interface|type|enum)\s+(\w+)/gi;
  private readonly classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/gi;
  private readonly functionRegex = /function\s+(\w+)\s*\([^)]*\)/gi;
  private readonly methodRegex = /(?:public|private|protected)?\s*(\w+)\s*\([^)]*\)\s*[:?]/gi;

  canAnalyze(filePath: string): boolean {
    return /\.(ts|tsx)$/.test(filePath);
  }

  analyze(content: string, filePath: string): AnalysisResult {
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const classes = this.extractClasses(content);
    const functions = this.extractFunctions(content);
    const components = filePath.includes(".tsx") ? this.extractReactComponents(content) : [];

    return {
      imports,
      exports,
      classes,
      functions,
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
      exports.push(match[1]);
    }
    return exports;
  }

  private extractClasses(content: string): any[] {
    const classes: any[] = [];
    this.classRegex.lastIndex = 0;
    let match;
    while ((match = this.classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2] || null,
        implements: match[3]
          ? match[3]
              .trim()
              .split(",")
              .map((i) => i.trim())
          : [],
        methods: this.extractMethods(content, match.index),
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

  private extractMethods(content: string, classStartIndex: number): any[] {
    const methods: any[] = [];
    const classContent = content.slice(classStartIndex);

    this.methodRegex.lastIndex = 0;
    let match;
    while ((match = this.methodRegex.exec(classContent)) !== null) {
      // Stop if we've gone beyond the class definition
      const nextClassIndex = classContent.indexOf("class ", match.index + 1);
      if (nextClassIndex !== -1 && nextClassIndex < match.index) {
        break;
      }

      methods.push({
        name: match[1],
        type: "method",
      });
    }
    return methods;
  }

  private extractReactComponents(content: string): any[] {
    const components: any[] = [];
    const componentRegex = /(?:export\s+(?:default\s+)?)?(?:const|function)\s+([A-Z]\w*)\s*[=:]/gi;

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
