import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * Service that reads `.codebuddyignore` from the workspace root and provides
 * pattern-based file/directory exclusion — similar to `.gitignore` / `.cursorignore`.
 *
 * Supported syntax:
 *  - Blank lines and lines starting with `#` are ignored
 *  - Standard glob patterns: `*`, `**`, `?`
 *  - Directory patterns (trailing `/`): `dist/` matches the directory and its contents
 *  - Negation: `!pattern` re-includes a previously excluded path
 *  - Anchored patterns: leading `/` anchors to the workspace root
 *
 * The service watches the file for changes and reloads automatically.
 */
export class CodebuddyIgnoreService implements vscode.Disposable {
  private static instance: CodebuddyIgnoreService | undefined;
  private readonly logger: Logger;
  private rules: IgnoreRule[] = [];
  private watcher: vscode.FileSystemWatcher | undefined;
  private workspaceRoot: string | undefined;

  static readonly IGNORE_FILENAME = ".codebuddyignore";

  private constructor() {
    this.logger = Logger.initialize("CodebuddyIgnoreService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): CodebuddyIgnoreService {
    if (!CodebuddyIgnoreService.instance) {
      CodebuddyIgnoreService.instance = new CodebuddyIgnoreService();
    }
    return CodebuddyIgnoreService.instance;
  }

  /**
   * Initialize the service — call once during extension activation.
   * Reads the ignore file and sets up a file watcher for live reload.
   */
  async initialize(): Promise<void> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      return;
    }
    this.workspaceRoot = root;
    await this.loadRules();
    this.setupWatcher();
  }

  /** Check whether a relative path should be ignored. */
  isIgnored(relativePath: string): boolean {
    if (this.rules.length === 0) {
      return false;
    }

    // Normalize to forward slashes
    const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");

    let ignored = false;
    for (const rule of this.rules) {
      if (rule.regex.test(normalized)) {
        ignored = !rule.negated;
      }
      // Also check if a parent directory matches a directory-only rule
      if (rule.dirOnly) {
        const parts = normalized.split("/");
        for (let i = 1; i <= parts.length; i++) {
          const partial = parts.slice(0, i).join("/");
          if (rule.regex.test(partial)) {
            ignored = !rule.negated;
          }
        }
      }
    }
    return ignored;
  }

  /**
   * Return the list of raw pattern strings suitable for VS Code `findFiles` exclude.
   * Only positive (non-negated) patterns are returned, converted to glob form.
   */
  getExcludeGlobs(): string[] {
    return this.rules.filter((r) => !r.negated).map((r) => r.originalGlob);
  }

  /** Get the combined exclude pattern string for `vscode.workspace.findFiles`. */
  getExcludePattern(): string | undefined {
    const globs = this.getExcludeGlobs();
    if (globs.length === 0) {
      return undefined;
    }
    return `{${globs.join(",")}}`;
  }

  /** Whether a `.codebuddyignore` file exists in the workspace. */
  hasIgnoreFile(): boolean {
    if (!this.workspaceRoot) {
      return false;
    }
    return fs.existsSync(
      path.join(this.workspaceRoot, CodebuddyIgnoreService.IGNORE_FILENAME),
    );
  }

  /** Reload rules from disk. */
  async reload(): Promise<void> {
    await this.loadRules();
    this.logger.info(
      `Reloaded .codebuddyignore — ${this.rules.length} rules active`,
    );
  }

  // ── Internal ──────────────────────────────────────────────

  private async loadRules(): Promise<void> {
    if (!this.workspaceRoot) {
      this.rules = [];
      return;
    }

    const filePath = path.join(
      this.workspaceRoot,
      CodebuddyIgnoreService.IGNORE_FILENAME,
    );

    try {
      if (!fs.existsSync(filePath)) {
        this.rules = [];
        return;
      }

      const content = await fs.promises.readFile(filePath, "utf-8");
      this.rules = parseIgnoreFile(content);
      this.logger.info(
        `Loaded ${this.rules.length} rules from .codebuddyignore`,
      );
    } catch (error: any) {
      this.logger.error("Failed to load .codebuddyignore:", error);
      this.rules = [];
    }
  }

  private setupWatcher(): void {
    if (!this.workspaceRoot) {
      return;
    }
    this.watcher?.dispose();
    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        this.workspaceRoot,
        CodebuddyIgnoreService.IGNORE_FILENAME,
      ),
    );
    this.watcher.onDidChange(() => this.reload());
    this.watcher.onDidCreate(() => this.reload());
    this.watcher.onDidDelete(() => {
      this.rules = [];
      this.logger.info(".codebuddyignore deleted — all rules cleared");
    });
  }

  dispose(): void {
    this.watcher?.dispose();
    CodebuddyIgnoreService.instance = undefined;
  }
}

// ── Pattern parsing ──────────────────────────────────────────

interface IgnoreRule {
  regex: RegExp;
  negated: boolean;
  dirOnly: boolean;
  originalGlob: string;
}

/**
 * Parse a `.codebuddyignore` file into an ordered list of rules.
 * Follows a subset of `.gitignore` semantics:
 *  - Blank lines / comment lines (`#`) are skipped
 *  - `!` prefix negates
 *  - Trailing `/` means directory-only
 *  - Leading `/` anchors to root (otherwise matches anywhere)
 *  - `**` matches any number of directories
 */
export function parseIgnoreFile(content: string): IgnoreRule[] {
  const rules: IgnoreRule[] = [];
  const lines = content.split(/\r?\n/);

  for (let raw of lines) {
    raw = raw.trim();
    if (raw === "" || raw.startsWith("#")) {
      continue;
    }

    let negated = false;
    if (raw.startsWith("!")) {
      negated = true;
      raw = raw.slice(1);
    }

    let dirOnly = false;
    if (raw.endsWith("/")) {
      dirOnly = true;
      raw = raw.replace(/\/+$/, "");
    }

    // Determine if the pattern is anchored (contains `/` or starts with `/`)
    const anchored = raw.startsWith("/") || raw.includes("/");
    if (raw.startsWith("/")) {
      raw = raw.slice(1);
    }

    // Build a glob suitable for VS Code findFiles
    const originalGlob = anchored ? `**/${raw}/**` : `**/${raw}/**`;

    // Convert the pattern to a regex
    const regex = patternToRegex(raw, anchored, dirOnly);
    rules.push({
      regex,
      negated,
      dirOnly,
      originalGlob: dirOnly || !anchored ? `**/${raw}/**` : `${raw}/**`,
    });
  }

  return rules;
}

/**
 * Convert a single gitignore-style pattern into a RegExp that matches
 * against workspace-relative paths (forward slashes, no leading `/`).
 */
function patternToRegex(
  pattern: string,
  anchored: boolean,
  dirOnly: boolean,
): RegExp {
  // Escape regex special chars except our glob tokens
  let re = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");

  // Replace glob tokens
  re = re
    .replace(/\*\*/g, "§DOUBLESTAR§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DOUBLESTAR§/g, ".*")
    .replace(/\?/g, "[^/]");

  if (anchored) {
    // Anchored to root — pattern must match from the start
    re = `^${re}`;
  } else {
    // Unanchored — can match at any depth
    re = `(?:^|/)${re}`;
  }

  if (dirOnly) {
    // Must match as a complete directory segment
    re = `${re}(?:/|$)`;
  } else {
    // Can match as a file or directory
    re = `${re}(?:/.*)?$`;
  }

  return new RegExp(re);
}

// ── Template ─────────────────────────────────────────────────

/** Default content for a newly scaffolded `.codebuddyignore` file. */
export const DEFAULT_CODEBUDDYIGNORE = `# CodeBuddy Ignore File
# Files and directories listed here will be excluded from AI context.
# Syntax follows .gitignore conventions.
#
# Examples:
#   node_modules/       — ignore the node_modules directory
#   *.log               — ignore all .log files
#   dist/               — ignore build output
#   **/*.min.js         — ignore all minified JS files
#   !src/vendor/        — re-include a previously ignored path
#
# Common defaults:

# Dependencies
node_modules/

# Build output
dist/
build/
out/

# IDE / editor
.vscode/
.idea/

# Environment & secrets
.env
.env.*

# Logs
*.log

# Lock files
package-lock.json
yarn.lock
pnpm-lock.yaml
`;
