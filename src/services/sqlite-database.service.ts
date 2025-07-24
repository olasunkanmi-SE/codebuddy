import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";
import { PersistentCodebaseAnalysis } from "./persistent-codebase-understanding.service";

interface CodebaseSnapshot {
  id?: number;
  workspace_path: string;
  git_branch: string;
  git_commit_hash: string;
  git_diff_hash: string;
  analysis_data: string; // JSON serialized
  file_count: number;
  created_at: string;
  last_accessed: string;
}

interface GitState {
  branch: string;
  commitHash: string;
  diffHash: string;
  fileCount: number;
  workspacePath: string;
}

export class SqliteDatabaseService {
  private static instance: SqliteDatabaseService;
  private db: any = null; // sql.js Database instance
  private readonly logger: Logger;
  private dbPath: string = "";
  private SQL: any = null; // sql.js instance

  private constructor() {
    this.logger = Logger.initialize("SqliteDatabaseService", {
      minLevel: LogLevel.DEBUG,
    });
  }

  public static getInstance(): SqliteDatabaseService {
    if (!SqliteDatabaseService.instance) {
      SqliteDatabaseService.instance = new SqliteDatabaseService();
    }
    return SqliteDatabaseService.instance;
  }

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("Starting SQLite database initialization...");

      // Initialize sql.js
      this.logger.info("Initializing sql.js...");
      const initSqlJs = (await import("sql.js")).default;

      // Configure sql.js with the WASM file location
      // In the bundled extension, the WASM file is in the same directory as extension.js
      const wasmPath = path.join(__dirname, "sql-wasm.wasm");
      this.logger.info(`Looking for WASM file at: ${wasmPath}`);

      this.SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file.endsWith(".wasm")) {
            return wasmPath;
          }
          return file;
        },
      });

      // Create database in workspace or extension global storage
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (workspaceRoot) {
        this.logger.info(`Using workspace root: ${workspaceRoot}`);
        const codebuddyDir = path.join(workspaceRoot, ".codebuddy");
        if (!fs.existsSync(codebuddyDir)) {
          this.logger.info(`Creating .codebuddy directory: ${codebuddyDir}`);
          fs.mkdirSync(codebuddyDir, { recursive: true });
        }
        this.dbPath = path.join(codebuddyDir, "codebase_analysis.db");
      } else {
        this.logger.info("No workspace root, using extension global storage");
        // Fallback to extension global storage
        const dbDir = path.join(__dirname, "..", "..", "database");
        if (!fs.existsSync(dbDir)) {
          this.logger.info(`Creating database directory: ${dbDir}`);
          fs.mkdirSync(dbDir, { recursive: true });
        }
        this.dbPath = path.join(dbDir, "codebase_analysis.db");
      }

      this.logger.info(`Database path: ${this.dbPath}`);

      // Initialize SQLite database
      this.logger.info("Creating Database instance with sql.js...");

      // Load existing database if it exists
      let data: Uint8Array | undefined = undefined;
      if (fs.existsSync(this.dbPath)) {
        this.logger.info("Loading existing database file...");
        const buffer = fs.readFileSync(this.dbPath);
        data = new Uint8Array(buffer);
      }

      this.db = new this.SQL.Database(data);

      // Create tables and indexes
      this.logger.info("Creating database tables...");
      await this.createTables();

      this.logger.info(
        `SQLite database initialized successfully at: ${this.dbPath}`,
      );
    } catch (error) {
      this.logger.error("Failed to initialize database", error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Create necessary tables for codebase analysis
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    // Create codebase_snapshots table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS codebase_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_path TEXT NOT NULL,
        git_branch TEXT NOT NULL,
        git_commit_hash TEXT NOT NULL,
        git_diff_hash TEXT NOT NULL,
        analysis_data TEXT NOT NULL,
        file_count INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        last_accessed TEXT NOT NULL
      )
    `);

    // Create indexes for better performance
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_workspace_path 
      ON codebase_snapshots (workspace_path)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_git_state 
      ON codebase_snapshots (workspace_path, git_branch, git_commit_hash, git_diff_hash)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_last_accessed 
      ON codebase_snapshots (last_accessed)
    `);

    // Composite index for workspace_path + git_branch (for loose cache lookups)
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_workspace_branch 
      ON codebase_snapshots (workspace_path, git_branch)
    `);

    this.logger.debug("SQLite database tables and indexes created");

    // Save the database to disk
    this.saveToDisk();
  }

  /**
   * Save the in-memory database to disk
   */
  private saveToDisk(): void {
    if (!this.db) {
      return;
    }

    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    } catch (error) {
      this.logger.error("Failed to save database to disk", error);
    }
  }

  /**
   * Get current git state for the workspace
   */
  async getCurrentGitState(): Promise<GitState | null> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      this.logger.info(`Workspace root: ${workspaceRoot}`);
      if (!workspaceRoot) {
        return null;
      }

      // Use VS Code's git extension API if available
      const gitExtension =
        vscode.extensions.getExtension("vscode.git")?.exports;
      const git = gitExtension?.getAPI(1);

      if (git && git.repositories.length > 0) {
        const repo = git.repositories[0];
        const branch = repo.state.HEAD?.name || "main";
        const commitHash = repo.state.HEAD?.commit || "";

        this.logger.info(`Git branch: ${branch}, commit: ${commitHash}`);

        // Get file count and create a simple diff hash
        const files = await vscode.workspace.findFiles(
          "**/*.{ts,js,tsx,jsx,json,py,java,cs,php,md}",
          "**/node_modules/**",
          1000,
        );

        const fileCount = files.length;
        const diffHash = await this.createDiffHash(files);

        this.logger.info(`File count: ${fileCount}, diff hash: ${diffHash}`);

        const gitState = {
          branch,
          commitHash,
          diffHash,
          fileCount,
          workspacePath: workspaceRoot,
        };

        this.logger.info(`Generated git state: ${JSON.stringify(gitState)}`);
        return gitState;
      }

      // Fallback without git extension
      this.logger.warn("Git extension not available, using fallback git state");
      const fallbackState = {
        branch: "unknown",
        commitHash: "unknown",
        diffHash: await this.createSimpleDiffHash(),
        fileCount: 0,
        workspacePath: workspaceRoot,
      };

      this.logger.info(`Fallback git state: ${JSON.stringify(fallbackState)}`);
      return fallbackState;
    } catch (error) {
      this.logger.error("Failed to get git state", error);
      return null;
    }
  }

  /**
   * Create a diff hash based on file modifications
   */
  private async createDiffHash(files: vscode.Uri[]): Promise<string> {
    try {
      const fileStats = await Promise.all(
        files.slice(0, 50).map(async (uri) => {
          try {
            const stat = await vscode.workspace.fs.stat(uri);
            return `${uri.fsPath}:${stat.mtime}:${stat.size}`;
          } catch {
            return uri.fsPath;
          }
        }),
      );

      const combinedString = fileStats.join("|");
      // Simple hash implementation (in production, use crypto)
      let hash = 0;
      for (let i = 0; i < combinedString.length; i++) {
        const char = combinedString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16);
    } catch (error) {
      this.logger.warn("Failed to create diff hash", error);
      return Date.now().toString();
    }
  }

  /**
   * Simple fallback diff hash
   */
  private async createSimpleDiffHash(): Promise<string> {
    return Date.now().toString();
  }

  /**
   * Save codebase analysis to database
   */
  async saveCodebaseAnalysis(
    gitState: GitState,
    analysisData: any,
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const now = new Date().toISOString();

      // Remove old snapshots for the same workspace first
      this.db.run(
        `DELETE FROM codebase_snapshots 
         WHERE workspace_path = ? AND NOT (git_branch = ? AND git_commit_hash = ? AND git_diff_hash = ?)`,
        [
          gitState.workspacePath,
          gitState.branch,
          gitState.commitHash,
          gitState.diffHash,
        ],
      );

      // Insert new snapshot
      this.db.run(
        `INSERT OR REPLACE INTO codebase_snapshots 
         (workspace_path, git_branch, git_commit_hash, git_diff_hash, analysis_data, file_count, created_at, last_accessed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gitState.workspacePath,
          gitState.branch,
          gitState.commitHash,
          gitState.diffHash,
          JSON.stringify(analysisData),
          gitState.fileCount,
          now,
          now,
        ],
      );

      // Clean up old snapshots (keep only latest 10 per workspace)
      this.db.run(
        `DELETE FROM codebase_snapshots 
         WHERE id NOT IN (
           SELECT id FROM codebase_snapshots 
           WHERE workspace_path = ? 
           ORDER BY created_at DESC 
           LIMIT 10
         ) AND workspace_path = ?`,
        [gitState.workspacePath, gitState.workspacePath],
      );

      // Save to disk
      this.saveToDisk();

      this.logger.info("Codebase analysis saved to SQLite database");
    } catch (error) {
      this.logger.error("Failed to save codebase analysis", error);
      throw error;
    }
  }

  /**
   * Get cached codebase analysis if valid
   */
  async getCachedCodebaseAnalysis(
    gitState: GitState,
  ): Promise<PersistentCodebaseAnalysis | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      this.logger.info(
        `Looking for cached analysis for: workspace=${gitState.workspacePath}, branch=${gitState.branch}, diffHash=${gitState.diffHash}`,
      );

      // First, let's see what's actually in the database
      const allStmt = this.db.prepare(`
        SELECT workspace_path, git_branch, git_diff_hash, created_at 
        FROM codebase_snapshots 
        ORDER BY created_at DESC
      `);

      this.logger.info("All snapshots in database:");
      while (allStmt.step()) {
        const row = allStmt.getAsObject();
        this.logger.info(`  - ${JSON.stringify(row)}`);
      }
      allStmt.free();

      // Find matching snapshot with exact match first
      const stmt = this.db.prepare(`
        SELECT analysis_data, id 
        FROM codebase_snapshots 
        WHERE workspace_path = ? AND git_branch = ? AND git_diff_hash = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      stmt.bind([gitState.workspacePath, gitState.branch, gitState.diffHash]);

      if (stmt.step()) {
        const snapshot = stmt.getAsObject() as {
          analysis_data: string;
          id: number;
        };
        stmt.free();

        // Update last accessed time
        this.db.run(
          `UPDATE codebase_snapshots 
           SET last_accessed = ? 
           WHERE id = ?`,
          [new Date().toISOString(), snapshot.id],
        );

        // Save to disk
        this.saveToDisk();

        this.logger.info(
          "Found valid cached codebase analysis with exact match",
        );
        return JSON.parse(snapshot.analysis_data);
      }
      stmt.free();

      // If no exact match, try without diff_hash (less strict)
      this.logger.info("No exact match found, trying without diff_hash...");
      const looseStmt = this.db.prepare(`
        SELECT analysis_data, id 
        FROM codebase_snapshots 
        WHERE workspace_path = ? AND git_branch = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      looseStmt.bind([gitState.workspacePath, gitState.branch]);

      if (looseStmt.step()) {
        const snapshot = looseStmt.getAsObject() as {
          analysis_data: string;
          id: number;
        };
        looseStmt.free();

        // Update last accessed time
        this.db.run(
          `UPDATE codebase_snapshots 
           SET last_accessed = ? 
           WHERE id = ?`,
          [new Date().toISOString(), snapshot.id],
        );

        // Save to disk
        this.saveToDisk();

        this.logger.info(
          "Found valid cached codebase analysis with loose match (ignoring diff hash)",
        );
        return JSON.parse(snapshot.analysis_data);
      }
      looseStmt.free();

      this.logger.info("No cached codebase analysis found");
      return null;
    } catch (error) {
      this.logger.error("Failed to get cached codebase analysis", error);
      return null;
    }
  }

  /**
   * Check if codebase has significantly changed
   */
  async hasSignificantChanges(gitState: GitState): Promise<boolean> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const stmt = this.db.prepare(`
        SELECT git_commit_hash, git_diff_hash, file_count
        FROM codebase_snapshots 
        WHERE workspace_path = ? AND git_branch = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      stmt.bind([gitState.workspacePath, gitState.branch]);

      if (!stmt.step()) {
        stmt.free();
        return true; // No previous snapshot, consider it a significant change
      }

      const lastSnapshot = stmt.getAsObject() as {
        git_commit_hash: string;
        git_diff_hash: string;
        file_count: number;
      };

      stmt.free();

      // Check if commit hash changed
      if (lastSnapshot.git_commit_hash !== gitState.commitHash) {
        return true;
      }

      // Check if file diff hash changed
      if (lastSnapshot.git_diff_hash !== gitState.diffHash) {
        return true;
      }

      // Check if file count changed significantly (>10%)
      const fileCountChange =
        Math.abs(lastSnapshot.file_count - gitState.fileCount) /
        lastSnapshot.file_count;
      if (fileCountChange > 0.1) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error("Failed to check for significant changes", error);
      return true; // Assume changes if we can't determine
    }
  }

  /**
   * Clean up old snapshots
   */
  async cleanupOldSnapshots(
    maxAge: number = 7 * 24 * 60 * 60 * 1000,
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const cutoffDate = new Date(Date.now() - maxAge).toISOString();

      // Delete old snapshots
      this.db.run(`DELETE FROM codebase_snapshots WHERE last_accessed < ?`, [
        cutoffDate,
      ]);

      // Save to disk
      this.saveToDisk();

      this.logger.info(`Cleaned up old snapshots`);
    } catch (error) {
      this.logger.error("Failed to cleanup old snapshots", error);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalSnapshots: number;
    oldestSnapshot: string;
    newestSnapshot: string;
    totalSize: number;
  }> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Get count and date statistics
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as totalSnapshots,
          MIN(created_at) as oldestSnapshot,
          MAX(created_at) as newestSnapshot
        FROM codebase_snapshots
      `);

      stmt.step();
      const results = stmt.getAsObject() as {
        totalSnapshots: number;
        oldestSnapshot: string | null;
        newestSnapshot: string | null;
      };

      stmt.free();

      // Get database file size
      let totalSize = 0;
      try {
        if (fs.existsSync(this.dbPath)) {
          const stat = await fs.promises.stat(this.dbPath);
          totalSize = stat.size;
        }
      } catch (error) {
        this.logger.warn("Failed to get database file size", error);
      }

      return {
        totalSnapshots: results.totalSnapshots || 0,
        oldestSnapshot: results.oldestSnapshot || "",
        newestSnapshot: results.newestSnapshot || "",
        totalSize,
      };
    } catch (error) {
      this.logger.error("Failed to get database stats", error);
      return {
        totalSnapshots: 0,
        oldestSnapshot: "",
        newestSnapshot: "",
        totalSize: 0,
      };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      // Save to disk before closing
      this.saveToDisk();
      this.db.close();
      this.db = null;
    }
  }
}
