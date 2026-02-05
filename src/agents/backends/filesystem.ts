/**
 * VS Code / Node-friendly Filesystem Backend for deepagentsjs
 *
 * This file implements a production-ready BackendFactory that:
 *  - writes/reads real files under a configured rootDir (workspace- or extension-scoped)
 *  - supports assistant-scoped namespaces (StateAndStore.assistantId)
 *  - performs atomic writes and serializes mutations
 *  - uses ripgrep for fast grep when available, integrating either via provided JS wrapper
 *    (preferred, e.g. @vscode/ripgrep) or by spawning a ripgrep binary (ripgrepExec).
 *  - allows disabling spawn fallback to guarantee portability in restricted environments
 *
 * API summary:
 *  - createVscodeFsBackendFactory(opts): BackendFactory
 *    opts.rootDir: string                  // on-disk root that maps to "/" seen by agent
 *    opts.ripgrepSearch?: RipgrepSearchFn  // preferred: JS wrapper to run ripgrep
 *    opts.ripgrepExec?: string             // optional binary path to ripgrep
 *    opts.useRipgrep?: boolean             // default true
 *    opts.disableSpawnFallback?: boolean   // default false
 *    opts.ripgrepArgs?: string[]           // additional args to ripgrep
 *    opts.maxGrepBuffer?: number           // spawnSync buffer size
 *
 * The returned BackendFactory will be called with StateAndStore by the middleware and will
 * return a BackendProtocol instance bound to the assistantId present in StateAndStore.
 *
 * Drop this file into your extension source and import the factory when wiring createDeepAgent.
 */

import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import * as readline from "readline"; // Optimization: Import readline for efficient stream processing.
import { spawnSync } from "child_process";

import type {
  BackendProtocol,
  BackendFactory,
  FileInfo,
  FileData,
  GrepMatch,
  WriteResult,
  EditResult,
} from "deepagents";

import { DiffReviewService } from "../../services/diff-review.service";

type StateAndStore = Parameters<BackendFactory>[0];

/** Type for a JS wrapper that runs ripgrep and returns stdout (string). */
export type RipgrepSearchFn = (opts: {
  pattern: string;
  cwd: string;
  glob?: string | null;
  extraArgs?: string[];
  maxBuffer?: number;
}) => Promise<string>;

/** Options for the factory creation. */
export interface VscodeFsBackendFactoryOptions {
  rootDir: string;
  useRipgrep?: boolean;
  disableSpawnFallback?: boolean;
  ripgrepArgs?: string[];
  ripgrepExec?: string;
  ripgrepSearch?: RipgrepSearchFn;
  maxGrepBuffer?: number;
}

/** Simple in-process mutex to serialize write/edit operations. */
class SimpleMutex {
  private _p: Promise<void> = Promise.resolve();
  async lock<T>(fn: () => Promise<T>): Promise<T> {
    const next = this._p.then(
      () => fn(),
      () => fn(),
    );
    this._p = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

/** Convert basic glob pattern to RegExp (supports *, **, ?). */
function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/^\/+|\/+$/g, "");

  if (!normalized) {
    return new RegExp("^.*$");
  }

  let escaped = normalized.replace(/[.+^${}()|[\]\\]/g, "\\$&");

  escaped = escaped
    .replace(/\*\*/g, "§DOUBLESTAR§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DOUBLESTAR§/g, ".*")
    .replace(/\?/g, "[^/]");

  return new RegExp(`^${escaped}$`);
}

/**
 * Implementation of BackendProtocol that uses the host filesystem.
 */
class VscodeFsBackend implements BackendProtocol {
  readonly rootDir: string;
  private mutex = new SimpleMutex();
  private ripgrepArgs: string[];
  private useRipgrep: boolean;
  private disableSpawnFallback: boolean;
  private ripgrepExec?: string;
  private ripgrepSearch?: RipgrepSearchFn;
  private maxGrepBuffer: number;
  private assistantId?: string;

  constructor(params: {
    rootDir: string;
    ripgrepArgs?: string[];
    useRipgrep?: boolean;
    disableSpawnFallback?: boolean;
    ripgrepExec?: string;
    ripgrepSearch?: RipgrepSearchFn;
    maxGrepBuffer?: number;
    assistantId?: string | undefined;
  }) {
    this.rootDir = path.resolve(params.rootDir);
    this.ripgrepArgs = params.ripgrepArgs ?? ["--hidden", "--no-ignore"];
    this.useRipgrep = params.useRipgrep ?? true;
    this.disableSpawnFallback = params.disableSpawnFallback ?? false;
    this.ripgrepExec = params.ripgrepExec;
    this.ripgrepSearch = params.ripgrepSearch;
    this.maxGrepBuffer = params.maxGrepBuffer ?? 10 * 1024 * 1024;
    this.assistantId = params.assistantId;

    fs.mkdirSync(this.rootDir, { recursive: true });
    if (this.assistantId) {
      fs.mkdirSync(path.join(this.rootDir, String(this.assistantId)), {
        recursive: true,
      });
    }
  }

  private assistantBase(): string {
    if (!this.assistantId) return this.rootDir;
    return path.join(this.rootDir, String(this.assistantId));
  }

  private resolveAgentPath(agentPath: string): string {
    let normalized = agentPath;
    if (!normalized.startsWith("/")) normalized = `/${normalized}`;
    const rel = normalized.replace(/^\/+/, "");
    const base = this.assistantBase();
    const abs = path.resolve(base, rel);
    const baseResolved = path.resolve(base);

    if (abs !== baseResolved && !abs.startsWith(baseResolved + path.sep)) {
      throw new Error("Invalid path: outside of permitted root");
    }
    return abs;
  }

  async lsInfo(dir: string): Promise<FileInfo[]> {
    const absDir = this.resolveAgentPath(dir);
    try {
      const entries = await fsp.readdir(absDir, { withFileTypes: true });

      // Optimization: Use Promise.all to execute 'stat' calls concurrently.
      // This significantly speeds up directory listing for directories with many files
      // by parallelizing the I/O operations.
      const infoPromises = entries.map(async (e): Promise<FileInfo | null> => {
        const child = path.join(absDir, e.name);
        try {
          const st = await fsp.stat(child);
          const rel = `/${path.relative(this.rootDir, child).replace(/\\/g, "/")}`;
          return {
            path: e.isDirectory() ? `${rel.replace(/\/+$/, "")}/` : rel,
            is_dir: e.isDirectory(),
            size: e.isDirectory() ? undefined : st.size,
            modified_at: st.mtime.toISOString(),
          };
        } catch (err) {
          console.warn(`[VscodeFsBackend] Could not stat ${child}: ${err}`);
          return null; // Handle cases where file is deleted during operation
        }
      });

      const infos = await Promise.all(infoPromises);
      // Filter out any null results from failed stats and sort
      return infos
        .filter((info): info is FileInfo => info !== null)
        .sort((a, b) => a.path.localeCompare(b.path));
    } catch (e: any) {
      if (e.code === "ENOENT") return [];
      throw e;
    }
  }

  async read(filePath: string, offset = 0, limit = 2000): Promise<string> {
    try {
      const abs = this.resolveAgentPath(filePath);

      // Optimization: Use streams to read the file line-by-line. This avoids loading
      // the entire file into memory, providing O(1) memory usage regardless of file size.
      const fileStream = fs.createReadStream(abs, { encoding: "utf-8" });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      const out: string[] = [];
      let currentLine = 0;
      let fileIsEmpty = true;

      for await (const line of rl) {
        fileIsEmpty = false;
        if (currentLine >= offset) {
          if (out.length < limit) {
            const truncatedLine = line.slice(0, 2000);
            out.push(
              `${String(currentLine + 1).padStart(6, " ")}\t${truncatedLine}`,
            );
          }
        }
        currentLine++;
        if (out.length >= limit) {
          rl.close(); // Stop reading once the limit is reached
          fileStream.destroy();
          break;
        }
      }

      if (fileIsEmpty)
        return "System reminder: File exists but has empty contents";
      if (offset > 0 && out.length === 0)
        return `Error: Line offset ${offset} exceeds file length (${currentLine} lines)`;

      return out.join("\n");
    } catch (e: any) {
      if (e && e.code === "ENOENT")
        return `Error: File '${filePath}' not found`;
      console.error(
        `[VscodeFsBackend] Unexpected error reading ${filePath}:`,
        e,
      );
      return `Error: An unexpected error occurred while reading the file.`;
    }
  }

  async readRaw(filePath: string): Promise<FileData> {
    const abs = this.resolveAgentPath(filePath);
    try {
      const content = await fsp.readFile(abs, "utf-8");
      const stat = await fsp.stat(abs);
      return {
        content: content.split("\n"),
        created_at: stat.birthtime.toISOString(),
        modified_at: stat.mtime.toISOString(),
      };
    } catch (e: any) {
      if (e.code === "ENOENT") {
        throw new Error(`File '${filePath}' not found`);
      }
      throw e;
    }
  }

  async grepRaw(
    pattern: string,
    basePath: string | null = "/",
    glob: string | null = null,
  ): Promise<GrepMatch[] | string> {
    let re: RegExp;
    try {
      re = new RegExp(pattern, "i");
    } catch (err: any) {
      return `Invalid regex: ${err.message ?? String(err)}`;
    }

    const absBase = this.resolveAgentPath(basePath ?? "/");

    if (this.useRipgrep) {
      if (this.ripgrepSearch) {
        try {
          const stdout = await this.ripgrepSearch({
            pattern,
            cwd: absBase,
            glob,
            extraArgs: this.ripgrepArgs,
            maxBuffer: this.maxGrepBuffer,
          });
          return parseRipgrepStdout(stdout, this.rootDir);
        } catch (err: any) {
          if (this.disableSpawnFallback)
            return `Error: ripgrep invocation failed: ${err?.message ?? String(err)}`;
        }
      }

      try {
        const rgBin = this.ripgrepExec ?? "rg";
        const args = [
          "-n",
          "-H",
          ...(this.ripgrepArgs ?? []),
          ...(glob ? ["-g", glob] : []),
          pattern,
          absBase,
        ];
        const rg = spawnSync(rgBin, args, {
          encoding: "utf-8",
          maxBuffer: this.maxGrepBuffer,
        });
        if (!rg.error && (rg.status === 0 || rg.status === 1)) {
          if (!rg.stdout) return [];
          return parseRipgrepStdout(rg.stdout, this.rootDir);
        } else {
          if (this.disableSpawnFallback) {
            const msg = rg.error ? rg.error.message : `rg exit ${rg.status}`;
            return `Error: ripgrep invocation failed: ${msg}`;
          }
        }
      } catch {
        if (this.disableSpawnFallback) return "Error: ripgrep not available";
      }
    } else if (this.disableSpawnFallback) {
      return "Error: ripgrep usage disabled by configuration";
    }

    // --- JS Fallback: Optimized with parallel, streaming directory traversal ---
    const globRegex = glob
      ? globToRegExp(glob.startsWith("/") ? glob : `/${glob}`)
      : null;

    const walkAndSearch = async (dir: string): Promise<GrepMatch[]> => {
      let entries: fs.Dirent[];
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch {
        return [];
      }

      const promises = entries.map(async (e): Promise<GrepMatch[]> => {
        const child = path.join(dir, e.name);
        if (e.isDirectory()) {
          return walkAndSearch(child); // Recurse into subdirectories
        }

        const relPosix = `/${path.relative(this.rootDir, child).replace(/\\/g, "/")}`;
        if (globRegex && !globRegex.test(relPosix)) return [];

        // Optimization: Stream files to avoid high memory usage and process line-by-line.
        const fileMatches: GrepMatch[] = [];
        try {
          const fileStream = fs.createReadStream(child, { encoding: "utf-8" });
          fileStream.on("error", () => fileStream.destroy());
          const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
          });

          let lineNum = 0;
          for await (const line of rl) {
            lineNum++;
            if (re.test(line)) {
              fileMatches.push({ path: relPosix, line: lineNum, text: line });
            }
          }
        } catch (err) {
          console.warn(
            `[VscodeFsBackend] Failed to grep file ${child}: ${err}`,
          );
        }
        return fileMatches;
      });

      const nestedMatches = await Promise.all(promises);
      return ([] as GrepMatch[]).concat(...nestedMatches);
    };

    try {
      return await walkAndSearch(absBase);
    } catch (err: any) {
      return `Error: ${err?.message ?? String(err)}`;
    }
  }

  async globInfo(pattern: string, basePath = "/"): Promise<FileInfo[]> {
    const absBase = this.resolveAgentPath(basePath);

    const normalizedPattern = pattern.startsWith("/")
      ? pattern.substring(1)
      : pattern;

    const regex = globToRegExp(normalizedPattern);

    const walk = async (dir: string): Promise<FileInfo[]> => {
      let entries: fs.Dirent[];
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch {
        return [];
      }

      const promises = entries.map(async (e): Promise<FileInfo[]> => {
        const child = path.join(dir, e.name);

        if (e.isDirectory()) {
          return walk(child);
        }
        const pathRelativeToSearchBase = path
          .relative(absBase, child)
          .split(path.sep)
          .join("/");

        if (!regex.test(pathRelativeToSearchBase)) return [];

        const virtualPath = `/${path.relative(this.rootDir, child).split(path.sep).join("/")}`;

        try {
          const st = await fsp.stat(child);
          return [
            {
              path: virtualPath,
              is_dir: false,
              size: st.size,
              modified_at: st.mtime.toISOString(),
            },
          ];
        } catch {
          return [];
        }
      });
      const nestedResults = await Promise.all(promises);
      return ([] as FileInfo[]).concat(...nestedResults);
    };

    const results = await walk(absBase);

    return results.sort((a, b) => a.path.localeCompare(b.path));
  }

  async write(filePath: string, content: string): Promise<WriteResult> {
    return this.mutex.lock(async () => {
      try {
        const abs = this.resolveAgentPath(filePath);

        try {
          const stat = await fsp.lstat(abs);
          if (stat.isSymbolicLink()) {
            return {
              error: `Cannot write to ${filePath} because it is a symlink. Symlinks are not allowed.`,
            };
          }
          return {
            error: `Cannot write to ${filePath} because it already exists. Read and then make an edit, or write to a new path.`,
          };
        } catch (error: any) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }

        // Ensure parent directory exists
        await fsp.mkdir(path.dirname(abs), { recursive: true });

        // Track change through DiffReviewService (auto-applies by default)
        const diffService = DiffReviewService.getInstance();
        const change = await diffService.addPendingChange(abs, content);

        return {
          path: filePath,
          filesUpdate: null,
          pendingChangeId: change.id,
        } as WriteResult;
      } catch (err: any) {
        return { error: String(err?.message ?? err) };
      }
    });
  }

  async edit(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll = false,
  ): Promise<EditResult> {
    // Note: For extremely large files, a streaming approach would be more memory-efficient.
    // This implementation reads the whole file, which is a pragmatic trade-off for typical source files.
    return this.mutex.lock(async () => {
      try {
        const abs = this.resolveAgentPath(filePath);
        let current: string;
        try {
          current = await fsp.readFile(abs, { encoding: "utf-8" });
        } catch (err: any) {
          if (err.code === "ENOENT")
            return { error: `Error: File '${filePath}' not found` };
          return { error: String(err?.message ?? err) };
        }

        if (!current.includes(oldString)) {
          return { path: filePath, filesUpdate: null, occurrences: 0 };
        }

        let newContent: string;
        let occurrences = 0;
        if (replaceAll) {
          const parts = current.split(oldString);
          occurrences = parts.length - 1;
          newContent = parts.join(newString);
        } else {
          const idx = current.indexOf(oldString);
          if (idx === -1)
            return { path: filePath, filesUpdate: null, occurrences: 0 };
          occurrences = 1;
          newContent =
            current.slice(0, idx) +
            newString +
            current.slice(idx + oldString.length);
        }

        // Track change through DiffReviewService (auto-applies by default)
        const diffService = DiffReviewService.getInstance();
        const change = await diffService.addPendingChange(abs, newContent);

        return {
          path: filePath,
          filesUpdate: null,
          occurrences,
          pendingChangeId: change.id,
        } as EditResult;
      } catch (err: any) {
        return { error: String(err?.message ?? err) };
      }
    });
  }
}

/** Parse ripgrep stdout lines into GrepMatch[] */
function parseRipgrepStdout(stdout: string, rootDir: string): GrepMatch[] {
  const lines = String(stdout).trim().split("\n").filter(Boolean);
  const results: GrepMatch[] = [];
  for (const l of lines) {
    // Format: /abs/path:line:match. The lazy quantifier is safer for paths that might contain colons.
    const m = l.match(/^(.+?):(\d+):(.*)$/s);
    if (!m) continue;
    const absPath = m[1];
    const lineNum = Number(m[2]);
    const text = m[3];
    const rel = `/${path.relative(rootDir, absPath).replace(/\\/g, "/")}`;
    results.push({ path: rel, line: lineNum, text });
  }
  return results;
}

/**
 * Return a BackendFactory bound to the given options.
 */
export function createVscodeFsBackendFactory(
  opts: VscodeFsBackendFactoryOptions,
): VscodeFsBackend {
  const { rootDir, ...rest } = opts;

  let probeRgAvailable = false;
  if (opts.useRipgrep !== false && !opts.ripgrepSearch) {
    try {
      const probe = spawnSync(opts.ripgrepExec ?? "rg", ["--version"], {
        encoding: "utf-8",
        maxBuffer: 1024,
      });
      probeRgAvailable = !probe.error && probe.status === 0;
    } catch {
      probeRgAvailable = false;
    }
  }

  const useRipgrep = opts.useRipgrep !== false;

  const backend = new VscodeFsBackend({ rootDir, ...rest });

  if (useRipgrep && !opts.ripgrepSearch && !probeRgAvailable) {
    (backend as any).useRipgrep = false;
  }
  return backend;
}
