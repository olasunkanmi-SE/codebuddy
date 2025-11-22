/**
 * sqljs.ts
 *
 * A DeepAgents backend implementation that stores files in a sql.js (SQLite) database.
 * Implements the BackendProtocol from deepagentsjs so it can be passed as the `backend`
 * option to createDeepAgent(...).
 *
 * Design notes:
 * - Uses a `files` table with columns: path (PRIMARY KEY), content (TEXT), created_at, modified_at
 * - Treats this backend as an "external" backend: after write/edit operations it will call
 *   an optional persist callback with the exported DB bytes; methods return filesUpdate=null
 *   (per the deepagents protocol for external persistence).
 * - Exposes a factory helper createSqljsBackendFactory(...) which returns a BackendFactory
 *   compatible function: (stateAndStore) => BackendProtocol
 *
 * Usage (example, see examples file):
 *  const SQL = await initSqlJs({ locateFile: () => pathToWasm });
 *  const backendFactory = createSqljsBackendFactory({
 *    SQL,
 *    initialDbBytes,
 *    persist: async (bytes) => extensionContext.globalState.update('agentDb', bytes)
 *  });
 *  const agent = createDeepAgent({ backend: backendFactory, ... });
 *
 * This file is intended for use inside a VS Code extension or an Electron-like environment
 * where sql.js can run and the extension persists the database bytes.
 */

import type { Database, SqlJsStatic } from "sql.js";
import type {
    BackendProtocol,
    FileInfo,
    FileData,
    GrepMatch,
    WriteResult,
    EditResult,
    StateAndStore,
} from "./protocol.js";

type PersistCallback = (bytes: Uint8Array) => Promise<void> | void;

function isoNow(): string {
    return new Date().toISOString();
}

function toLines(content: string): string[] {
    // split on CRLF or LF
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
 * Convert a glob-ish pattern to a RegExp.
 * Supports:
 *  - "*" -> match anything except path separator
 *  - "**" -> match anything including separators
 *  - "?" -> single char (not used heavily here)
 *
 * This is a lightweight converter; for very advanced patterns use a library.
 */
function globToRegExp(pattern: string): RegExp {
    // Escape regex special chars, then replace glob tokens
    const esc = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
    const replaced = esc
        .replace(/\\\*\\\*/g, ".*") // ** -> .*
        .replace(/\\\*/g, "[^/]*") // * -> anything but slash
        .replace(/\\\?/g, "."); // ? -> single char
    return new RegExp(`^${replaced}$`);
}

export class SqlJsBackend implements BackendProtocol {
    private SQL: SqlJsStatic;
    private db: Database;
    private persist?: PersistCallback;
    private assistantId?: string;

    constructor(params: {
        SQL: SqlJsStatic;
        dbInstance?: Database;
        initialBytes?: Uint8Array | null;
        persist?: PersistCallback;
        assistantId?: string | undefined;
    }) {
        this.SQL = params.SQL;
        if (params.dbInstance) {
            this.db = params.dbInstance;
        } else if (params.initialBytes) {
            this.db = new this.SQL.Database(params.initialBytes);
        } else {
            this.db = new this.SQL.Database();
        }
        this.persist = params.persist;
        this.assistantId = params.assistantId;

        // Ensure table
        this.db.run(
            `CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL
      )`
        );
    }

    // Helper to prefix paths by assistantId if provided (namespacing)
    private nsPath(path: string): string {
        if (!this.assistantId) return path;
        // Keep the full path but prefix with assistant id to isolate
        return `/${this.assistantId}${path.startsWith("/") ? "" : "/"}${path.replace(/^\/+/, "")}`;
    }

    async lsInfo(path = "/"): Promise<FileInfo[]> {
        // Non-recursive listing of top-level entries under `path`.
        // For simplicity we treat all stored paths as files (no explicit directories stored),
        // but synthesize directories when paths contain separators.
        const pfx = path === "/" ? "" : path.replace(/\/+$/, "");
        const stmt = this.db.prepare("SELECT path, content, modified_at FROM files");
        const infos: FileInfo[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
            const storedPath = String(row.path);
            // If path is not under pfx skip
            if (pfx && !storedPath.startsWith(pfx + "/")) continue;
            // Determine the immediate child under `path`
            const rel = pfx ? storedPath.slice(pfx.length + 1) : storedPath.replace(/^\//, "");
            const parts = rel.split("/").filter((s) => s.length > 0);
            if (parts.length === 0) continue;
            const immediate = parts[0];
            // We want only immediate entries; avoid duplicates
            const entryPath = pfx === "" ? `/${immediate}` : `${pfx}/${immediate}`;
            // Avoid duplicates
            if (!infos.some((f) => f.path === entryPath)) {
                const isDir = parts.length > 1;
                // compute approximate size from stored content (if file)
                const size = isDir ? undefined : (String(row.content) as string).length;
                infos.push({
                    path: entryPath,
                    is_dir: isDir,
                    size,
                    modified_at: row.modified_at,
                });
            }
        }
        stmt.free();
        // Sort lexically
        infos.sort((a, b) => a.path.localeCompare(b.path));
        return infos;
    }

    async read(filePath: string, offset = 0, limit = 2000): Promise<string> {
        const p = this.nsPath(filePath);
        const stmt = this.db.prepare("SELECT content, created_at, modified_at FROM files WHERE path = :p LIMIT 1");
        stmt.bind({ ":p": p });
        let fileData: FileData | undefined;
        if (stmt.step()) {
            const row = stmt.getAsObject() as any;
            fileData = {
                content: toLines(row.content ?? ""),
                created_at: row.created_at,
                modified_at: row.modified_at,
            };
        }
        stmt.free();

        if (!fileData) {
            return `Error: File '${filePath}' not found`;
        }
        if (!fileData.content || fileData.content.length === 0) {
            return "System reminder: File exists but has empty contents";
        }
        return formatReadResponse(fileData, offset, limit);
    }

    async grepRaw(pattern: string, path?: string | null, glob?: string | null): Promise<GrepMatch[] | string> {
        let re: RegExp;
        try {
            re = new RegExp(pattern, "i");
        } catch (e) {
            return `Invalid regex: ${(e as Error).message}`;
        }
        const patternGlob = glob ?? "**";
        const globRegex = globToRegExp(patternGlob.startsWith("/") ? patternGlob : `/${patternGlob}`);
        const pfx = path ? path.replace(/\/+$/, "") : "/";
        const stmt = this.db.prepare("SELECT path, content FROM files");
        const matches: GrepMatch[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
            const storedPath = String(row.path);
            if (pfx !== "/" && !storedPath.startsWith(pfx + "/")) continue;
            if (!globRegex.test(storedPath)) continue;
            const lines = toLines(row.content ?? "");
            for (let i = 0; i < lines.length; i++) {
                if (re.test(lines[i])) {
                    matches.push({
                        path: storedPath,
                        line: i + 1,
                        text: lines[i],
                    });
                }
            }
        }
        stmt.free();
        return matches;
    }

    async globInfo(pattern: string, basePath = "/"): Promise<FileInfo[]> {
        const pfx = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
        const regex = globToRegExp(pattern.startsWith("/") ? pattern : `/${pattern}`);
        const stmt = this.db.prepare("SELECT path, content, modified_at FROM files");
        const infos: FileInfo[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
            const storedPath = String(row.path);
            if (pfx && !storedPath.startsWith(pfx + "/")) continue;
            if (!regex.test(storedPath)) continue;
            const size = (String(row.content) as string).length;
            infos.push({
                path: storedPath,
                is_dir: false,
                size,
                modified_at: row.modified_at,
            });
        }
        stmt.free();
        infos.sort((a, b) => a.path.localeCompare(b.path));
        return infos;
    }

    // write: create or replace file. return WriteResult with filesUpdate=null (external)
    async write(filePath: string, content: string): Promise<WriteResult> {
        const p = this.nsPath(filePath);
        // Check for existing to set created_at appropriately
        const sel = this.db.prepare("SELECT created_at FROM files WHERE path = :p LIMIT 1");
        sel.bind({ ":p": p });
        let createdAt = isoNow();
        if (sel.step()) {
            const row = sel.getAsObject() as any;
            createdAt = row.created_at ?? createdAt;
        }
        sel.free();
        const modifiedAt = isoNow();

        const stmt = this.db.prepare(
            "INSERT OR REPLACE INTO files (path, content, created_at, modified_at) VALUES (:p, :c, :ca, :ma)"
        );
        stmt.bind({ ":p": p, ":c": content, ":ca": createdAt, ":ma": modifiedAt });
        stmt.step();
        stmt.free();

        // Persist DB bytes if persist callback provided
        try {
            if (this.persist) {
                const bytes = this.db.export();
                await Promise.resolve(this.persist(bytes));
            }
        } catch {
            // ignore persistence errors; still report success to caller
        }

        return {
            path: filePath,
            filesUpdate: null,
        };
    }

    // edit: replace occurrences; returns occurrences count and filesUpdate=null
    async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
        const p = this.nsPath(filePath);
        const sel = this.db.prepare("SELECT content, created_at FROM files WHERE path = :p LIMIT 1");
        sel.bind({ ":p": p });
        if (!sel.step()) {
            sel.free();
            return { error: `File '${filePath}' not found` };
        }
        const row = sel.getAsObject() as any;
        const currentContent: string = row.content ?? "";
        const createdAt = row.created_at ?? isoNow();
        sel.free();

        if (!currentContent.includes(oldString)) {
            return { path: filePath, filesUpdate: null, occurrences: 0 };
        }

        let newContent: string;
        let occurrences = 0;
        if (replaceAll) {
            // global replace
            const parts = currentContent.split(oldString);
            occurrences = parts.length - 1;
            newContent = parts.join(newString);
        } else {
            // replace first occurrence
            const idx = currentContent.indexOf(oldString);
            if (idx === -1) {
                occurrences = 0;
                newContent = currentContent;
            } else {
                occurrences = 1;
                newContent =
                    currentContent.slice(0, idx) + newString + currentContent.slice(idx + oldString.length);
            }
        }

        const modifiedAt = isoNow();
        const upd = this.db.prepare(
            "UPDATE files SET content = :c, modified_at = :ma WHERE path = :p"
        );
        upd.bind({ ":c": newContent, ":ma": modifiedAt, ":p": p });
        upd.step();
        upd.free();

        try {
            if (this.persist) {
                const bytes = this.db.export();
                await Promise.resolve(this.persist(bytes));
            }
        } catch {
            // ignore
        }

        return {
            path: filePath,
            filesUpdate: null,
            occurrences,
        };
    }
}

/**
 * Helper factory to produce a BackendFactory (stateAndStore => BackendProtocol).
 *
 * Params:
 *  - SQL: the SqlJsStatic runtime (the result of initSqlJs(...))
 *  - initialDbBytes: optional bytes to initialize DB (previously exported bytes)
 *  - persist: optional callback invoked after writes/edits with db bytes so the host can persist them.
 *
 * The returned BackendFactory will read assistantId from StateAndStore and pass it to the backend
 * to provide per-assistant namespacing for files (optional).
 */
export function createSqljsBackendFactory(params: {
    SQL: SqlJsStatic;
    initialDbBytes?: Uint8Array | null;
    persist?: PersistCallback;
}) {
    return function backendFactory(stateAndStore: StateAndStore): BackendProtocol {
        const assistantId = stateAndStore.assistantId;
        // If a host has already created a DB instance and placed it into stateAndStore.store or elsewhere,
        // you could look it up here. For simplicity, we create a DB per factory invocation and let the
        // persist callback handle long-term storage.
        return new SqlJsBackend({
            SQL: params.SQL,
            initialBytes: params.initialDbBytes ?? null,
            persist: params.persist,
            assistantId,
        });
    };
}