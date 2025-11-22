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
        const next = this._p.then(() => fn(), () => fn());
        // ensure the queue continues regardless of fn outcome
        this._p = next.then(() => undefined, () => undefined);
        return next;
    }
}

/** Helper utilities */
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

/** Convert basic glob pattern to RegExp (supports *, **, ?). */
function globToRegExp(pattern: string): RegExp {
    const esc = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
    const replaced = esc
        .replace(/\\\*\\\*/g, ".*")
        .replace(/\\\*/g, "[^/]*")
        .replace(/\\\?/g, ".");
    return new RegExp(`^${replaced}$`);
}

/**
 * Implementation of BackendProtocol that uses the host filesystem.
 * It intentionally treats the backend as "external" persistence (filesUpdate = null).
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

        // ensure base directory exists
        fs.mkdirSync(this.rootDir, { recursive: true });
        if (this.assistantId) {
            fs.mkdirSync(path.join(this.rootDir, String(this.assistantId)), { recursive: true });
        }
    }

    /** Per-assistant base directory on disk. */
    private assistantBase(): string {
        if (!this.assistantId) return this.rootDir;
        return path.join(this.rootDir, String(this.assistantId));
    }

    /** Map agent-visible path ("/a/b") to absolute disk path under assistantBase. */
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

    private async fileDataFromDisk(abs: string): Promise<FileData> {
        const content = await fsp.readFile(abs, { encoding: "utf-8" });
        const st = await fsp.stat(abs);
        return {
            content: toLines(content),
            created_at: st.birthtime.toISOString(),
            modified_at: st.mtime.toISOString(),
        };
    }

    async lsInfo(dir: string): Promise<FileInfo[]> {
        const absDir = this.resolveAgentPath(dir);
        try {
            const entries = await fsp.readdir(absDir, { withFileTypes: true });
            const infos: FileInfo[] = [];
            for (const e of entries) {
                const child = path.join(absDir, e.name);
                const st = await fsp.stat(child);
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
            if (e.code === "ENOENT") return [];
            throw e;
        }
    }

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
     * grepRaw: uses ripgrep if available (prefer ripgrepSearch wrapper), otherwise JS fallback.
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

        // If configured to use ripgrep, prefer the provided JS wrapper (ripgrepSearch)
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
                    if (this.disableSpawnFallback) {
                        return `Error: ripgrep invocation failed: ${err?.message ?? String(err)}`;
                    }
                    // otherwise fallthrough to other approaches
                }
            }

            // If JS wrapper not provided, try spawning ripgrep executable (ripgrepExec or "rg")
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
                const rg = spawnSync(rgBin, args, { encoding: "utf-8", maxBuffer: this.maxGrepBuffer });
                if (!rg.error && (rg.status === 0 || rg.status === 1)) {
                    if (!rg.stdout) return [];
                    return parseRipgrepStdout(rg.stdout, this.rootDir);
                } else {
                    if (this.disableSpawnFallback) {
                        const msg = rg.error ? rg.error.message : `rg exit ${rg.status}`;
                        return `Error: ripgrep invocation failed: ${msg}`;
                    }
                    // else fallthrough to JS fallback
                }
            } catch {
                if (this.disableSpawnFallback) return "Error: ripgrep not available";
                // else continue to JS fallback
            }
        } else if (this.disableSpawnFallback) {
            return "Error: ripgrep usage disabled by configuration";
        }

        // JS fallback: walk and search. Constrain with glob if provided.
        const matches: GrepMatch[] = [];
        const globRegex = glob ? globToRegExp(glob.startsWith("/") ? glob : `/${glob}`) : null;

        async function walkAndSearch(dir: string, backend: VscodeFsBackend) {
            const ents = await fsp.readdir(dir, { withFileTypes: true });
            for (const e of ents) {
                const child = path.join(dir, e.name);
                if (e.isDirectory()) {
                    await walkAndSearch(child, backend);
                } else {
                    const relPosix = `/${path.relative(backend.rootDir, child).replace(/\\/g, "/")}`;
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

    async globInfo(pattern: string, basePath: string = "/"): Promise<FileInfo[]> {
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

    async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
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

/** Parse ripgrep stdout lines into GrepMatch[] */
function parseRipgrepStdout(stdout: string, rootDir: string): GrepMatch[] {
    const lines = String(stdout).trim().split("\n").filter(Boolean);
    const results: GrepMatch[] = [];
    for (const l of lines) {
        // expected format: /abs/path:line:match (match may contain ":")
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
 * The factory will be called with StateAndStore; it uses stateAndStore.assistantId for scoping.
 */
export function createVscodeFsBackendFactory(opts: VscodeFsBackendFactoryOptions): BackendFactory {
    const {
        rootDir,
        useRipgrep = true,
        disableSpawnFallback = false,
        ripgrepArgs,
        ripgrepExec,
        ripgrepSearch,
        maxGrepBuffer,
    } = opts;

    // Pre-probe ripgrep binary availability only if ripgrepExec not provided and useRipgrep true.
    let probeRgAvailable = false;
    if (useRipgrep && !ripgrepSearch) {
        try {
            const probe = spawnSync(ripgrepExec ?? "rg", ["--version"], { encoding: "utf-8", maxBuffer: 1024 });
            probeRgAvailable = !probe.error && probe.status === 0;
        } catch {
            probeRgAvailable = false;
        }
    }

    return function backendFactory(stateAndStore: StateAndStore): BackendProtocol {
        const assistantId = stateAndStore.assistantId;
        // If ripgrepSearch (JS wrapper) provided, prefer it. Otherwise respect probe availability and ripgrepExec.
        const backend = new VscodeFsBackend({
            rootDir,
            ripgrepArgs,
            useRipgrep: useRipgrep,
            disableSpawnFallback,
            ripgrepExec,
            ripgrepSearch,
            maxGrepBuffer,
            assistantId,
        });
        // If useRipgrep is true but we probed and rg isn't available and there is no ripgrepSearch wrapper,
        // update backend.useRipgrep so the backend will fall back (or return error if disableSpawnFallback).
        if (useRipgrep && !ripgrepSearch && !probeRgAvailable) {
            backend["useRipgrep"] = false;
        }
        return backend;
    };
}