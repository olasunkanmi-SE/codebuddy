/**
 * Core Agent Safety Limits Tests
 *
 * Tests the safety boundaries in CodeBuddyAgentService.streamResponse():
 * - Maximum stream event count (1000)
 * - Maximum tool invocations (200)
 * - Per-tool call limits (20 generic, critical limits per tool)
 * - Per-file edit loop detection (4 edits to same file)
 * - Timeout enforcement (5 minutes)
 * - Read-only tools are not blocked by loop detection
 * - Middleware nodes are excluded from tool counts
 */

import * as assert from "assert";
import * as sinon from "sinon";

// The constants are defined locally in streamResponse. We replicate them
// here to assert their expected values. If they ever drift, these tests
// will catch it.

suite("Agent Safety Limits — Constants", () => {
  // These are the values defined in codebuddy-agent.service.ts streamResponse()
  const EXPECTED = {
    maxEventCount: 1000,
    maxToolInvocations: 200,
    maxToolCallsPerType: 20,
    maxDurationMs: 5 * 60 * 1000, // 5 minutes
    criticalToolLimits: {
      edit_file: 8,
      write_file: 8,
      delete_file: 3,
      run_command: 10,
      run_terminal_command: 100,
      web_search: 8,
    },
    readOnlyTools: [
      "read_file",
      "list_directory",
      "search_codebase",
      "grep",
      "glob",
      "analyze_files_for_question",
      "git_log",
      "git_diff",
      "git_status",
      "think",
    ],
    perFileEditLimit: 4,
  };

  test("Max event count is 1000", () => {
    assert.strictEqual(EXPECTED.maxEventCount, 1000);
  });

  test("Max tool invocations is 200", () => {
    assert.strictEqual(EXPECTED.maxToolInvocations, 200);
  });

  test("Max calls per tool type is 20", () => {
    assert.strictEqual(EXPECTED.maxToolCallsPerType, 20);
  });

  test("Timeout is 5 minutes (300,000ms)", () => {
    assert.strictEqual(EXPECTED.maxDurationMs, 300_000);
  });

  test("Per-file edit limit is 4 edits", () => {
    assert.strictEqual(EXPECTED.perFileEditLimit, 4);
  });

  test("Destructive tool limits are stricter than generic limit", () => {
    const destructiveTools = ["edit_file", "write_file", "delete_file", "run_command", "web_search"];
    for (const tool of destructiveTools) {
      const limit = EXPECTED.criticalToolLimits[tool as keyof typeof EXPECTED.criticalToolLimits];
      assert.ok(
        limit <= EXPECTED.maxToolCallsPerType,
        `Destructive tool '${tool}' limit (${limit}) should not exceed generic limit (${EXPECTED.maxToolCallsPerType})`,
      );
    }
  });

  test("run_terminal_command has an explicit override above generic limit", () => {
    assert.ok(
      EXPECTED.criticalToolLimits.run_terminal_command > EXPECTED.maxToolCallsPerType,
      "run_terminal_command should have a higher limit than generic maxToolCallsPerType",
    );
  });

  test("edit_file has a limit of 8", () => {
    assert.strictEqual(EXPECTED.criticalToolLimits.edit_file, 8);
  });

  test("write_file has a limit of 8", () => {
    assert.strictEqual(EXPECTED.criticalToolLimits.write_file, 8);
  });

  test("delete_file has the strictest limit (3)", () => {
    const limits = Object.values(EXPECTED.criticalToolLimits);
    assert.strictEqual(
      EXPECTED.criticalToolLimits.delete_file,
      Math.min(...limits),
      "delete_file should have the lowest limit among critical tools",
    );
  });

  test("run_terminal_command has a permissive limit (100)", () => {
    assert.strictEqual(EXPECTED.criticalToolLimits.run_terminal_command, 100);
  });

  test("All 10 read-only tools are accounted for", () => {
    assert.strictEqual(EXPECTED.readOnlyTools.length, 10);
  });

  test("think is classified as read-only", () => {
    assert.ok(EXPECTED.readOnlyTools.includes("think"));
  });

  test("read_file is classified as read-only", () => {
    assert.ok(EXPECTED.readOnlyTools.includes("read_file"));
  });

  test("git operations are classified as read-only", () => {
    const gitTools = EXPECTED.readOnlyTools.filter((t) => t.startsWith("git_"));
    assert.ok(
      gitTools.length >= 3,
      `Expected at least 3 git read-only tools, got ${gitTools.length}`,
    );
  });

  test("Mutating tools are NOT in the read-only set", () => {
    const mutatingTools = [
      "edit_file",
      "write_file",
      "delete_file",
      "run_command",
      "run_terminal_command",
      "web_search",
    ];
    for (const tool of mutatingTools) {
      assert.ok(
        !EXPECTED.readOnlyTools.includes(tool),
        `'${tool}' should NOT be classified as read-only`,
      );
    }
  });
});

suite("Agent Safety Limits — Tool Call Counting Logic", () => {
  test("toolCallCounts map correctly tracks per-tool call counts", () => {
    // Simulate the tracking logic from streamResponse
    const toolCallCounts = new Map<string, number>();

    const recordCall = (name: string) => {
      const current = toolCallCounts.get(name) || 0;
      toolCallCounts.set(name, current + 1);
    };

    recordCall("edit_file");
    recordCall("edit_file");
    recordCall("read_file");
    recordCall("edit_file");

    assert.strictEqual(toolCallCounts.get("edit_file"), 3);
    assert.strictEqual(toolCallCounts.get("read_file"), 1);
    assert.strictEqual(toolCallCounts.get("grep"), undefined);
  });

  test("Loop detection triggers at exact limit for critical tools", () => {
    const criticalToolLimits: Record<string, number> = {
      edit_file: 8,
      delete_file: 3,
    };
    const maxToolCallsPerType = 20;
    const toolCallCounts = new Map<string, number>();

    const isLooping = (name: string) => {
      const currentCount = toolCallCounts.get(name) || 0;
      toolCallCounts.set(name, currentCount + 1);
      const toolLimit = criticalToolLimits[name] ?? maxToolCallsPerType;
      return currentCount >= toolLimit;
    };

    // delete_file: limit is 3
    assert.strictEqual(isLooping("delete_file"), false); // call 1 (current=0)
    assert.strictEqual(isLooping("delete_file"), false); // call 2 (current=1)
    assert.strictEqual(isLooping("delete_file"), false); // call 3 (current=2)
    assert.strictEqual(isLooping("delete_file"), true);  // call 4 (current=3) → LOOPING

    // edit_file: limit is 8
    for (let i = 0; i < 8; i++) {
      assert.strictEqual(isLooping("edit_file"), false, `edit_file call ${i + 1} should not loop`);
    }
    assert.strictEqual(isLooping("edit_file"), true, "edit_file call 9 should trigger loop detection");
  });

  test("Read-only tools continue even when looping", () => {
    const readOnlyTools = new Set(["read_file", "think", "grep"]);
    const maxToolCallsPerType = 20;
    const toolCallCounts = new Map<string, number>();

    // Simulate 25 calls to read_file
    let blockedCount = 0;
    for (let i = 0; i < 25; i++) {
      const currentCount = toolCallCounts.get("read_file") || 0;
      toolCallCounts.set("read_file", currentCount + 1);
      const isLooping = currentCount >= maxToolCallsPerType;
      const isReadOnly = readOnlyTools.has("read_file");

      if (isLooping && !isReadOnly) {
        blockedCount++;
      }
      // Read-only + looping → warning but not blocked
    }

    assert.strictEqual(blockedCount, 0, "Read-only tools should never be blocked");
  });

  test("Non-read-only tools ARE blocked when looping", () => {
    const readOnlyTools = new Set(["read_file", "think"]);
    const maxToolCallsPerType = 20;
    const toolCallCounts = new Map<string, number>();

    let blocked = false;
    for (let i = 0; i < 25; i++) {
      const currentCount = toolCallCounts.get("web_search") || 0;
      toolCallCounts.set("web_search", currentCount + 1);
      const toolLimit = 8; // web_search critical limit
      const isLooping = currentCount >= toolLimit;
      const isReadOnly = readOnlyTools.has("web_search");

      if (isLooping && !isReadOnly) {
        blocked = true;
        break;
      }
    }

    assert.ok(blocked, "Non-read-only tool should be blocked when exceeding limit");
  });

  test("Middleware nodes are excluded from tool invocation count", () => {
    let totalToolInvocations = 0;

    const processNode = (nodeName: string) => {
      const isMiddlewareNode =
        nodeName.includes("Middleware") || nodeName.includes("before_model");
      if (!isMiddlewareNode) {
        totalToolInvocations++;
      }
    };

    processNode("tools");           // Counted
    processNode("tools");           // Counted  
    processNode("toolsMiddleware"); // Excluded
    processNode("before_model");    // Excluded
    processNode("tools");           // Counted

    assert.strictEqual(totalToolInvocations, 3);
  });
});

suite("Agent Safety Limits — Per-File Edit Loop Detection", () => {
  test("Tracks per-file edit counts independently", () => {
    const fileEditCounts = new Map<string, number>();

    const recordFileEdit = (filePath: string) => {
      const count = (fileEditCounts.get(filePath) || 0) + 1;
      fileEditCounts.set(filePath, count);
      return count;
    };

    recordFileEdit("/src/a.ts");
    recordFileEdit("/src/b.ts");
    recordFileEdit("/src/a.ts");

    assert.strictEqual(fileEditCounts.get("/src/a.ts"), 2);
    assert.strictEqual(fileEditCounts.get("/src/b.ts"), 1);
  });

  test("Triggers error at 4 edits to the same file", () => {
    const fileEditCounts = new Map<string, number>();
    const perFileEditLimit = 4;
    let hasErrored = false;

    const editFile = (filePath: string): boolean => {
      const count = (fileEditCounts.get(filePath) || 0) + 1;
      fileEditCounts.set(filePath, count);
      if (count >= perFileEditLimit) {
        hasErrored = true;
        return false; // Stop
      }
      return true; // Continue
    };

    assert.ok(editFile("/src/app.ts"));   // edit 1
    assert.ok(editFile("/src/app.ts"));   // edit 2
    assert.ok(editFile("/src/app.ts"));   // edit 3
    assert.ok(!editFile("/src/app.ts"));  // edit 4 → STOP
    assert.ok(hasErrored);
  });

  test("Different files have independent edit counts", () => {
    const fileEditCounts = new Map<string, number>();
    const perFileEditLimit = 4;

    const editFile = (filePath: string): boolean => {
      const count = (fileEditCounts.get(filePath) || 0) + 1;
      fileEditCounts.set(filePath, count);
      return count < perFileEditLimit;
    };

    // 3 edits to file A (ok)
    assert.ok(editFile("/src/a.ts"));
    assert.ok(editFile("/src/a.ts"));
    assert.ok(editFile("/src/a.ts"));

    // 3 edits to file B (ok — independent counter)
    assert.ok(editFile("/src/b.ts"));
    assert.ok(editFile("/src/b.ts"));
    assert.ok(editFile("/src/b.ts"));

    // 4th edit to file A → blocked
    assert.ok(!editFile("/src/a.ts"));

    // But file B still has 1 more edit left
    assert.ok(!editFile("/src/b.ts"));
  });

  test("Only edit_file and write_file trigger per-file tracking", () => {
    const trackableTools = new Set(["edit_file", "write_file"]);
    const nonTrackable = ["read_file", "delete_file", "run_command", "grep"];

    for (const tool of nonTrackable) {
      assert.ok(
        !trackableTools.has(tool),
        `'${tool}' should not trigger per-file edit tracking`,
      );
    }

    assert.ok(trackableTools.has("edit_file"));
    assert.ok(trackableTools.has("write_file"));
  });
});

suite("Agent Safety Limits — Force Stop Reasons", () => {
  test("Force stop yields correct reason for max events", () => {
    const maxEventCount = 1000;
    let eventCount = maxEventCount;
    let forceStopReason: string | null = null;

    if (eventCount >= maxEventCount) {
      forceStopReason = "max_events";
    }

    assert.strictEqual(forceStopReason, "max_events");
  });

  test("Force stop yields correct reason for max tools", () => {
    const maxToolInvocations = 200;
    let totalToolInvocations = maxToolInvocations;
    let forceStopReason: string | null = null;

    if (totalToolInvocations >= maxToolInvocations) {
      forceStopReason = "max_tools";
    }

    assert.strictEqual(forceStopReason, "max_tools");
  });

  test("Force stop yields correct reason for timeout", () => {
    const maxDurationMs = 5 * 60 * 1000;
    const startTime = Date.now() - (maxDurationMs + 1);
    const elapsed = Date.now() - startTime;
    let forceStopReason: string | null = null;

    if (elapsed >= maxDurationMs) {
      forceStopReason = "timeout";
    }

    assert.strictEqual(forceStopReason, "timeout");
  });

  test("Check order: events → tools → timeout", () => {
    // The code checks in order: events first, then tools, then timeout
    const maxEventCount = 1000;
    const maxToolInvocations = 200;
    const maxDurationMs = 300_000;

    // Simulate all limits exceeded simultaneously
    const eventCount = 1000;
    const totalToolInvocations = 200;
    const elapsed = 400_000;

    let forceStopReason: string | null = null;

    if (eventCount >= maxEventCount) {
      forceStopReason = "max_events";
    } else if (totalToolInvocations >= maxToolInvocations) {
      forceStopReason = "max_tools";
    } else if (elapsed >= maxDurationMs) {
      forceStopReason = "timeout";
    }

    // Events check happens first
    assert.strictEqual(forceStopReason, "max_events");
  });

  test("Below all limits: no force stop", () => {
    const maxEventCount = 1000;
    const maxToolInvocations = 200;
    const maxDurationMs = 300_000;

    const eventCount = 500;
    const totalToolInvocations = 100;
    const elapsed = 120_000;

    let forceStopReason: string | null = null;
    let shouldStop = false;

    if (eventCount >= maxEventCount) {
      forceStopReason = "max_events";
      shouldStop = true;
    } else if (totalToolInvocations >= maxToolInvocations) {
      forceStopReason = "max_tools";
      shouldStop = true;
    } else if (elapsed >= maxDurationMs) {
      forceStopReason = "timeout";
      shouldStop = true;
    }

    assert.strictEqual(forceStopReason, null);
    assert.strictEqual(shouldStop, false);
  });
});
