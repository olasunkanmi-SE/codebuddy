/**
 * ErrorRecoveryService Tests
 *
 * Tests error classification (permanent vs transient), retry gating,
 * exponential back-off delays, cause-chain traversal, and nudge messages.
 */

import * as assert from "assert";
import * as sinon from "sinon";
import {
  ErrorRecoveryService,
  RecoveryDecision,
} from "../../agents/services/error-recovery.service";

/** Helper to build an Error with a cause chain. */
function errorWithCause(msg: string, cause?: Error): Error {
  const err = new Error(msg);
  (err as any).cause = cause;
  return err;
}

suite("ErrorRecoveryService", () => {
  let svc: ErrorRecoveryService;
  const defaultCtx = { fromSafetyGuard: false };

  setup(() => {
    svc = new ErrorRecoveryService(2, 100);
  });

  teardown(() => {
    sinon.restore();
  });

  // ── Permanent errors — never retry ──────────────────────

  suite("permanent errors — should NOT retry", () => {
    const permanentMessages = [
      "loop detected in agent execution",
      "infinite loop: same output repeated",
      "same file edited 5 times",
      "safety limit reached for operation",
      "User cancelled the request",
      "abort signal received",
      "Authentication failed: invalid token",
      "unauthorized access to resource",
      "invalid api key provided",
      "quota exceeded for this billing period",
    ];

    permanentMessages.forEach((msg) => {
      test(`does not retry: "${msg.slice(0, 50)}..."`, () => {
        const result = svc.evaluate(new Error(msg), 0, defaultCtx);
        assert.strictEqual(result.shouldRetry, false);
        assert.strictEqual(result.delayMs, 0);
      });
    });
  });

  // ── Transient errors — should retry ─────────────────────

  suite("transient errors — should retry", () => {
    const transientMessages = [
      "Connection timeout after 30s",
      "Request timed out",
      "read ECONNRESET",
      "connect ECONNREFUSED 127.0.0.1:3000",
      "getaddrinfo ENOTFOUND api.example.com",
      "rate limit exceeded, retry after 60s",
      "HTTP 429 Too Many Requests",
      "HTTP 503 Service Unavailable",
      "HTTP 502 Bad Gateway",
      "HTTP 500 Internal Server Error",
      "internal server error",
      "status code 500",
      "server overloaded, try later",
      "at capacity, please wait",
      "network error during fetch",
      "socket hang up",
      "fetch failed",
      "write EPIPE",
      "could not process the request",
      "internal error from provider",
    ];

    transientMessages.forEach((msg) => {
      test(`retries: "${msg.slice(0, 50)}..."`, () => {
        const result = svc.evaluate(new Error(msg), 0, defaultCtx);
        assert.strictEqual(result.shouldRetry, true);
        assert.ok(result.delayMs > 0);
        assert.ok(result.nudgeMessage.length > 0);
      });
    });
  });

  // ── Word-boundary anchoring (C1 fix) ───────────────────

  suite("HTTP status codes do NOT false-positive on substrings", () => {
    const falsePositiveMessages = [
      "Error code 5001 from subsystem",
      "port 5000 already in use",
      "process exited with code 5003",
      "segment 4290 not found",
      "reference #5029 invalid",
    ];

    falsePositiveMessages.forEach((msg) => {
      test(`does not retry: "${msg}"`, () => {
        const result = svc.evaluate(new Error(msg), 0, defaultCtx);
        assert.strictEqual(result.shouldRetry, false);
      });
    });
  });

  // ── Retry cap ──────────────────────────────────────────

  suite("retry cap", () => {
    test("allows retry at attempt 0", () => {
      const result = svc.evaluate(new Error("timeout"), 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, true);
    });

    test("allows retry at attempt 1", () => {
      const result = svc.evaluate(new Error("timeout"), 1, defaultCtx);
      assert.strictEqual(result.shouldRetry, true);
    });

    test("refuses retry at maxRetries (attempt 2)", () => {
      const result = svc.evaluate(new Error("timeout"), 2, defaultCtx);
      assert.strictEqual(result.shouldRetry, false);
    });

    test("refuses retry beyond maxRetries", () => {
      const result = svc.evaluate(new Error("timeout"), 5, defaultCtx);
      assert.strictEqual(result.shouldRetry, false);
    });
  });

  // ── Exponential back-off ───────────────────────────────

  suite("exponential back-off", () => {
    test("first attempt: baseDelay * 2^0 = 100ms", () => {
      const result = svc.evaluate(new Error("timeout"), 0, defaultCtx);
      assert.strictEqual(result.delayMs, 100);
    });

    test("second attempt: baseDelay * 2^1 = 200ms", () => {
      const result = svc.evaluate(new Error("timeout"), 1, defaultCtx);
      assert.strictEqual(result.delayMs, 200);
    });
  });

  // ── Safety-guard context ───────────────────────────────

  suite("safety-guard context", () => {
    test("never retries when fromSafetyGuard is true", () => {
      const result = svc.evaluate(new Error("timeout"), 0, {
        fromSafetyGuard: true,
      });
      assert.strictEqual(result.shouldRetry, false);
    });
  });

  // ── Nudge messages ─────────────────────────────────────

  suite("nudge messages", () => {
    test("first retry nudge contains 'continue'", () => {
      const result = svc.evaluate(new Error("timeout"), 0, defaultCtx);
      assert.ok(result.nudgeMessage.includes("continue"));
    });

    test("second retry nudge contains 'final answer'", () => {
      const result = svc.evaluate(new Error("timeout"), 1, defaultCtx);
      assert.ok(result.nudgeMessage.includes("final answer"));
    });
  });

  // ── Cause chain traversal (M4 fix) ────────────────────

  suite("cause chain traversal", () => {
    test("detects transient error in cause chain", () => {
      const root = errorWithCause(
        "Stream processing failed",
        errorWithCause("Provider error", new Error("ECONNRESET")),
      );
      const result = svc.evaluate(root, 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, true);
    });

    test("detects permanent error at top level even with transient cause", () => {
      // Permanent patterns are checked on the top-level message first
      const root = errorWithCause(
        "loop detected in execution",
        new Error("timeout"),
      );
      const result = svc.evaluate(root, 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, false);
    });

    test("does not retry unknown errors without transient signals", () => {
      const root = errorWithCause(
        "Something unexpected happened",
        new Error("Unknown internal failure"),
      );
      const result = svc.evaluate(root, 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, false);
    });

    test("handles errors without cause chain", () => {
      const result = svc.evaluate(
        new Error("Some random error"),
        0,
        defaultCtx,
      );
      assert.strictEqual(result.shouldRetry, false);
    });
  });

  // ── Error name heuristic ───────────────────────────────

  suite("error name heuristic", () => {
    test("retries FetchError by name", () => {
      const err = new Error("something went wrong");
      err.name = "FetchError";
      const result = svc.evaluate(err, 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, true);
    });

    test("retries TimeoutError by name", () => {
      const err = new Error("operation interrupted");
      err.name = "TimeoutError";
      const result = svc.evaluate(err, 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, true);
    });

    test("retries NetworkError by name", () => {
      const err = new Error("cannot reach host");
      err.name = "NetworkError";
      const result = svc.evaluate(err, 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, true);
    });
  });

  // ── Custom maxRetries / baseDelayMs ────────────────────

  suite("custom constructor parameters", () => {
    test("respects custom maxRetries=0 (no retries ever)", () => {
      const noRetrySvc = new ErrorRecoveryService(0, 100);
      const result = noRetrySvc.evaluate(new Error("timeout"), 0, defaultCtx);
      assert.strictEqual(result.shouldRetry, false);
    });

    test("respects custom baseDelayMs", () => {
      const customSvc = new ErrorRecoveryService(2, 500);
      const result = customSvc.evaluate(new Error("timeout"), 0, defaultCtx);
      assert.strictEqual(result.delayMs, 500);
    });
  });
});
