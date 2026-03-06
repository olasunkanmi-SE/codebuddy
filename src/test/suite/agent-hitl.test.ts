/**
 * Human-in-the-Loop (HITL) Flow Tests
 *
 * Tests the consent/approval mechanism in CodeBuddyAgentService:
 * - Thread-keyed consent waiter map
 * - setUserConsent() resolves waiters with a boolean (granted/denied)
 * - waitForActionConsent() blocks until resolved, returns boolean
 * - Multiple concurrent threads are isolated
 * - Fallback: calling setUserConsent without threadId resolves all waiters
 */

import * as assert from "assert";
import * as sinon from "sinon";

suite("HITL — Consent Waiter Queue", () => {
  /**
   * Replicate the consent mechanism from CodeBuddyAgentService.
   * The actual implementation uses:
   *   private consentWaiters: Map<string, Array<(granted: boolean) => void>>
   *   setUserConsent(granted: boolean, threadId?: string) { ... }
   *   private async waitForActionConsent(threadId: string): Promise<boolean> { ... }
   */
  class ConsentQueue {
    private consentWaiters = new Map<string, Array<(granted: boolean) => void>>();

    setUserConsent(granted: boolean, threadId?: string): void {
      if (threadId) {
        const waiters = this.consentWaiters.get(threadId);
        if (waiters?.length) {
          const resolver = waiters.shift()!;
          resolver(granted);
          if (waiters.length === 0) {
            this.consentWaiters.delete(threadId);
          }
        }
      } else {
        // Fallback: resolve all waiters across all threads
        for (const [tid, waiters] of this.consentWaiters) {
          for (const resolver of waiters) {
            resolver(granted);
          }
        }
        this.consentWaiters.clear();
      }
    }

    async waitForActionConsent(threadId: string): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        if (!this.consentWaiters.has(threadId)) {
          this.consentWaiters.set(threadId, []);
        }
        this.consentWaiters.get(threadId)!.push(resolve);
      });
    }

    pendingCount(threadId?: string): number {
      if (threadId) {
        return this.consentWaiters.get(threadId)?.length ?? 0;
      }
      let total = 0;
      for (const waiters of this.consentWaiters.values()) {
        total += waiters.length;
      }
      return total;
    }
  }

  let queue: ConsentQueue;

  setup(() => {
    queue = new ConsentQueue();
  });

  test("Queue starts empty", () => {
    assert.strictEqual(queue.pendingCount(), 0);
  });

  test("waitForActionConsent adds a resolver to the queue for the given thread", () => {
    const promise = queue.waitForActionConsent("thread-1");
    assert.strictEqual(queue.pendingCount("thread-1"), 1);
    assert.strictEqual(queue.pendingCount(), 1);

    // Resolve so the promise settles
    queue.setUserConsent(true, "thread-1");
    return promise;
  });

  test("setUserConsent(true) resolves the FIRST pending waiter for a thread (FIFO)", async () => {
    const order: number[] = [];

    const p1 = queue.waitForActionConsent("t1").then((g) => { order.push(1); return g; });
    const p2 = queue.waitForActionConsent("t1").then((g) => { order.push(2); return g; });

    assert.strictEqual(queue.pendingCount("t1"), 2);

    queue.setUserConsent(true, "t1");
    const r1 = await p1;
    assert.strictEqual(r1, true);
    assert.deepStrictEqual(order, [1]);
    assert.strictEqual(queue.pendingCount("t1"), 1);

    queue.setUserConsent(true, "t1");
    const r2 = await p2;
    assert.strictEqual(r2, true);
    assert.deepStrictEqual(order, [1, 2]);
    assert.strictEqual(queue.pendingCount("t1"), 0);
  });

  test("setUserConsent(false) resolves the waiter with false (denial)", async () => {
    const promise = queue.waitForActionConsent("t1");
    assert.strictEqual(queue.pendingCount("t1"), 1);

    queue.setUserConsent(false, "t1");
    const result = await promise;
    assert.strictEqual(result, false, "Denied consent should resolve with false");
    assert.strictEqual(queue.pendingCount("t1"), 0);
  });

  test("setUserConsent(true) with empty queue is harmless", () => {
    assert.strictEqual(queue.pendingCount(), 0);

    // Should not throw
    queue.setUserConsent(true, "empty-thread");
    queue.setUserConsent(true);

    assert.strictEqual(queue.pendingCount(), 0);
  });

  test("Multiple threads are isolated", async () => {
    const results: string[] = [];

    const p1 = queue.waitForActionConsent("thread-A").then((g) => { results.push(`A:${g}`); });
    const p2 = queue.waitForActionConsent("thread-B").then((g) => { results.push(`B:${g}`); });

    assert.strictEqual(queue.pendingCount("thread-A"), 1);
    assert.strictEqual(queue.pendingCount("thread-B"), 1);
    assert.strictEqual(queue.pendingCount(), 2);

    // Approve thread-B first, deny thread-A
    queue.setUserConsent(true, "thread-B");
    await p2;
    assert.deepStrictEqual(results, ["B:true"]);
    assert.strictEqual(queue.pendingCount("thread-A"), 1);
    assert.strictEqual(queue.pendingCount("thread-B"), 0);

    queue.setUserConsent(false, "thread-A");
    await p1;
    assert.deepStrictEqual(results, ["B:true", "A:false"]);
    assert.strictEqual(queue.pendingCount(), 0);
  });

  test("Fallback: setUserConsent without threadId resolves all threads", async () => {
    const results: boolean[] = [];

    const p1 = queue.waitForActionConsent("t1").then((g) => { results.push(g); });
    const p2 = queue.waitForActionConsent("t2").then((g) => { results.push(g); });

    assert.strictEqual(queue.pendingCount(), 2);

    // No threadId — resolves all
    queue.setUserConsent(true);
    await Promise.all([p1, p2]);
    assert.deepStrictEqual(results.sort(), [true, true]);
    assert.strictEqual(queue.pendingCount(), 0);
  });

  test("Rapid approve-wait interleaving works correctly", async () => {
    // Pre-approve with no pending waiter
    queue.setUserConsent(true, "t1");
    assert.strictEqual(queue.pendingCount(), 0);

    // Now wait — should NOT be auto-resolved
    const p = queue.waitForActionConsent("t1");
    assert.strictEqual(queue.pendingCount("t1"), 1);

    queue.setUserConsent(true, "t1");
    const result = await p;
    assert.strictEqual(result, true);
    assert.strictEqual(queue.pendingCount(), 0);
  });
});

suite("HITL — Interrupt Detection", () => {
  test("Interrupt entry detection from stream entries", () => {
    // Simulate the entries.find() logic from streamResponse
    const entries: Array<[string, any]> = [
      ["tools", { messages: [] }],
      ["__interrupt__", { value: { id: "int-1", name: "edit_file" } }],
    ];

    const interruptEntry = entries.find(
      ([nodeName]) => nodeName === "__interrupt__",
    );

    assert.ok(interruptEntry, "Should detect __interrupt__ entry");
    assert.strictEqual(interruptEntry[0], "__interrupt__");
    assert.strictEqual(interruptEntry[1].value.name, "edit_file");
  });

  test("No interrupt when all entries are normal nodes", () => {
    const entries: Array<[string, any]> = [
      ["tools", { messages: [] }],
      ["agent", { messages: [] }],
    ];

    const interruptEntry = entries.find(
      ([nodeName]) => nodeName === "__interrupt__",
    );

    assert.strictEqual(interruptEntry, undefined);
  });

  test("Interrupt metadata extraction handles missing fields gracefully", () => {
    // The code uses fallbacks: value?.name || value?.tool || "tool"
    const interrupt = { value: {} };

    const toolNameRaw =
      interrupt.value &&
      ((interrupt.value as any).name ||
        (interrupt.value as any).tool ||
        "tool");

    assert.strictEqual(toolNameRaw, "tool");
  });

  test("Interrupt metadata extraction uses name over tool", () => {
    const interrupt = {
      value: { name: "edit_file", tool: "file_editor" },
    };

    const toolNameRaw =
      interrupt.value.name || (interrupt.value as any).tool || "tool";

    assert.strictEqual(toolNameRaw, "edit_file");
  });

  test("Interrupt array normalization handles single vs array", () => {
    // The code does: Array.isArray(interruptUpdates) ? interruptUpdates : [interruptUpdates]
    const single = { value: { name: "edit_file" } };
    const array = [
      { value: { name: "edit_file" } },
      { value: { name: "write_file" } },
    ];

    const fromSingle = Array.isArray(single) ? single : [single];
    const fromArray = Array.isArray(array) ? array : [array];

    assert.strictEqual(fromSingle.length, 1);
    assert.strictEqual(fromArray.length, 2);
  });
});

suite("HITL — Tool Description for Approvals", () => {
  // Test the friendly name mapping that's displayed to users
  const TOOL_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
    run_command: { name: "Terminal", description: "Running command..." },
    edit_file: { name: "File Editor", description: "Editing file contents..." },
    write_file: { name: "File Writer", description: "Writing new file..." },
    delete_file: { name: "File Deletion", description: "Deleting file..." },
    web_search: { name: "Web Search", description: "Searching the web..." },
    read_file: { name: "File Reader", description: "Reading file contents..." },
    think: { name: "Reasoning", description: "Thinking through the problem..." },
    default: { name: "Tool", description: "Executing tool..." },
  };

  test("Known tools return friendly names", () => {
    assert.strictEqual(TOOL_DESCRIPTIONS.edit_file.name, "File Editor");
    assert.strictEqual(TOOL_DESCRIPTIONS.run_command.name, "Terminal");
  });

  test("Unknown tools fall back to 'default'", () => {
    const toolName = "some_new_tool";
    const info = TOOL_DESCRIPTIONS[toolName] || TOOL_DESCRIPTIONS.default;
    assert.strictEqual(info.name, "Tool");
    assert.strictEqual(info.description, "Executing tool...");
  });
});
