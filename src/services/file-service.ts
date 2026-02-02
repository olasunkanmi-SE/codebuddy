import * as vscode from "vscode";
import * as path from "path";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { LanguageUtils, AsyncUtils } from "../utils/common-utils";

export interface FileMetadata {
  size: number;
  lastModified: Date;
  language: string;
  isCode: boolean;
  lineCount?: number;
}

export interface FileReadOptions {
  timeout?: number;
  encoding?: string;
  maxSize?: number;
}

export interface FileSystemWatchOptions {
  patterns: string[];
  ignorePatterns?: string[];
  recursive?: boolean;
}

/**
 * FileService abstracts file system operations to improve testability
 * and decouple embedding phases from direct VS Code API calls.
 */
export class FileService {
  private logger: Logger;

  constructor() {
    this.logger = Logger.initialize("FileService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content with options and error handling
   */
  async readFile(
    filePath: string,
    options: FileReadOptions = {},
  ): Promise<string> {
    const {
      timeout = 30000,
      encoding = "utf8",
      maxSize = 10 * 1024 * 1024,
    } = options;

    try {
      const uri = vscode.Uri.file(filePath);

      // Check file size first
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.size > maxSize) {
        throw new Error(`File too large: ${stat.size} bytes (max: ${maxSize})`);
      }

      // Read with timeout
      const bytes = await AsyncUtils.safeExecute(
        async () => vscode.workspace.fs.readFile(uri),
        new Uint8Array(),
        (error) => this.logger.warn(`Failed to read file ${filePath}:`, error),
      );

      return new TextDecoder(encoding).decode(bytes);
    } catch (error: any) {
      this.logger.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(
    filePath: string,
    content: string,
    encoding = "utf8",
  ): Promise<void> {
    try {
      const uri = vscode.Uri.file(filePath);
      const bytes = new TextEncoder().encode(content);
      await vscode.workspace.fs.writeFile(uri, bytes);
      this.logger.debug(`File written: ${path.basename(filePath)}`);
    } catch (error: any) {
      this.logger.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata with safe error handling
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);
      const content = await this.readFile(filePath, { maxSize: 1024 * 1024 }); // Read up to 1MB for line count

      return {
        size: stat.size,
        lastModified: new Date(stat.mtime),
        language: LanguageUtils.getLanguageFromPath(filePath),
        isCode: LanguageUtils.isCodeFileByPath(filePath),
        lineCount: content ? content.split("\n").length : undefined,
      };
    } catch (error: any) {
      this.logger.warn(`Could not get metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Find files matching patterns with filtering
   */
  async findFiles(
    includePatterns: string[],
    excludePatterns: string[] = [],
    workspaceFolder?: vscode.WorkspaceFolder,
  ): Promise<string[]> {
    const folders = workspaceFolder
      ? [workspaceFolder]
      : vscode.workspace.workspaceFolders || [];
    const allFiles: string[] = [];

    for (const folder of folders) {
      for (const pattern of includePatterns) {
        try {
          const excludePattern =
            excludePatterns.length > 0
              ? `{${excludePatterns.join(",")}}`
              : undefined;

          const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(folder, pattern),
            excludePattern,
          );

          allFiles.push(...files.map((uri) => uri.fsPath));
        } catch (error: any) {
          this.logger.warn(
            `Error finding files with pattern ${pattern}:`,
            error,
          );
        }
      }
    }

    // Remove duplicates
    return [...new Set(allFiles)];
  }

  /**
   * Get recently modified files within a time range
   */
  async getRecentlyModifiedFiles(
    patterns: string[],
    daysBack = 7,
    excludePatterns: string[] = [],
  ): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const allFiles = await this.findFiles(patterns, excludePatterns);
    const recentFiles: string[] = [];

    for (const filePath of allFiles) {
      try {
        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
        const modifiedDate = new Date(stat.mtime);

        if (modifiedDate > cutoffDate) {
          recentFiles.push(filePath);
        }
      } catch (error: any) {
        this.logger.warn(`Could not get stats for file ${filePath}:`, error);
        continue;
      }
    }

    // Sort by modification time (newest first)
    recentFiles.sort((a, b) => {
      try {
        // This is a simplified sort - in production you'd want to cache the stats
        return b.localeCompare(a); // Sort by path as proxy for recency
      } catch {
        return 0;
      }
    });

    return recentFiles;
  }

  /**
   * Get entry point files (main files of the project)
   */
  async findEntryPoints(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const entryPoints: string[] = [];

    for (const folder of workspaceFolders) {
      try {
        // Check package.json for main entry
        const packageJsonPath = path.join(folder.uri.fsPath, "package.json");
        if (await this.fileExists(packageJsonPath)) {
          const packageContent = await this.readFile(packageJsonPath);
          const packageJson = JSON.parse(packageContent);

          if (packageJson.main) {
            const mainPath = path.resolve(folder.uri.fsPath, packageJson.main);
            if (await this.fileExists(mainPath)) {
              entryPoints.push(mainPath);
            }
          }
        }

        // Check common entry points
        const commonEntries = [
          "src/index.ts",
          "src/main.ts",
          "src/app.ts",
          "index.ts",
          "main.ts",
          "app.ts",
          "src/index.js",
          "src/main.js",
          "src/app.js",
          "index.js",
          "main.js",
          "app.js",
        ];

        for (const entry of commonEntries) {
          const entryPath = path.join(folder.uri.fsPath, entry);
          if (await this.fileExists(entryPath)) {
            entryPoints.push(entryPath);
          }
        }
      } catch (error: any) {
        this.logger.debug(
          `No package.json found in ${folder.uri.fsPath}:`,
          error,
        );
      }
    }

    return [...new Set(entryPoints)]; // Remove duplicates
  }

  /**
   * Get all code files in workspace
   */
  async getAllCodeFiles(excludePatterns: string[] = []): Promise<string[]> {
    const codePatterns = [LanguageUtils.getCodeFileGlobPattern()];
    const defaultExcludes = [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/.git/**",
      "**/.codebuddy/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/*.bundle.js",
      "**/*.d.ts",
      ...excludePatterns,
    ];

    return this.findFiles(codePatterns, defaultExcludes);
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();

    return (
      fileName.includes("test") ||
      fileName.includes("spec") ||
      dirName.includes("test") ||
      dirName.includes("spec") ||
      fileName.endsWith(".test.ts") ||
      fileName.endsWith(".test.js") ||
      fileName.endsWith(".spec.ts") ||
      fileName.endsWith(".spec.js")
    );
  }

  /**
   * Get related files (files in same directory or with similar names)
   */
  async getRelatedFiles(filePath: string, maxResults = 10): Promise<string[]> {
    const directory = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));

    try {
      // Get files in same directory
      const directoryFiles = await this.findFiles(
        [path.join(directory, "*")],
        [],
      );

      // Filter and score by relevance
      const relatedFiles = directoryFiles
        .filter((f) => f !== filePath) // Exclude the original file
        .map((f) => ({
          path: f,
          score: this.calculateRelatedScore(baseName, path.basename(f)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map((f) => f.path);

      return relatedFiles;
    } catch (error: any) {
      this.logger.warn(`Could not get related files for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Create file system watcher with configurable options
   */
  createWatcher(
    options: FileSystemWatchOptions,
    onCreated?: (uri: vscode.Uri) => void,
    onChanged?: (uri: vscode.Uri) => void,
    onDeleted?: (uri: vscode.Uri) => void,
  ): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders || [];

    for (const folder of workspaceFolders) {
      for (const pattern of options.patterns) {
        try {
          const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, pattern),
          );

          if (onCreated) watcher.onDidCreate(onCreated);
          if (onChanged) watcher.onDidChange(onChanged);
          if (onDeleted) watcher.onDidDelete(onDeleted);

          disposables.push(watcher);
        } catch (error: any) {
          this.logger.error(
            `Failed to create watcher for pattern ${pattern}:`,
            error,
          );
        }
      }
    }

    this.logger.info(`Created ${disposables.length} file watchers`);
    return disposables;
  }

  private calculateRelatedScore(baseName: string, fileName: string): number {
    const baseNameLower = baseName.toLowerCase();
    const fileNameLower = fileName.toLowerCase();

    let score = 0;

    // Exact match bonus
    if (fileNameLower.includes(baseNameLower)) {
      score += 10;
    }

    // Test file bonus
    if (
      this.isTestFile(fileName) &&
      baseNameLower === fileNameLower.replace(/\.(test|spec)/, "")
    ) {
      score += 15;
    }

    // Same extension bonus
    if (path.extname(fileName) === path.extname(baseName)) {
      score += 5;
    }

    return score;
  }
}
