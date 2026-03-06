import { Logger, LogLevel } from "../../infrastructure/logger/logger";

/**
 * Manages human-in-the-loop consent requests, keyed by threadId.
 *
 * Each pending request is stored as a resolver callback in a per-thread
 * FIFO queue. Calling `respond()` resolves the oldest waiter for that
 * thread with a boolean (granted / denied). A timeout auto-denies stale
 * requests to prevent memory leaks.
 */
export class ConsentManager {
  private static readonly DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
  private readonly timeoutMs: number;
  private readonly logger: Pick<Logger, "log" | "warn" | "debug">;

  /**
   * threadId → queue of { resolve, timeoutHandle } in FIFO order.
   */
  private waiters = new Map<
    string,
    Array<{
      resolve: (granted: boolean) => void;
      timeout: ReturnType<typeof setTimeout>;
    }>
  >();

  constructor(
    logger?: Pick<Logger, "log" | "warn" | "debug">,
    timeoutMs?: number,
  ) {
    this.logger =
      logger ??
      Logger.initialize("ConsentManager", {
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableFile: true,
        enableTelemetry: true,
      });
    this.timeoutMs = timeoutMs ?? ConsentManager.DEFAULT_TIMEOUT_MS;
  }

  /**
   * Block until the user approves or denies this thread's consent request.
   * Returns `true` (approved) or `false` (denied / timed out).
   */
  waitForConsent(threadId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const entry: {
        resolve: (granted: boolean) => void;
        timeout: ReturnType<typeof setTimeout>;
      } = {
        resolve,
        timeout: 0 as unknown as ReturnType<typeof setTimeout>,
      };

      entry.timeout = setTimeout(() => {
        this.removeWaiter(threadId, entry);
        this.logger.warn(
          `Consent request for thread ${threadId} timed out after ${this.timeoutMs / 1000}s`,
        );
        resolve(false);
      }, this.timeoutMs);

      let queue = this.waiters.get(threadId);
      if (!queue) {
        queue = [];
        this.waiters.set(threadId, queue);
      }
      queue.push(entry);
    });
  }

  /**
   * Respond to a pending consent request.
   * @param granted Whether the user approved the action.
   * @param threadId Optional — when provided, resolves the oldest waiter
   *   for that thread. When omitted, resolves the first waiter across all
   *   threads (backward-compatible fallback).
   */
  respond(granted: boolean, threadId?: string): void {
    if (threadId) {
      this.resolveOldest(threadId, granted);
    } else {
      // Fallback: resolve the first waiter across all threads.
      // This path should not be reached now that the webview passes threadId.
      this.logger.warn(
        "respond() called without threadId — falling back to oldest waiter across all threads",
      );
      for (const [tid] of this.waiters) {
        if (this.resolveOldest(tid, granted)) return;
      }
    }
  }

  /** Number of pending waiters, optionally scoped to a single thread. */
  pendingCount(threadId?: string): number {
    if (threadId) {
      return this.waiters.get(threadId)?.length ?? 0;
    }
    let total = 0;
    for (const queue of this.waiters.values()) {
      total += queue.length;
    }
    return total;
  }

  /** Clear all waiters for a thread (e.g. on stream cancellation). */
  clearThread(threadId: string): void {
    const queue = this.waiters.get(threadId);
    if (!queue) return;
    for (const entry of queue) {
      clearTimeout(entry.timeout);
      entry.resolve(false);
    }
    this.waiters.delete(threadId);
  }

  // ── helpers ──────────────────────────────────────────────

  private resolveOldest(threadId: string, granted: boolean): boolean {
    const queue = this.waiters.get(threadId);
    const entry = queue?.shift();
    if (!entry) return false;
    clearTimeout(entry.timeout);
    if (queue?.length === 0) this.waiters.delete(threadId);
    entry.resolve(granted);
    return true;
  }

  private removeWaiter(
    threadId: string,
    entry: {
      resolve: (granted: boolean) => void;
      timeout: ReturnType<typeof setTimeout>;
    },
  ): void {
    const queue = this.waiters.get(threadId);
    if (!queue) return;
    const idx = queue.indexOf(entry);
    if (idx !== -1) queue.splice(idx, 1);
    if (queue.length === 0) this.waiters.delete(threadId);
  }
}
