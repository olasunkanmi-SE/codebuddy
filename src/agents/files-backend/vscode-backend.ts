/**
 * VS Code extension friendly filesystem backend (Node-only, no vscode types).
 *
 * - Uses Node fs/promises for storage (writes real files under a configured rootDir)
 * - Exposes a factory: createVscodeFsBackendFactory({ rootDir, allowWorkspaceWrite })
 *   that returns a BackendFactory compatible with deepagentsjs
 *
 * Security:
 * - All agent paths are mapped to rootDir (no traversal allowed)
 * - Optionally namespaces by assistantId from StateAndStore
 *
 * Compatibility:
 * - Returns external persistence semantics (filesUpdate: null)
 * - Methods implement BackendProtocol semantics in spirit and return friendly error strings
 */

import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import { spawnSync } from "child_process";
import { BackendProtocol } from "deepagents";

// Minimal types copied for clarity — replace with imports from deepagentsjs if available
type FileInfo = { path: string; is_dir?: boolean; size?: number; modified_at?: string };
type GrepMatch = { path: string; line: number; text: string };
type FileData = { content: string[]; created_at: string; modified_at: string };
type WriteResult = { error?: string; path?: string; filesUpdate?: Record<string, FileData> | null };
type EditResult = { error?: string; path?: string; filesUpdate?: Record<string, FileData> | null; occurrences?: number };
type StateAndStore = { state: unknown; store?: unknown; assistantId?: string };

// Simple mutex to serialize filesystem mutations
class SimpleMutex {
    private _p: Promise<void> = Promise.resolve();
    lock<T>(fn: () => Promise<T>): Promise<T> {
        const next = this._p.then(() => fn(), () => fn());
        // ensure subsequent locks wait until next finishes
        this._p = next.then(() => undefined, () => undefined);
        return next;
    }
}

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
 * VscodeFsBackend: implements the core file operations on top of the host filesystem.
 */
class VscodeFsBackend implements BackendProtocol {
    private rootDir: string;
    private mutex = new SimpleMutex();

    constructor(rootDir: string) {
        this.rootDir = path.resolve(rootDir);
        // Ensure rootDir exists
        fs.mkdirSync(this.rootDir, { recursive: true });
    }

    // Map agent path ("/foo/bar") to a safe absolute path under rootDir
    private resolveAgentPath(agentPath: string, assistantId?: string): string {
        // Normalize agent path, force it to start with "/"
        if (!agentPath.startsWith("/")) {
            agentPath = `/${agentPath}`;
        }
        // If assistantId provided, scope under a subdir to isolate
        const base = assistantId ? path.join(this.rootDir, String(assistantId)) : this.rootDir;
        const rel = agentPath.replace(/^\/+/, "");
        const abs = path.resolve(base, rel);
        // Ensure abs is within base
        if (!abs.startsWith(path.resolve(base) + path.sep) && abs !== path.resolve(base)) {
            throw new Error("Invalid path: outside of permitted root");
        }
        return abs;
    }

    // Non-recursive lsInfo: list immediate entries under `path`
    async lsInfo(agentDir: string = "/", assistantId?: string): Promise<FileInfo[]> {
        const absDir = this.resolveAgentPath(agentDir, assistantId);
        try {
            const entries = await fsp.readdir(absDir, { withFileTypes: true });
            const infos: FileInfo[] = [];
            for (const e of entries) {
                const childPath = path.join(absDir, e.name);
                const stat = await fsp.stat(childPath);
                const rel = path.posix.join(
                    "/",
                    (assistantId ? `/${assistantId}` : "").replace(/^\/+/, ""),
                    path.relative(this.rootDir, childPath).replace(/\\/g, "/")
                );
                infos.push({
                    path: e.isDirectory() ? `${rel.replace(/\/+$/, "")}/` : rel,
                    is_dir: e.isDirectory(),
                    size: e.isDirectory() ? undefined : stat.size,
                    modified_at: stat.mtime.toISOString(),
                });
            }
            infos.sort((a, b) => a.path.localeCompare(b.path));
            return infos;
        } catch (err: any) {
            // If directory doesn't exist, return empty list (consistency with other backends)
            if (err.code === "ENOENT") return [];
            throw err;
        }
    }

    // Read a file; returns formatted string with line numbers or error
    async read(agentPath: string, offset = 0, limit = 2000, assistantId?: string): Promise<string> {
        const abs = this.resolveAgentPath(agentPath, assistantId);
        try {
            const content = await fsp.readFile(abs, { encoding: "utf-8" });
            const fileData: FileData = {
                content: toLines(content),
                created_at: (await fsp.stat(abs)).birthtime.toISOString(),
                modified_at: (await fsp.stat(abs)).mtime.toISOString(),
            };
            if (!fileData.content || fileData.content.length === 0) {
                return "System reminder: File exists but has empty contents";
            }
            return formatReadResponse(fileData, offset, limit);
        } catch (err: any) {
            if (err.code === "ENOENT") return `Error: File '${agentPath}' not found`;
            return `Error: ${err.message ?? String(err)}`;
        }
    }

    // Very small helper to produce FileData for files on disk
    private async fileDataFromDisk(abs: string): Promise<FileData> {
        const content = await fsp.readFile(abs, { encoding: "utf-8" });
        const st = await fsp.stat(abs);
        return {
            content: toLines(content),
            created_at: st.birthtime.toISOString(),
            modified_at: st.mtime.toISOString(),
        };
    }

    // Write file atomically (create or replace)
    async write(agentPath: string, content: string, assistantId?: string): Promise<WriteResult> {
        // Wrap in mutex to keep file system writes serialized and avoid partial writes due to races
        return this.mutex.lock(async () => {
            try {
                const abs = this.resolveAgentPath(agentPath, assistantId);
                // Ensure parent dir exists
                await fsp.mkdir(path.dirname(abs), { recursive: true });
                // Atomic write: write to temp then rename
                const tmp = `${abs}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await fsp.writeFile(tmp, content, { encoding: "utf-8" });
                await fsp.rename(tmp, abs);
                // Return external-persist semantics
                return { path: agentPath, filesUpdate: null };
            } catch (err: any) {
                return { error: String(err.message ?? err) };
            }
        });
    }

    // Edit file by replacing occurrences
    async edit(agentPath: string, oldString: string, newString: string, replaceAll = false, assistantId?: string): Promise<EditResult> {
        return this.mutex.lock(async () => {
            try {
                const abs = this.resolveAgentPath(agentPath, assistantId);
                // Read existing content
                let cur: string;
                try {
                    cur = await fsp.readFile(abs, { encoding: "utf-8" });
                } catch (err: any) {
                    if (err.code === "ENOENT") return { error: `Error: File '${agentPath}' not found` };
                    return { error: String(err.message ?? err) };
                }
                if (!cur.includes(oldString)) {
                    return { path: agentPath, filesUpdate: null, occurrences: 0 };
                }
                let newContent: string;
                let occurrences = 0;
                if (replaceAll) {
                    const parts = cur.split(oldString);
                    occurrences = parts.length - 1;
                    newContent = parts.join(newString);
                } else {
                    const idx = cur.indexOf(oldString);
                    if (idx === -1) {
                        return { path: agentPath, filesUpdate: null, occurrences: 0 };
                    }
                    occurrences = 1;
                    newContent = cur.slice(0, idx) + newString + cur.slice(idx + oldString.length);
                }
                // atomic write
                const tmp = `${abs}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await fsp.writeFile(tmp, newContent, { encoding: "utf-8" });
                await fsp.rename(tmp, abs);
                return { path: agentPath, filesUpdate: null, occurrences };
            } catch (err: any) {
                return { error: String(err.message ?? err) };
            }
        });
    }

    // Simple globInfo: match file paths under root using a basic pattern (supports '*' and '**')
    async globInfo(pattern: string, basePath = "/", assistantId?: string): Promise<FileInfo[]> {
        // For simplicity, perform a recursive walk under base path and match with simple glob conversion
        const walk = async (dir: string, acc: string[]) => {
            const ents = await fsp.readdir(dir, { withFileTypes: true });
            for (const e of ents) {
                const child = path.join(dir, e.name);
                if (e.isDirectory()) {
                    await walk(child, acc);
                } else {
                    acc.push(child);
                }
            }
        };

        try {
            const baseAbs = this.resolveAgentPath(basePath, assistantId);
            const files: string[] = [];
            await walk(baseAbs, files);
            // Convert pattern to a posix-style regex
            const posixPattern = pattern.startsWith("/") ? pattern : `/${pattern}`;
            const regex = new RegExp(
                "^" +
                posixPattern
                    .replace(/\*\*/g, ".*")
                    .replace(/\*/g, "[^/]*")
                    .replace(/\?/g, ".") +
                "$"
            );
            const infos: FileInfo[] = [];
            for (const f of files) {
                const rel = `/${path.relative(this.rootDir, f).replace(/\\/g, "/")}`;
                if (!regex.test(rel)) continue;
                const st = await fsp.stat(f);
                infos.push({ path: rel, is_dir: false, size: st.size, modified_at: st.mtime.toISOString() });
            }
            infos.sort((a, b) => a.path.localeCompare(b.path));
            return infos;
        } catch (err: any) {
            return [];
        }
    }

    // grepRaw: try to use ripgrep (rg) if available for speed; otherwise a JS fallback scanning files under path
    async grepRaw(pattern: string, basePath: string | null = "/", glob: string | null = null, assistantId?: string): Promise<GrepMatch[] | string> {
        // Validate regex
        let testRe: RegExp;
        try {
            testRe = new RegExp(pattern, "i");
        } catch (e: any) {
            return `Invalid regex: ${e.message}`;
        }

        // If rg available, spawn it (fast)
        try {
            const absBase = this.resolveAgentPath(basePath ?? "/", assistantId);
            const rg = spawnSync("rg", ["-n", "-H", "--hidden", "--glob", glob ?? "**/*", pattern, absBase], {
                encoding: "utf-8",
                maxBuffer: 10 * 1024 * 1024,
            });
            if (!rg.error && rg.status === 0) {
                const lines = String(rg.stdout).trim().split("\n").filter(Boolean);
                const results: GrepMatch[] = [];
                for (const l of lines) {
                    // format: /abs/path:line:match
                    const m = l.match(/^(.+?):(\d+):(.*)$/);
                    if (!m) continue;
                    const absPath = m[1];
                    const lineNum = Number(m[2]);
                    const text = m[3];
                    const rel = `/${path.relative(this.rootDir, absPath).replace(/\\/g, "/")}`;
                    results.push({ path: rel, line: lineNum, text });
                }
                return results;
            }
        } catch {
            // fall through to JS fallback
        }

        // JS fallback: walk files and test per-line (careful with very large workspaces)
        const results: GrepMatch[] = [];
        const walkAndSearch = async (dir: string) => {
            const ents = await fsp.readdir(dir, { withFileTypes: true });
            for (const e of ents) {
                const child = path.join(dir, e.name);
                if (e.isDirectory()) {
                    await walkAndSearch(child);
                } else {
                    try {
                        const data = await fsp.readFile(child, { encoding: "utf-8" });
                        const lines = toLines(data);
                        for (let i = 0; i < lines.length; i++) {
                            if (testRe.test(lines[i])) {
                                const rel = `/${path.relative(this.rootDir, child).replace(/\\/g, "/")}`;
                                results.push({ path: rel, line: i + 1, text: lines[i] });
                            }
                        }
                    } catch {
                        // skip unreadable files
                        continue;
                    }
                }
            }
        };

        try {
            const baseAbs = this.resolveAgentPath(basePath ?? "/", assistantId);
            await walkAndSearch(baseAbs);
            return results;
        } catch (err: any) {
            return `Error: ${err.message ?? String(err)}`;
        }
    }
}

/**
 * Factory: createVscodeFsBackendFactory({ rootDir })
 * The returned function matches BackendFactory(stateAndStore => BackendProtocol)
 */
export function createVscodeFsBackendFactory(opts: { rootDir: string }) {
    const { rootDir } = opts;
    // create one canonical root on factory creation
    return function backendFactory(stateAndStore: StateAndStore) {
        const assistantId = stateAndStore.assistantId;
        // compute assistant-scoped root if needed
        const backendRoot = assistantId ? path.join(rootDir, String(assistantId)) : rootDir;
        return new VscodeFsBackend(backendRoot) as unknown as any; // cast to BackendProtocol-compatible type
    };
}