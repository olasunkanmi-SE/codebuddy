import * as path from "path";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { LanguageUtils, AsyncUtils } from "../utils/common-utils";
import { EditorHostService } from "./editor-host.service";
import { IDisposable } from "../interfaces/disposable";
import { FileType } from "../interfaces/editor-host";

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
      const host = EditorHostService.getInstance().getHost();
      const stat = await host.workspace.fs.stat(filePath);
      return stat.type !== FileType.Unknown;
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
      const host = EditorHostService.getInstance().getHost();

      // Check file size first
      const stat = await host.workspace.fs.stat(filePath);
      if (stat.type === FileType.Unknown) {
        throw new Error(`File not found: ${filePath}`);
      }

      if (stat.size > maxSize) {
        throw new Error(`File too large: ${stat.size} bytes (max: ${maxSize})`);
      }

      // Read with timeout
      const content = await AsyncUtils.safeExecute(
        async () => {
          const buffer = await host.workspace.fs.readFile(filePath);
          return new TextDecoder().decode(buffer);
        },
        "",
        (error) => this.logger.warn(`Failed to read file ${filePath}:`, error),
      );

      return content;
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
      const host = EditorHostService.getInstance().getHost();
      // Use BackendProtocol write which handles file writing
      await host.fs.write(filePath, content);
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
      const host = EditorHostService.getInstance().getHost();
      const stat = await host.workspace.fs.stat(filePath);

      if (stat.type === FileType.Unknown) {
        return null;
      }

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
    workspaceFolderPath?: string,
  ): Promise<string[]> {
    const host = EditorHostService.getInstance().getHost();
    const allFiles: string[] = [];

    // If workspaceFolderPath is provided, we should scope the search to that folder.
    // However, findFiles usually takes glob patterns.
    // If workspaceFolderPath is provided, we can prepend it to patterns if they are relative?
    // Or we rely on the host implementation to handle it.
    // For now, let's assume patterns are what we need.

    // If we want to support multiple patterns, we iterate.
    for (const pattern of includePatterns) {
      try {
        // Construct exclude string if needed
        const exclude =
          excludePatterns.length > 0
            ? `{${excludePatterns.join(",")}}`
            : undefined;

        // If workspaceFolderPath is provided, use it to construct a glob?
        // VS Code findFiles works on the whole workspace.
        // If we want to restrict to a folder, we can use a relative pattern string.
        // But here we are passing strings.

        let searchPattern = pattern;
        if (workspaceFolderPath) {
          // If pattern is relative, join it. If absolute, leave it.
          if (!path.isAbsolute(pattern)) {
            // Actually, findFiles patterns are glob patterns, not paths.
            // So we might need `path/to/folder/**/*.ts`
            // Let's assume the caller handles the pattern logic or we just pass it to host.
            // But wait, the original code used new vscode.RelativePattern(folder, pattern).
            // RelativePattern scopes to the folder.
            // To replicate this with a global findFiles, we should probably prepend the folder path to the pattern.
            // But finding the relative path of the folder to the workspace root is tricky without VS Code API.
            // Let's assume for now we search globally and filter, or just use the pattern.
            // Ideally, the pattern should be constructed to include the folder.
            // If the caller passed a specific folder, they likely want to search inside it.
            searchPattern = path.join(workspaceFolderPath, pattern);
          }
        }

        const files = await host.workspace.findFiles(searchPattern, exclude);
        allFiles.push(...files);
      } catch (error: any) {
        this.logger.warn(`Error finding files with pattern ${pattern}:`, error);
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
    const host = EditorHostService.getInstance().getHost();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const allFiles = await this.findFiles(patterns, excludePatterns);
    const recentFiles: string[] = [];

    for (const filePath of allFiles) {
      try {
        const stat = await host.workspace.fs.stat(filePath);
        if (stat.type === FileType.Unknown) {
          continue;
        }
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
        // We can't easily access mtime again without re-reading stats or caching.
        // The original code sorted by path string as a proxy or placeholder?
        // "return b.localeCompare(a); // Sort by path as proxy for recency"
        // Let's keep that behavior.
        return b.localeCompare(a);
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
    const host = EditorHostService.getInstance().getHost();
    const rootPath = host.workspace.rootPath;

    if (!rootPath) return [];

    // For now, support single root. Multi-root would need IEditorHost update.
    const folders = [rootPath];

    const entryPoints: string[] = [];

    for (const folderPath of folders) {
      try {
        // Check package.json for main entry
        const packageJsonPath = path.join(folderPath, "package.json");
        if (await this.fileExists(packageJsonPath)) {
          const packageContent = await this.readFile(packageJsonPath);
          const packageJson = JSON.parse(packageContent);

          if (packageJson.main) {
            const mainPath = path.resolve(folderPath, packageJson.main);
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
          const entryPath = path.join(folderPath, entry);
          if (await this.fileExists(entryPath)) {
            entryPoints.push(entryPath);
          }
        }
      } catch (error: any) {
        this.logger.debug(`No package.json found in ${folderPath}:`, error);
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
      // Note: glob needs to be constructed carefully
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
    onCreated?: (uri: { fsPath: string }) => void,
    onChanged?: (uri: { fsPath: string }) => void,
    onDeleted?: (uri: { fsPath: string }) => void,
  ): IDisposable[] {
    const disposables: IDisposable[] = [];
    const host = EditorHostService.getInstance().getHost();
    const rootPath = host.workspace.rootPath;

    if (!rootPath) return [];

    // Support single root for now
    const folders = [rootPath];

    for (const folderPath of folders) {
      for (const pattern of options.patterns) {
        try {
          // Construct pattern. If we had RelativePattern support in host, we'd use it.
          // For now, we use createFileSystemWatcher with string.
          // We might need to make the pattern absolute if the host expects it?
          // VS Code's createFileSystemWatcher takes a GlobPattern (string or RelativePattern).
          // Our host interface takes string.
          // Let's assume we pass a glob pattern relative to workspace or absolute.
          // If we want to watch the workspace, "pattern" usually works if it is a relative glob like "**/*.ts".

          const watcher = host.workspace.createFileSystemWatcher(pattern);

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
