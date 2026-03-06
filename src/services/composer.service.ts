import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { DiffReviewService, PendingChange } from "./diff-review.service";

export interface ComposerSession {
  /** Unique session identifier */
  id: string;
  /** Human-readable label (e.g. "Refactor auth module") */
  label: string;
  /** IDs of PendingChange objects managed by DiffReviewService */
  changeIds: string[];
  /** Session-level status */
  status: "active" | "applied" | "rejected" | "partial";
  /** Creation timestamp */
  timestamp: number;
}

export interface ComposerSessionEvent {
  type: "created" | "applied" | "rejected" | "partial";
  session: ComposerSession;
}

export interface FileEdit {
  filePath: string;
  mode: "overwrite" | "replace";
  content?: string;
  search?: string;
  replace?: string;
}

export class ComposerService {
  private static instance: ComposerService;
  private sessions: Map<string, ComposerSession> = new Map();
  private logger: Logger;

  private _onSessionEvent = new vscode.EventEmitter<ComposerSessionEvent>();
  readonly onSessionEvent = this._onSessionEvent.event;

  private constructor() {
    this.logger = Logger.initialize("ComposerService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): ComposerService {
    if (!ComposerService.instance) {
      ComposerService.instance = new ComposerService();
    }
    return ComposerService.instance;
  }

  /**
   * Create a new composer session and batch-add file edits.
   * Each edit creates a PendingChange via DiffReviewService (with autoApply=false
   * so all changes remain pending for grouped review).
   */
  public async createSession(
    label: string,
    edits: FileEdit[],
  ): Promise<{ session: ComposerSession; errors: string[] }> {
    const id = this.generateId();
    const session: ComposerSession = {
      id,
      label,
      changeIds: [],
      status: "active",
      timestamp: Date.now(),
    };

    const diffService = DiffReviewService.getInstance();
    const errors: string[] = [];

    for (const edit of edits) {
      try {
        let newContent = "";

        if (edit.mode === "overwrite") {
          newContent = edit.content ?? "";
        } else if (edit.mode === "replace") {
          if (!edit.search || edit.replace === undefined) {
            errors.push(
              `${edit.filePath}: 'search' and 'replace' are required for replace mode.`,
            );
            continue;
          }

          const uri = vscode.Uri.file(edit.filePath);
          const existingData = await vscode.workspace.fs.readFile(uri);
          const existingContent = Buffer.from(existingData).toString("utf8");

          if (!existingContent.includes(edit.search)) {
            errors.push(`${edit.filePath}: Search text not found.`);
            continue;
          }

          newContent = existingContent.replace(edit.search, edit.replace);
        } else {
          errors.push(`${edit.filePath}: Invalid mode '${edit.mode}'.`);
          continue;
        }

        // Force autoApply=false so change stays pending for grouped review
        const change = await diffService.addPendingChange(
          edit.filePath,
          newContent,
          false,
        );
        session.changeIds.push(change.id);
      } catch (e: any) {
        errors.push(`${edit.filePath}: ${e.message}`);
      }
    }

    this.sessions.set(id, session);
    this.logger.info(
      `Created composer session ${id} "${label}" with ${session.changeIds.length} changes`,
    );
    this._onSessionEvent.fire({ type: "created", session });

    return { session, errors };
  }

  /**
   * Apply all pending changes in a session atomically.
   * Returns counts of applied and failed changes.
   */
  public async applySession(
    sessionId: string,
  ): Promise<{ applied: number; failed: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Composer session ${sessionId} not found`);
    }

    const diffService = DiffReviewService.getInstance();
    let applied = 0;
    let failed = 0;

    for (const changeId of session.changeIds) {
      try {
        const change = diffService.getPendingChange(changeId);
        if (!change || change.status !== "pending") {
          continue; // Already applied/rejected individually
        }
        const ok = await diffService.applyChange(changeId);
        if (ok) {
          applied++;
        } else {
          failed++;
        }
      } catch (e: any) {
        this.logger.error(
          `Failed to apply change ${changeId} in session ${sessionId}: ${e.message}`,
        );
        failed++;
      }
    }

    session.status = failed === 0 ? "applied" : "partial";
    this._onSessionEvent.fire({
      type: session.status,
      session,
    });
    this.logger.info(
      `Session ${sessionId}: ${applied} applied, ${failed} failed`,
    );

    return { applied, failed };
  }

  /**
   * Reject all pending changes in a session.
   */
  public rejectSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Composer session ${sessionId} not found`);
    }

    const diffService = DiffReviewService.getInstance();

    for (const changeId of session.changeIds) {
      const change = diffService.getPendingChange(changeId);
      if (change && change.status === "pending") {
        diffService.removePendingChange(changeId);
      }
    }

    session.status = "rejected";
    this._onSessionEvent.fire({ type: "rejected", session });
    this.logger.info(`Rejected all changes in session ${sessionId}`);
  }

  public getSession(sessionId: string): ComposerSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): ComposerSession[] {
    return Array.from(this.sessions.values());
  }

  public getActiveSessions(): ComposerSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === "active",
    );
  }

  /**
   * Get the PendingChange objects belonging to a session.
   */
  public getSessionChanges(sessionId: string): PendingChange[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    const diffService = DiffReviewService.getInstance();
    const changes: PendingChange[] = [];

    for (const changeId of session.changeIds) {
      const change = diffService.getPendingChange(changeId);
      if (change) {
        changes.push(change);
      }
    }

    return changes;
  }

  /**
   * Look up which session (if any) owns a given changeId.
   */
  public getSessionForChange(changeId: string): ComposerSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.changeIds.includes(changeId)) {
        return session;
      }
    }
    return undefined;
  }

  private generateId(): string {
    return `composer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
