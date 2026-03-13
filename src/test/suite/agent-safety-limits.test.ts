/**
 * Agent Safety Guard Tests
 *
 * Tests AgentSafetyGuard class methods and readAgentSafetyLimits():
 * - checkLimits() force-stop logic with configurable limits
 * - detectToolLoop() with read-only vs mutating tools
 * - detectFileLoop() per-file edit tracking
 * - buildStopMessage() and buildToolLoopErrorMessage() output
 * - buildLimitReset() and extendLimits() counter resets
 * - readAgentSafetyLimits() returns correct defaults from config
 */

import * as assert from "assert";
import * as sinon from "sinon";
import {
  AgentSafetyGuard,
  readAgentSafetyLimits,
  type AgentSafetyLimits,
} from "../../agents/services/agent-safety-guard";
import { TOOL_NAMES, READ_ONLY_TOOLS } from "../../agents/constants/tool-names";

/** Build a limits object with sensible test defaults, overrideable per-test. */
function makeLimits(overrides?: Partial<AgentSafetyLimits>): AgentSafetyLimits {
  return Object.freeze({
    maxEventCount: 2000,
    maxToolInvocations: 400,
    maxToolCallsPerType: 20,
    maxDurationMs: 10 * 60_000,
    fileEditLoopThreshold: 4,
    criticalToolLimits: {
      [TOOL_NAMES.EDIT_FILE]: 8,
      [TOOL_NAMES.WRITE_FILE]: 8,
      [TOOL_NAMES.DELETE_FILE]: 3,
      [TOOL_NAMES.RUN_COMMAND]: 10,
      [TOOL_NAMES.RUN_TERMINAL_COMMAND]: 100,
      [TOOL_NAMES.WEB_SEARCH]: 8,
    },
    readOnlyTools: READ_ONLY_TOOLS,
    ...overrides,
  });
}

suite("readAgentSafetyLimits — Config-Driven Defaults", () => {
  teardown(() => sinon.restore());

  test("Returns frozen object with expected default values", () => {
    const limits = readAgentSafetyLimits();
    assert.strictEqual(typeof limits.maxEventCount, "number");
    assert.strictEqual(typeof limits.maxToolInvocations, "number");
    assert.strictEqual(limits.maxToolCallsPerType, 20);
    assert.strictEqual(limits.fileEditLoopThreshold, 4);
    assert.ok(limits.readOnlyTools instanceof Set);
    assert.ok(Object.isFrozen(limits));
  });

  test("criticalToolLimits uses TOOL_NAMES constants", () => {
    const limits = readAgentSafetyLimits();
    assert.strictEqual(limits.criticalToolLimits[TOOL_NAMES.EDIT_FILE], 8);
    assert.strictEqual(limits.criticalToolLimits[TOOL_NAMES.WRITE_FILE], 8);
    assert.strictEqual(limits.criticalToolLimits[TOOL_NAMES.DELETE_FILE], 3);
    assert.strictEqual(limits.criticalToolLimits[TOOL_NAMES.RUN_COMMAND], 10);
    assert.strictEqual(limits.criticalToolLimits[TOOL_NAMES.RUN_TERMINAL_COMMAND], 100);
    assert.strictEqual(limits.criticalToolLimits[TOOL_NAMES.WEB_SEARCH], 8);
  });

  test("readOnlyTools contains all expected entries", () => {
    const limits = readAgentSafetyLimits();
    assert.ok(limits.readOnlyTools.has(TOOL_NAMES.READ_FILE));
    assert.ok(limits.readOnlyTools.has(TOOL_NAMES.THINK));
    assert.ok(limits.readOnlyTools.has(TOOL_NAMES.RUN_TESTS));
    assert.ok(!limits.readOnlyTools.has(TOOL_NAMES.EDIT_FILE));
  });

  test("Destructive tool limits are ≤ generic maxToolCallsPerType", () => {
    const limits = readAgentSafetyLimits();
    const destructive = [TOOL_NAMES.EDIT_FILE, TOOL_NAMES.WRITE_FILE, TOOL_NAMES.DELETE_FILE, TOOL_NAMES.RUN_COMMAND, TOOL_NAMES.WEB_SEARCH];
    for (const tool of destructive) {
      assert.ok(
        limits.criticalToolLimits[tool] <= limits.maxToolCallsPerType,
        `${tool} limit (${limits.criticalToolLimits[tool]}) should not exceed generic (${limits.maxToolCallsPerType})`,
      );
    }
  });

  test("run_terminal_command has a permissive limit above generic", () => {
    const limits = readAgentSafetyLimits();
    assert.ok(
      limits.criticalToolLimits[TOOL_NAMES.RUN_TERMINAL_COMMAND] > limits.maxToolCallsPerType,
      "run_terminal_command should have a higher limit than generic maxToolCallsPerType",
    );
  });
});

suite("AgentSafetyGuard.checkLimits()", () => {
  let guard: AgentSafetyGuard;
  let limits: AgentSafetyLimits;

  setup(() => {
    guard = new AgentSafetyGuard({ log() {}, warn() {}, debug() {} });
    limits = makeLimits();
  });

  test("Returns shouldStop=false when all counters are below limits", () => {
    const result = guard.checkLimits(500, 100, 60_000, limits);
    assert.strictEqual(result.shouldStop, false);
    assert.strictEqual(result.reason, null);
  });

  test("Stops on max_events when eventCount >= maxEventCount", () => {
    const result = guard.checkLimits(2000, 0, 0, limits);
    assert.strictEqual(result.shouldStop, true);
    assert.strictEqual(result.reason, "max_events");
  });

  test("Stops on max_tools when totalToolInvocations >= maxToolInvocations", () => {
    const result = guard.checkLimits(0, 400, 0, limits);
    assert.strictEqual(result.shouldStop, true);
    assert.strictEqual(result.reason, "max_tools");
  });

  test("Stops on timeout when elapsedMs >= maxDurationMs", () => {
    const result = guard.checkLimits(0, 0, 10 * 60_001, limits);
    assert.strictEqual(result.shouldStop, true);
    assert.strictEqual(result.reason, "timeout");
  });

  test("Check precedence: events → tools → timeout", () => {
    const result = guard.checkLimits(2000, 400, 10 * 60_001, limits);
    assert.strictEqual(result.reason, "max_events");
  });

  test("Custom limits are respected", () => {
    const custom = makeLimits({ maxEventCount: 5 });
    const result = guard.checkLimits(5, 0, 0, custom);
    assert.strictEqual(result.shouldStop, true);
    assert.strictEqual(result.reason, "max_events");
  });
});

suite("AgentSafetyGuard.detectToolLoop()", () => {
  let guard: AgentSafetyGuard;
  let limits: AgentSafetyLimits;

  setup(() => {
    guard = new AgentSafetyGuard({ log() {}, warn() {}, debug() {} });
    limits = makeLimits();
  });

  test("Critical tool triggers loop at its specific limit", () => {
    const r = guard.detectToolLoop(TOOL_NAMES.DELETE_FILE, 3, limits);
    assert.strictEqual(r.isLooping, true);
    assert.strictEqual(r.limit, 3);
  });

  test("Below critical limit → not looping", () => {
    const r = guard.detectToolLoop(TOOL_NAMES.DELETE_FILE, 2, limits);
    assert.strictEqual(r.isLooping, false);
  });

  test("Non-critical tool uses generic maxToolCallsPerType", () => {
    const r = guard.detectToolLoop("some_unknown_tool", 20, limits);
    assert.strictEqual(r.isLooping, true);
    assert.strictEqual(r.limit, 20);
  });

  test("Read-only tool is flagged as read-only even when looping", () => {
    const r = guard.detectToolLoop(TOOL_NAMES.READ_FILE, 999, limits);
    assert.strictEqual(r.isLooping, true);
    assert.strictEqual(r.isReadOnly, true);
  });

  test("Mutating tool is NOT read-only", () => {
    const r = guard.detectToolLoop(TOOL_NAMES.EDIT_FILE, 0, limits);
    assert.strictEqual(r.isReadOnly, false);
  });

  test("run_terminal_command has permissive critical limit", () => {
    const r = guard.detectToolLoop(TOOL_NAMES.RUN_TERMINAL_COMMAND, 99, limits);
    assert.strictEqual(r.isLooping, false);
    assert.strictEqual(r.limit, 100);
  });
});

suite("AgentSafetyGuard.detectFileLoop()", () => {
  let guard: AgentSafetyGuard;
  let limits: AgentSafetyLimits;

  setup(() => {
    guard = new AgentSafetyGuard({ log() {}, warn() {}, debug() {} });
    limits = makeLimits();
  });

  test("Returns isLooping=false for first 3 edits (threshold=4)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 3; i++) {
      const r = guard.detectFileLoop("/src/a.ts", counts, limits);
      assert.strictEqual(r.isLooping, false, `edit ${i + 1} should not loop`);
      counts.set("/src/a.ts", r.editCount);
    }
  });

  test("Triggers at 4th edit to same file", () => {
    const counts = new Map([[ "/src/a.ts", 3 ]]);
    const r = guard.detectFileLoop("/src/a.ts", counts, limits);
    assert.strictEqual(r.isLooping, true);
    assert.strictEqual(r.editCount, 4);
  });

  test("Different files have independent counters", () => {
    const counts = new Map([[ "/src/a.ts", 3 ]]);
    const r = guard.detectFileLoop("/src/b.ts", counts, limits);
    assert.strictEqual(r.isLooping, false);
    assert.strictEqual(r.editCount, 1);
  });
});

suite("AgentSafetyGuard — Message Builders", () => {
  let guard: AgentSafetyGuard;

  setup(() => {
    guard = new AgentSafetyGuard({ log() {}, warn() {}, debug() {} });
  });

  test("buildStopMessage includes event count for max_events", () => {
    const msg = guard.buildStopMessage("max_events", 2000, 350, 120_000);
    assert.ok(msg.includes("2000"), "Should mention event count");
    assert.ok(msg.includes("Stopping"), "Should indicate stopping");
  });

  test("buildStopMessage includes tool count for max_tools", () => {
    const msg = guard.buildStopMessage("max_tools", 500, 400, 120_000);
    assert.ok(msg.includes("400"), "Should mention tool count");
  });

  test("buildStopMessage includes elapsed seconds for timeout", () => {
    const msg = guard.buildStopMessage("timeout", 500, 200, 600_000);
    assert.ok(msg.includes("600"), "Should mention elapsed seconds");
  });

  test("buildToolLoopErrorMessage mentions edit attempts for edit_file", () => {
    const msg = guard.buildToolLoopErrorMessage(TOOL_NAMES.EDIT_FILE, 8);
    assert.ok(msg.includes("8 times"));
    assert.ok(msg.includes("edit"));
  });

  test("buildToolLoopErrorMessage mentions web_search fallback", () => {
    const msg = guard.buildToolLoopErrorMessage(TOOL_NAMES.WEB_SEARCH, 8);
    assert.ok(msg.includes("searched") || msg.includes("search"));
  });

  test("buildToolLoopErrorMessage generic fallback for unknown tool", () => {
    const msg = guard.buildToolLoopErrorMessage("custom_tool", 20);
    assert.ok(msg.includes("custom_tool"));
    assert.ok(msg.includes("20 times"));
  });

  test("buildLimitReset resets counters to zero with fresh startTime", () => {
    const before = Date.now();
    const reset = guard.buildLimitReset();
    assert.strictEqual(reset.eventCount, 0);
    assert.strictEqual(reset.totalToolInvocations, 0);
    assert.ok(reset.startTime >= before);
  });

  test("extendLimits mutates context counters to zero", () => {
    const ctx = { eventCount: 1500, totalToolInvocations: 300, startTime: 0 };
    guard.extendLimits(ctx);
    assert.strictEqual(ctx.eventCount, 0);
    assert.strictEqual(ctx.totalToolInvocations, 0);
    assert.ok(ctx.startTime > 0);
  });
});
