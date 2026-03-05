/**
 * Human-in-the-Loop (HITL) Flow Tests
 *
 * Tests the consent/approval mechanism in CodeBuddyAgentService:
 * - Consent waiter queue (FIFO)
 * - setUserConsent() resolves the next pending waiter
 * - Denied consent is a no-op
 * - Multiple concurrent approval requests are queued independently
 * - waitForActionConsent() blocks until resolved
 */

import * as assert from "assert";
import * as sinon from "sinon";

suite("HITL — Consent Waiter Queue", () => {
  /**
   * Replicate the consent mechanism from CodeBuddyAgentService.
   * The actual implementation uses:
   *   private consentWaiters: Array<() => void> = [];
   *   setUserConsent(granted: boolean) { ... }
   *   private async waitForActionConsent(): Promise<void> { ... }
   */
  class ConsentQueue {
    private consentWaiters: Array<() => void> = [];

    setUserConsent(granted: boolean): void {
      if (!granted) return;
      const resolver = this.consentWaiters.shift();
      resolver?.();
    }

    async waitForActionConsent(): Promise<void> {
      await new Promise<void>((resolve) =>
        this.consentWaiters.push(resolve),
      );
    }

    get pendingCount(): number {
      return this.consentWaiters.length;
    }
  }

  let queue: ConsentQueue;

  setup(() => {
    queue = new ConsentQueue();
  });

  test("Queue starts empty", () => {
    assert.strictEqual(queue.pendingCount, 0);
  });

  test("waitForActionConsent adds a resolver to the queue", () => {
    // Don't await — it would block forever without consent
    const promise = queue.waitForActionConsent();
    assert.strictEqual(queue.pendingCount, 1);

    // Resolve it so the promise settles
    queue.setUserConsent(true);
    return promise;
  });

  test("setUserConsent(true) resolves the FIRST pending waiter (FIFO)", async () => {
    const order: number[] = [];

    const p1 = queue.waitForActionConsent().then(() => order.push(1));
    const p2 = queue.waitForActionConsent().then(() => order.push(2));

    assert.strictEqual(queue.pendingCount, 2);

    // Approve first
    queue.setUserConsent(true);
    await p1;
    assert.deepStrictEqual(order, [1]);
    assert.strictEqual(queue.pendingCount, 1);

    // Approve second
    queue.setUserConsent(true);
    await p2;
    assert.deepStrictEqual(order, [1, 2]);
    assert.strictEqual(queue.pendingCount, 0);
  });

  test("setUserConsent(false) is a no-op — does not resolve any waiter", () => {
    const promise = queue.waitForActionConsent();
    assert.strictEqual(queue.pendingCount, 1);

    queue.setUserConsent(false);
    assert.strictEqual(queue.pendingCount, 1, "Denied consent should not resolve any waiter");

    // Multiple denials still no-op
    queue.setUserConsent(false);
    queue.setUserConsent(false);
    assert.strictEqual(queue.pendingCount, 1);

    // Clean up — actually approve so test doesn't hang
    queue.setUserConsent(true);
    return promise;
  });

  test("setUserConsent(true) with empty queue is harmless", () => {
    assert.strictEqual(queue.pendingCount, 0);

    // Should not throw
    queue.setUserConsent(true);
    queue.setUserConsent(true);

    assert.strictEqual(queue.pendingCount, 0);
  });

  test("Multiple approvals in sequence resolve in FIFO order", async () => {
    const results: string[] = [];

    const p1 = queue.waitForActionConsent().then(() => results.push("first"));
    const p2 = queue.waitForActionConsent().then(() => results.push("second"));
    const p3 = queue.waitForActionConsent().then(() => results.push("third"));

    assert.strictEqual(queue.pendingCount, 3);

    queue.setUserConsent(true);
    await p1;
    assert.deepStrictEqual(results, ["first"]);

    queue.setUserConsent(true);
    await p2;
    assert.deepStrictEqual(results, ["first", "second"]);

    queue.setUserConsent(true);
    await p3;
    assert.deepStrictEqual(results, ["first", "second", "third"]);
  });

  test("Rapid approve-wait interleaving works correctly", async () => {
    // Pre-approve (no pending waiter)
    queue.setUserConsent(true);
    assert.strictEqual(queue.pendingCount, 0);

    // Now wait (should NOT be auto-resolved — pre-approval doesn't queue)
    const p = queue.waitForActionConsent();
    assert.strictEqual(queue.pendingCount, 1);

    queue.setUserConsent(true);
    await p;
    assert.strictEqual(queue.pendingCount, 0);
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
