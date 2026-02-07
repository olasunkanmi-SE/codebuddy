import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { IReviewService, PendingChange } from "../interfaces/review-service";
import { generateId } from "../utils/id-utils";
import { IEvent, IEventEmitter } from "../interfaces/events";
import { createEventEmitter } from "../emitter/factory";
import { EditorHostService } from "./editor-host.service";
export interface ChangeEvent {
  type: "added" | "applied" | "rejected";
  change: PendingChange;
}

export class DiffReviewService implements IReviewService {
  private static instance: DiffReviewService;
  private pendingChanges: Map<string, PendingChange> = new Map();
  private recentChanges: PendingChange[] = [];
  private readonly MAX_RECENT_CHANGES = 50;
  private logger: Logger;

  // Event emitter for change notifications
  private _onChangeEvent: IEventEmitter<ChangeEvent>;
  readonly onChangeEvent: IEvent<ChangeEvent>;

  public static readonly SCHEME = "codebuddy-diff";

  private constructor() {
    this.logger = Logger.initialize("DiffReviewService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this._onChangeEvent = createEventEmitter<ChangeEvent>();
    this.onChangeEvent = this._onChangeEvent.event;
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
   * @param autoApply If true, immediately applies the change
   * @returns The pending change object
   */
  public async addPendingChange(
    filePath: string,
    newContent: string,
    autoApply = false,
  ): Promise<PendingChange> {
    const id = generateId();

    // Read original content if file exists
    let originalContent = "";
    let isNewFile = true;
    try {
      const host = EditorHostService.getInstance().getHost();
      const contentBytes = await host.workspace.fs.readFile(filePath);
      originalContent = new TextDecoder().decode(contentBytes);
      isNewFile = false;
    } catch (e: any) {
      // In IEditorHost, readFile might throw if file doesn't exist
      // We assume if it throws, it's ENOENT-like
      if (e.code !== "ENOENT" && !e.message?.includes("no such file")) {
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

    if (autoApply) {
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

  public async applyChange(id: string): Promise<boolean> {
    const change = this.pendingChanges.get(id);
    if (!change) {
      this.logger.error(`Cannot apply change ${id}: not found`);
      return false;
    }

    try {
      const host = EditorHostService.getInstance().getHost();
      const encoder = new TextEncoder();
      await host.workspace.fs.writeFile(
        change.filePath,
        encoder.encode(change.newContent),
      );

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
}
