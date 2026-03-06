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
   */
  filterToolUseFromString(text: string): string {
    if (!text) return "";

    let result = "";
    let i = 0;
    while (i < text.length) {
      if (text[i] === "{") {
        const jsonStr = this.extractBalancedJson(text, i);
        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr);
            if (this.isToolMetadata(parsed)) {
              i += jsonStr.length;
              continue;
            }
          } catch {
            // Not valid JSON — keep as-is
          }
        }
      }
      result += text[i];
      i++;
    }

    return result.replace(/\n{3,}/g, "\n\n").trim();
  }

  private extractBalancedJson(text: string, start: number): string | null {
    if (text[start] !== "{") return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
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
