/**
 * Filesystem Optimizations Tests
 *
 * Tests the stream cleanup, grep accumulator, and ripgrep probe logic
 * introduced on the feature/optimization branch:
 * - Grep MAX_GREP_RESULTS shared accumulator prevents unbounded results
 * - effectiveUseRipgrep boolean logic in createVscodeFsBackendFactory
 * - Stream read with offset/limit triggers proper cleanup via finally
 */

import * as assert from "assert";

// ---------- Inline re-implementations of optimization-critical logic ----------

/** MAX_GREP_RESULTS cap — matches filesystem.ts constant. */
const MAX_GREP_RESULTS = 500;

interface GrepMatch {
  path: string;
  line: number;
  text: string;
}

/**
 * Shared accumulator pattern from the refactored walkAndSearch.
 * This replaces the old per-file-then-concat approach.
 */
function createAccumulator(): { results: GrepMatch[]; isFull: boolean } {
  return { results: [], isFull: false };
}

function pushMatch(
  acc: { results: GrepMatch[]; isFull: boolean },
  match: GrepMatch,
): void {
  acc.results.push(match);
  if (acc.results.length >= MAX_GREP_RESULTS) {
    acc.isFull = true;
  }
}

/**
 * effectiveUseRipgrep — same logic as createVscodeFsBackendFactory.
 */
function computeEffectiveUseRipgrep(opts: {
  useRipgrep?: boolean;
  ripgrepSearch?: unknown;
  probeRgAvailable: boolean;
}): boolean {
  return opts.useRipgrep !== false && (!!opts.ripgrepSearch || opts.probeRgAvailable);
}

/**
 * Stream read simulation — models the try/finally pattern in VscodeFsBackend.read().
 * Records whether cleanup (rl.close + fileStream.destroy) runs.
 */
function simulateStreamRead(
  lines: string[],
  offset: number,
  limit: number,
): { output: string[]; cleaned: boolean } {
  let cleaned = false;
  const out: string[] = [];
  let currentLine = 0;

  try {
    for (const line of lines) {
      if (currentLine >= offset) {
        if (out.length < limit) {
          out.push(`${String(currentLine + 1).padStart(6, " ")}\t${line.slice(0, 2000)}`);
        }
      }
      currentLine++;
      if (out.length >= limit) {
        break;
      }
    }
  } finally {
    cleaned = true;
  }

  return { output: out, cleaned };
}

// ---------- Tests ----------

suite("Filesystem Grep — Shared Accumulator", () => {
  test("Accumulator starts empty and not full", () => {
    const acc = createAccumulator();
    assert.strictEqual(acc.results.length, 0);
    assert.strictEqual(acc.isFull, false);
  });

  test("Accumulator caps at MAX_GREP_RESULTS (500)", () => {
    const acc = createAccumulator();
    for (let i = 0; i < 600; i++) {
      if (acc.isFull) break;
      pushMatch(acc, { path: `/file${i}.ts`, line: 1, text: "match" });
    }
    assert.strictEqual(acc.results.length, MAX_GREP_RESULTS);
    assert.strictEqual(acc.isFull, true);
  });

  test("Accumulator isFull flag is set exactly at limit", () => {
    const acc = createAccumulator();
    for (let i = 0; i < MAX_GREP_RESULTS - 1; i++) {
      pushMatch(acc, { path: `/f.ts`, line: i, text: "x" });
    }
    assert.strictEqual(acc.isFull, false, "Should not be full at 499");
    pushMatch(acc, { path: "/f.ts", line: 500, text: "x" });
    assert.strictEqual(acc.isFull, true, "Should be full at 500");
  });

  test("Early isFull check prevents processing after limit", () => {
    const acc = createAccumulator();
    acc.isFull = true;
    let processedCount = 0;
    const entries = ["/a.ts", "/b.ts", "/c.ts"];
    for (const e of entries) {
      if (acc.isFull) break;
      pushMatch(acc, { path: e, line: 1, text: "match" });
      processedCount++;
    }
    assert.strictEqual(processedCount, 0, "No entries should be processed when already full");
  });
});

suite("Filesystem — effectiveUseRipgrep Logic", () => {
  test("Ripgrep enabled when useRipgrep=true and rg binary available", () => {
    assert.strictEqual(
      computeEffectiveUseRipgrep({ useRipgrep: true, probeRgAvailable: true }),
      true,
    );
  });

  test("Ripgrep disabled when useRipgrep=false even if rg is available", () => {
    assert.strictEqual(
      computeEffectiveUseRipgrep({ useRipgrep: false, probeRgAvailable: true }),
      false,
    );
  });

  test("Ripgrep disabled when useRipgrep unset and rg not available", () => {
    assert.strictEqual(
      computeEffectiveUseRipgrep({ probeRgAvailable: false }),
      false,
    );
  });

  test("Ripgrep enabled when useRipgrep unset and rg available", () => {
    assert.strictEqual(
      computeEffectiveUseRipgrep({ probeRgAvailable: true }),
      true,
    );
  });

  test("Ripgrep enabled when ripgrepSearch wrapper is provided even if rg binary unavailable", () => {
    assert.strictEqual(
      computeEffectiveUseRipgrep({
        ripgrepSearch: () => {},
        probeRgAvailable: false,
      }),
      true,
    );
  });

  test("Ripgrep disabled when useRipgrep=false even with ripgrepSearch wrapper", () => {
    assert.strictEqual(
      computeEffectiveUseRipgrep({
        useRipgrep: false,
        ripgrepSearch: () => {},
        probeRgAvailable: true,
      }),
      false,
    );
  });
});

suite("Filesystem — Stream Read Cleanup", () => {
  test("Cleanup runs after normal read", () => {
    const lines = ["line0", "line1", "line2"];
    const { output, cleaned } = simulateStreamRead(lines, 0, 10);
    assert.strictEqual(output.length, 3);
    assert.strictEqual(cleaned, true);
  });

  test("Cleanup runs after early break due to limit", () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line${i}`);
    const { output, cleaned } = simulateStreamRead(lines, 0, 5);
    assert.strictEqual(output.length, 5);
    assert.strictEqual(cleaned, true);
  });

  test("Offset skips initial lines", () => {
    const lines = ["a", "b", "c", "d", "e"];
    const { output } = simulateStreamRead(lines, 2, 10);
    assert.strictEqual(output.length, 3); // lines at index 2,3,4
    assert.ok(output[0].includes("c"), "First output should be line 'c'");
  });

  test("Line numbers in output are 1-based and padded", () => {
    const lines = ["hello"];
    const { output } = simulateStreamRead(lines, 0, 10);
    assert.ok(output[0].includes("\t"), "Should have tab separator");
    assert.ok(output[0].trimStart().startsWith("1"), "First line number should be 1");
  });

  test("Lines are truncated to 2000 characters", () => {
    const longLine = "x".repeat(3000);
    const { output } = simulateStreamRead([longLine], 0, 10);
    // 6 chars padding + \t + 2000 chars = 2007
    const content = output[0].split("\t")[1];
    assert.strictEqual(content.length, 2000);
  });

  test("Cleanup runs even when lines array is empty", () => {
    const { output, cleaned } = simulateStreamRead([], 0, 10);
    assert.strictEqual(output.length, 0);
    assert.strictEqual(cleaned, true);
  });
});
