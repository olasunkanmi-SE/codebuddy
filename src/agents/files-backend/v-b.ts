/**
 * VS Code / Node-friendly Filesystem Backend for deepagentsjs
 *
 * Implements the deepagentsjs BackendProtocol and exposes a BackendFactory
 * so you can pass it directly to createDeepAgent({ backend: backendFactory }).
 *
 * Features:
 * - Fully typed implementation that imports BackendProtocol types from deepagentsjs.
 * - Workspace-rooted, assistant-scoped file mapping (prevents path traversal).
 * - Atomic writes (write tmp file then rename).
 * - Simple mutex to serialize mutations in-process.
 * - Optional ripgrep (rg) detection + use for fast grepRaw.
 * - Option to disable spawn fallback for portability (e.g., in restricted environments).
 *
 * Usage:
 *   const backendFactory = createVscodeFsBackendFactory({
 *     rootDir: "/path/to/agent-workspace",
 *     useRipgrep: true,
 *     disableSpawnFallback: false,
 *   });
 *
 *   const agent = createDeepAgent({
 *     backend: backendFactory,
 *     ...
 *   });
 */

import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import { spawnSync } from "child_process";

import type {
    BackendProtocol,
    BackendFactory,
    FileInfo,
    GrepMatch,
    FileData,
    WriteResult,
    EditResult,
} from "deepagents";

type StateAndStore = Parameters<BackendFactory>[0];

/**
 * Configuration options for the backend factory
 */
export interface VscodeFsBackendFactoryOptions {
    /**
     * Root directory on disk where agent-visible files are stored.
     * All agent paths (which are absolute-like and start with "/") will be mapped into this directory.
     */
    rootDir: string;
    /**
     * Try to use ripgrep (rg) for fast grep. If true, the backend will attempt to spawn `rg`.
     * If rg is not found and disableSpawnFallback=false the backend falls back to a JS search.
     * Default: true
     */
    useRipgrep?: boolean;
    /**
     * If true, do NOT fall back to executing `rg` (spawn) when it's not available.
     * Instead return an error string indicating ripgrep is unavailable.
     * Default: false
     */
    disableSpawnFallback?: boolean;
    /**
     * Additional args to pass to `rg` when spawned (e.g. ["--hidden", "--no-ignore"]).
     */
    ripgrepArgs?: string[];
    /**
     * Maximum stdout/stderr buffer size in bytes when invoking ripgrep via spawnSync.
     * Default: 10 MiB.
     */
    maxGrepBuffer?: number;
}

/**
 * Simple in-process mutex/queue to serialize filesystem mutations.
 */
class SimpleMutex {
    private _p: Promise<void> = Promise.resolve();

    async lock<T>(fn: () => Promise<T>): Promise<T> {
        const next = this._p.then(() => fn(), () => fn());
        // Ensure subsequent locks wait for next
        this._p = next.then(() => undefined, () => undefined);
        return next;
    }
}

/**
 * Utility helpers
 */
function isoNow(): string {
    return new Date().toISOString();
}
function toLines(content: string): string[] {
    return content.length === 0 ? [] : content.split(/\r?\n/);
}
function formatReadResponse(fileData: FileData, offset = 0, limit = 2000): string {
    const lines = fileData.content;
    if (offset >= lines.length) {
        return `Error: Line offset ${offset} exceeds file length (${lines.length} lines)`;
    }
    const endIdx = Math.min(offset + limit, lines.length);
    const out: string[] = [];
    for (let i = offset; i < endIdx; i++) {
        const line = (lines[i] ?? "").slice(0, 2000);
        out.push(`${String(i + 1).padStart(6, " ")}\t${line}`);
    }
    return out.join("\n");
}

/**
 * Backend implementation that writes/reads real files under a configured rootDir.
 */
class VscodeFsBackend implements BackendProtocol {
    private rootDir: string;
    private mutex = new SimpleMutex();
    private useRipgrep: boolean;
    private disableSpawnFallback: boolean;
    private ripgrepArgs: string[];
    private maxGrepBuffer: number;
    private assistantId?: string;

    constructor(params: {
        rootDir: string;
        useRipgrep?: boolean;
        disableSpawnFallback?: boolean;
        ripgrepArgs?: string[];
        maxGrepBuffer?: number;
        assistantId?: string | undefined;
    }) {
        this.rootDir = path.resolve(params.rootDir);
        this.useRipgrep = params.useRipgrep ?? true;
        this.disableSpawnFallback = params.disableSpawnFallback ?? false;
        this.ripgrepArgs = params.ripgrepArgs ?? ["--hidden", "--no-ignore"];
        this.maxGrepBuffer = params.maxGrepBuffer ?? 10 * 1024 * 1024; // 10 MiB
        this.assistantId = params.assistantId;

        // Ensure root exists
        fs.mkdirSync(this.rootDir, { recursive: true });
    }

    private assistantBase(): string {
        if (!this.assistantId) return this.rootDir;
        // Each assistant gets its own subdirectory under root
        return path.join(this.rootDir, String(this.assistantId));
    }

    /**
     * Map an agent path (starts with '/') to disk absolute path under rootDir (and assistantId namespace).
     * Throws if the resolved absolute path would escape the base directory (prevents traversal).
     */
    private resolveAgentPath(agentPath: string): string {
        let normalized = agentPath;
        if (!normalized.startsWith("/")) normalized = `/${normalized}`;
        // remove leading slashes for relative join
        const rel = normalized.replace(/^\/+/, "");
        const base = this.assistantBase();
        const abs = path.resolve(base, rel);
        const baseResolved = path.resolve(base);

        // allow exact match to base (when rel === '')
        if (abs !== baseResolved && !abs.startsWith(baseResolved + path.sep)) {
            throw new Error("Invalid path: outside of permitted root");
        }
        return abs;
    }

    /**
     * Produce FileData from a disk file path
     */
    private async fileDataFromDisk(abs: string): Promise<FileData> {
        const content = await fsp.readFile(abs, { encoding: "utf-8" });
        const st = await fsp.stat(abs);
        return {
            content: toLines(content),
            created_at: st.birthtime.toISOString(),
            modified_at: st.mtime.toISOString(),
        };
    }

    /**
     * List entries in directory (non-recursive).
     * Returned paths are agent-facing (absolute-like starting with '/').
     */
    async lsInfo(dir: string): Promise<FileInfo[]> {
        const absDir = this.resolveAgentPath(dir);
        try {
            const entries = await fsp.readdir(absDir, { withFileTypes: true });
            const infos: FileInfo[] = [];
            for (const e of entries) {
                const child = path.join(absDir, e.name);
                const st = await fsp.stat(child);
                // agent-visible path uses posix style and is relative to rootDir (including assistant prefix)
                const rel = `/${path.relative(this.rootDir, child).replace(/\\/g, "/")}`;
                infos.push({
                    path: e.isDirectory() ? `${rel.replace(/\/+$/, "")}/` : rel,
                    is_dir: e.isDirectory(),
                    size: e.isDirectory() ? undefined : st.size,
                    modified_at: st.mtime.toISOString(),
                });
            }
            infos.sort((a, b) => a.path.localeCompare(b.path));
            return infos;
        } catch (e: any) {
            // If directory doesn't exist, return empty list for consistency
            if (e.code === "ENOENT") return [];
            throw e;
        }
    }

    /**
     * Read file with offset/limit and format output with line numbers.
     */
    async read(filePath: string, offset = 0, limit = 2000): Promise<string> {
        try {
            const abs = this.resolveAgentPath(filePath);
            const fd = await this.fileDataFromDisk(abs);
            if (!fd.content || fd.content.length === 0) {
                return "System reminder: File exists but has empty contents";
            }
            return formatReadResponse(fd, offset, limit);
        } catch (e: any) {
            if (e && e.code === "ENOENT") return `Error: File '${filePath}' not found`;
            return `Error: ${e?.message ?? String(e)}`;
        }
    }

    /**
     * Search files for pattern. Returns GrepMatch[] or string on invalid regex.
     * Attempts ripgrep first (if enabled). If ripgrep is unavailable and disableSpawnFallback=false,
     * falls back to a JS-based search.
     */
    async grepRaw(
        pattern: string,
        basePath: string | null = "/",
        glob: string | null = null,
    ): Promise<GrepMatch[] | string> {
        // validate regex
        let re: RegExp;
        try {
            re = new RegExp(pattern, "i");
        } catch (err: any) {
            return `Invalid regex: ${err.message ?? String(err)}`;
        }

        const absBase = this.resolveAgentPath(basePath ?? "/");

        // Try ripgrep if configured
        if (this.useRipgrep) {
            try {
                // Basic check for rg availability (spawnSync version)
                const args = [
                    "-n",
                    "-H",
                    "--hidden",
                    "--no-ignore-vcs",
                    "--no-ignore", // ensure we find files even if ignored
                    ...(this.ripgrepArgs ?? []),
                    ...(glob ? ["-g", glob] : []),
                    pattern,
                    absBase,
                ];
                const rg = spawnSync("rg", args, { encoding: "utf-8", maxBuffer: this.maxGrepBuffer });
                if (!rg.error && (rg.status === 0 || rg.status === 1)) {
                    // rg status 0 means matches found, 1 means no matches (but not an error)
                    if (!rg.stdout) return [];
                    const lines = String(rg.stdout).trim().split("\n").filter(Boolean);
                    const results: GrepMatch[] = [];
                    for (const l of lines) {
                        // format: /abs/path:line:match
                        const m = l.match(/^(.+?):(\d+):(.*)$/s);
                        if (!m) continue;
                        const absPath = m[1];
                        const lineNum = Number(m[2]);
                        const text = m[3];
                        const rel = `/${path.relative(this.rootDir, absPath).replace(/\\/g, "/")}`;
                        results.push({ path: rel, line: lineNum, text });
                    }
                    return results;
                } else {
                    // rg invocation failed
                    if (this.disableSpawnFallback) {
                        return `Error: ripgrep invocation failed: ${rg.error ? rg.error.message : "unknown"}`;
                    }
                    // otherwise fallback to JS search below
                }
            } catch {
                if (this.disableSpawnFallback) {
                    return "Error: ripgrep not available";
                }
                // fall-through to JS fallback
            }
        } else if (this.disableSpawnFallback) {
            // ripgrep explicitly disabled and fallback disabled
            return "Error: ripgrep usage disabled by configuration";
        }

        // JS fallback: walk files under absBase and test each line.
        // Note: may be slow on large repositories; acceptable with basePath & glob constraints.
        const matches: GrepMatch[] = [];
        const globRegex = glob ? globToRegExp(glob) : null;

        async function walkAndSearch(dir: string, outer: VscodeFsBackend) {
            const ents = await fsp.readdir(dir, { withFileTypes: true });
            for (const e of ents) {
                const child = path.join(dir, e.name);
                if (e.isDirectory()) {
                    await walkAndSearch(child, outer);
                } else {
                    // If glob provided, filter by posix-style relative path
                    const relPosix = `/${path.relative(outer.rootDir, child).replace(/\\/g, "/")}`;
                    if (globRegex && !globRegex.test(relPosix)) continue;
                    try {
                        const data = await fsp.readFile(child, { encoding: "utf-8" });
                        const lines = toLines(data);
                        for (let i = 0; i < lines.length; i++) {
                            if (re.test(lines[i])) {
                                matches.push({ path: relPosix, line: i + 1, text: lines[i] });
                            }
                        }
                    } catch {
                        // skip unreadable files
                        continue;
                    }
                }
            }
        }

        try {
            await walkAndSearch(absBase, this);
            return matches;
        } catch (err: any) {
            return `Error: ${err?.message ?? String(err)}`;
        }
    }

    /**
     * Glob info: returns FileInfo[] matching pattern under basePath.
     * Supports '*' and '**' style patterns.
     */
    async globInfo(pattern: string, basePath: string = "/"): Promise<FileInfo[]> {
        // walk basePath and match each file path with a simple glob->regex
        const absBase = this.resolveAgentPath(basePath);
        const regex = globToRegExp(pattern.startsWith("/") ? pattern : `/${pattern}`);
        const files: FileInfo[] = [];

        async function walk(dir: string, backend: VscodeFsBackend) {
            const ents = await fsp.readdir(dir, { withFileTypes: true });
            for (const e of ents) {
                const child = path.join(dir, e.name);
                if (e.isDirectory()) {
                    await walk(child, backend);
                } else {
                    const rel = `/${path.relative(backend.rootDir, child).replace(/\\/g, "/")}`;
                    if (!regex.test(rel)) continue;
                    const st = await fsp.stat(child);
                    files.push({ path: rel, is_dir: false, size: st.size, modified_at: st.mtime.toISOString() });
                }
            }
        }

        try {
            await walk(absBase, this);
            files.sort((a, b) => a.path.localeCompare(b.path));
            return files;
        } catch {
            return [];
        }
    }

    /**
     * Write (create or replace) a file. Uses atomic write pattern.
     * Returns WriteResult with filesUpdate = null (external persistence semantics).
     */
    async write(filePath: string, content: string): Promise<WriteResult> {
        return this.mutex.lock(async () => {
            try {
                const abs = this.resolveAgentPath(filePath);
                await fsp.mkdir(path.dirname(abs), { recursive: true });
                const tmp = `${abs}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await fsp.writeFile(tmp, content, { encoding: "utf-8" });
                await fsp.rename(tmp, abs);
                return { path: filePath, filesUpdate: null };
            } catch (err: any) {
                return { error: String(err?.message ?? err) };
            }
        });
    }

    /**
     * Edit a file by replacing occurrences. Returns EditResult with occurrences count and filesUpdate=null.
     */
    async edit(
        filePath: string,
        oldString: string,
        newString: string,
        replaceAll = false,
    ): Promise<EditResult> {
        return this.mutex.lock(async () => {
            try {
                const abs = this.resolveAgentPath(filePath);
                let current: string;
                try {
                    current = await fsp.readFile(abs, { encoding: "utf-8" });
                } catch (err: any) {
                    if (err.code === "ENOENT") return { error: `Error: File '${filePath}' not found` };
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
                    if (idx === -1) {
                        return { path: filePath, filesUpdate: null, occurrences: 0 };
                    }
                    occurrences = 1;
                    newContent = current.slice(0, idx) + newString + current.slice(idx + oldString.length);
                }

                const tmp = `${abs}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await fsp.writeFile(tmp, newContent, { encoding: "utf-8" });
                await fsp.rename(tmp, abs);
                return { path: filePath, filesUpdate: null, occurrences };
            } catch (err: any) {
                return { error: String(err?.message ?? err) };
            }
        });
    }
}

/**
 * Convert simple glob patterns to RegExp.
 * Supports:
 *  - '*' => match anything except path separator
 *  - '**' => match across separators
 *  - '?' => single char
 */
function globToRegExp(pattern: string): RegExp {
    // escape regex specials
    const esc = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
    const replaced = esc
        .replace(/\\\*\\\*/g, ".*")
        .replace(/\\\*/g, "[^/]*")
        .replace(/\\\?/g, ".");
    return new RegExp(`^${replaced}$`);
}

/**
 * Factory helper to create a BackendFactory compatible with deepagentsjs.
 * The returned factory will be called with StateAndStore during middleware initialization.
 */
export function createVscodeFsBackendFactory(opts: VscodeFsBackendFactoryOptions): BackendFactory {
    const {
        rootDir,
        useRipgrep = true,
        disableSpawnFallback = false,
        ripgrepArgs,
        maxGrepBuffer,
    } = opts;

    // Pre-check ripgrep availability if requested (not strictly required; we also check per-call)
    let rgAvailable = false;
    if (useRipgrep) {
        try {
            const probe = spawnSync("rg", ["--version"], { encoding: "utf-8", maxBuffer: 1024 });
            rgAvailable = !probe.error && probe.status === 0;
        } catch {
            rgAvailable = false;
        }
    }

    return function backendFactory(stateAndStore: StateAndStore): BackendProtocol {
        const assistantId = stateAndStore.assistantId;
        const backend = new VscodeFsBackend({
            rootDir,
            useRipgrep: useRipgrep && rgAvailable,
            disableSpawnFallback,
            ripgrepArgs,
            maxGrepBuffer,
            assistantId,
        });

        return backend;
    };
}