import { FileAnalyzer, AnalysisResult } from "./index";

export class ConfigAnalyzer implements FileAnalyzer {
  canAnalyze(filePath: string): boolean {
    return (
      filePath.endsWith("package.json") ||
      filePath.endsWith("tsconfig.json") ||
      filePath.endsWith(".config.js") ||
      filePath.endsWith(".config.ts") ||
      filePath.endsWith("Dockerfile") ||
      filePath.endsWith("docker-compose.yml") ||
      filePath.endsWith(".env")
    );
  }

  analyze(content: string, filePath: string): AnalysisResult {
    if (filePath.endsWith("package.json")) {
      return this.analyzePackageJson(content);
    }

    if (filePath.endsWith("tsconfig.json")) {
      return this.analyzeTsConfig(content);
    }

    if (filePath.includes("docker")) {
      return this.analyzeDocker(content);
    }

    return {};
  }

  private analyzePackageJson(content: string): AnalysisResult {
    try {
      const pkg = JSON.parse(content);
      const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

      return {
        dependencies,
        scripts: Object.keys(pkg.scripts || {}),
        name: pkg.name,
        version: pkg.version,
      };
    } catch {
      return {};
    }
  }

  private analyzeTsConfig(content: string): AnalysisResult {
    try {
      const config = JSON.parse(content);
      return {
        compilerOptions: Object.keys(config.compilerOptions || {}),
        include: config.include || [],
        exclude: config.exclude || [],
      };
    } catch {
      return {};
    }
  }

  private analyzeDocker(content: string): AnalysisResult {
    const fromRegex = /FROM\s+([^\s]+)/gi;
    const runRegex = /RUN\s+([^\n]+)/gi;
    const baseImages: string[] = [];
    const commands: string[] = [];

    let match;
    while ((match = fromRegex.exec(content)) !== null) {
      baseImages.push(match[1]);
    }

    while ((match = runRegex.exec(content)) !== null) {
      commands.push(match[1]);
    }

    return {
      baseImages,
      commands,
    };
  }
}
