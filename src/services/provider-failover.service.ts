import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { getAPIKeyAndModel } from "../utils/utils";

// ─── Failure Reason ──────────────────────────────────────

/**
 * Categorised reason why a provider call failed.
 * Used to decide cooldown duration and whether to retry.
 */
export type FailoverReason =
  | "auth"
  | "rate_limit"
  | "billing"
  | "timeout"
  | "model_not_found"
  | "format"
  | "overloaded"
  | "unknown";

// ─── Error Classification ────────────────────────────────

/** Status code → failure reason mapping. */
const STATUS_CODE_MAP: Record<number, FailoverReason> = {
  401: "auth",
  403: "auth",
  402: "billing",
  429: "rate_limit",
  408: "timeout",
  503: "overloaded",
  404: "model_not_found",
};

/** Pattern-based reason detection (checked against error message). */
const REASON_PATTERNS: Array<[RegExp, FailoverReason]> = [
  [/\bunauthorized\b/i, "auth"],
  [/\binvalid.api.key\b/i, "auth"],
  [/\bauthentication\b/i, "auth"],
  [/\bquota.exceeded\b/i, "billing"],
  [/\bbilling\b/i, "billing"],
  [/\brate.limit\b/i, "rate_limit"],
  [/\b429\b/, "rate_limit"],
  [/\btoo many requests\b/i, "rate_limit"],
  [/\btimeout\b/i, "timeout"],
  [/\btimed?\s*out\b/i, "timeout"],
  [/\bETIMEDOUT\b/, "timeout"],
  [/\bECONNRESET\b/, "overloaded"],
  [/\bECONNREFUSED\b/, "overloaded"],
  [/\bmodel.*not.*found\b/i, "model_not_found"],
  [/\bmodel.*does.*not.*exist\b/i, "model_not_found"],
  [/\boverloaded\b/i, "overloaded"],
  [/\bcapacity\b/i, "overloaded"],
  [/\b503\b/, "overloaded"],
  [/\b502\b/, "overloaded"],
];

/** Reasons that should NOT trigger failover to the next provider. */
const NON_FAILOVER_REASONS = new Set<FailoverReason>(["format", "unknown"]);

/**
 * Classify an error into a `FailoverReason`.
 * Checks HTTP status codes first, then falls back to pattern matching.
 */
export function classifyFailoverReason(error: unknown): FailoverReason {
  if (!(error instanceof Error)) return "unknown";

  // Try to extract status code from common SDK error shapes
  const status =
    (error as unknown as Record<string, unknown>).status ??
    (error as unknown as Record<string, unknown>).statusCode ??
    extractStatusFromMessage(error.message);

  if (typeof status === "number" && STATUS_CODE_MAP[status]) {
    return STATUS_CODE_MAP[status];
  }

  // Walk message + cause chain for pattern matches
  let current: unknown = error;
  let depth = 0;
  while (current instanceof Error && depth < 5) {
    const msg = current.message ?? "";
    for (const [rx, reason] of REASON_PATTERNS) {
      if (rx.test(msg)) return reason;
    }
    current = (current as { cause?: unknown }).cause;
    depth++;
  }

  return "unknown";
}

/** Extract a 3-digit HTTP status from an error message. */
function extractStatusFromMessage(msg: string): number | undefined {
  const m = msg.match(/\bstatus\s*(?:code\s*)?:?\s*([45]\d{2})\b/i);
  return m ? Number(m[1]) : undefined;
}

// ─── Provider Health ─────────────────────────────────────

export interface ProviderHealth {
  provider: string;
  status: "healthy" | "degraded" | "down";
  errorCount: number;
  lastError?: string;
  lastErrorReason?: FailoverReason;
  lastSuccessAt?: number;
  cooldownUntil: number;
}

/** Emitted when the active provider changes or health updates. */
export interface FailoverEvent {
  type: "provider_switch" | "health_update" | "probe_recovery";
  from?: string;
  to?: string;
  reason?: FailoverReason;
  health: ProviderHealth[];
}

export type FailoverListener = (event: FailoverEvent) => void;

// ─── Cooldown Constants ──────────────────────────────────

/** How long to cool down each failure reason (ms). */
const COOLDOWN_BY_REASON: Record<FailoverReason, number> = {
  auth: 10 * 60_000, // 10 min — likely a config issue
  billing: 30 * 60_000, // 30 min — needs manual fix
  rate_limit: 60_000, // 1 min — typically short
  timeout: 30_000, // 30 sec — transient
  overloaded: 2 * 60_000, // 2 min — server busy
  model_not_found: 60 * 60_000, // 1 hour — model removed or typo
  format: 0, // don't cooldown for format errors
  unknown: 30_000, // 30 sec — be optimistic
};

/** How close to cooldown expiry we start probing (ms). */
const PROBE_MARGIN_MS = 30_000; // 30 sec
/** Minimum interval between probe attempts per provider (ms). */
const MIN_PROBE_INTERVAL_MS = 30_000; // 30 sec

// ─── Service ─────────────────────────────────────────────

/**
 * Manages provider failover: when the primary LLM provider fails,
 * automatically tries the next configured provider in the fallback chain.
 *
 * Tracks per-provider health (cooldown timers, error counts) and
 * probes the primary provider for recovery.
 */
export class ProviderFailoverService {
  private static instance: ProviderFailoverService;
  private readonly logger: Logger;

  /** Provider health states keyed by lowercase provider name. */
  private readonly healthMap = new Map<string, ProviderHealth>();

  /** Last probe attempt timestamp per provider. */
  private readonly lastProbeAt = new Map<string, number>();

  /** Event listeners for health/switch events. */
  private readonly listeners = new Set<FailoverListener>();

  /** User-configured fallback chain (lowercase provider names). */
  private fallbackChain: string[] = [];

  private constructor() {
    this.logger = Logger.initialize("ProviderFailover", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: false,
    });
  }

  static getInstance(): ProviderFailoverService {
    return (ProviderFailoverService.instance ??= new ProviderFailoverService());
  }

  // ── Configuration ──────────────────────────────────────

  /**
   * Set the ordered fallback chain from VS Code settings.
   * The first entry is assumed to be the primary provider.
   *
   * @param providers  Ordered list of provider names (case-insensitive).
   */
  setFallbackChain(providers: string[]): void {
    this.fallbackChain = providers.map((p) => p.toLowerCase());

    // Initialize health entries for any new providers
    for (const p of this.fallbackChain) {
      if (!this.healthMap.has(p)) {
        this.healthMap.set(p, {
          provider: p,
          status: "healthy",
          errorCount: 0,
          cooldownUntil: 0,
        });
      }
    }

    this.logger.info(
      `Failover chain configured: ${this.fallbackChain.join(" → ")}`,
    );
  }

  // ── Event System ───────────────────────────────────────

  onFailoverEvent(listener: FailoverListener): { dispose: () => void } {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  private emit(event: FailoverEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break failover logic
      }
    }
  }

  // ── Core Failover ──────────────────────────────────────

  /**
   * Build the list of candidate providers for a request.
   * Respects cooldowns and the configured fallback chain.
   *
   * @param primary  The currently-selected provider (from settings).
   * @returns Ordered list of providers to try, starting with the primary
   *          (if not in cooldown) followed by fallbacks.
   */
  getCandidates(primary: string): string[] {
    const primaryLower = primary.toLowerCase();
    const now = Date.now();
    const candidates: string[] = [];

    // Always try the primary first (unless in cooldown and we have fallbacks)
    const primaryHealth = this.getHealth(primaryLower);
    if (primaryHealth.cooldownUntil <= now) {
      candidates.push(primaryLower);
    } else if (this.shouldProbe(primaryLower, now)) {
      // Primary is in cooldown but we should probe for recovery
      candidates.push(primaryLower);
      this.lastProbeAt.set(primaryLower, now);
      this.logger.info(
        `Probing primary provider "${primaryLower}" (cooldown expires in ${Math.round((primaryHealth.cooldownUntil - now) / 1000)}s)`,
      );
    }

    // Add fallback chain entries that aren't in cooldown
    for (const provider of this.fallbackChain) {
      if (provider === primaryLower) continue; // Already handled
      if (candidates.includes(provider)) continue;

      const health = this.getHealth(provider);
      if (health.cooldownUntil <= now) {
        candidates.push(provider);
      }
    }

    // If primary was skipped due to cooldown and not probed, add it at the end
    // as a last resort (better than no candidates)
    if (!candidates.includes(primaryLower)) {
      candidates.push(primaryLower);
    }

    return candidates;
  }

  /**
   * Try to resolve credentials for the first available provider in the
   * candidate list.  Returns the provider name and its credentials,
   * or throws if no provider has valid credentials.
   *
   * This is the main entry point used by the agent service before
   * creating the LLM model.
   */
  resolveProvider(primary: string): {
    provider: string;
    apiKey: string;
    model?: string;
    baseUrl?: string;
    isFallback: boolean;
  } {
    const candidates = this.getCandidates(primary);

    for (const provider of candidates) {
      try {
        const cfg = getAPIKeyAndModel(provider);
        if (!cfg.apiKey && provider !== "local") continue;

        const isFallback = provider !== primary.toLowerCase();
        if (isFallback) {
          this.logger.info(`Failing over from "${primary}" to "${provider}"`);
          this.emit({
            type: "provider_switch",
            from: primary,
            to: provider,
            health: this.getAllHealth(),
          });
        }

        return {
          provider,
          apiKey: cfg.apiKey,
          model: cfg.model,
          baseUrl: cfg.baseUrl,
          isFallback,
        };
      } catch {
        // Provider not configured (no API key) — skip
        continue;
      }
    }

    // All candidates exhausted — throw descriptive error
    throw new Error(
      `All providers unavailable. Tried: ${candidates.join(", ")}. ` +
        `Check your API keys and provider configuration.`,
    );
  }

  // ── Health Recording ───────────────────────────────────

  /**
   * Record a successful call to a provider.
   * Resets error count and clears cooldown.
   */
  recordSuccess(provider: string): void {
    const p = provider.toLowerCase();
    const health = this.getHealth(p);

    const wasDown = health.status !== "healthy";
    health.status = "healthy";
    health.errorCount = 0;
    health.lastSuccessAt = Date.now();
    health.cooldownUntil = 0;

    this.healthMap.set(p, health);

    if (wasDown) {
      this.logger.info(`Provider "${p}" recovered — status: healthy`);
      this.emit({
        type: "probe_recovery",
        to: p,
        health: this.getAllHealth(),
      });
    }
  }

  /**
   * Record a failed call to a provider.
   * Classifies the error, increments error count, and applies cooldown.
   *
   * @returns The classified failure reason.
   */
  recordFailure(provider: string, error: unknown): FailoverReason {
    const p = provider.toLowerCase();
    const reason = classifyFailoverReason(error);
    const health = this.getHealth(p);

    health.errorCount++;
    health.lastError =
      error instanceof Error ? error.message.slice(0, 200) : String(error);
    health.lastErrorReason = reason;

    // Apply cooldown
    const cooldownMs = COOLDOWN_BY_REASON[reason];
    health.cooldownUntil = Date.now() + cooldownMs;

    // Determine status
    if (NON_FAILOVER_REASONS.has(reason)) {
      // Format errors don't degrade the provider
      health.status = "healthy";
    } else if (health.errorCount >= 3) {
      health.status = "down";
    } else {
      health.status = "degraded";
    }

    this.healthMap.set(p, health);

    this.logger.log(
      LogLevel.WARN,
      `Provider "${p}" failed: ${reason} (errors: ${health.errorCount}, cooldown: ${Math.round(cooldownMs / 1000)}s)`,
    );

    this.emit({
      type: "health_update",
      reason,
      health: this.getAllHealth(),
    });

    return reason;
  }

  /**
   * Check if a failure reason should trigger failover to the next provider,
   * or if the error should be surfaced immediately.
   */
  shouldFailover(reason: FailoverReason): boolean {
    return !NON_FAILOVER_REASONS.has(reason);
  }

  // ── Health Queries ─────────────────────────────────────

  getHealth(provider: string): ProviderHealth {
    const p = provider.toLowerCase();
    const stored = this.healthMap.get(p);
    if (stored) return { ...stored };
    return {
      provider: p,
      status: "healthy" as const,
      errorCount: 0,
      cooldownUntil: 0,
    };
  }

  /**
   * Expire a provider's cooldown if it has elapsed.
   * Explicit mutation — separated from read methods (CQS).
   */
  private expireCooldownIfElapsed(provider: string, now: number): void {
    const health = this.healthMap.get(provider);
    if (!health) return;
    if (health.cooldownUntil > 0 && health.cooldownUntil <= now) {
      this.healthMap.set(provider, {
        ...health,
        cooldownUntil: 0,
        status: health.status === "down" ? "degraded" : health.status,
      });
    }
  }

  getAllHealth(): ProviderHealth[] {
    const now = Date.now();

    // Include all providers in fallback chain + any with recorded health
    const allProviders = new Set([
      ...this.fallbackChain,
      ...this.healthMap.keys(),
    ]);

    // Expire cooldowns first (explicit mutation step)
    for (const p of allProviders) {
      this.expireCooldownIfElapsed(p, now);
    }

    // Return safe copies
    return [...allProviders].map((p) => this.getHealth(p));
  }

  /**
   * Manually clear a provider's cooldown (e.g., user changed API key).
   */
  clearCooldown(provider: string): void {
    const p = provider.toLowerCase();
    const health = this.getHealth(p);
    health.cooldownUntil = 0;
    health.errorCount = 0;
    health.status = "healthy";
    this.healthMap.set(p, health);

    this.emit({
      type: "health_update",
      health: this.getAllHealth(),
    });
  }

  // ── Private ────────────────────────────────────────────

  /**
   * Decide whether the primary provider should be probed during cooldown.
   * Only probes if cooldown is about to expire and enough time has passed
   * since the last probe.
   */
  private shouldProbe(provider: string, now: number): boolean {
    if (this.fallbackChain.length < 2) return false; // No fallbacks → just try primary

    const health = this.getHealth(provider);
    if (health.cooldownUntil <= now) return false; // Not in cooldown

    // Only probe if cooldown expires within PROBE_MARGIN_MS
    const timeUntilExpiry = health.cooldownUntil - now;
    if (timeUntilExpiry > PROBE_MARGIN_MS) return false;

    // Throttle probes
    const lastProbe = this.lastProbeAt.get(provider) ?? 0;
    return now - lastProbe >= MIN_PROBE_INTERVAL_MS;
  }
}
