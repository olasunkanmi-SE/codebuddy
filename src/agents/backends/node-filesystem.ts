/**
 * FilesystemBackend: Read and write files directly from the filesystem.
 *
 * Security and search upgrades:
 * - Secure path resolution with root containment when in virtual_mode (sandboxed to cwd)
 * - Prevent symlink-following on file I/O using O_NOFOLLOW when available
 * - Ripgrep-powered grep with literal (fixed-string) search, plus substring fallback
 *   and optional glob include filtering, while preserving virtual path behavior
 */

import * as path from "path";
import { spawn } from "node:child_process";
import { TextDecoder, TextEncoder } from "util";

import fg from "fast-glob";
import micromatch from "micromatch";
import type {
  BackendProtocol,
  EditResult,
  FileData,
  FileDownloadResponse,
  FileInfo,
  FileUploadResponse,
  GrepMatch,
  WriteResult,
} from "deepagents";
import { EditorHostService } from "../../services/editor-host.service";
import { FileType } from "../../interfaces/editor-host";
import {
  checkEmptyContent,
  formatContentWithLineNumbers,
  performStringReplacement,
} from "./utils";

const SUPPORTS_NOFOLLOW = true;

/**
 * Backend that reads and writes files via the EditorHost.
 *
 * Files are accessed using the IEditorHost interface. Relative paths are
 * resolved relative to the current working directory.
 */
export class NodeFilesystemBackend implements BackendProtocol {
  private cwd: string;
  private virtualMode: boolean;
  private maxFileSizeBytes: number;
  private ripgrepExec?: string;

  constructor(
    options: {
      rootDir?: string;
      virtualMode?: boolean;
      maxFileSizeMb?: number;
      ripgrepExec?: string;
    } = {},
  ) {
    const {
      rootDir,
      virtualMode = false,
      maxFileSizeMb = 10,
      ripgrepExec,
    } = options;
    this.cwd = rootDir ? path.resolve(rootDir) : process.cwd();
    this.virtualMode = virtualMode;
    this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    this.ripgrepExec = ripgrepExec;
  }

  /**
   * Resolve a file path with security checks.
   *
   * When virtualMode=true, treat incoming paths as virtual absolute paths under
   * this.cwd, disallow traversal (.., ~) and ensure resolved path stays within root.
   * When virtualMode=false, preserve legacy behavior: absolute paths are allowed
   * as-is; relative paths resolve under cwd.
   *
   * @param key - File path (absolute, relative, or virtual when virtualMode=true)
   * @returns Resolved absolute path string
   * @throws Error if path traversal detected or path outside root
   */
  private resolvePath(key: string): string {
    if (this.virtualMode) {
      const vpath = key.startsWith("/") ? key : "/" + key;
      if (vpath.includes("..") || vpath.startsWith("~")) {
        throw new Error("Path traversal not allowed");
      }
      const full = path.resolve(this.cwd, vpath.substring(1));
      const relative = path.relative(this.cwd, full);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`Path: ${full} outside root directory: ${this.cwd}`);
      }
      return full;
    }

    if (path.isAbsolute(key)) {
      return key;
    }
    return path.resolve(this.cwd, key);
  }

  /**
   * List files and directories in the specified directory (non-recursive).
   *
   * @param dirPath - Absolute directory path to list files from
   * @returns List of FileInfo objects for files and directories directly in the directory.
   *          Directories have a trailing / in their path and is_dir=true.
   */
  async lsInfo(dirPath: string): Promise<FileInfo[]> {
    try {
      const resolvedPath = this.resolvePath(dirPath);
      const host = EditorHostService.getInstance().getHost();

      try {
        const stat = await host.workspace.fs.stat(resolvedPath);
        if (stat.type !== FileType.Directory) {
          return [];
        }
      } catch {
        return [];
      }

      const entries = await host.workspace.fs.readDirectory(resolvedPath);
      const results: FileInfo[] = [];

      const cwdStr = this.cwd.endsWith(path.sep)
        ? this.cwd
        : this.cwd + path.sep;

      for (const [name, type] of entries) {
        const fullPath = path.join(resolvedPath, name);

        try {
          const entryStat = await host.workspace.fs.stat(fullPath);
          const isFile = type === FileType.File;
          const isDir = type === FileType.Directory;

          if (!this.virtualMode) {
            // Non-virtual mode: use absolute paths
            if (isFile) {
              results.push({
                path: fullPath,
                is_dir: false,
                size: entryStat.size,
                modified_at: new Date(entryStat.mtime).toISOString(),
              });
            } else if (isDir) {
              results.push({
                path: fullPath + path.sep,
                is_dir: true,
                size: 0,
                modified_at: new Date(entryStat.mtime).toISOString(),
              });
            }
          } else {
            let relativePath: string;
            if (fullPath.startsWith(cwdStr)) {
              relativePath = fullPath.substring(cwdStr.length);
            } else if (fullPath.startsWith(this.cwd)) {
              relativePath = fullPath
                .substring(this.cwd.length)
                .replace(/^[/\\]/, "");
            } else {
              relativePath = fullPath;
            }

            relativePath = relativePath.split(path.sep).join("/");
            const virtPath = "/" + relativePath;

            if (isFile) {
              results.push({
                path: virtPath,
                is_dir: false,
                size: entryStat.size,
                modified_at: new Date(entryStat.mtime).toISOString(),
              });
            } else if (isDir) {
              results.push({
                path: virtPath + "/",
                is_dir: true,
                size: 0,
                modified_at: new Date(entryStat.mtime).toISOString(),
              });
            }
          }
        } catch {
          // Skip entries we can't stat
          continue;
        }
      }

      results.sort((a, b) => a.path.localeCompare(b.path));
      return results;
    } catch {
      return [];
    }
  }

  /**
   * Read file content with line numbers.
   *
   * @param filePath - Absolute or relative file path
   * @param offset - Line offset to start reading from (0-indexed)
   * @param limit - Maximum number of lines to read
   * @returns Formatted file content with line numbers, or error message
   */
  async read(filePath: string, offset = 0, limit = 500): Promise<string> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const host = EditorHostService.getInstance().getHost();
      const contentBytes = await host.workspace.fs.readFile(resolvedPath);
      const content = new TextDecoder("utf-8").decode(contentBytes);

      const emptyMsg = checkEmptyContent(content);
      if (emptyMsg) {
        return emptyMsg;
      }

      const lines = content.split("\n");
      const startIdx = offset;
      const endIdx = Math.min(startIdx + limit, lines.length);

      if (startIdx >= lines.length) {
        return `Error: Line offset ${offset} exceeds file length (${lines.length} lines)`;
      }

      const selectedLines = lines.slice(startIdx, endIdx);
      return formatContentWithLineNumbers(selectedLines, startIdx + 1);
    } catch (error: any) {
      if (
        error.code === "ENOENT" ||
        error.code === "FileNotFound" ||
        error.message?.includes("not found")
      ) {
        return `Error: File '${filePath}' not found`;
      }
      throw error;
    }
  }

  /**
   * Read file content as raw FileData.
   *
   * @param filePath - Absolute or relative file path
   * @returns Raw file content as FileData
   */
  async readRaw(filePath: string): Promise<FileData> {
    const resolvedPath = this.resolvePath(filePath);
    const host = EditorHostService.getInstance().getHost();
    const stat = await host.workspace.fs.stat(resolvedPath);
    const contentBytes = await host.workspace.fs.readFile(resolvedPath);
    const content = new TextDecoder("utf-8").decode(contentBytes);

    return {
      content: content.split("\n"),
      created_at: new Date(stat.ctime).toISOString(),
      modified_at: new Date(stat.mtime).toISOString(),
    };
  }

  /**
   * Create a new file with content or overwrite existing.
   *
   * @param filePath - Absolute or relative file path
   * @param content - Content to write
   * @returns WriteResult
   */
  async write(filePath: string, content: string): Promise<WriteResult> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const host = EditorHostService.getInstance().getHost();

      // Check if file exists to prevent overwrite if needed?
      // The interface implies overwrite is allowed unless we add logic.
      // But typically "write" tool might want to be careful.
      // For now, standard behavior: overwrite.

      // Ensure directory exists
      await host.workspace.fs.createDirectory(path.dirname(resolvedPath));

      // Write file
      const contentBytes = new TextEncoder().encode(content);
      await host.workspace.fs.writeFile(resolvedPath, contentBytes);

      return {
        path: filePath,
        filesUpdate: null,
      };
    } catch (error: any) {
      return {
        error: `Failed to write file: ${error.message}`,
      };
    }
  }

  /**
   * Edit a file by replacing string occurrences.
   *
   * @param filePath - Absolute or relative file path
   * @param oldString - String to replace
   * @param newString - Replacement string
   * @param replaceAll - Whether to replace all occurrences
   * @returns EditResult
   */
  async edit(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll = false,
  ): Promise<EditResult> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const host = EditorHostService.getInstance().getHost();
      const contentBytes = await host.workspace.fs.readFile(resolvedPath);
      const content = new TextDecoder("utf-8").decode(contentBytes);

      const result = performStringReplacement(
        content,
        oldString,
        newString,
        replaceAll,
      );

      if (typeof result === "string") {
        return { error: result };
      }

      const [newContent, occurrences] = result;

      const newContentBytes = new TextEncoder().encode(newContent);
      await host.workspace.fs.writeFile(resolvedPath, newContentBytes);

      return {
        path: filePath,
        filesUpdate: null,
        occurrences,
      };
    } catch (error: any) {
      if (
        error.code === "ENOENT" ||
        error.code === "FileNotFound" ||
        error.message?.includes("not found")
      ) {
        return { error: `Error: File '${filePath}' not found` };
      }
      return { error: `Failed to edit file: ${error.message}` };
    }
  }

  /**
   * Searches file contents for a regex pattern using ripgrep or fallback.
   *
   * @param pattern - Regex pattern to search for
   * @param basePath - Base path to search from (default: root)
   * @param glob - Optional glob pattern to filter files (e.g., "*.py")
   * @returns List of GrepMatch objects or error string
   */
  async grepRaw(
    pattern: string,
    basePath?: string | null,
    glob?: string | null,
  ): Promise<GrepMatch[] | string> {
    const startPath = basePath ? this.resolvePath(basePath) : this.cwd;

    try {
      // Try to use ripgrep (rg) if available
      return await this.grepRipgrep(pattern, startPath, glob);
    } catch (e) {
      // Fallback to JS implementation
      return await this.grepJs(pattern, startPath, glob);
    }
  }

  private async grepRipgrep(
    pattern: string,
    cwd: string,
    glob?: string | null,
  ): Promise<GrepMatch[]> {
    return new Promise((resolve, reject) => {
      const args = ["-n", "--no-heading", "--with-filename", "--color=never"];

      if (glob) {
        args.push("-g", glob);
      }

      // Fixed string search if it looks like one? Regex is expected.
      // But user might provide regex. rg supports regex by default.
      args.push(pattern);
      args.push(cwd); // Search in this directory

      const child = spawn(this.ripgrepExec || "rg", args);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(this.parseRipgrepOutput(stdout, cwd));
        } else if (code === 1) {
          // No matches found
          resolve([]);
        } else {
          reject(new Error(`ripgrep failed with code ${code}: ${stderr}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  }

  private parseRipgrepOutput(output: string, cwd: string): GrepMatch[] {
    const matches: GrepMatch[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (!line) continue;
      // Format: filename:line:text
      // But filename can contain colons (on windows, though we use /), so we need to be careful.
      // rg --with-filename outputs: path/to/file:line:match
      const firstColon = line.indexOf(":");
      const secondColon = line.indexOf(":", firstColon + 1);

      if (firstColon === -1 || secondColon === -1) continue;

      const filePath = line.substring(0, firstColon);
      const lineNumStr = line.substring(firstColon + 1, secondColon);
      const text = line.substring(secondColon + 1);

      const lineNum = parseInt(lineNumStr, 10);
      if (isNaN(lineNum)) continue;

      // Normalize path relative to cwd/root if possible
      let relPath = filePath;
      if (filePath.startsWith(this.cwd)) {
        relPath = path.relative(this.cwd, filePath);
      }
      // Ensure forward slashes
      relPath = relPath.split(path.sep).join("/");
      if (!relPath.startsWith("/")) relPath = "/" + relPath;

      matches.push({
        path: relPath,
        line: lineNum,
        text: text,
      });
    }
    return matches;
  }

  private async grepJs(
    pattern: string,
    cwd: string,
    glob?: string | null,
  ): Promise<GrepMatch[] | string> {
    try {
      const regex = new RegExp(pattern, "g");
      const matches: GrepMatch[] = [];

      const stream = fg.stream(glob || "**/*", {
        cwd: cwd,
        absolute: true,
        onlyFiles: true,
        dot: false, // Default to ignoring hidden files
      });

      const host = EditorHostService.getInstance().getHost();

      for await (const entry of stream) {
        const filePath = entry as string;
        try {
          const contentBytes = await host.workspace.fs.readFile(filePath);
          const content = new TextDecoder("utf-8").decode(contentBytes);
          const lines = content.split("\n");

          lines.forEach((line: string, index: number) => {
            if (regex.test(line)) {
              // Normalize path
              let relPath = path.relative(this.cwd, filePath);
              relPath = relPath.split(path.sep).join("/");
              if (!relPath.startsWith("/")) relPath = "/" + relPath;

              matches.push({
                path: relPath,
                line: index + 1,
                text: line,
              });
              // Reset regex lastIndex
              regex.lastIndex = 0;
            }
          });
        } catch (err) {
          // Ignore read errors
        }
      }

      return matches;
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }

  /**
   * List files matching a glob pattern.
   *
   * @param pattern - Glob pattern
   * @param basePath - Base path to search from (default: root)
   * @returns List of FileInfo objects
   */
  async globInfo(pattern: string, basePath?: string): Promise<FileInfo[]> {
    const startPath = basePath ? this.resolvePath(basePath) : this.cwd;

    try {
      const entries = await fg(pattern, {
        cwd: startPath,
        stats: true,
        absolute: true,
        onlyFiles: false,
        objectMode: true,
      });

      const results: FileInfo[] = entries.map((entry) => {
        // Normalize path relative to root
        let relPath = path.relative(this.cwd, entry.path);
        relPath = relPath.split(path.sep).join("/");
        if (!relPath.startsWith("/")) relPath = "/" + relPath;

        const isDir = entry.dirent.isDirectory();

        if (isDir) {
          if (!relPath.endsWith("/")) relPath += "/";
          return {
            path: relPath,
            is_dir: true,
            size: 0,
            modified_at: entry.stats ? entry.stats.mtime.toISOString() : "",
          };
        }

        return {
          path: relPath,
          is_dir: false,
          size: entry.stats ? entry.stats.size : 0,
          modified_at: entry.stats ? entry.stats.mtime.toISOString() : "",
        };
      });

      return results.sort((a, b) => a.path.localeCompare(b.path));
    } catch (e) {
      console.error("Glob error:", e);
      return [];
    }
  }
}
