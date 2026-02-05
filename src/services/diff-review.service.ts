import * as vscode from "vscode";
import * as fsp from "fs/promises";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface PendingChange {
  id: string;
  filePath: string;
  originalContent: string;
  newContent: string;
  timestamp: number;
  status: "pending" | "applied" | "rejected";
  isNewFile: boolean;
}

export interface ChangeEvent {
  type: "added" | "applied" | "rejected";
  change: PendingChange;
}

export class DiffReviewService implements vscode.TextDocumentContentProvider {
  private static instance: DiffReviewService;
  private pendingChanges: Map<string, PendingChange> = new Map();
  private recentChanges: PendingChange[] = [];
  private readonly MAX_RECENT_CHANGES = 50;
  private logger: Logger;
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  // Event emitter for change notifications
  private _onChangeEvent = new vscode.EventEmitter<ChangeEvent>();
  readonly onChangeEvent = this._onChangeEvent.event;

  public static readonly SCHEME = "codebuddy-diff";

  private constructor() {
    this.logger = Logger.initialize("DiffReviewService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): DiffReviewService {
    if (!DiffReviewService.instance) {
      DiffReviewService.instance = new DiffReviewService();
    }
    return DiffReviewService.instance;
  }

  /**
   * Add a pending change for review or immediate application
   * @param filePath Absolute path to the file
   * @param newContent The new content to write
   * @param autoApply If true, immediately applies the change (default based on config)
   * @returns The pending change object
   */
  public async addPendingChange(
    filePath: string,
    newContent: string,
    autoApply?: boolean,
  ): Promise<PendingChange> {
    const id = this.generateId();

    // Read original content if file exists
    let originalContent = "";
    let isNewFile = true;
    try {
      originalContent = await fsp.readFile(filePath, "utf-8");
      isNewFile = false;
    } catch (e: any) {
      if (e.code !== "ENOENT") {
        this.logger.warn(`Failed to read original content: ${e.message}`);
      }
    }

    const change: PendingChange = {
      id,
      filePath,
      originalContent,
      newContent,
      timestamp: Date.now(),
      status: "pending",
      isNewFile,
    };

    this.pendingChanges.set(id, change);
    this.logger.info(`Added pending change ${id} for ${filePath}`);

    // Emit event
    this._onChangeEvent.fire({ type: "added", change });

    // Check if auto-apply is enabled
    const shouldAutoApply =
      autoApply ??
      !vscode.workspace
        .getConfiguration("codebuddy")
        .get<boolean>("requireDiffApproval", false);

    if (shouldAutoApply) {
      await this.applyChange(id);
    }

    return change;
  }

  public getPendingChange(id: string): PendingChange | undefined {
    return this.pendingChanges.get(id);
  }

  public getAllPendingChanges(): PendingChange[] {
    return Array.from(this.pendingChanges.values()).filter(
      (c) => c.status === "pending",
    );
  }

  public getRecentChanges(): PendingChange[] {
    return [...this.recentChanges];
  }

  public removePendingChange(id: string): void {
    const change = this.pendingChanges.get(id);
    if (change) {
      change.status = "rejected";
      this._onChangeEvent.fire({ type: "rejected", change });
      this.addToRecentChanges(change);
    }
    this.pendingChanges.delete(id);
  }

  public provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<string> {
    if (uri.scheme !== DiffReviewService.SCHEME) {
      return null;
    }

    const id = uri.path; // We'll use the path as the ID
    const change = this.pendingChanges.get(id);

    if (!change) {
      return "Error: Pending change not found or expired.";
    }

    return change.newContent;
  }

  public async applyChange(id: string): Promise<boolean> {
    const change = this.pendingChanges.get(id);
    if (!change) {
      this.logger.error(`Cannot apply change ${id}: not found`);
      return false;
    }

    try {
      const uri = vscode.Uri.file(change.filePath);
      const data = new Uint8Array(Buffer.from(change.newContent, "utf8"));
      await vscode.workspace.fs.writeFile(uri, data);

      change.status = "applied";
      this.logger.info(`Applied change ${id} to ${change.filePath}`);

      // Emit event
      this._onChangeEvent.fire({ type: "applied", change });

      // Add to recent changes
      this.addToRecentChanges(change);

      // Remove from pending
      this.pendingChanges.delete(id);

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to apply change ${id}: ${error.message}`);
      throw error;
    }
  }

  private addToRecentChanges(change: PendingChange): void {
    this.recentChanges.unshift(change);
    if (this.recentChanges.length > this.MAX_RECENT_CHANGES) {
      this.recentChanges.pop();
    }
  }

  public clearRecentChanges(): void {
    this.recentChanges = [];
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
