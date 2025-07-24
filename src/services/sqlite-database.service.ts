import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";
import { PersistentCodebaseAnalysis } from "./persistent-codebase-understanding.service";

// We'll use a simple SQLite wrapper - in production you might want to use better-sqlite3
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}

interface SqliteStatement {
  run(...params: any[]): { changes: number; lastInsertRowid: number };
  get(...params: any[]): any;
  all(...params: any[]): any[];
  finalize(): void;
}

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
  private db: SqliteDatabase | null = null;
  private readonly logger: Logger;
  private dbPath: string = "";

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
      // Create database in workspace or extension global storage
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (workspaceRoot) {
        const codebuddyDir = path.join(workspaceRoot, ".codebuddy");
        if (!fs.existsSync(codebuddyDir)) {
          fs.mkdirSync(codebuddyDir, { recursive: true });
        }
        this.dbPath = path.join(codebuddyDir, "codebase_analysis.db");
      } else {
        // Fallback to extension global storage
        this.dbPath = path.join(
          __dirname,
          "..",
          "..",
          "database",
          "codebase_analysis.db",
        );
      }

      // For now, we'll use a simple file-based JSON storage as SQLite substitute
      // In production, you'd use a proper SQLite driver like better-sqlite3
      await this.createTables();

      this.logger.info(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      this.logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  /**
   * Create necessary tables for codebase analysis
   */
  private async createTables(): Promise<void> {
    // For now, we'll simulate table creation by ensuring the database directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize with empty data structure if file doesn't exist
    if (!fs.existsSync(this.dbPath)) {
      const initialData = {
        codebase_snapshots: [],
        metadata: {
          version: "1.0.0",
          created_at: new Date().toISOString(),
        },
      };
      await fs.promises.writeFile(
        this.dbPath,
        JSON.stringify(initialData, null, 2),
      );
    }

    this.logger.debug("Database tables initialized");
  }

  /**
   * Get current git state for the workspace
   */
  async getCurrentGitState(): Promise<GitState | null> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
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

        // Get file count and create a simple diff hash
        const files = await vscode.workspace.findFiles(
          "**/*.{ts,js,tsx,jsx,json,py,java,cs,php,md}",
          "**/node_modules/**",
          1000,
        );

        const fileCount = files.length;
        const diffHash = await this.createDiffHash(files);

        return {
          branch,
          commitHash,
          diffHash,
          fileCount,
          workspacePath: workspaceRoot,
        };
      }

      // Fallback without git extension
      return {
        branch: "unknown",
        commitHash: "unknown",
        diffHash: await this.createSimpleDiffHash(),
        fileCount: 0,
        workspacePath: workspaceRoot,
      };
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
    try {
      const data = await this.readDatabase();

      const snapshot: CodebaseSnapshot = {
        workspace_path: gitState.workspacePath,
        git_branch: gitState.branch,
        git_commit_hash: gitState.commitHash,
        git_diff_hash: gitState.diffHash,
        analysis_data: JSON.stringify(analysisData),
        file_count: gitState.fileCount,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      };

      // Remove old snapshots for the same workspace to save space
      data.codebase_snapshots = data.codebase_snapshots.filter(
        (s: CodebaseSnapshot) => s.workspace_path !== gitState.workspacePath,
      );

      // Add new snapshot
      data.codebase_snapshots.push(snapshot);

      // Keep only the most recent 5 snapshots
      data.codebase_snapshots = data.codebase_snapshots
        .sort(
          (a: CodebaseSnapshot, b: CodebaseSnapshot) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);

      await this.writeDatabase(data);
      this.logger.info("Codebase analysis saved to database");
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
    try {
      const data = await this.readDatabase();

      const snapshot = data.codebase_snapshots.find(
        (s: CodebaseSnapshot) =>
          s.workspace_path === gitState.workspacePath &&
          s.git_branch === gitState.branch &&
          s.git_diff_hash === gitState.diffHash,
      );

      if (snapshot) {
        // Update last accessed time
        snapshot.last_accessed = new Date().toISOString();
        await this.writeDatabase(data);

        this.logger.info("Found valid cached codebase analysis");
        return JSON.parse(snapshot.analysis_data);
      }

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
    try {
      const data = await this.readDatabase();

      const lastSnapshot = data.codebase_snapshots.find(
        (s: CodebaseSnapshot) =>
          s.workspace_path === gitState.workspacePath &&
          s.git_branch === gitState.branch,
      );

      if (!lastSnapshot) {
        return true; // No previous snapshot, consider it a significant change
      }

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
    try {
      const data = await this.readDatabase();
      const cutoffDate = new Date(Date.now() - maxAge);

      const initialCount = data.codebase_snapshots.length;
      data.codebase_snapshots = data.codebase_snapshots.filter(
        (s: CodebaseSnapshot) => new Date(s.last_accessed) > cutoffDate,
      );

      const removedCount = initialCount - data.codebase_snapshots.length;
      if (removedCount > 0) {
        await this.writeDatabase(data);
        this.logger.info(`Cleaned up ${removedCount} old snapshots`);
      }
    } catch (error) {
      this.logger.error("Failed to cleanup old snapshots", error);
    }
  }

  /**
   * Read database file
   */
  private async readDatabase(): Promise<any> {
    try {
      const content = await fs.promises.readFile(this.dbPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      // Return empty structure if file doesn't exist
      this.logger.info(
        "Database file not found, creating new structure",
        error instanceof Error ? error.message : String(error),
      );
      return {
        codebase_snapshots: [],
        metadata: {
          version: "1.0.0",
          created_at: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Write database file
   */
  private async writeDatabase(data: any): Promise<void> {
    await fs.promises.writeFile(this.dbPath, JSON.stringify(data, null, 2));
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
    try {
      const data = await this.readDatabase();
      const snapshots = data.codebase_snapshots;

      if (snapshots.length === 0) {
        return {
          totalSnapshots: 0,
          oldestSnapshot: "",
          newestSnapshot: "",
          totalSize: 0,
        };
      }

      const dates = snapshots.map(
        (s: CodebaseSnapshot) => new Date(s.created_at),
      );
      const stat = await fs.promises.stat(this.dbPath);

      return {
        totalSnapshots: snapshots.length,
        oldestSnapshot: new Date(
          Math.min(...dates.map((d: Date) => d.getTime())),
        ).toISOString(),
        newestSnapshot: new Date(
          Math.max(...dates.map((d: Date) => d.getTime())),
        ).toISOString(),
        totalSize: stat.size,
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
      this.db.close();
      this.db = null;
    }
  }
}
