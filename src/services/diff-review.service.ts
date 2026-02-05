import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EventEmitter } from "events";

export interface PendingChange {
  id: string;
  filePath: string;
  originalContent: string;
  newContent: string;
  timestamp: number;
}

export class DiffReviewService implements vscode.TextDocumentContentProvider {
  private static instance: DiffReviewService;
  private pendingChanges: Map<string, PendingChange> = new Map();
  private logger: Logger;
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

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

  public addPendingChange(filePath: string, newContent: string): PendingChange {
    const id = this.generateId();
    // Ideally we read the original content now, but for the diff provider we just need the new content.
    // The "original" side of the diff will be the actual file on disk.

    const change: PendingChange = {
      id,
      filePath,
      originalContent: "", // We might not need to store this if we diff against disk
      newContent,
      timestamp: Date.now(),
    };

    this.pendingChanges.set(id, change);
    this.logger.info(`Added pending change ${id} for ${filePath}`);
    return change;
  }

  public getPendingChange(id: string): PendingChange | undefined {
    return this.pendingChanges.get(id);
  }

  public removePendingChange(id: string): void {
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
      this.logger.info(`Applied change ${id} to ${change.filePath}`);
      this.removePendingChange(id);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to apply change ${id}: ${error.message}`);
      throw error;
    }
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
