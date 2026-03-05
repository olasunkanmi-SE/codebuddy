import * as vscode from "vscode";
import * as fsp from "fs/promises";
import * as path from "path";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * A snapshot of a single file at checkpoint time.
 */
export interface FileSnapshot {
  filePath: string;
  content: string;
  /** True if the file did not exist when the checkpoint was taken. */
  didNotExist: boolean;
}

/**
 * A checkpoint captures the state of all files that the agent has
 * touched (or is about to touch) so the user can revert later.
 */
export interface Checkpoint {
  id: string;
  label: string;
  timestamp: number;
  /** Conversation / thread ID this checkpoint belongs to. */
  conversationId: string;
  files: FileSnapshot[];
}

/**
 * CheckpointService provides Cline-style workspace checkpoints.
 *
 * Before each agent turn the caller should call `createCheckpoint()`
 * with the list of files that *may* be modified. After the turn,
 * the user can revert to any previous checkpoint which restores
 * every snapshotted file to its captured state (or deletes it if
 * it didn't exist at checkpoint time).
 *
 * Checkpoints are kept in memory for the lifetime of the session
 * and capped at MAX_CHECKPOINTS to avoid unbounded growth.
 */
export class CheckpointService implements vscode.Disposable {
  private static instance: CheckpointService;
  private readonly checkpoints: Checkpoint[] = [];
  private readonly MAX_CHECKPOINTS = 50;
  private readonly logger: Logger;

  /** Set of absolute file paths the agent has written to in this session. */
  private trackedFiles = new Set<string>();

  private constructor() {
    this.logger = Logger.initialize("CheckpointService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): CheckpointService {
    return (CheckpointService.instance ??= new CheckpointService());
  }

  // ------------------------------------------------------------------
  // Tracking
  // ------------------------------------------------------------------

  /**
   * Mark a file as agent-touched so it will be included in the next
   * automatic checkpoint even if not explicitly listed.
   */
  trackFile(filePath: string): void {
    this.trackedFiles.add(filePath);
  }

  /**
   * Mark multiple files as agent-touched.
   */
  trackFiles(filePaths: string[]): void {
    for (const p of filePaths) {
      this.trackedFiles.add(p);
    }
  }

  getTrackedFiles(): string[] {
    return [...this.trackedFiles];
  }

  // ------------------------------------------------------------------
  // Checkpoint CRUD
  // ------------------------------------------------------------------

  /**
   * Create a checkpoint that captures the current on-disk state of the
   * given files plus any previously tracked files.
   *
   * @param conversationId  Thread / conversation ID
   * @param label           Human-readable label (e.g. "Before turn 3")
   * @param extraFiles      Additional file paths to snapshot
   */
  async createCheckpoint(
    conversationId: string,
    label: string,
    extraFiles: string[] = [],
  ): Promise<Checkpoint> {
    const allPaths = new Set([...this.trackedFiles, ...extraFiles]);
    const files: FileSnapshot[] = [];

    for (const filePath of allPaths) {
      try {
        const content = await fsp.readFile(filePath, "utf-8");
        files.push({ filePath, content, didNotExist: false });
      } catch (e: any) {
        if (e.code === "ENOENT") {
          files.push({ filePath, content: "", didNotExist: true });
        } else {
          this.logger.warn(
            `Checkpoint: failed to read ${filePath}: ${e.message}`,
          );
        }
      }
    }

    const checkpoint: Checkpoint = {
      id: `ckpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      timestamp: Date.now(),
      conversationId,
      files,
    };

    this.checkpoints.push(checkpoint);

    // Cap total checkpoints
    while (this.checkpoints.length > this.MAX_CHECKPOINTS) {
      this.checkpoints.shift();
    }

    this.logger.info(
      `Created checkpoint "${label}" (${files.length} files) [${checkpoint.id}]`,
    );

    return checkpoint;
  }

  /**
   * Revert the workspace to the state captured in the given checkpoint.
   * Files that didn't exist at checkpoint time are deleted.
   */
  async revertToCheckpoint(checkpointId: string): Promise<{
    reverted: string[];
    deleted: string[];
    errors: string[];
  }> {
    const checkpoint = this.checkpoints.find((c) => c.id === checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const reverted: string[] = [];
    const deleted: string[] = [];
    const errors: string[] = [];

    for (const snap of checkpoint.files) {
      try {
        if (snap.didNotExist) {
          // File didn't exist at checkpoint time — delete it if it's there now
          try {
            await fsp.unlink(snap.filePath);
            deleted.push(snap.filePath);
          } catch (e: any) {
            if (e.code !== "ENOENT") {
              throw e;
            }
            // Already gone — fine
          }
        } else {
          // Restore file content
          const dir = path.dirname(snap.filePath);
          await fsp.mkdir(dir, { recursive: true });
          await fsp.writeFile(snap.filePath, snap.content, "utf-8");
          reverted.push(snap.filePath);
        }
      } catch (e: any) {
        this.logger.error(
          `Checkpoint revert failed for ${snap.filePath}: ${e.message}`,
        );
        errors.push(`${snap.filePath}: ${e.message}`);
      }
    }

    // Remove all checkpoints created *after* the one we reverted to
    const idx = this.checkpoints.indexOf(checkpoint);
    if (idx >= 0) {
      this.checkpoints.splice(idx + 1);
    }

    this.logger.info(
      `Reverted to checkpoint "${checkpoint.label}": ${reverted.length} restored, ${deleted.length} deleted, ${errors.length} errors`,
    );

    return { reverted, deleted, errors };
  }

  /**
   * Return all checkpoints, newest first.
   */
  getCheckpoints(conversationId?: string): Checkpoint[] {
    const list = conversationId
      ? this.checkpoints.filter((c) => c.conversationId === conversationId)
      : this.checkpoints;
    return [...list].reverse();
  }

  /**
   * Delete a specific checkpoint.
   */
  deleteCheckpoint(checkpointId: string): boolean {
    const idx = this.checkpoints.findIndex((c) => c.id === checkpointId);
    if (idx >= 0) {
      this.checkpoints.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear all checkpoints (e.g. on session reset).
   */
  clearAll(): void {
    this.checkpoints.length = 0;
    this.trackedFiles.clear();
  }

  dispose(): void {
    this.clearAll();
  }
}
