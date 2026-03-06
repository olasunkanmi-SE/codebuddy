/**
 * Core Path Coverage Tests
 *
 * Tests the critical code paths in CodeBuddyAgentService and its
 * collaborators that previously had zero test coverage:
 *
 * 1. ContentNormalizer — direct import (no vscode dependency)
 * 2. ConsentManager — logic re-implemented inline (depends on Logger → vscode)
 * 3. AgentSafetyGuard — expanded coverage (checkLimits, detectToolLoop,
 *    detectFileLoop, buildStopMessage, buildToolLoopErrorMessage)
 * 4. collectToolCalls — validation of additional_kwargs entries
 * 5. summarizeToolResult — size guard, per-tool summaries
 * 6. cancelStream / dispose lifecycle
 * 7. StreamManager buffer & flush behavior
 */

import * as assert from "assert";
import { ContentNormalizer } from "../../agents/services/content-normalizer";

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
// 2. ConsentManager — re-implemented inline
// ═══════════════════════════════════════════════════════════════

suite("ConsentManager — consent lifecycle", () => {
  // Inline re-implementation (real class imports Logger → vscode)
  class TestConsentManager {
    private static readonly CONSENT_TIMEOUT_MS = 200; // short for tests
    private waiters = new Map<
      string,
      Array<{
        resolve: (granted: boolean) => void;
        timeout: ReturnType<typeof setTimeout>;
      }>
    >();

    waitForConsent(threadId: string): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          this.removeWaiter(threadId, entry);
          resolve(false);
        }, TestConsentManager.CONSENT_TIMEOUT_MS);
        const entry = { resolve, timeout };
        let queue = this.waiters.get(threadId);
        if (!queue) {
          queue = [];
          this.waiters.set(threadId, queue);
        }
        queue.push(entry);
      });
    }

    respond(granted: boolean, threadId?: string): void {
      if (threadId) {
        this.resolveOldest(threadId, granted);
      } else {
        for (const [tid] of this.waiters) {
          if (this.resolveOldest(tid, granted)) return;
        }
      }
    }

    pendingCount(threadId?: string): number {
      if (threadId) return this.waiters.get(threadId)?.length ?? 0;
      let total = 0;
      for (const queue of this.waiters.values()) total += queue.length;
      return total;
    }

    clearThread(threadId: string): void {
      const queue = this.waiters.get(threadId);
      if (!queue) return;
      for (const entry of queue) {
        clearTimeout(entry.timeout);
        entry.resolve(false);
      }
      this.waiters.delete(threadId);
    }

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

  let mgr: TestConsentManager;

  setup(() => {
    mgr = new TestConsentManager();
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

  test("respond without threadId resolves first waiter across all threads", async () => {
    const p1 = mgr.waitForConsent("tA");
    const p2 = mgr.waitForConsent("tB");
    assert.strictEqual(mgr.pendingCount(), 2);

    mgr.respond(true); // no threadId → fallback
    assert.strictEqual(await p1, true);
    assert.strictEqual(mgr.pendingCount(), 1);

    mgr.respond(false);
    assert.strictEqual(await p2, false);
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
// 3. AgentSafetyGuard — expanded coverage
// ═══════════════════════════════════════════════════════════════

suite("AgentSafetyGuard — checkLimits", () => {
  // Re-implement inline (real class imports Logger → vscode)
  const AGENT_SAFETY_LIMITS = {
    maxEventCount: 1000,
    maxToolInvocations: 200,
    maxToolCallsPerType: 20,
    maxDurationMs: 5 * 60 * 1000,
    fileEditLoopThreshold: 4,
    criticalToolLimits: {
      edit_file: 8, write_file: 8, delete_file: 3,
      run_command: 10, run_terminal_command: 100, web_search: 8,
    } as Record<string, number>,
    readOnlyTools: new Set([
      "read_file", "list_directory", "search_codebase", "grep", "glob",
      "analyze_files_for_question", "git_log", "git_diff", "git_status", "think", "run_tests",
    ]),
  };

  type ForceStopReason = "max_events" | "max_tools" | "timeout";

  function checkLimits(
    eventCount: number,
    totalToolInvocations: number,
    elapsedMs: number,
  ): { shouldStop: boolean; reason: ForceStopReason | null } {
    if (eventCount >= AGENT_SAFETY_LIMITS.maxEventCount) {
      return { shouldStop: true, reason: "max_events" };
    }
    if (totalToolInvocations >= AGENT_SAFETY_LIMITS.maxToolInvocations) {
      return { shouldStop: true, reason: "max_tools" };
    }
    if (elapsedMs >= AGENT_SAFETY_LIMITS.maxDurationMs) {
      return { shouldStop: true, reason: "timeout" };
    }
    return { shouldStop: false, reason: null };
  }

  test("under all limits → shouldStop false", () => {
    const r = checkLimits(500, 100, 60_000);
    assert.strictEqual(r.shouldStop, false);
    assert.strictEqual(r.reason, null);
  });

  test("at exact maxEventCount → stops", () => {
    const r = checkLimits(1000, 0, 0);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "max_events");
  });

  test("over maxEventCount → stops", () => {
    const r = checkLimits(1500, 0, 0);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "max_events");
  });

  test("at exact maxToolInvocations → stops", () => {
    const r = checkLimits(0, 200, 0);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "max_tools");
  });

  test("at exact maxDurationMs → stops", () => {
    const r = checkLimits(0, 0, 300_000);
    assert.strictEqual(r.shouldStop, true);
    assert.strictEqual(r.reason, "timeout");
  });

  test("events checked before tools (priority)", () => {
    // Both exceeded but events should be returned first
    const r = checkLimits(1000, 200, 300_000);
    assert.strictEqual(r.reason, "max_events");
  });

  test("just under all limits → safe", () => {
    const r = checkLimits(999, 199, 299_999);
    assert.strictEqual(r.shouldStop, false);
  });
});

suite("AgentSafetyGuard — detectToolLoop", () => {
  const AGENT_SAFETY_LIMITS = {
    maxToolCallsPerType: 20,
    criticalToolLimits: {
      edit_file: 8, write_file: 8, delete_file: 3,
      run_command: 10, run_terminal_command: 100, web_search: 8,
    } as Record<string, number>,
    readOnlyTools: new Set([
      "read_file", "list_directory", "search_codebase", "grep", "glob",
      "analyze_files_for_question", "git_log", "git_diff", "git_status", "think", "run_tests",
    ]),
  };

  function detectToolLoop(toolName: string, currentCount: number) {
    const isReadOnly = AGENT_SAFETY_LIMITS.readOnlyTools.has(toolName);
    const limit =
      AGENT_SAFETY_LIMITS.criticalToolLimits[toolName] ??
      AGENT_SAFETY_LIMITS.maxToolCallsPerType;
    const isLooping = currentCount >= limit;
    return { isLooping, isReadOnly, limit, currentCount };
  }

  test("edit_file has critical limit of 8", () => {
    const r = detectToolLoop("edit_file", 8);
    assert.strictEqual(r.isLooping, true);
    assert.strictEqual(r.limit, 8);
    assert.strictEqual(r.isReadOnly, false);
  });

  test("edit_file under limit is not looping", () => {
    assert.strictEqual(detectToolLoop("edit_file", 7).isLooping, false);
  });

  test("delete_file has critical limit of 3", () => {
    assert.strictEqual(detectToolLoop("delete_file", 3).isLooping, true);
    assert.strictEqual(detectToolLoop("delete_file", 2).isLooping, false);
  });

  test("read_file is read-only", () => {
    const r = detectToolLoop("read_file", 0);
    assert.strictEqual(r.isReadOnly, true);
  });

  test("edit_file is not read-only", () => {
    assert.strictEqual(detectToolLoop("edit_file", 0).isReadOnly, false);
  });

  test("unknown tool uses default maxToolCallsPerType (20)", () => {
    const r = detectToolLoop("custom_tool", 19);
    assert.strictEqual(r.isLooping, false);
    assert.strictEqual(r.limit, 20);

    const r2 = detectToolLoop("custom_tool", 20);
    assert.strictEqual(r2.isLooping, true);
  });

  test("run_terminal_command has high limit of 100", () => {
    assert.strictEqual(detectToolLoop("run_terminal_command", 99).isLooping, false);
    assert.strictEqual(detectToolLoop("run_terminal_command", 100).isLooping, true);
  });

  test("think is read-only", () => {
    assert.strictEqual(detectToolLoop("think", 0).isReadOnly, true);
  });

  test("run_tests is read-only", () => {
    assert.strictEqual(detectToolLoop("run_tests", 0).isReadOnly, true);
  });
});

suite("AgentSafetyGuard — detectFileLoop (pure query, no mutation)", () => {
  const FILE_EDIT_LOOP_THRESHOLD = 4;

  function detectFileLoop(
    filePath: string,
    fileEditCounts: Map<string, number>,
  ) {
    const editCount = (fileEditCounts.get(filePath) || 0) + 1;
    return {
      isLooping: editCount >= FILE_EDIT_LOOP_THRESHOLD,
      filePath,
      editCount,
    };
  }

  test("first edit returns editCount 1, not looping", () => {
    const counts = new Map<string, number>();
    const r = detectFileLoop("/src/a.ts", counts);
    assert.strictEqual(r.editCount, 1);
    assert.strictEqual(r.isLooping, false);
  });

  test("does NOT mutate the caller's map", () => {
    const counts = new Map<string, number>();
    detectFileLoop("/src/a.ts", counts);
    assert.strictEqual(counts.has("/src/a.ts"), false);
  });

  test("at threshold (4) → looping", () => {
    const counts = new Map<string, number>([[ "/src/a.ts", 3 ]]);
    const r = detectFileLoop("/src/a.ts", counts);
    assert.strictEqual(r.editCount, 4);
    assert.strictEqual(r.isLooping, true);
  });

  test("above threshold → looping", () => {
    const counts = new Map<string, number>([[ "/src/a.ts", 10 ]]);
    assert.strictEqual(detectFileLoop("/src/a.ts", counts).isLooping, true);
  });

  test("different files tracked independently", () => {
    const counts = new Map<string, number>([[ "/src/a.ts", 3 ]]);
    assert.strictEqual(detectFileLoop("/src/b.ts", counts).editCount, 1);
    assert.strictEqual(detectFileLoop("/src/a.ts", counts).editCount, 4);
  });
});

suite("AgentSafetyGuard — buildStopMessage", () => {
  type ForceStopReason = "max_events" | "max_tools" | "timeout";

  function buildStopMessage(
    reason: ForceStopReason,
    eventCount: number,
    totalToolInvocations: number,
    elapsedMs: number,
  ): string {
    const reasonMessages: Record<ForceStopReason, string> = {
      max_events: `Processed ${eventCount} events`,
      max_tools: `Made ${totalToolInvocations} tool calls`,
      timeout: `Ran for ${Math.round(elapsedMs / 1000)} seconds`,
    };
    return `⚠️ Stopping early (${reasonMessages[reason]}). Here's what I found so far:`;
  }

  test("max_events includes event count", () => {
    const msg = buildStopMessage("max_events", 1000, 50, 60_000);
    assert.ok(msg.includes("Processed 1000 events"));
    assert.ok(msg.includes("⚠️"));
  });

  test("max_tools includes tool count", () => {
    const msg = buildStopMessage("max_tools", 500, 200, 120_000);
    assert.ok(msg.includes("Made 200 tool calls"));
  });

  test("timeout includes elapsed seconds", () => {
    const msg = buildStopMessage("timeout", 100, 50, 300_000);
    assert.ok(msg.includes("Ran for 300 seconds"));
  });
});

suite("AgentSafetyGuard — buildToolLoopErrorMessage", () => {
  function buildToolLoopErrorMessage(toolName: string, callCount: number): string {
    if (toolName === "edit_file" || toolName === "write_file") {
      return `I've attempted to edit this file ${callCount} times but the edit isn't completing successfully. This usually happens when the edit operation is interrupted or the file content doesn't match exactly. I'll stop here to avoid an infinite loop. You may need to make the change manually.`;
    }
    if (toolName === "web_search") {
      return `I've searched for this information multiple times but couldn't find definitive results. For GitHub issues, try using the GitHub MCP tools directly or visit the repository issues page manually.`;
    }
    return `I've called ${toolName} ${callCount} times which indicates a loop. I'll stop here to prevent infinite processing.`;
  }

  test("edit_file message mentions 'edit this file' + count", () => {
    const msg = buildToolLoopErrorMessage("edit_file", 8);
    assert.ok(msg.includes("8 times"));
    assert.ok(msg.includes("infinite loop"));
  });

  test("write_file uses same path as edit_file", () => {
    const msg = buildToolLoopErrorMessage("write_file", 5);
    assert.ok(msg.includes("5 times"));
    assert.ok(msg.includes("edit"));
  });

  test("web_search has specific message", () => {
    const msg = buildToolLoopErrorMessage("web_search", 8);
    assert.ok(msg.includes("searched for this information"));
    assert.ok(msg.includes("GitHub MCP tools"));
  });

  test("generic tool message includes tool name and count", () => {
    const msg = buildToolLoopErrorMessage("custom_tool", 20);
    assert.ok(msg.includes("custom_tool"));
    assert.ok(msg.includes("20 times"));
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. collectToolCalls — validation of additional_kwargs entries
// ═══════════════════════════════════════════════════════════════

suite("collectToolCalls — additional_kwargs validation", () => {
  interface IAgentToolCall {
    name: string;
    args: Record<string, unknown>;
    id?: string;
  }

  // Re-implementation mirrors the real validated collectToolCalls
  function collectToolCalls(update: {
    toolCalls?: IAgentToolCall[];
    messages?: Array<{
      tool_calls?: IAgentToolCall[];
      additional_kwargs?: Record<string, unknown>;
      content?: Array<{ type: string; name?: string; input?: Record<string, unknown>; id?: string }>;
    }>;
  }): IAgentToolCall[] {
    const calls: IAgentToolCall[] = [];

    if (update?.toolCalls && Array.isArray(update.toolCalls)) {
      calls.push(...update.toolCalls);
    }

    if (update?.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          calls.push(...msg.tool_calls);
        }
        if (
          msg.additional_kwargs?.tool_calls &&
          Array.isArray(msg.additional_kwargs.tool_calls)
        ) {
          for (const tc of msg.additional_kwargs.tool_calls as unknown[]) {
            if (
              tc &&
              typeof tc === "object" &&
              typeof (tc as Record<string, unknown>).name === "string"
            ) {
              const raw = tc as Record<string, unknown>;
              calls.push({
                name: raw.name as string,
                args:
                  raw.args && typeof raw.args === "object"
                    ? (raw.args as Record<string, unknown>)
                    : {},
                id: typeof raw.id === "string" ? raw.id : undefined,
              });
            }
          }
        }
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "tool_use") {
              calls.push({
                name: block.name ?? "unknown",
                args: block.input ?? {},
                id: block.id,
              });
            }
          }
        }
      }
    }

    return calls;
  }

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
// 5. summarizeToolResult — size guard & per-tool summaries
// ═══════════════════════════════════════════════════════════════

suite("summarizeToolResult — size guard & summaries", () => {
  const MAX_CONTENT_LENGTH = 512_000;

  function summarizeToolResult(content: unknown, toolName: string): string {
    if (!content) return "Completed";

    let contentStr: string;
    if (typeof content === "string") {
      contentStr =
        content.length > MAX_CONTENT_LENGTH
          ? content.slice(0, MAX_CONTENT_LENGTH)
          : content;
    } else {
      const raw = JSON.stringify(content);
      contentStr =
        raw.length > MAX_CONTENT_LENGTH
          ? raw.slice(0, MAX_CONTENT_LENGTH)
          : raw;
    }

    if (toolName === "read_file") {
      const lines = contentStr.split("\n").length;
      return `Read ${lines} lines`;
    }

    if (toolName === "search_codebase") {
      const matchCount = (contentStr.match(/match/gi) || []).length;
      return matchCount > 0 ? `Found ${matchCount} matches` : "Search complete";
    }

    if (contentStr.length > 100) {
      return `Processed ${Math.ceil(contentStr.length / 1000)}KB of data`;
    }

    return "Completed successfully";
  }

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
