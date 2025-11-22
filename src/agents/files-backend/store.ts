/**
 * sqliteFileStore.ts
 *
 * A small file-store backed by sql.js (SQLite compiled to WASM).
 * Designed to be used inside a VS Code extension (or any browser / electron-like env).
 *
 * Usage notes for a VS Code extension:
 * - ship `sql-wasm.wasm` alongside your extension (e.g. in `dist/` or `media/`).
 * - call initSqlJs({ locateFile: () => pathToWasm }) during extension activation to get the SQL.js runtime.
 * - persist the DB bytes (db.export()) into extension storage (globalState or a file) and rehydrate by passing the bytes
 *   to this store constructor.
 *
 * This store purposely exposes a minimal API matching the notebook semantics:
 *  - listFiles()
 *  - readFile(filePath, offset = 0, limit = 2000)
 *  - writeFile(filePath, content)
 *
 * The implementation avoids any dependency on the deepagents backend interface and instead
 * provides tools that operate directly on this store. That keeps the code simple and suitable
 * for VS Code extension contexts where you already use sql.js directly.
 */

import type initSqlJsModule from "sql.js";
import type { SqlJsStatic, Database } from "sql.js";

export interface SqliteFileStoreOptions {
    /**
     * If provided, existing database bytes to load (previously produced by db.export()).
     * If not provided, a fresh in-memory DB will be created.
     */
    data?: Uint8Array | null;
    /**
     * The sql.js Database instance. If provided, this class will use it directly and won't create a new DB.
     * This is useful if the extension already initialised sql.js and holds a DB instance.
     */
    dbInstance?: Database | null;
}

/**
 * Lightweight wrapper around sql.js Database to store files.
 */
export class SqliteFileStore {
    private SQL!: SqlJsStatic;
    private db!: Database;
    private ready = false;

    /**
     * Construct the store.
     * - sqlJsInit should be the resolved initSqlJs() call (i.e. SqlJsStatic).
     * - If data bytes are provided, the DB will be loaded from them.
     */
    constructor(sqlJsInit: typeof initSqlJsModule | SqlJsStatic, private opts: SqliteFileStoreOptions = {}) {
        // The actual init needs to be async (we provide init() below).
        // Accept either the init function or already-initialised SqlJsStatic object.
        // Caller should call init() after constructing.
        // Store opts for use in init.
        // We'll type-narrow inside init().
    }

    /**
     * Initialize the store (async). Must be called before using any other method.
     *
     * Example:
     *   const SQL = await initSqlJs({ locateFile: () => pathToWasm });
     *   const store = new SqliteFileStore(SQL, { data: maybePreviousBytes });
     *   await store.init();
     */
    async init(sqlJsRuntime?: SqlJsStatic | typeof initSqlJsModule): Promise<void> {
        // Attempt to resolve SQL.js runtime if not provided.
        // Caller may provide sqlJsRuntime (the value returned from initSqlJs()).
        // If sqlJsRuntime is an init function, call it with default locateFile behavior (caller should have provided earlier).
        // For robustness, we accept either.
        // NOTE: In typical usage you'll pass the already-initialized SqlJsStatic value.
        let SQL: SqlJsStatic | undefined;

        if (sqlJsRuntime && typeof (sqlJsRuntime as any) === "function") {
            // @ts-ignore - call init if user passed the factory
            SQL = await (sqlJsRuntime as any)();
        } else if (sqlJsRuntime) {
            SQL = sqlJsRuntime as SqlJsStatic;
        } else {
            throw new Error(
                "SqliteFileStore.init requires a sql.js runtime. Call initSqlJs(...) in your extension and pass the result here."
            );
        }

        this.SQL = SQL;

        if (this.opts.dbInstance) {
            this.db = this.opts.dbInstance;
        } else if (this.opts.data) {
            this.db = new this.SQL.Database(this.opts.data);
        } else {
            this.db = new this.SQL.Database();
        }

        // Ensure table exists
        this.db.run(
            `CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        content TEXT NOT NULL
      )`
        );

        this.ready = true;
    }

    ensureReady() {
        if (!this.ready) {
            throw new Error("SqliteFileStore not initialized. Call init(...) first.");
        }
    }

    /**
     * List file paths currently stored.
     */
    async listFiles(): Promise<string[]> {
        this.ensureReady();

        const stmt = this.db.prepare("SELECT path FROM files ORDER BY path ASC");
        const paths: string[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as Record<string, unknown>;
            if (typeof row.path === "string") paths.push(row.path);
        }
        stmt.free();
        return paths;
    }

    /**
     * Read content from a file, returning a newline-delimited chunk.
     * - offset: zero-based line offset.
     * - limit: max number of lines to return.
     *
     * Mimics the Python notebook's read_file output (line-numbered).
     */
    async readFile(filePath: string, offset = 0, limit = 2000): Promise<string> {
        this.ensureReady();

        const stmt = this.db.prepare("SELECT content FROM files WHERE path = :p LIMIT 1");
        stmt.bind({ ":p": filePath });
        let content = "";
        if (stmt.step()) {
            // getAsObject returns { content: "..." }
            // NOTE: getAsObject returns strings for TEXT columns
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj: any = stmt.getAsObject();
            content = obj.content ?? "";
        }
        stmt.free();

        if (content === "") {
            // Distinguish between file-not-found and empty content:
            // If file exists but empty, SELECT would still return "".
            // We need to check existence first.
            const existsStmt = this.db.prepare("SELECT 1 FROM files WHERE path = :p LIMIT 1");
            existsStmt.bind({ ":p": filePath });
            const exists = existsStmt.step();
            existsStmt.free();
            if (!exists) {
                return `Error: File '${filePath}' not found`;
            } else {
                return "System reminder: File exists but has empty contents";
            }
        }

        const lines = content.split(/\r?\n/);
        if (offset >= lines.length) {
            return `Error: Line offset ${offset} exceeds file length (${lines.length} lines)`;
        }
        const end = Math.min(offset + limit, lines.length);
        const resultLines: string[] = [];
        for (let i = offset; i < end; i += 1) {
            // Truncate lines to keep outputs bounded (similar to original)
            const lineContent = lines[i].slice(0, 2000);
            // Line numbers are 1-based in the notebook output
            resultLines.push(`${String(i + 1).padStart(6, " ")}\t${lineContent}`);
        }
        return resultLines.join("\n");
    }

    /**
     * Write a file (create or replace entire content).
     * Returns the serialized DB bytes if caller wants to persist.
     */
    async writeFile(filePath: string, content: string): Promise<Uint8Array> {
        this.ensureReady();

        const stmt = this.db.prepare(
            "INSERT OR REPLACE INTO files (path, content) VALUES (:p, :c)"
        );
        stmt.bind({ ":p": filePath, ":c": content });
        stmt.step();
        stmt.free();

        // Export DB bytes for persistence (extension developer can pick this up and save)
        return this.db.export();
    }

    /**
     * Low-level accessor: get raw db bytes (useful to persist into extension storage)
     */
    getRawDbBytes(): Uint8Array {
        this.ensureReady();
        return this.db.export();
    }

    /**
     * Close/free db resources.
     */
    close(): void {
        if (this.db) {
            try {
                this.db.close();
            } catch {
                // ignore
            }
        }
        this.ready = false;
    }
}