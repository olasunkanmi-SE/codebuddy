import * as vscode from "vscode";
import * as path from "path";

/**
 * Utility class for language and file type operations
 */
export class LanguageUtils {
  /**
   * Determines if a file is a code file based on its language ID
   */
  static isCodeFile(languageId: string): boolean {
    const codeLanguages = [
      "typescript",
      "javascript",
      "python",
      "java",
      "cpp",
      "c",
      "csharp",
      "php",
      "ruby",
      "go",
      "rust",
      "swift",
      "kotlin",
      "scala",
      "r",
      "objective-c",
      "vue",
      "jsx",
      "tsx",
      "json",
      "yaml",
      "xml",
      "html",
      "css",
    ];
    return codeLanguages.includes(languageId);
  }

  /**
   * Gets the language ID from a file path
   */
  static getLanguageFromPath(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".js": "javascript",
      ".tsx": "tsx",
      ".jsx": "jsx",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".cs": "csharp",
      ".php": "php",
      ".rb": "ruby",
      ".go": "go",
      ".rs": "rust",
      ".swift": "swift",
      ".kt": "kotlin",
      ".scala": "scala",
      ".r": "r",
      ".m": "objective-c",
      ".vue": "vue",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".xml": "xml",
      ".html": "html",
      ".css": "css",
    };
    return languageMap[extension] || "plaintext";
  }

  /**
   * Checks if a file is a code file based on its path
   */
  static isCodeFileByPath(filePath: string): boolean {
    const languageId = this.getLanguageFromPath(filePath);
    return this.isCodeFile(languageId);
  }

  /**
   * Gets file extensions for code files
   */
  static getCodeFileExtensions(): string[] {
    return [
      "ts",
      "js",
      "tsx",
      "jsx",
      "py",
      "java",
      "cpp",
      "c",
      "cs",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "scala",
      "r",
      "m",
      "vue",
    ];
  }

  /**
   * Creates a glob pattern for code files
   */
  static getCodeFileGlobPattern(): string {
    const extensions = this.getCodeFileExtensions().join(",");
    return `**/*.{${extensions}}`;
  }
}

/**
 * Utility class for file system operations
 */
export class FileUtils {
  /**
   * Safely gets file stats with error handling
   */
  static async safeGetStats(uri: vscode.Uri): Promise<vscode.FileStat | null> {
    try {
      return await vscode.workspace.fs.stat(uri);
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Checks if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the relative path from workspace root
   */
  static getRelativePath(filePath: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return path.basename(filePath);
    }
    return path.relative(workspaceFolder.uri.fsPath, filePath);
  }

  /**
   * Filters out ignored files based on common patterns
   */
  static shouldIgnoreFile(filePath: string): boolean {
    const ignoredPatterns = [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /dist/,
      /build/,
      /out/,
      /target/,
      /bin/,
      /obj/,
      /\.next/,
      /coverage/,
      /\.nyc_output/,
      /\.cache/,
      /temp/,
      /tmp/,
      /\.DS_Store/,
      /Thumbs\.db/,
    ];

    return ignoredPatterns.some((pattern) => pattern.test(filePath));
  }

  /**
   * Gets priority score for a file (higher = more important)
   */
  static getFilePriority(filePath: string): number {
    const fileName = path.basename(filePath).toLowerCase();
    const directory = path.dirname(filePath).toLowerCase();

    // Entry points and config files
    if (
      [
        "index.ts",
        "index.js",
        "main.ts",
        "main.js",
        "app.ts",
        "app.js",
      ].includes(fileName)
    ) {
      return 100;
    }

    // Config files
    if (
      [
        "package.json",
        "tsconfig.json",
        "webpack.config.js",
        "vite.config.ts",
      ].includes(fileName)
    ) {
      return 90;
    }

    // README and documentation
    if (fileName.startsWith("readme") || fileName.includes("doc")) {
      return 80;
    }

    // Source directories
    if (directory.includes("src") || directory.includes("lib")) {
      return 70;
    }

    // Test files
    if (
      fileName.includes("test") ||
      fileName.includes("spec") ||
      directory.includes("test")
    ) {
      return 60;
    }

    // Default priority
    return 50;
  }
}

/**
 * Utility class for async operations
 */
export class AsyncUtils {
  /**
   * Delays execution for specified milliseconds
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Processes items in batches with optional delay between batches
   */
  static async processBatches<T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    batchSize: number = 10,
    delayMs: number = 0,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(processor));

      if (delayMs > 0 && i + batchSize < items.length) {
        await this.delay(delayMs);
      }
    }
  }

  /**
   * Processes items in batches with progress reporting
   */
  static async processBatchesWithProgress<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<void>,
    batchSize: number = 10,
    progressCallback?: (current: number, total: number) => void,
  ): Promise<void> {
    let processed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item, batchIndex) => {
          const globalIndex = i + batchIndex;
          await processor(item, globalIndex);
          processed++;

          if (progressCallback) {
            progressCallback(processed, items.length);
          }
        }),
      );
    }
  }

  /**
   * Wraps an async operation with error handling
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T,
    errorHandler?: (error: Error) => void,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (errorHandler) {
        errorHandler(error as Error);
      }
      return fallback;
    }
  }
}

/**
 * Utility class for disposable management
 */
export class DisposableUtils {
  /**
   * Safely disposes of multiple disposables
   */
  static safeDispose(disposables: vscode.Disposable[]): void {
    disposables.forEach((disposable) => {
      try {
        disposable.dispose();
      } catch (error: any) {
        console.warn("Error disposing resource:", error);
      }
    });
  }

  /**
   * Creates a composite disposable from multiple disposables
   */
  static createComposite(disposables: vscode.Disposable[]): vscode.Disposable {
    return new vscode.Disposable(() => {
      this.safeDispose(disposables);
    });
  }
}
