import { Logger, LogLevel } from "../../infrastructure/logger/logger";

/**
 * Lightweight service that decides whether a failed agent stream should be
 * automatically retried with a "nudge" message rather than surfacing the
 * error to the user.
 *
 * Design principles:
 *  - Only retry **transient** errors (LLM timeouts, rate limits, network).
 *  - Never retry **intentional** stops (safety-guard loops, user cancellation).
 *  - Cap retries to a small number (default 2) with exponential back-off.
 *  - Each retry re-uses the existing LangGraph `thread_id` so the checkpoint
 *    gives the agent full conversation history.
 */

/** Errors whose message matches any of these patterns are NOT retryable. */
const PERMANENT_ERROR_PATTERNS: RegExp[] = [
  /loop detected/i,
  /infinite loop/i,
  /same.file.*edited/i,
  /safety.limit/i,
  /user.cancel/i,
  /abort/i,
  /authentication/i,
  /unauthorized/i,
  /invalid.api.key/i,
  /quota.exceeded/i,
];

/** Errors whose message matches any of these are almost certainly transient. */
const TRANSIENT_ERROR_PATTERNS: RegExp[] = [
  /timeout/i,
  /timed?\s*out/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /rate.limit/i,
  /\b429\b/,
  /\b503\b/,
  /\b502\b/,
  /\bHTTP\s+500\b/i,
  /status\s*(?:code\s*)?500\b/i,
  /internal\s+server\s+error/i,
  /overloaded/i,
  /capacity/i,
  /network/i,
  /socket hang up/i,
  /fetch failed/i,
  /EPIPE/i,
  /could not process/i,
  /internal.error/i,
];

export interface RecoveryDecision {
  /** Whether the error should trigger an automatic retry. */
  shouldRetry: boolean;
  /** The delay (ms) before retrying. */
  delayMs: number;
  /** A nudge message to send to the agent so it can continue. */
  nudgeMessage: string;
}

/** Type-safe access to the ES2022 Error.cause property. */
interface ErrorWithCause extends Error {
  readonly cause?: unknown;
}

export class ErrorRecoveryService {
  private readonly logger = Logger.instance;

  /** Maximum automatic retries per stream session. */
  private readonly maxRetries: number;

  /** Base delay in ms (doubled each retry). */
  private readonly baseDelayMs: number;

  constructor(maxRetries = 2, baseDelayMs = 1500) {
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
  }

  /**
   * Evaluate whether `error` is retryable and return the recovery decision.
   *
   * @param error      The caught error
   * @param attempt    Current retry attempt (0-based; 0 = first failure)
   * @param ctx        Contextual flags from the stream (e.g. was error from safety guard)
   */
  evaluate(
    error: Error,
    attempt: number,
    ctx: { fromSafetyGuard: boolean },
  ): RecoveryDecision {
    const noRetry: RecoveryDecision = {
      shouldRetry: false,
      delayMs: 0,
      nudgeMessage: "",
    };

    // Never retry past the cap
    if (attempt >= this.maxRetries) {
      this.logger.log(
        LogLevel.DEBUG,
        `[ErrorRecovery] Max retries (${this.maxRetries}) exhausted — not retrying`,
      );
      return noRetry;
    }

    // Never retry safety-guard stops
    if (ctx.fromSafetyGuard) {
      this.logger.log(
        LogLevel.DEBUG,
        "[ErrorRecovery] Error originated from safety guard — not retrying",
      );
      return noRetry;
    }

    const msg = error.message ?? "";

    // Explicit permanent patterns
    if (PERMANENT_ERROR_PATTERNS.some((rx) => rx.test(msg))) {
      this.logger.log(
        LogLevel.DEBUG,
        `[ErrorRecovery] Permanent error pattern matched — not retrying: ${msg.slice(0, 120)}`,
      );
      return noRetry;
    }

    // Check for known-transient patterns (fast path)
    const isKnownTransient = TRANSIENT_ERROR_PATTERNS.some((rx) =>
      rx.test(msg),
    );

    // Heuristic: if the error came from the LLM / network layer and is not
    // explicitly permanent, treat it as retryable.  Most LangGraph runtime
    // errors during streaming fall into this bucket.
    if (!isKnownTransient && !this.looksTransient(error)) {
      this.logger.log(
        LogLevel.DEBUG,
        `[ErrorRecovery] Error does not look transient — not retrying: ${msg.slice(0, 120)}`,
      );
      return noRetry;
    }

    const delayMs = this.baseDelayMs * Math.pow(2, attempt);

    this.logger.log(
      LogLevel.INFO,
      `[ErrorRecovery] Transient error detected (attempt ${attempt + 1}/${this.maxRetries}). ` +
        `Retrying in ${delayMs}ms: ${msg.slice(0, 120)}`,
    );

    return {
      shouldRetry: true,
      delayMs,
      nudgeMessage: this.buildNudgeMessage(error, attempt),
    };
  }

  // ── Helpers ──────────────────────────────────────────────

  /**
   * Broad heuristic for errors that "look" transient even if they don't
   * match a specific pattern.  LLM provider SDKs often wrap the real cause.
   */
  private looksTransient(error: Error): boolean {
    const name = error.name ?? "";

    // Explicit network/HTTP error class names
    if (/fetch|network|http|timeout|connection/i.test(name)) return true;

    // Walk the cause chain looking for a known-transient message
    let current: unknown = error;
    let depth = 0;
    while (current instanceof Error && depth < 5) {
      const msg = current.message ?? "";
      if (TRANSIENT_ERROR_PATTERNS.some((rx) => rx.test(msg))) {
        return true;
      }
      current = (current as ErrorWithCause).cause;
      depth++;
    }

    // Do NOT fall back to "it's a generic Error so retry it".
    // If no transient signal is found anywhere in the chain, it's permanent.
    return false;
  }

  private buildNudgeMessage(_error: Error, attempt: number): string {
    if (attempt === 0) {
      return (
        "There was a temporary interruption. " +
        "Please continue from where you left off and complete your response."
      );
    }
    return (
      "The previous attempt was interrupted again. " +
      "Please provide your final answer based on the information gathered so far."
    );
  }
}
