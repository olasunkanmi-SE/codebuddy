/**
 * Converts various LLM message content shapes into plain display text.
 *
 * Handles: raw strings, arrays of content blocks (text / tool_use /
 * tool_result), and single objects with `text` or `content` fields.
 * Tool-related blocks are stripped so only user-facing prose remains.
 */
export class ContentNormalizer {
  /** Non-display block types produced by LLMs. */
  private static readonly NON_DISPLAY_TYPES = new Set([
    "tool_use",
    "tool_result",
    "tool_call",
  ]);

  /**
   * Normalize arbitrary content into a plain display string.
   */
  normalize(content: unknown): string {
    if (content == null) return "";

    if (typeof content === "string") {
      return this.filterToolUseFromString(content);
    }

    if (Array.isArray(content)) {
      return content
        .map((item) => this.normalizeBlock(item))
        .filter(Boolean)
        .join("");
    }

    if (typeof content === "object") {
      return this.normalizeBlock(content);
    }

    return String(content);
  }

  // ── block-level helpers ──────────────────────────────────

  private normalizeBlock(block: unknown): string {
    if (block == null) return "";
    if (typeof block === "string") return this.filterToolUseFromString(block);

    if (typeof block === "object") {
      const obj = block as Record<string, unknown>;

      // Skip tool_use / tool_result / tool_call blocks entirely
      if (ContentNormalizer.NON_DISPLAY_TYPES.has(obj.type as string))
        return "";

      // Skip objects that look like tool metadata
      if (obj.name && obj.input) return "";

      if (typeof obj.text === "string") return obj.text;
      if (typeof obj.content === "string") return obj.content;

      return "";
    }

    return String(block);
  }

  // ── string-level tool-JSON stripping ─────────────────────

  /**
   * Remove embedded JSON tool_use / tool_call blocks from string content.
   * Uses structural JSON parsing instead of fragile regex patterns.
   * Optimized to use slice-based copying instead of character-by-character
   * iteration to avoid O(n²) performance on large responses.
   */
  filterToolUseFromString(text: string): string {
    if (!text) return "";

    const parts: string[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const braceIdx = text.indexOf("{", cursor);
      if (braceIdx === -1) {
        // No more braces; copy remaining text and exit
        parts.push(text.slice(cursor));
        break;
      }

      // Copy everything before the brace
      if (braceIdx > cursor) {
        parts.push(text.slice(cursor, braceIdx));
      }

      const jsonStr = this.extractBalancedJson(text, braceIdx);
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          if (this.isToolMetadata(parsed)) {
            // Skip the tool block entirely
            cursor = braceIdx + jsonStr.length;
            continue;
          }
        } catch {
          // Not valid JSON — keep as-is
        }
        // Valid JSON but not tool metadata, or invalid JSON — keep the block
        parts.push(jsonStr);
        cursor = braceIdx + jsonStr.length;
      } else {
        // Unbalanced brace — keep just the opening brace and move on
        parts.push("{");
        cursor = braceIdx + 1;
      }
    }

    return parts
      .join("")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /** Maximum characters to scan when looking for balanced JSON brackets. */
  private static readonly MAX_JSON_SCAN_CHARS = 10_000;

  private extractBalancedJson(text: string, start: number): string | null {
    if (text[start] !== "{") return null;

    // Cap the scan window to prevent slow scans on large LLM outputs
    const scanEnd = Math.min(
      text.length,
      start + ContentNormalizer.MAX_JSON_SCAN_CHARS,
    );
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < scanEnd; i++) {
      const ch = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    // Truncated or unbalanced — treat as not found
    return null;
  }

  private isToolMetadata(obj: unknown): boolean {
    if (typeof obj !== "object" || obj === null) return false;
    const o = obj as Record<string, unknown>;
    if (
      o.type === "tool_use" ||
      o.type === "tool_call" ||
      o.type === "tool_result"
    )
      return true;
    if (o.name && o.args) return true;
    if (o.command === "user-input") return true;
    if (typeof o.id === "string" && (o.id as string).startsWith("toolu_"))
      return true;
    return false;
  }
}
