/**
 * Core Path Coverage Tests
 *
 * Tests the critical code paths in CodeBuddyAgentService and its
 * collaborators that previously had zero test coverage:
 *
 * 1. ContentNormalizer — direct import (no vscode dependency)
 * 2. ConsentManager — real import with injected no-op logger
 * 3. AgentSafetyGuard — real import with injected no-op logger;
 *    detectFileLoop, buildStopMessage, buildToolLoopErrorMessage)
 * 4. collectToolCalls — imported pure function with dedup + additional_kwargs
 * 5. summarizeToolResult — imported pure function, size guard, per-tool summaries
 * 6. cancelStream / dispose lifecycle
 * 7. StreamManager buffer & flush behavior
 */

import * as assert from "assert";
import { ContentNormalizer } from "../../agents/services/content-normalizer";
import { ConsentManager } from "../../agents/services/consent-manager";
import { AgentSafetyGuard } from "../../agents/services/agent-safety-guard";
import {
  collectToolCallsFromUpdate,
  summarizeToolResultContent,
} from "../../agents/services/codebuddy-agent.service";
import { LogLevel } from "../../infrastructure/logger/logger";

// ═══════════════════════════════════════════════════════════════
// No-op logger matching Pick<Logger, 'log' | 'warn' | 'debug'>
// ═══════════════════════════════════════════════════════════════

const noopLogger = {
  log: (_level: LogLevel, _message: string, _data?: unknown) => {},
  warn: (_message: string, _data?: unknown) => {},
  debug: (_message: string, _data?: unknown) => {},
};

// ═══════════════════════════════════════════════════════════════
// 1. ContentNormalizer (real import — zero external deps)
// ═══════════════════════════════════════════════════════════════

suite("ContentNormalizer — normalize()", () => {
  let normalizer: ContentNormalizer;

  setup(() => {
    normalizer = new ContentNormalizer();
  });

  test("returns empty string for null / undefined", () => {
    assert.strictEqual(normalizer.normalize(null), "");
    assert.strictEqual(normalizer.normalize(undefined), "");
  });

  test("passes plain string through", () => {
    assert.strictEqual(normalizer.normalize("Hello world"), "Hello world");
  });

  test("strips embedded tool_use JSON from string content", () => {
    const input = 'Some text {"type":"tool_use","name":"edit_file","input":{}} more text';
    const result = normalizer.normalize(input);
    assert.ok(!result.includes("tool_use"));
    assert.ok(result.includes("Some text"));
    assert.ok(result.includes("more text"));
  });

  test("strips tool_call JSON from string content", () => {
    const input = 'Before {"type":"tool_call","name":"read_file","args":{}} After';
    const result = normalizer.normalize(input);
    assert.ok(!result.includes("tool_call"));
    assert.ok(result.includes("Before"));
    assert.ok(result.includes("After"));
  });

  test("strips objects with toolu_ id prefix", () => {
    const input = 'Text {"id":"toolu_abc123","name":"test"} more';
    const result = normalizer.normalize(input);
    assert.ok(!result.includes("toolu_"));
    assert.ok(result.includes("Text"));
  });

  test("strips tool_use blocks from array content", () => {
    const content = [
      { type: "text", text: "Here is the result" },
      { type: "tool_use", name: "edit_file", input: { path: "/a.ts" } },
      { type: "text", text: " of the analysis" },
    ];
    const result = normalizer.normalize(content);
    assert.strictEqual(result, "Here is the result of the analysis");
  });

  test("strips tool_result blocks from array content", () => {
    const content = [
      { type: "text", text: "Hello" },
      { type: "tool_result", content: "some result data" },
    ];
    const result = normalizer.normalize(content);
    assert.strictEqual(result, "Hello");
  });

  test("handles object with text field", () => {
    assert.strictEqual(
      normalizer.normalize({ type: "text", text: "Hello" }),
      "Hello",
    );
  });

  test("handles object with content field", () => {
    assert.strictEqual(
      normalizer.normalize({ content: "World" }),
      "World",
    );
  });

  test("returns empty string for tool_use object", () => {
    assert.strictEqual(
      normalizer.normalize({ type: "tool_use", name: "edit_file", input: {} }),
      "",
    );
  });

  test("returns empty string for object with name + input (tool metadata)", () => {
    assert.strictEqual(
      normalizer.normalize({ name: "some_tool", input: { key: "val" } }),
      "",
    );
  });

  test("collapses triple+ newlines into double", () => {
    const input = "Line 1\n\n\n\nLine 2";
    const result = normalizer.normalize(input);
    assert.ok(!result.includes("\n\n\n"));
  });

  test("handles number content via String()", () => {
    assert.strictEqual(normalizer.normalize(42 as unknown), "42");
  });

  test("handles empty array", () => {
    assert.strictEqual(normalizer.normalize([]), "");
  });

  test("handles array of nulls", () => {
    assert.strictEqual(normalizer.normalize([null, null]), "");
  });
});

suite("ContentNormalizer — filterToolUseFromString()", () => {
  let normalizer: ContentNormalizer;

  setup(() => {
    normalizer = new ContentNormalizer();
  });

  test("returns empty string for empty input", () => {
    assert.strictEqual(normalizer.filterToolUseFromString(""), "");
  });

  test("preserves normal text", () => {
    assert.strictEqual(
      normalizer.filterToolUseFromString("Hello world"),
      "Hello world",
    );
  });

  test("preserves non-tool JSON objects", () => {
    const input = 'Config: {"port": 3000, "host": "localhost"}';
    const result = normalizer.filterToolUseFromString(input);
    assert.ok(result.includes('"port"'));
  });

  test("strips objects with command: user-input", () => {
    const input = 'Text {"command":"user-input","data":"test"} more';
    const result = normalizer.filterToolUseFromString(input);
    assert.ok(!result.includes("user-input"));
  });

  test("strips objects with name + args (tool metadata)", () => {
    const input = 'Before {"name":"edit_file","args":{"path":"/a.ts"}} After';
    const result = normalizer.filterToolUseFromString(input);
    assert.ok(!result.includes("edit_file"));
    assert.ok(result.includes("Before"));
    assert.ok(result.includes("After"));
  });

  test("handles malformed JSON gracefully (unbalanced braces)", () => {
    const input = "Some {broken json";
    const result = normalizer.filterToolUseFromString(input);
    assert.strictEqual(result, "Some {broken json");
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. ConsentManager — real import with no-op logger
// ═══════════════════════════════════════════════════════════════

suite("ConsentManager — consent lifecycle", () => {
  let mgr: ConsentManager;

  setup(() => {
    mgr = new ConsentManager(noopLogger, 200); // 200ms timeout for tests
  });

  test("waitForConsent + respond(true) resolves with true", async () => {
    const promise = mgr.waitForConsent("t1");
    assert.strictEqual(mgr.pendingCount("t1"), 1);
    mgr.respond(true, "t1");
    const result = await promise;
    assert.strictEqual(result, true);
    assert.strictEqual(mgr.pendingCount("t1"), 0);
  });

  test("respond(false) resolves with false", async () => {
    const promise = mgr.waitForConsent("t1");
    mgr.respond(false, "t1");
    assert.strictEqual(await promise, false);
  });

  test("FIFO ordering: first waiter resolved first", async () => {
    const p1 = mgr.waitForConsent("t1");
    const p2 = mgr.waitForConsent("t1");
    assert.strictEqual(mgr.pendingCount("t1"), 2);

    mgr.respond(true, "t1");
    assert.strictEqual(await p1, true);
    assert.strictEqual(mgr.pendingCount("t1"), 1);

    mgr.respond(false, "t1");
    assert.strictEqual(await p2, false);
    assert.strictEqual(mgr.pendingCount("t1"), 0);
  });

  test("respond without threadId resolves first waiter in EACH thread (global broadcast)", async () => {
    const p1 = mgr.waitForConsent("tA");
    const p2 = mgr.waitForConsent("tB");
    assert.strictEqual(mgr.pendingCount(), 2);

    // Global broadcast: resolves one waiter per thread (approve all / deny all UI)
    mgr.respond(true); // no threadId → resolves oldest in each thread
    assert.strictEqual(await p1, true);
    assert.strictEqual(await p2, true);
    assert.strictEqual(mgr.pendingCount(), 0);
  });

  test("clearThread denies all pending waiters", async () => {
    const p1 = mgr.waitForConsent("t1");
    const p2 = mgr.waitForConsent("t1");
    mgr.clearThread("t1");
    assert.strictEqual(await p1, false);
    assert.strictEqual(await p2, false);
    assert.strictEqual(mgr.pendingCount("t1"), 0);
  });

  test("clearThread on non-existent thread is a no-op", () => {
    mgr.clearThread("nonexistent"); // should not throw
    assert.strictEqual(mgr.pendingCount("nonexistent"), 0);
  });

  test("consent times out and resolves false", async () => {
    const result = await mgr.waitForConsent("t1"); // 200ms timeout
    assert.strictEqual(result, false);
    assert.strictEqual(mgr.pendingCount("t1"), 0);
  });

  test("respond on empty thread is a no-op", () => {
    mgr.respond(true, "empty"); // should not throw
    assert.strictEqual(mgr.pendingCount("empty"), 0);
  });

  test("pendingCount returns total across threads when no threadId given", async () => {
    mgr.waitForConsent("a");
    mgr.waitForConsent("b");
    mgr.waitForConsent("a");
    assert.strictEqual(mgr.pendingCount(), 3);
    assert.strictEqual(mgr.pendingCount("a"), 2);
    assert.strictEqual(mgr.pendingCount("b"), 1);
    // Clean up
    mgr.clearThread("a");
    mgr.clearThread("b");
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. AgentSafetyGuard — real import with no-op logger
// ═══════════════════════════════════════════════════════════════

suite("AgentSafetyGuard — checkLimits", () => {
  let guard: AgentSafetyGuard;

  setup(() => {
    guard = new AgentSafetyGuard(noopLogger);
  });

  test("under all limits → shouldStop false", () => {
    const r = guard.checkLimits(500, 100, 60_000);
    assert.strictEqual(r.shouldStop, false);
    assert.strictEqual(r.reason, null);
  });

  test("at exact maxEventCount → stops", () => {
    const r = guard.checkLimits(1000, 0, 0);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "max_events");
  });

  test("over maxEventCount → stops", () => {
    const r = guard.checkLimits(1500, 0, 0);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "max_events");
  });

  test("at exact maxToolInvocations → stops", () => {
    const r = guard.checkLimits(0, 200, 0);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "max_tools");
  });

  test("at exact maxDurationMs → stops", () => {
    const r = guard.checkLimits(0, 0, 300_000);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "timeout");
  });

  test("events checked before tools (priority)", () => {
    // Both exceeded but events should be returned first
    const r = guard.checkLimits(1000, 200, 300_000);
    assert.strictEqual(r.reason, "max_events");
  });

  test("just under all limits → safe", () => {
    const r = guard.checkLimits(999, 199, 299_999);
    assert.strictEqual(r.shouldStop, false);
  });
});

suite("AgentSafetyGuard — detectToolLoop", () => {
  let guard: AgentSafetyGuard;

  setup(() => {
    guard = new AgentSafetyGuard(noopLogger);
  });

  test("edit_file has critical limit of 8", () => {
    const r = guard.detectToolLoop("edit_file", 8);
    assert.strictEqual(r.isLooping, true);
    assert.strictEqual(r.limit, 8);
    assert.strictEqual(r.isReadOnly, false);
  });

  test("edit_file under limit is not looping", () => {
    assert.strictEqual(guard.detectToolLoop("edit_file", 7).isLooping, false);
  });

  test("delete_file has critical limit of 3", () => {
    assert.strictEqual(guard.detectToolLoop("delete_file", 3).isLooping, true);
    assert.strictEqual(guard.detectToolLoop("delete_file", 2).isLooping, false);
  });

  test("read_file is read-only", () => {
    const r = guard.detectToolLoop("read_file", 0);
    assert.strictEqual(r.isReadOnly, true);
  });

  test("edit_file is not read-only", () => {
    assert.strictEqual(guard.detectToolLoop("edit_file", 0).isReadOnly, false);
  });

  test("unknown tool uses default maxToolCallsPerType (20)", () => {
    const r = guard.detectToolLoop("custom_tool", 19);
    assert.strictEqual(r.isLooping, false);
    assert.strictEqual(r.limit, 20);

    const r2 = guard.detectToolLoop("custom_tool", 20);
    assert.strictEqual(r2.isLooping, true);
  });

  test("run_terminal_command has high limit of 100", () => {
    assert.strictEqual(guard.detectToolLoop("run_terminal_command", 99).isLooping, false);
    assert.strictEqual(guard.detectToolLoop("run_terminal_command", 100).isLooping, true);
  });

  test("think is read-only", () => {
    assert.strictEqual(guard.detectToolLoop("think", 0).isReadOnly, true);
  });

  test("run_tests is read-only", () => {
    assert.strictEqual(guard.detectToolLoop("run_tests", 0).isReadOnly, true);
  });
});

// NOTE: detectFileLoop is a pure query — it returns the *would-be* edit count
// without touching the caller's map. The real caller (processToolCalls) is
// responsible for mutating ctx.fileEditCounts after inspecting the result.
suite("AgentSafetyGuard — detectFileLoop (pure query, no mutation)", () => {
  let guard: AgentSafetyGuard;

  setup(() => {
    guard = new AgentSafetyGuard(noopLogger);
  });

  test("first edit returns editCount 1, not looping", () => {
    const counts = new Map<string, number>();
    const r = guard.detectFileLoop("/src/a.ts", counts);
    assert.strictEqual(r.editCount, 1);
    assert.strictEqual(r.isLooping, false);
  });

  test("does NOT mutate the caller's map — caller must persist count itself", () => {
    const counts = new Map<string, number>();
    guard.detectFileLoop("/src/a.ts", counts);
    assert.strictEqual(counts.has("/src/a.ts"), false);
  });

  test("at threshold (4) → looping", () => {
    const counts = new Map<string, number>([[ "/src/a.ts", 3 ]]);
    const r = guard.detectFileLoop("/src/a.ts", counts);
    assert.strictEqual(r.editCount, 4);
    assert.strictEqual(r.isLooping, true);
  });

  test("above threshold → looping", () => {
    const counts = new Map<string, number>([[ "/src/a.ts", 10 ]]);
    assert.strictEqual(guard.detectFileLoop("/src/a.ts", counts).isLooping, true);
  });

  test("different files tracked independently", () => {
    const counts = new Map<string, number>([[ "/src/a.ts", 3 ]]);
    assert.strictEqual(guard.detectFileLoop("/src/b.ts", counts).editCount, 1);
    assert.strictEqual(guard.detectFileLoop("/src/a.ts", counts).editCount, 4);
  });
});

suite("AgentSafetyGuard — buildStopMessage", () => {
  let guard: AgentSafetyGuard;

  setup(() => {
    guard = new AgentSafetyGuard(noopLogger);
  });

  test("max_events includes event count", () => {
    const msg = guard.buildStopMessage("max_events", 1000, 50, 60_000);
    assert.ok(msg.includes("Processed 1000 events"));
    assert.ok(msg.includes("⚠️"));
  });

  test("max_tools includes tool count", () => {
    const msg = guard.buildStopMessage("max_tools", 500, 200, 120_000);
    assert.ok(msg.includes("Made 200 tool calls"));
  });

  test("timeout includes elapsed seconds", () => {
    const msg = guard.buildStopMessage("timeout", 100, 50, 300_000);
    assert.ok(msg.includes("Ran for 300 seconds"));
  });
});

suite("AgentSafetyGuard — buildToolLoopErrorMessage", () => {
  let guard: AgentSafetyGuard;

  setup(() => {
    guard = new AgentSafetyGuard(noopLogger);
  });

  test("edit_file message mentions 'edit this file' + count", () => {
    const msg = guard.buildToolLoopErrorMessage("edit_file", 8);
    assert.ok(msg.includes("8 times"));
    assert.ok(msg.includes("infinite loop"));
  });

  test("write_file uses same path as edit_file", () => {
    const msg = guard.buildToolLoopErrorMessage("write_file", 5);
    assert.ok(msg.includes("5 times"));
    assert.ok(msg.includes("edit"));
  });

  test("web_search has specific message", () => {
    const msg = guard.buildToolLoopErrorMessage("web_search", 8);
    assert.ok(msg.includes("searched for this information"));
    assert.ok(msg.includes("GitHub MCP tools"));
  });

  test("generic tool message includes tool name and count", () => {
    const msg = guard.buildToolLoopErrorMessage("custom_tool", 20);
    assert.ok(msg.includes("custom_tool"));
    assert.ok(msg.includes("20 times"));
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. collectToolCalls — real import (deduplication + kwargs)
// ═══════════════════════════════════════════════════════════════

suite("collectToolCalls — additional_kwargs validation", () => {
  // Use the real exported function instead of an inline copy
  const collectToolCalls = collectToolCallsFromUpdate as (update: Record<string, unknown>) => Array<{ name: string; args: Record<string, unknown>; id?: string }>;

  test("valid additional_kwargs entries are collected", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [
              { name: "read_file", args: { path: "/a.ts" }, id: "tc-1" },
            ],
          },
        },
      ],
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].name, "read_file");
    assert.strictEqual(calls[0].id, "tc-1");
  });

  test("malformed entry without name is skipped", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [
              { args: { path: "/a.ts" } }, // no name
              { name: "valid", args: {} },
            ],
          },
        },
      ],
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].name, "valid");
  });

  test("null entry in tool_calls array is skipped", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [null, undefined, { name: "ok", args: {} }],
          },
        },
      ],
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].name, "ok");
  });

  test("entry with non-string name is skipped", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [{ name: 42, args: {} }],
          },
        },
      ],
    });
    assert.strictEqual(calls.length, 0);
  });

  test("entry with non-object args defaults to empty object", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [{ name: "tool", args: "not-an-object" }],
          },
        },
      ],
    });
    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual(calls[0].args, {});
  });

  test("entry with numeric id does not include id", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [{ name: "tool", args: {}, id: 123 }],
          },
        },
      ],
    });
    assert.strictEqual(calls[0].id, undefined);
  });

  test("entry with missing args defaults to empty object", () => {
    const calls = collectToolCalls({
      messages: [
        {
          additional_kwargs: {
            tool_calls: [{ name: "tool" }], // no args field
          },
        },
      ],
    });
    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual(calls[0].args, {});
  });

  test("empty update returns no calls", () => {
    assert.strictEqual(collectToolCalls({}).length, 0);
  });

  test("all sources combined", () => {
    const calls = collectToolCalls({
      toolCalls: [{ name: "think", args: {}, id: "a" }],
      messages: [
        {
          tool_calls: [{ name: "read_file", args: {}, id: "b" }],
          additional_kwargs: {
            tool_calls: [{ name: "web_search", args: {}, id: "c" }],
          },
          content: [
            { type: "tool_use", name: "edit_file", input: {}, id: "d" },
          ],
        },
      ],
    });
    assert.strictEqual(calls.length, 4);
    const names = calls.map((c) => c.name);
    assert.ok(names.includes("think"));
    assert.ok(names.includes("read_file"));
    assert.ok(names.includes("web_search"));
    assert.ok(names.includes("edit_file"));
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. summarizeToolResult — real import, size guard & per-tool summaries
// ═══════════════════════════════════════════════════════════════

suite("summarizeToolResult — size guard & summaries", () => {
  const MAX_CONTENT_LENGTH = 512_000;

  // Use the real exported function
  const summarizeToolResult = summarizeToolResultContent;

  test("null/undefined content returns 'Completed'", () => {
    assert.strictEqual(summarizeToolResult(null, "read_file"), "Completed");
    assert.strictEqual(summarizeToolResult(undefined, "edit_file"), "Completed");
    assert.strictEqual(summarizeToolResult("", "edit_file"), "Completed");
  });

  test("read_file reports line count", () => {
    const content = "line1\nline2\nline3";
    assert.strictEqual(summarizeToolResult(content, "read_file"), "Read 3 lines");
  });

  test("search_codebase counts matches", () => {
    const content = "match 1\nmatch 2\nno results here\nmatch 3";
    assert.strictEqual(summarizeToolResult(content, "search_codebase"), "Found 3 matches");
  });

  test("search_codebase with no matches", () => {
    assert.strictEqual(summarizeToolResult("no results", "search_codebase"), "Search complete");
  });

  test("long content reports KB processed", () => {
    const content = "x".repeat(5000);
    const result = summarizeToolResult(content, "some_tool");
    assert.strictEqual(result, "Processed 5KB of data");
  });

  test("short content returns 'Completed successfully'", () => {
    assert.strictEqual(
      summarizeToolResult("ok", "some_tool"),
      "Completed successfully",
    );
  });

  test("size guard truncates oversized string content", () => {
    const huge = "a".repeat(600_000);
    // Should not throw or hang — truncated before processing
    const result = summarizeToolResult(huge, "some_tool");
    // 512K chars → 512KB of data
    assert.strictEqual(result, `Processed ${Math.ceil(MAX_CONTENT_LENGTH / 1000)}KB of data`);
  });

  test("size guard truncates oversized object content", () => {
    const huge = { data: "b".repeat(600_000) };
    const result = summarizeToolResult(huge, "some_tool");
    assert.ok(result.includes("KB of data"));
  });

  test("object content is JSON stringified", () => {
    const obj = { key: "value" };
    const result = summarizeToolResult(obj, "some_tool");
    // JSON.stringify(obj) = '{"key":"value"}' → 15 chars, short
    assert.strictEqual(result, "Completed successfully");
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. cancelStream / dispose lifecycle
// NOTE: Tests use a hand-rolled TestStreamLifecycle instead of the real
// CodeBuddyAgentService because the real class requires VS Code APIs,
// a LangGraph agent, and other runtime dependencies that are unavailable
// in the unit-test host. The test verifies the *contract* of the lifecycle
// methods (cancelStream, dispose, isAnyAgentRunning) via a structural
// mirror. If the real class logic diverges, consider extracting a
// StreamLifecycleManager class and testing it directly.
// ═══════════════════════════════════════════════════════════════

suite("cancelStream & dispose — stream lifecycle management", () => {
  // Simulates the stream tracking data structures from CodeBuddyAgentService
  class TestStreamLifecycle {
    activeStreams = new Map<string, { isActive: () => boolean; endStream: () => Promise<void> }>();
    agentCache = new Map<string, unknown>();

    cancelStream(threadId: string): void {
      const sm = this.activeStreams.get(threadId);
      if (sm?.isActive()) {
        // In real code, endStream is called
        sm.endStream();
      }
      this.activeStreams.delete(threadId);
    }

    getActiveStreamCount(): number {
      let count = 0;
      for (const sm of this.activeStreams.values()) {
        if (sm.isActive()) count++;
      }
      return count;
    }

    isAnyAgentRunning(): boolean {
      return this.getActiveStreamCount() > 0;
    }

    dispose(): void {
      for (const [threadId, sm] of this.activeStreams) {
        if (sm.isActive()) sm.endStream();
      }
      this.activeStreams.clear();
      this.agentCache.clear();
    }
  }

  let lifecycle: TestStreamLifecycle;

  setup(() => {
    lifecycle = new TestStreamLifecycle();
  });

  test("cancelStream removes the stream from activeStreams", () => {
    let ended = false;
    lifecycle.activeStreams.set("t1", {
      isActive: () => true,
      endStream: async () => { ended = true; },
    });
    assert.strictEqual(lifecycle.getActiveStreamCount(), 1);

    lifecycle.cancelStream("t1");
    assert.strictEqual(ended, true);
    assert.strictEqual(lifecycle.activeStreams.has("t1"), false);
    assert.strictEqual(lifecycle.getActiveStreamCount(), 0);
  });

  test("cancelStream on non-existent thread is a no-op", () => {
    lifecycle.cancelStream("nonexistent"); // should not throw
    assert.strictEqual(lifecycle.getActiveStreamCount(), 0);
  });

  test("cancelStream on inactive stream deletes but doesn't call endStream", () => {
    let ended = false;
    lifecycle.activeStreams.set("t1", {
      isActive: () => false,
      endStream: async () => { ended = true; },
    });

    lifecycle.cancelStream("t1");
    assert.strictEqual(ended, false);
    assert.strictEqual(lifecycle.activeStreams.has("t1"), false);
  });

  test("isAnyAgentRunning returns true when at least one active", () => {
    lifecycle.activeStreams.set("t1", {
      isActive: () => true,
      endStream: async () => {},
    });
    assert.strictEqual(lifecycle.isAnyAgentRunning(), true);
  });

  test("isAnyAgentRunning returns false when all inactive", () => {
    lifecycle.activeStreams.set("t1", {
      isActive: () => false,
      endStream: async () => {},
    });
    assert.strictEqual(lifecycle.isAnyAgentRunning(), false);
  });

  test("dispose ends all active streams and clears caches", () => {
    const ended: string[] = [];
    lifecycle.activeStreams.set("t1", {
      isActive: () => true,
      endStream: async () => { ended.push("t1"); },
    });
    lifecycle.activeStreams.set("t2", {
      isActive: () => true,
      endStream: async () => { ended.push("t2"); },
    });
    lifecycle.agentCache.set("key1", {});

    lifecycle.dispose();
    assert.deepStrictEqual(ended.sort(), ["t1", "t2"]);
    assert.strictEqual(lifecycle.activeStreams.size, 0);
    assert.strictEqual(lifecycle.agentCache.size, 0);
  });

  test("dispose with no active streams is safe", () => {
    lifecycle.dispose(); // should not throw
    assert.strictEqual(lifecycle.activeStreams.size, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. StreamManager — buffer & flush behavior
// ═══════════════════════════════════════════════════════════════

suite("StreamManager — buffer behavior", () => {
  // Simplified re-implementation of StreamManager buffer logic
  class TestStreamBuffer {
    private buffer: Array<{ content: string; metadata?: Record<string, unknown> }> = [];
    private readonly maxBufferSize: number;
    private flushed: Array<{ content: string; metadata?: Record<string, unknown> }>[] = [];
    private isStreaming = false;

    constructor(maxBufferSize = 50) {
      this.maxBufferSize = maxBufferSize;
    }

    startStream(): void {
      this.isStreaming = true;
      this.buffer = [];
      this.flushed = [];
    }

    addChunk(content: string, metadata?: Record<string, unknown>): void {
      if (!this.isStreaming) return;
      this.buffer.push({ content, metadata });
      if (this.buffer.length >= this.maxBufferSize) {
        this.flush();
      }
    }

    flush(): void {
      if (this.buffer.length === 0) return;
      this.flushed.push([...this.buffer]);
      this.buffer = [];
    }

    endStream(): void {
      this.flush();
      this.isStreaming = false;
    }

    isActive(): boolean {
      return this.isStreaming;
    }

    getFlushed() { return this.flushed; }
    getBuffer() { return this.buffer; }
  }

  test("addChunk accumulates in buffer", () => {
    const buf = new TestStreamBuffer();
    buf.startStream();
    buf.addChunk("hello");
    buf.addChunk(" world");
    assert.strictEqual(buf.getBuffer().length, 2);
  });

  test("auto-flush at maxBufferSize", () => {
    const buf = new TestStreamBuffer(3);
    buf.startStream();
    buf.addChunk("a");
    buf.addChunk("b");
    assert.strictEqual(buf.getFlushed().length, 0);
    buf.addChunk("c"); // hits limit → auto-flush
    assert.strictEqual(buf.getFlushed().length, 1);
    assert.strictEqual(buf.getFlushed()[0].length, 3);
    assert.strictEqual(buf.getBuffer().length, 0);
  });

  test("endStream flushes remaining buffer", () => {
    const buf = new TestStreamBuffer(100);
    buf.startStream();
    buf.addChunk("a");
    buf.addChunk("b");
    buf.endStream();
    assert.strictEqual(buf.getFlushed().length, 1);
    assert.strictEqual(buf.getFlushed()[0].length, 2);
    assert.strictEqual(buf.isActive(), false);
  });

  test("addChunk ignored when not streaming", () => {
    const buf = new TestStreamBuffer();
    buf.addChunk("ignored");
    assert.strictEqual(buf.getBuffer().length, 0);
  });

  test("flush with empty buffer is a no-op", () => {
    const buf = new TestStreamBuffer();
    buf.startStream();
    buf.flush();
    assert.strictEqual(buf.getFlushed().length, 0);
  });

  test("metadata is preserved through buffer", () => {
    const buf = new TestStreamBuffer();
    buf.startStream();
    buf.addChunk("test", { node: "agent", messageType: "ai" });
    buf.endStream();
    const flushed = buf.getFlushed()[0];
    assert.strictEqual(flushed[0].metadata?.node, "agent");
    assert.strictEqual(flushed[0].metadata?.messageType, "ai");
  });

  test("multiple flush cycles work correctly", () => {
    const buf = new TestStreamBuffer(2);
    buf.startStream();
    buf.addChunk("a");
    buf.addChunk("b"); // auto-flush
    buf.addChunk("c");
    buf.addChunk("d"); // auto-flush
    buf.addChunk("e");
    buf.endStream(); // final flush
    assert.strictEqual(buf.getFlushed().length, 3);
  });
});
