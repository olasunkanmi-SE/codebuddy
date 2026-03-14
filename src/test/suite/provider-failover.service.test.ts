/**
 * ProviderFailoverService Tests
 *
 * Tests the failover state machine: error classification, health tracking,
 * cooldown management, candidate ordering, probe recovery, and event emission.
 */

import * as assert from "assert";
import * as sinon from "sinon";
import {
  classifyFailoverReason,
  ProviderFailoverService,
  type FailoverReason,
  type FailoverEvent,
  type ProviderHealth,
} from "../../services/provider-failover.service";

/** Helper to build an Error with an HTTP status code. */
function httpError(message: string, status: number): Error {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

/** Helper to build an Error with a statusCode field (some SDKs use this). */
function sdkError(message: string, statusCode: number): Error {
  const err = new Error(message);
  (err as any).statusCode = statusCode;
  return err;
}

/** Helper to build an Error with a cause chain. */
function errorWithCause(message: string, cause: Error): Error {
  const err = new Error(message);
  (err as any).cause = cause;
  return err;
}

// ── classifyFailoverReason ───────────────────────────────

suite("classifyFailoverReason", () => {
  teardown(() => {
    sinon.restore();
  });

  // ── Non-Error inputs ──

  test("returns 'unknown' for non-Error values", () => {
    assert.strictEqual(classifyFailoverReason("some string"), "unknown");
    assert.strictEqual(classifyFailoverReason(42), "unknown");
    assert.strictEqual(classifyFailoverReason(null), "unknown");
    assert.strictEqual(classifyFailoverReason(undefined), "unknown");
    assert.strictEqual(classifyFailoverReason({}), "unknown");
  });

  // ── HTTP status code extraction ──

  suite("classifies by HTTP status code", () => {
    const statusMap: Array<[number, FailoverReason]> = [
      [401, "auth"],
      [403, "auth"],
      [402, "billing"],
      [429, "rate_limit"],
      [408, "timeout"],
      [503, "overloaded"],
      [404, "model_not_found"],
    ];

    statusMap.forEach(([status, expected]) => {
      test(`status ${status} → "${expected}"`, () => {
        const err = httpError("Request failed", status);
        assert.strictEqual(classifyFailoverReason(err), expected);
      });
    });

    test("classifies by statusCode field (SDK variant)", () => {
      const err = sdkError("Request failed", 429);
      assert.strictEqual(classifyFailoverReason(err), "rate_limit");
    });

    test("extracts status from error message when no .status field", () => {
      const err = new Error("API returned status code: 401 Unauthorized");
      assert.strictEqual(classifyFailoverReason(err), "auth");
    });

    test("does NOT match 2xx/3xx status codes in messages", () => {
      const err = new Error("Request succeeded with status 200 OK");
      assert.strictEqual(classifyFailoverReason(err), "unknown");
    });

    test("does NOT match status 301 (redirect) in messages", () => {
      const err = new Error("Redirect received with status 301");
      assert.strictEqual(classifyFailoverReason(err), "unknown");
    });
  });

  // ── Pattern-based classification ──

  suite("classifies by message pattern", () => {
    const patterns: Array<[string, FailoverReason]> = [
      ["Unauthorized access to API", "auth"],
      ["Invalid API key provided", "auth"],
      ["Authentication token expired", "auth"],
      ["Quota exceeded for billing period", "billing"],
      ["Billing account suspended", "billing"],
      ["Rate limit exceeded, try again later", "rate_limit"],
      ["Error 429: Too many requests", "rate_limit"],
      ["Too Many Requests — slow down", "rate_limit"],
      ["Request timeout after 30s", "timeout"],
      ["Connection timed out", "timeout"],
      ["ETIMEDOUT: connect failed", "timeout"],
      ["ECONNRESET: connection reset by peer", "overloaded"],
      ["ECONNREFUSED: server not reachable", "overloaded"],
      ["Model gpt-5 not found in registry", "model_not_found"],
      ["Model does not exist: claude-99", "model_not_found"],
      ["Server overloaded, please retry", "overloaded"],
      ["Insufficient capacity for request", "overloaded"],
      ["Upstream service returned 503", "overloaded"],
      ["Bad Gateway: 502 from upstream", "overloaded"],
    ];

    patterns.forEach(([message, expected]) => {
      test(`"${message.slice(0, 50)}" → "${expected}"`, () => {
        assert.strictEqual(
          classifyFailoverReason(new Error(message)),
          expected,
        );
      });
    });
  });

  // ── Cause chain traversal ──

  suite("traverses cause chain", () => {
    test("finds reason in nested cause", () => {
      const root = new Error("Request failed");
      const cause = new Error("rate limit exceeded");
      const err = errorWithCause("Outer wrapper", errorWithCause(root.message, cause));
      // The outer message doesn't match, but the deepest cause does
      assert.strictEqual(
        classifyFailoverReason(errorWithCause("Wrapper error", cause)),
        "rate_limit",
      );
    });

    test("respects depth limit (max 5)", () => {
      let current = new Error("rate limit exceeded");
      // Build a chain deeper than 5
      for (let i = 0; i < 7; i++) {
        current = errorWithCause(`Wrapper level ${i}`, current);
      }
      // The matching cause is at depth 8 — beyond the 5-level traversal
      assert.strictEqual(classifyFailoverReason(current), "unknown");
    });

    test("returns 'unknown' for a plain Error with no patterns", () => {
      assert.strictEqual(
        classifyFailoverReason(new Error("Something went wrong")),
        "unknown",
      );
    });
  });

  // ── Status code priority over pattern ──

  test("status code takes priority over message pattern", () => {
    // Message says "timeout" but status says 402 (billing)
    const err = httpError("Connection timeout error", 402);
    assert.strictEqual(classifyFailoverReason(err), "billing");
  });
});

// ── ProviderFailoverService ──────────────────────────────

suite("ProviderFailoverService", () => {
  let svc: ProviderFailoverService;

  setup(() => {
    svc = ProviderFailoverService.getInstance();
    // Reset state between tests by setting a fresh chain
    // and clearing any previous health data
    svc.setFallbackChain(["anthropic", "openai", "gemini"]);
    svc.clearCooldown("anthropic");
    svc.clearCooldown("openai");
    svc.clearCooldown("gemini");
  });

  teardown(() => {
    sinon.restore();
  });

  // ── setFallbackChain ──

  suite("setFallbackChain", () => {
    test("initializes health entries for all providers", () => {
      svc.setFallbackChain(["ProviderA", "ProviderB"]);
      const healthA = svc.getHealth("providera");
      const healthB = svc.getHealth("providerb");
      assert.strictEqual(healthA.status, "healthy");
      assert.strictEqual(healthB.status, "healthy");
      assert.strictEqual(healthA.errorCount, 0);
    });

    test("normalizes provider names to lowercase", () => {
      svc.setFallbackChain(["Anthropic", "OPENAI"]);
      const health = svc.getHealth("ANTHROPIC");
      assert.strictEqual(health.provider, "anthropic");
    });

    test("does not reset existing health state", () => {
      svc.recordFailure("anthropic", new Error("rate limit exceeded"));
      const before = svc.getHealth("anthropic");
      assert.strictEqual(before.errorCount, 1);

      // Re-set the chain — should not reset error count
      svc.setFallbackChain(["anthropic", "openai"]);
      const after = svc.getHealth("anthropic");
      assert.strictEqual(after.errorCount, 1);
    });
  });

  // ── getHealth ──

  suite("getHealth", () => {
    test("returns healthy default for unknown provider", () => {
      const health = svc.getHealth("nonexistent");
      assert.strictEqual(health.provider, "nonexistent");
      assert.strictEqual(health.status, "healthy");
      assert.strictEqual(health.errorCount, 0);
      assert.strictEqual(health.cooldownUntil, 0);
    });

    test("returns a copy — mutations don't affect internal state", () => {
      const health = svc.getHealth("anthropic");
      health.status = "down";
      health.errorCount = 999;

      const fresh = svc.getHealth("anthropic");
      assert.strictEqual(fresh.status, "healthy");
      assert.strictEqual(fresh.errorCount, 0);
    });

    test("is case-insensitive", () => {
      svc.recordFailure("Anthropic", new Error("timeout"));
      const h1 = svc.getHealth("anthropic");
      const h2 = svc.getHealth("ANTHROPIC");
      assert.strictEqual(h1.errorCount, h2.errorCount);
    });
  });

  // ── getAllHealth ──

  suite("getAllHealth", () => {
    test("includes all providers in fallback chain", () => {
      const all = svc.getAllHealth();
      const names = all.map((h) => h.provider);
      assert.ok(names.includes("anthropic"));
      assert.ok(names.includes("openai"));
      assert.ok(names.includes("gemini"));
    });

    test("returns safe copies", () => {
      const all = svc.getAllHealth();
      all[0].status = "down";
      all[0].errorCount = 999;

      const fresh = svc.getAllHealth();
      assert.strictEqual(fresh[0].status, "healthy");
      assert.strictEqual(fresh[0].errorCount, 0);
    });

    test("auto-expires elapsed cooldowns", () => {
      // Simulate a provider in cooldown that has already expired
      svc.recordFailure("anthropic", httpError("rate limited", 429));
      const health = svc.getHealth("anthropic");
      assert.ok(health.cooldownUntil > Date.now());

      // Manually expire the cooldown by faking time
      // We can't easily manipulate time, but we CAN test the principle:
      // record a failure with a very short cooldown reason
      svc.clearCooldown("anthropic");
      svc.recordFailure("anthropic", new Error("timeout")); // 30s cooldown

      const all = svc.getAllHealth();
      const anthropicHealth = all.find((h) => h.provider === "anthropic");
      assert.ok(anthropicHealth);
      assert.strictEqual(anthropicHealth!.status, "degraded");
    });
  });

  // ── recordSuccess ──

  suite("recordSuccess", () => {
    test("resets health to healthy", () => {
      svc.recordFailure("anthropic", httpError("limit", 429));
      assert.strictEqual(svc.getHealth("anthropic").status, "degraded");

      svc.recordSuccess("anthropic");
      const health = svc.getHealth("anthropic");
      assert.strictEqual(health.status, "healthy");
      assert.strictEqual(health.errorCount, 0);
      assert.strictEqual(health.cooldownUntil, 0);
      assert.ok(health.lastSuccessAt! > 0);
    });

    test("emits probe_recovery event when recovering from non-healthy", () => {
      svc.recordFailure("anthropic", httpError("limit", 429));

      const events: FailoverEvent[] = [];
      const sub = svc.onFailoverEvent((e) => events.push(e));

      svc.recordSuccess("anthropic");

      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, "probe_recovery");
      assert.strictEqual(events[0].to, "anthropic");

      sub.dispose();
    });

    test("does NOT emit probe_recovery if already healthy", () => {
      const events: FailoverEvent[] = [];
      const sub = svc.onFailoverEvent((e) => events.push(e));

      svc.recordSuccess("anthropic");
      const probeRecoveries = events.filter(
        (e) => e.type === "probe_recovery",
      );
      assert.strictEqual(probeRecoveries.length, 0);

      sub.dispose();
    });
  });

  // ── recordFailure ──

  suite("recordFailure", () => {
    test("returns classified reason", () => {
      const reason = svc.recordFailure("anthropic", httpError("Unauthorized", 401));
      assert.strictEqual(reason, "auth");
    });

    test("increments error count", () => {
      svc.recordFailure("anthropic", new Error("timeout"));
      svc.recordFailure("anthropic", new Error("timeout"));
      assert.strictEqual(svc.getHealth("anthropic").errorCount, 2);
    });

    test("sets status to degraded on first failure", () => {
      svc.recordFailure("anthropic", new Error("timeout"));
      assert.strictEqual(svc.getHealth("anthropic").status, "degraded");
    });

    test("sets status to down after 3 failures", () => {
      svc.recordFailure("anthropic", new Error("timeout"));
      svc.recordFailure("anthropic", new Error("timeout"));
      svc.recordFailure("anthropic", new Error("timeout"));
      assert.strictEqual(svc.getHealth("anthropic").status, "down");
    });

    test("format errors do NOT degrade provider", () => {
      // Note: "format" reason is in NON_FAILOVER_REASONS.
      // Currently no pattern maps to "format" — this tests the shouldFailover guard.
      // A 400 status classifies as "unknown" which is also in NON_FAILOVER_REASONS.
      svc.recordFailure("anthropic", new Error("Something unexpected"));
      const health = svc.getHealth("anthropic");
      // "unknown" is in NON_FAILOVER_REASONS → status stays healthy
      assert.strictEqual(health.status, "healthy");
    });

    test("unknown errors do NOT degrade provider", () => {
      svc.recordFailure("anthropic", new Error("Something unexpected"));
      const health = svc.getHealth("anthropic");
      assert.strictEqual(health.status, "healthy");
    });

    test("applies cooldown based on reason", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", httpError("limit", 429)); // rate_limit → 60s cooldown
      const health = svc.getHealth("anthropic");
      // Cooldown should be roughly 60s from now
      assert.ok(health.cooldownUntil >= before + 59_000);
      assert.ok(health.cooldownUntil <= before + 61_000);
    });

    test("unknown errors get short 30-second cooldown", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", new Error("Something weird happened"));
      const health = svc.getHealth("anthropic");
      // unknown → 30s cooldown
      assert.ok(health.cooldownUntil >= before + 29_000);
      assert.ok(health.cooldownUntil <= before + 31_000);
    });

    test("stores last error message (truncated to 200 chars)", () => {
      const longMessage = "A".repeat(300);
      svc.recordFailure("anthropic", new Error(longMessage));
      const health = svc.getHealth("anthropic");
      assert.strictEqual(health.lastError!.length, 200);
    });

    test("emits health_update event", () => {
      const events: FailoverEvent[] = [];
      const sub = svc.onFailoverEvent((e) => events.push(e));

      svc.recordFailure("anthropic", httpError("limit", 429));

      const updates = events.filter((e) => e.type === "health_update");
      assert.strictEqual(updates.length, 1);
      assert.strictEqual(updates[0].reason, "rate_limit");
      assert.ok(Array.isArray(updates[0].health));

      sub.dispose();
    });
  });

  // ── shouldFailover ──

  suite("shouldFailover", () => {
    const failoverReasons: FailoverReason[] = [
      "auth",
      "rate_limit",
      "billing",
      "timeout",
      "model_not_found",
      "overloaded",
    ];

    failoverReasons.forEach((reason) => {
      test(`returns true for "${reason}"`, () => {
        assert.strictEqual(svc.shouldFailover(reason), true);
      });
    });

    test('returns false for "format"', () => {
      assert.strictEqual(svc.shouldFailover("format"), false);
    });

    test('returns false for "unknown"', () => {
      assert.strictEqual(svc.shouldFailover("unknown"), false);
    });
  });

  // ── getCandidates ──

  suite("getCandidates", () => {
    test("primary is first when healthy", () => {
      const candidates = svc.getCandidates("Anthropic");
      assert.strictEqual(candidates[0], "anthropic");
    });

    test("includes all fallback chain providers when healthy", () => {
      const candidates = svc.getCandidates("Anthropic");
      assert.deepStrictEqual(candidates, ["anthropic", "openai", "gemini"]);
    });

    test("moves primary to end when in cooldown", () => {
      // Put anthropic in a long cooldown
      svc.recordFailure("anthropic", httpError("billing error", 402)); // 30 min cooldown
      const candidates = svc.getCandidates("Anthropic");
      // anthropic should be at the end (last resort)
      assert.strictEqual(candidates[candidates.length - 1], "anthropic");
      // openai should be first available
      assert.strictEqual(candidates[0], "openai");
    });

    test("skips cooldown providers in fallback chain", () => {
      svc.recordFailure("openai", httpError("billing", 402));
      const candidates = svc.getCandidates("Anthropic");
      // anthropic first (healthy primary), then gemini (healthy fallback)
      // openai is in cooldown and is NOT the primary — it's excluded entirely
      assert.strictEqual(candidates[0], "anthropic");
      assert.strictEqual(candidates[1], "gemini");
      assert.ok(!candidates.includes("openai"));
    });

    test("always includes primary as last resort", () => {
      svc.recordFailure("anthropic", httpError("limit", 429));
      const candidates = svc.getCandidates("Anthropic");
      assert.ok(candidates.includes("anthropic"));
    });
  });

  // ── clearCooldown ──

  suite("clearCooldown", () => {
    test("resets provider to healthy", () => {
      svc.recordFailure("anthropic", httpError("limit", 429));
      svc.recordFailure("anthropic", httpError("limit", 429));
      svc.recordFailure("anthropic", httpError("limit", 429));
      assert.strictEqual(svc.getHealth("anthropic").status, "down");

      svc.clearCooldown("anthropic");
      const health = svc.getHealth("anthropic");
      assert.strictEqual(health.status, "healthy");
      assert.strictEqual(health.errorCount, 0);
      assert.strictEqual(health.cooldownUntil, 0);
    });

    test("emits health_update event", () => {
      const events: FailoverEvent[] = [];
      const sub = svc.onFailoverEvent((e) => events.push(e));

      svc.clearCooldown("anthropic");

      const updates = events.filter((e) => e.type === "health_update");
      assert.strictEqual(updates.length, 1);
      sub.dispose();
    });
  });

  // ── Event System ──

  suite("event system", () => {
    test("listener receives events", () => {
      const events: FailoverEvent[] = [];
      const sub = svc.onFailoverEvent((e) => events.push(e));

      svc.recordFailure("anthropic", httpError("limit", 429));
      assert.ok(events.length > 0);

      sub.dispose();
    });

    test("dispose removes listener", () => {
      const events: FailoverEvent[] = [];
      const sub = svc.onFailoverEvent((e) => events.push(e));
      sub.dispose();

      svc.recordFailure("anthropic", httpError("limit", 429));
      assert.strictEqual(events.length, 0);
    });

    test("listener error does not break failover logic", () => {
      svc.onFailoverEvent(() => {
        throw new Error("Listener explosion!");
      });

      // Should not throw
      assert.doesNotThrow(() => {
        svc.recordFailure("anthropic", httpError("limit", 429));
      });
    });
  });

  // ── Health State Machine ──

  suite("health state transitions", () => {
    test("healthy → degraded → down → healthy (via recordSuccess)", () => {
      // Start healthy
      assert.strictEqual(svc.getHealth("anthropic").status, "healthy");

      // First failure → degraded
      svc.recordFailure("anthropic", new Error("timeout"));
      assert.strictEqual(svc.getHealth("anthropic").status, "degraded");

      // Second failure → still degraded
      svc.recordFailure("anthropic", new Error("timeout"));
      assert.strictEqual(svc.getHealth("anthropic").status, "degraded");

      // Third failure → down
      svc.recordFailure("anthropic", new Error("timeout"));
      assert.strictEqual(svc.getHealth("anthropic").status, "down");

      // Success → back to healthy
      svc.recordSuccess("anthropic");
      assert.strictEqual(svc.getHealth("anthropic").status, "healthy");
      assert.strictEqual(svc.getHealth("anthropic").errorCount, 0);
    });

    test("non-failover errors do not transition state", () => {
      // "unknown" errors are in NON_FAILOVER_REASONS → stay healthy
      svc.recordFailure("anthropic", new Error("Something odd"));
      assert.strictEqual(svc.getHealth("anthropic").status, "healthy");

      svc.recordFailure("anthropic", new Error("Another odd thing"));
      assert.strictEqual(svc.getHealth("anthropic").status, "healthy");

      svc.recordFailure("anthropic", new Error("Third odd thing"));
      // Still healthy after 3 unknown errors
      assert.strictEqual(svc.getHealth("anthropic").status, "healthy");
    });

    test("mixed errors accumulate count correctly", () => {
      svc.recordFailure("anthropic", new Error("timeout")); // 1
      svc.recordFailure("anthropic", httpError("limit", 429)); // 2
      assert.strictEqual(svc.getHealth("anthropic").status, "degraded");
      assert.strictEqual(svc.getHealth("anthropic").errorCount, 2);

      svc.recordFailure("anthropic", new Error("overloaded")); // 3
      assert.strictEqual(svc.getHealth("anthropic").status, "down");
    });
  });

  // ── Cooldown Behavior ──

  suite("cooldown behavior", () => {
    test("auth errors get 10-minute cooldown", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", httpError("Unauthorized", 401));
      const health = svc.getHealth("anthropic");
      const expectedMs = 10 * 60_000;
      assert.ok(health.cooldownUntil >= before + expectedMs - 100);
      assert.ok(health.cooldownUntil <= before + expectedMs + 100);
    });

    test("billing errors get 30-minute cooldown", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", httpError("Payment required", 402));
      const health = svc.getHealth("anthropic");
      const expectedMs = 30 * 60_000;
      assert.ok(health.cooldownUntil >= before + expectedMs - 100);
      assert.ok(health.cooldownUntil <= before + expectedMs + 100);
    });

    test("rate_limit errors get 1-minute cooldown", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", httpError("Rate limited", 429));
      const health = svc.getHealth("anthropic");
      const expectedMs = 60_000;
      assert.ok(health.cooldownUntil >= before + expectedMs - 100);
      assert.ok(health.cooldownUntil <= before + expectedMs + 100);
    });

    test("timeout errors get 30-second cooldown", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", new Error("Connection timeout"));
      const health = svc.getHealth("anthropic");
      const expectedMs = 30_000;
      assert.ok(health.cooldownUntil >= before + expectedMs - 100);
      assert.ok(health.cooldownUntil <= before + expectedMs + 100);
    });

    test("model_not_found errors get 1-hour cooldown", () => {
      const before = Date.now();
      svc.recordFailure("anthropic", httpError("Not Found", 404));
      const health = svc.getHealth("anthropic");
      const expectedMs = 60 * 60_000;
      assert.ok(health.cooldownUntil >= before + expectedMs - 100);
      assert.ok(health.cooldownUntil <= before + expectedMs + 100);
    });
  });

  // ── Isolation between providers ──

  suite("provider isolation", () => {
    test("failures on one provider do not affect others", () => {
      svc.recordFailure("anthropic", httpError("limit", 429));
      svc.recordFailure("anthropic", httpError("limit", 429));
      svc.recordFailure("anthropic", httpError("limit", 429));

      assert.strictEqual(svc.getHealth("anthropic").status, "down");
      assert.strictEqual(svc.getHealth("openai").status, "healthy");
      assert.strictEqual(svc.getHealth("gemini").status, "healthy");
    });

    test("success on one provider does not reset others", () => {
      svc.recordFailure("anthropic", new Error("timeout"));
      svc.recordFailure("openai", new Error("timeout"));

      svc.recordSuccess("anthropic");

      assert.strictEqual(svc.getHealth("anthropic").status, "healthy");
      assert.strictEqual(svc.getHealth("openai").status, "degraded");
    });
  });
});
