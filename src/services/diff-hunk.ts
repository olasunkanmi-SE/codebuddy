/**
 * Per-hunk diff utilities — computes line-level diffs between two strings,
 * groups changes into contiguous hunks, and supports selectively applying
 * or rejecting individual hunks.
 */

// ── Types ────────────────────────────────────────────────────

export interface DiffLine {
  type: "context" | "add" | "remove";
  content: string;
}

export interface DiffHunk {
  index: number;
  /** 1-based start line in the original text */
  oldStart: number;
  /** Number of lines from the original in this hunk */
  oldLines: number;
  /** 1-based start line in the new text */
  newStart: number;
  /** Number of lines from the new text in this hunk */
  newLines: number;
  /** The diff lines (context + adds + removes) */
  lines: DiffLine[];
  /** Per-hunk status for selective application */
  status: "pending" | "accepted" | "rejected";
  /** Human-readable header, e.g. "@@ -10,5 +12,7 @@" */
  header: string;
}

// ── Constants ────────────────────────────────────────────────

/** Number of context lines surrounding each hunk (like `diff -U3`). */
const CONTEXT_LINES = 3;

// ── Public API ───────────────────────────────────────────────

/**
 * Compute a list of diff hunks between `original` and `modified`.
 * Each hunk is a contiguous region of change with surrounding context lines.
 */
export function computeHunks(original: string, modified: string): DiffHunk[] {
  const oldLines = splitLines(original);
  const newLines = splitLines(modified);

  // Compute edit operations via LCS
  const ops = computeEditOps(oldLines, newLines);

  if (ops.length === 0) {
    return [];
  }

  // Group edit operations into hunks with context
  return groupIntoHunks(ops, oldLines, newLines);
}

/**
 * Given the original text and a list of hunks (each with a status),
 * produce the result text by applying only "accepted" hunks.
 * "pending" hunks are treated as rejected (original kept).
 */
export function applySelectedHunks(
  original: string,
  hunks: DiffHunk[],
): string {
  const oldLines = splitLines(original);
  const result: string[] = [];
  let oldIdx = 0; // 0-based index into oldLines

  for (const hunk of hunks) {
    const hunkOldStart = hunk.oldStart - 1; // convert to 0-based

    // Copy unchanged lines before this hunk
    while (oldIdx < hunkOldStart) {
      result.push(oldLines[oldIdx]);
      oldIdx++;
    }

    if (hunk.status === "accepted") {
      // Apply hunk: skip old lines, add new lines
      for (const line of hunk.lines) {
        if (line.type === "add") {
          result.push(line.content);
        } else if (line.type === "remove") {
          oldIdx++;
        } else {
          // context line — emit and advance
          result.push(line.content);
          oldIdx++;
        }
      }
    } else {
      // Rejected/pending: keep original lines, skip adds
      for (const line of hunk.lines) {
        if (line.type === "remove" || line.type === "context") {
          result.push(oldLines[oldIdx]);
          oldIdx++;
        }
        // skip "add" lines
      }
    }
  }

  // Copy remaining lines after the last hunk
  while (oldIdx < oldLines.length) {
    result.push(oldLines[oldIdx]);
    oldIdx++;
  }

  return joinLines(result);
}

/**
 * Format hunks into a unified diff string for display.
 */
export function formatUnifiedDiff(filePath: string, hunks: DiffHunk[]): string {
  const lines: string[] = [];
  lines.push(`--- a/${filePath}`);
  lines.push(`+++ b/${filePath}`);

  for (const hunk of hunks) {
    lines.push(hunk.header);
    for (const line of hunk.lines) {
      const prefix =
        line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
      lines.push(`${prefix}${line.content}`);
    }
  }

  return lines.join("\n");
}

// ── Internal: edit operations ────────────────────────────────

interface EditOp {
  type: "equal" | "insert" | "delete";
  /** 0-based index in oldLines (for equal/delete) */
  oldIndex: number;
  /** 0-based index in newLines (for equal/insert) */
  newIndex: number;
}

/**
 * Compute a minimal list of edit operations using a simple O(ND) diff
 * (Myers algorithm simplified). Returns operations in order.
 */
function computeEditOps(oldLines: string[], newLines: string[]): EditOp[] {
  const n = oldLines.length;
  const m = newLines.length;

  // Trivial cases
  if (n === 0 && m === 0) {
    return [];
  }
  if (n === 0) {
    return newLines.map((_, i) => ({
      type: "insert" as const,
      oldIndex: 0,
      newIndex: i,
    }));
  }
  if (m === 0) {
    return oldLines.map((_, i) => ({
      type: "delete" as const,
      oldIndex: i,
      newIndex: 0,
    }));
  }

  // LCS-based approach for reasonable file sizes
  // For very large files (>10K lines), fall back to a simpler approach
  if (n * m > 10_000_000) {
    return simpleDiff(oldLines, newLines);
  }

  // Compute LCS length table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce edit ops
  const ops: EditOp[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: "equal", oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "insert", oldIndex: i, newIndex: j - 1 });
      j--;
    } else {
      ops.push({ type: "delete", oldIndex: i - 1, newIndex: j });
      i--;
    }
  }

  ops.reverse();
  return ops;
}

/**
 * Fallback diff for very large files — line-by-line hash comparison.
 * Not optimal but avoids O(n*m) memory.
 */
function simpleDiff(oldLines: string[], newLines: string[]): EditOp[] {
  const ops: EditOp[] = [];
  let oi = 0;
  let ni = 0;

  while (oi < oldLines.length && ni < newLines.length) {
    if (oldLines[oi] === newLines[ni]) {
      ops.push({ type: "equal", oldIndex: oi, newIndex: ni });
      oi++;
      ni++;
    } else {
      // Look ahead to find match
      let foundOld = -1;
      let foundNew = -1;
      const lookahead = Math.min(
        50,
        Math.max(oldLines.length - oi, newLines.length - ni),
      );

      for (let k = 1; k <= lookahead; k++) {
        if (
          foundNew === -1 &&
          ni + k < newLines.length &&
          oldLines[oi] === newLines[ni + k]
        ) {
          foundNew = ni + k;
        }
        if (
          foundOld === -1 &&
          oi + k < oldLines.length &&
          oldLines[oi + k] === newLines[ni]
        ) {
          foundOld = oi + k;
        }
        if (foundOld !== -1 || foundNew !== -1) {
          break;
        }
      }

      if (
        foundNew !== -1 &&
        (foundOld === -1 || foundNew - ni <= foundOld - oi)
      ) {
        // Insert new lines until we reach the match
        while (ni < foundNew) {
          ops.push({ type: "insert", oldIndex: oi, newIndex: ni });
          ni++;
        }
      } else if (foundOld !== -1) {
        // Delete old lines until we reach the match
        while (oi < foundOld) {
          ops.push({ type: "delete", oldIndex: oi, newIndex: ni });
          oi++;
        }
      } else {
        // No match found in lookahead — treat as delete + insert
        ops.push({ type: "delete", oldIndex: oi, newIndex: ni });
        oi++;
        ops.push({ type: "insert", oldIndex: oi, newIndex: ni });
        ni++;
      }
    }
  }

  while (oi < oldLines.length) {
    ops.push({ type: "delete", oldIndex: oi, newIndex: newLines.length });
    oi++;
  }
  while (ni < newLines.length) {
    ops.push({ type: "insert", oldIndex: oldLines.length, newIndex: ni });
    ni++;
  }

  return ops;
}

// ── Internal: hunk grouping ──────────────────────────────────

/**
 * Group sequential edit operations into hunks with context lines.
 */
function groupIntoHunks(
  ops: EditOp[],
  oldLines: string[],
  newLines: string[],
): DiffHunk[] {
  // Find change regions (sequences of non-equal ops)
  const changeRegions: { start: number; end: number }[] = [];
  let regionStart = -1;

  for (let i = 0; i < ops.length; i++) {
    if (ops[i].type !== "equal") {
      if (regionStart === -1) {
        regionStart = i;
      }
    } else if (regionStart !== -1) {
      changeRegions.push({ start: regionStart, end: i });
      regionStart = -1;
    }
  }
  if (regionStart !== -1) {
    changeRegions.push({ start: regionStart, end: ops.length });
  }

  if (changeRegions.length === 0) {
    return [];
  }

  // Merge regions that are close together (within 2 * CONTEXT_LINES)
  const mergedRegions: { start: number; end: number }[] = [changeRegions[0]];
  for (let i = 1; i < changeRegions.length; i++) {
    const prev = mergedRegions[mergedRegions.length - 1];
    const curr = changeRegions[i];

    // Count equal ops between regions
    let equalsBetween = 0;
    for (let j = prev.end; j < curr.start; j++) {
      if (ops[j].type === "equal") {
        equalsBetween++;
      }
    }

    if (equalsBetween <= CONTEXT_LINES * 2) {
      // Merge
      prev.end = curr.end;
    } else {
      mergedRegions.push(curr);
    }
  }

  // Build hunks from merged regions
  const hunks: DiffHunk[] = [];

  for (let ri = 0; ri < mergedRegions.length; ri++) {
    const region = mergedRegions[ri];

    // Expand region to include context lines
    let contextStart = region.start;
    let contextEnd = region.end;

    // Add leading context
    let leadingContext = 0;
    let idx = region.start - 1;
    while (idx >= 0 && leadingContext < CONTEXT_LINES) {
      if (ops[idx].type === "equal") {
        leadingContext++;
      }
      contextStart = idx;
      idx--;
    }

    // Add trailing context
    let trailingContext = 0;
    idx = region.end;
    while (idx < ops.length && trailingContext < CONTEXT_LINES) {
      if (ops[idx].type === "equal") {
        trailingContext++;
      }
      contextEnd = idx + 1;
      idx++;
    }

    // Build the hunk lines and compute line numbers
    const hunkLines: DiffLine[] = [];
    let hunkOldStart = -1;
    let hunkNewStart = -1;
    let hunkOldCount = 0;
    let hunkNewCount = 0;

    for (let i = contextStart; i < contextEnd; i++) {
      const op = ops[i];

      if (op.type === "equal") {
        if (hunkOldStart === -1) {
          hunkOldStart = op.oldIndex;
        }
        if (hunkNewStart === -1) {
          hunkNewStart = op.newIndex;
        }
        hunkLines.push({ type: "context", content: oldLines[op.oldIndex] });
        hunkOldCount++;
        hunkNewCount++;
      } else if (op.type === "delete") {
        if (hunkOldStart === -1) {
          hunkOldStart = op.oldIndex;
        }
        if (hunkNewStart === -1) {
          hunkNewStart = op.newIndex;
        }
        hunkLines.push({ type: "remove", content: oldLines[op.oldIndex] });
        hunkOldCount++;
      } else {
        // insert
        if (hunkOldStart === -1) {
          hunkOldStart = op.oldIndex;
        }
        if (hunkNewStart === -1) {
          hunkNewStart = op.newIndex;
        }
        hunkLines.push({ type: "add", content: newLines[op.newIndex] });
        hunkNewCount++;
      }
    }

    // Convert to 1-based
    const oldStart = (hunkOldStart === -1 ? 0 : hunkOldStart) + 1;
    const newStart = (hunkNewStart === -1 ? 0 : hunkNewStart) + 1;

    hunks.push({
      index: ri,
      oldStart,
      oldLines: hunkOldCount,
      newStart,
      newLines: hunkNewCount,
      lines: hunkLines,
      status: "pending",
      header: `@@ -${oldStart},${hunkOldCount} +${newStart},${hunkNewCount} @@`,
    });
  }

  return hunks;
}

// ── Helpers ──────────────────────────────────────────────────

function splitLines(text: string): string[] {
  if (text === "") {
    return [];
  }
  // Split on newline, preserving the line structure
  return text.split(/\r?\n/);
}

function joinLines(lines: string[]): string {
  return lines.join("\n");
}
