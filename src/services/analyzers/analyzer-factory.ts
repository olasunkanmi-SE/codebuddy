import { FileAnalyzer } from "./index";
import { TypeScriptAnalyzer } from "./typescript-analyzer";
import { JavaScriptAnalyzer } from "./javascript-analyzer";
import { PythonAnalyzer } from "./python-analyzer";
import { ConfigAnalyzer } from "./config-analyzer";

export class AnalyzerFactory {
  private readonly analyzers: FileAnalyzer[] = [
    new TypeScriptAnalyzer(),
    new JavaScriptAnalyzer(),
    new PythonAnalyzer(),
    new ConfigAnalyzer(),
  ];

  getAnalyzer(filePath: string): FileAnalyzer | null {
    return (
      this.analyzers.find((analyzer) => analyzer.canAnalyze(filePath)) || null
    );
  }

  getAllAnalyzers(): FileAnalyzer[] {
    return [...this.analyzers];
  }
}
