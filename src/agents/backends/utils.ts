/**
 * Shared utility functions for memory backend implementations.
 *
 * This module contains both user-facing string formatters and structured
 * helpers used by backends and the composite router. Structured helpers
 * enable composition without fragile string parsing.
 */

import micromatch from "micromatch";
import { basename } from "path";
import type { FileData, GrepMatch } from "deepagents";

// Constants
export const EMPTY_CONTENT_WARNING =
  "System reminder: File exists but has empty contents";
export const MAX_LINE_LENGTH = 10000;
export const LINE_NUMBER_WIDTH = 6;
export const TOOL_RESULT_TOKEN_LIMIT = 20000; // Same threshold as eviction
export const TRUNCATION_GUIDANCE =
  "... [results truncated, try being more specific with your parameters]";

/**
 * Sanitize tool_call_id to prevent path traversal and separator issues.
 *
 * Replaces dangerous characters (., /, \) with underscores.
 */
export function sanitizeToolCallId(toolCallId: string): string {
  return toolCallId.replace(/\./g, "_").replace(/\//g, "_").replace(/\\/g, "_");
}

/**
 * Format file content with line numbers (cat -n style).
 *
 * Chunks lines longer than MAX_LINE_LENGTH with continuation markers (e.g., 5.1, 5.2).
 *
 * @param content - File content as string or list of lines
 * @param startLine - Starting line number (default: 1)
 * @returns Formatted content with line numbers and continuation markers
 */
export function formatContentWithLineNumbers(
  content: string | string[],
  startLine = 1,
): string {
  let lines: string[];
  if (typeof content === "string") {
    lines = content.split("\n");
    if (lines.length > 0 && lines[lines.length - 1] === "") {
      lines = lines.slice(0, -1);
    }
  } else {
    lines = content;
  }

  const resultLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + startLine;

    if (line.length <= MAX_LINE_LENGTH) {
      resultLines.push(
        `${lineNum.toString().padStart(LINE_NUMBER_WIDTH)}\t${line}`,
      );
    } else {
      // Split long line into chunks with continuation markers
      const numChunks = Math.ceil(line.length / MAX_LINE_LENGTH);
      for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
        const start = chunkIdx * MAX_LINE_LENGTH;
        const end = Math.min(start + MAX_LINE_LENGTH, line.length);
        const chunk = line.substring(start, end);
        if (chunkIdx === 0) {
          // First chunk: use normal line number
          resultLines.push(
            `${lineNum.toString().padStart(LINE_NUMBER_WIDTH)}\t${chunk}`,
          );
        } else {
          // Continuation chunks: use decimal notation (e.g., 5.1, 5.2)
          const continuationMarker = `${lineNum}.${chunkIdx}`;
          resultLines.push(
            `${continuationMarker.padStart(LINE_NUMBER_WIDTH)}\t${chunk}`,
          );
        }
      }
    }
  }

  return resultLines.join("\n");
}

/**
 * Check if content is empty and return warning message.
 *
 * @param content - Content to check
 * @returns Warning message if empty, null otherwise
 */
export function checkEmptyContent(content: string): string | null {
  if (!content || content.trim() === "") {
    return EMPTY_CONTENT_WARNING;
  }
  return null;
}

/**
 * Convert FileData to plain string content.
 *
 * @param fileData - FileData object with 'content' key
 * @returns Content as string with lines joined by newlines
 */
export function fileDataToString(fileData: FileData): string {
  return fileData.content.join("\n");
}

/**
 * Create a FileData object with timestamps.
 *
 * @param content - File content as string
 * @param createdAt - Optional creation timestamp (ISO format)
 * @returns FileData object with content and timestamps
 */
export function createFileData(content: string, createdAt?: string): FileData {
  const lines = typeof content === "string" ? content.split("\n") : content;
  const now = new Date().toISOString();

  return {
    content: lines,
    created_at: createdAt || now,
    modified_at: now,
  };
}

/**
 * Update FileData with new content, preserving creation timestamp.
 *
 * @param fileData - Existing FileData object
 * @param content - New content as string
 * @returns Updated FileData object
 */
export function updateFileData(fileData: FileData, content: string): FileData {
  const lines = typeof content === "string" ? content.split("\n") : content;
  const now = new Date().toISOString();

  return {
    content: lines,
    created_at: fileData.created_at,
    modified_at: now,
  };
}

/**
 * Format file data for read response with line numbers.
 *
 * @param fileData - FileData object
 * @param offset - Line offset (0-indexed)
 * @param limit - Maximum number of lines
 * @returns Formatted content or error message
 */
export function formatReadResponse(
  fileData: FileData,
  offset: number,
  limit: number,
): string {
  const content = fileDataToString(fileData);
  const emptyMsg = checkEmptyContent(content);
  if (emptyMsg) {
    return emptyMsg;
  }

  const lines = content.split("\n");
  const startIdx = offset;
  const endIdx = Math.min(startIdx + limit, lines.length);

  if (startIdx >= lines.length) {
    return `Error: Line offset ${offset} exceeds file length (${lines.length} lines)`;
  }

  const selectedLines = lines.slice(startIdx, endIdx);
  return formatContentWithLineNumbers(selectedLines, startIdx + 1);
}

/**
 * Perform string replacement with occurrence validation.
 *
 * @param content - Original content
 * @param oldString - String to replace
 * @param newString - Replacement string
 * @param replaceAll - Whether to replace all occurrences
 * @returns Tuple of [new_content, occurrences] on success, or error message string
 *
 * Special case: When both content and oldString are empty, this sets the initial
 * content to newString. This allows editing empty files by treating empty oldString
 * as "set initial content" rather than "replace nothing".
 */
export function performStringReplacement(
  content: string,
  oldString: string,
  newString: string,
  replaceAll: boolean,
): [string, number] | string {
  // Special case: empty file with empty oldString sets initial content
  if (content === "" && oldString === "") {
    return [newString, 0];
  }

  // Validate that oldString is not empty (for non-empty files)
  if (oldString === "") {
    return "Error: oldString cannot be empty when file has content";
  }

  // Use split to count occurrences (simpler than regex)
  const occurrences = content.split(oldString).length - 1;

  if (occurrences === 0) {
    return `Error: String not found in file: '${oldString}'`;
  }

  if (occurrences > 1 && !replaceAll) {
    return `Error: String '${oldString}' appears ${occurrences} times in file. Use replace_all=True to replace all instances, or provide a more specific string with surrounding context.`;
  }

  // Python's str.replace() replaces ALL occurrences
  // Use split/join for consistent behavior
  const newContent = content.split(oldString).join(newString);

  return [newContent, occurrences];
}

/**
 * Truncate list or string result if it exceeds token limit (rough estimate: 4 chars/token).
 */
export function truncateIfTooLong(
  result: string[] | string,
): string[] | string {
  if (Array.isArray(result)) {
    const totalChars = result.reduce((sum, item) => sum + item.length, 0);
    if (totalChars > TOOL_RESULT_TOKEN_LIMIT * 4) {
      const truncateAt = Math.floor(
        (result.length * TOOL_RESULT_TOKEN_LIMIT * 4) / totalChars,
      );
      return [...result.slice(0, truncateAt), TRUNCATION_GUIDANCE];
    }
    return result;
  }
  // string
  if (result.length > TOOL_RESULT_TOKEN_LIMIT * 4) {
    return (
      result.substring(0, TOOL_RESULT_TOKEN_LIMIT * 4) +
      "\n" +
      TRUNCATION_GUIDANCE
    );
  }
  return result;
}

/**
 * Validate and normalize a directory path.
 *
 * Ensures paths are safe to use by preventing directory traversal attacks
 * and enforcing consistent formatting. All paths are normalized to use
 * forward slashes and start with a leading slash.
 *
 * This function is designed for virtual filesystem paths and rejects
 * Windows absolute paths (e.g., C:/..., F:/...) to maintain consistency
 * and prevent path format ambiguity.
 *
 * @param path - Path to validate
 * @returns Normalized path starting with / and ending with /
 * @throws Error if path is invalid
 *
 * @example
 * ```typescript
 * validatePath("foo/bar")  // Returns: "/foo/bar/"
 * validatePath("/./foo//bar")  // Returns: "/foo/bar/"
 * validatePath("../etc/passwd")  // Throws: Path traversal not allowed
 * validatePath("C:\\Users\\file")  // Throws: Windows absolute paths not supported
 * ```
 */
export function validatePath(path: string | null | undefined): string {
  const pathStr = path || "/";
  if (!pathStr || pathStr.trim() === "") {
    throw new Error("Path cannot be empty");
  }

  let normalized = pathStr.startsWith("/") ? pathStr : "/" + pathStr;

  if (!normalized.endsWith("/")) {
    normalized += "/";
  }

  return normalized;
}
