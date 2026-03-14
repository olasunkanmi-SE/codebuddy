import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

// ─── Review Comment Model ────────────────────────────────

export type ReviewSeverity = "critical" | "moderate" | "minor" | "info";

export interface ReviewComment {
  /** 1-based line number where the issue was found. */
  line: number;
  /** Optional end line for multi-line ranges. */
  endLine?: number;
  severity: ReviewSeverity;
  /** Short human-readable issue title. */
  title: string;
  /** Full comment body — may contain markdown. */
  body: string;
}

export interface FileReviewComments {
  /** Absolute or workspace-relative file path. */
  filePath: string;
  comments: ReviewComment[];
}

// ─── Severity helpers ────────────────────────────────────

const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  critical: "🔴 Critical",
  moderate: "🟡 Moderate",
  minor: "🔵 Minor",
  info: "ℹ️ Info",
};

// ─── Service ─────────────────────────────────────────────

/**
 * Displays code-review feedback as inline Comment threads
 * inside workspace files using the VS Code Comments API.
 *
 * Lifecycle: create the singleton once in extension activation,
 * call `showReviewComments()` after every review run, and
 * `clearComments()` when the user dismisses them.
 */
export class InlineReviewService implements vscode.Disposable {
  private static instance: InlineReviewService;

  private readonly commentController: vscode.CommentController;
  private threads: vscode.CommentThread[] = [];
  private readonly logger: Logger;

  private constructor() {
    this.commentController = vscode.comments.createCommentController(
      "codebuddy-review",
      "CodeBuddy Code Review",
    );
    // Comments are read-only — no reply widget
    this.commentController.commentingRangeProvider = undefined;

    this.logger = Logger.initialize("InlineReviewService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): InlineReviewService {
    if (!InlineReviewService.instance) {
      InlineReviewService.instance = new InlineReviewService();
    }
    return InlineReviewService.instance;
  }

  // ── Public API ─────────────────────────────────────────

  /**
   * Returns `true` if the user has enabled inline code-review comments.
   */
  static isEnabled(): boolean {
    return (
      vscode.workspace
        .getConfiguration("codebuddy.review")
        .get<boolean>("inlineComments", true) ?? true
    );
  }

  /**
   * Display review comments as VS Code comment threads.
   *
   * @param fileReviews  Parsed review data per file.
   * @param clearPrevious  Whether to dispose existing threads first (default: true).
   */
  async showReviewComments(
    fileReviews: FileReviewComments[],
    clearPrevious = true,
  ): Promise<void> {
    if (clearPrevious) {
      this.clearComments();
    }

    for (const fileReview of fileReviews) {
      const uri = this.resolveUri(fileReview.filePath);
      if (!uri) {
        this.logger.warn(
          `[InlineReview] Could not resolve URI for "${fileReview.filePath}"`,
        );
        continue;
      }

      for (const comment of fileReview.comments) {
        const startLine = Math.max(0, comment.line - 1); // VS Code is 0-based
        const endLine = comment.endLine
          ? Math.max(0, comment.endLine - 1)
          : startLine;

        const range = new vscode.Range(startLine, 0, endLine, 0);

        const thread = this.commentController.createCommentThread(uri, range, [
          {
            author: { name: "Code Review" },
            body: new vscode.MarkdownString(
              `**${SEVERITY_LABEL[comment.severity]}** — ${comment.title}\n\n${comment.body}`,
            ),
            mode: vscode.CommentMode.Preview,
          },
        ]);
        thread.canReply = false;
        thread.label = `${SEVERITY_LABEL[comment.severity]}`;
        thread.collapsibleState =
          comment.severity === "critical"
            ? vscode.CommentThreadCollapsibleState.Expanded
            : vscode.CommentThreadCollapsibleState.Collapsed;

        this.threads.push(thread);
      }
    }

    this.logger.info(
      `[InlineReview] Created ${this.threads.length} comment threads across ${fileReviews.length} file(s)`,
    );
  }

  /**
   * Remove all currently displayed review comment threads.
   */
  clearComments(): void {
    for (const thread of this.threads) {
      thread.dispose();
    }
    this.threads = [];
  }

  dispose(): void {
    this.clearComments();
    this.commentController.dispose();
  }

  // ── URI Resolution ─────────────────────────────────────

  private resolveUri(filePath: string): vscode.Uri | undefined {
    // Absolute paths
    if (filePath.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(filePath)) {
      return vscode.Uri.file(filePath);
    }

    // Relative to workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
    }

    return undefined;
  }

  // ── Markdown Parser ────────────────────────────────────

  /**
   * Parse a freeform LLM code-review markdown response into
   * structured review comments.
   *
   * Extraction strategy:
   * 1. First look for a fenced ```json block labelled REVIEW_COMMENTS
   *    (injected via the structured prompt addendum).
   * 2. Fall back to regex-based heuristics that match the patterns from
   *    the existing review prompt template (e.g. `// Location: Line 45-47`).
   *
   * @param markdown  The full review response from the LLM.
   * @param filePath  The file that was reviewed (used when the LLM
   *                  doesn't explicitly state the file path).
   * @param lineOffset  0-based line offset to add when the review was
   *                    performed on a selection (e.g. selection starts at line 50
   *                    → LLM's "Line 2" maps to file line 52).
   */
  static parseReviewMarkdown(
    markdown: string,
    filePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    // ── Strategy 1: Structured JSON block ────────────────
    const jsonComments = InlineReviewService.extractJsonBlock(markdown);
    if (jsonComments && jsonComments.length > 0) {
      return InlineReviewService.normalizeJsonComments(
        jsonComments,
        filePath,
        lineOffset,
      );
    }

    // ── Strategy 2: Regex heuristics ─────────────────────
    return InlineReviewService.extractFromMarkdown(
      markdown,
      filePath,
      lineOffset,
    );
  }

  /**
   * Look for ```json ... ``` block with a REVIEW_COMMENTS marker.
   */
  private static extractJsonBlock(markdown: string): any[] | null {
    const jsonPattern =
      /```json\s*\n\s*\/\/\s*REVIEW_COMMENTS\s*\n([\s\S]*?)```/i;
    const match = jsonPattern.exec(markdown);
    if (!match) return null;

    try {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate and normalise JSON-parsed review comment objects.
   */
  private static normalizeJsonComments(
    raw: any[],
    defaultFilePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    const byFile = new Map<string, ReviewComment[]>();

    for (const item of raw) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.line !== "number"
      ) {
        continue;
      }

      const fp = typeof item.file === "string" ? item.file : defaultFilePath;
      const severity = InlineReviewService.normalizeSeverity(item.severity);
      const comment: ReviewComment = {
        line: item.line + lineOffset,
        endLine:
          typeof item.endLine === "number"
            ? item.endLine + lineOffset
            : undefined,
        severity,
        title: typeof item.title === "string" ? item.title : "Review Issue",
        body:
          typeof item.body === "string"
            ? item.body
            : String(item.message ?? ""),
      };

      const existing = byFile.get(fp) ?? [];
      existing.push(comment);
      byFile.set(fp, existing);
    }

    return [...byFile.entries()].map(([filePath, comments]) => ({
      filePath,
      comments,
    }));
  }

  /**
   * Regex-based fallback: scans the markdown for patterns like
   * `// Location: Line 45` or `// Line 45-47` within issue blocks.
   */
  private static extractFromMarkdown(
    markdown: string,
    filePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    const comments: ReviewComment[] = [];

    // Detect current severity section
    let currentSeverity: ReviewSeverity = "info";

    const lines = markdown.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect severity sections
      if (/critical\s*issues?/i.test(line) || /🔴/u.test(line)) {
        currentSeverity = "critical";
        continue;
      }
      if (/moderate\s*issues?/i.test(line) || /🟡/u.test(line)) {
        currentSeverity = "moderate";
        continue;
      }
      if (/minor\s*issues?/i.test(line) || /🔵/u.test(line)) {
        currentSeverity = "minor";
        continue;
      }
      if (/strengths/i.test(line) || /✅/u.test(line)) {
        currentSeverity = "info";
        continue;
      }
      if (/optimization|recommendation/i.test(line) || /🚀|🎯/u.test(line)) {
        currentSeverity = "info";
        continue;
      }

      // Match location patterns
      // Patterns: "// Location: Line 45-47", "Line 45", "line 23-28", "Lines 10 to 15"
      const locationMatch = line.match(
        /(?:\/\/\s*)?(?:Location:\s*)?[Ll]ines?\s+(\d+)(?:\s*[-–to]+\s*(\d+))?/,
      );
      if (!locationMatch) continue;

      const startLine = parseInt(locationMatch[1], 10) + lineOffset;
      const endLine = locationMatch[2]
        ? parseInt(locationMatch[2], 10) + lineOffset
        : undefined;

      // Extract the issue title from the nearby "// Issue:" line
      let title = "Review Issue";
      let body = "";

      // Look backwards for "// Issue: ..." within 3 lines
      for (let j = Math.max(0, i - 3); j <= i; j++) {
        const issueLine = lines[j].match(/\/\/\s*Issue:\s*(.+)/i);
        if (issueLine) {
          title = issueLine[1].trim();
          break;
        }
      }

      // Collect body: gather next lines until we hit another location or section
      const bodyLines: string[] = [];
      for (let j = i + 1; j < lines.length && j <= i + 15; j++) {
        const nextLine = lines[j];
        // Stop at next issue, section, or empty code block end
        if (
          /\/\/\s*Issue:/i.test(nextLine) ||
          /^#{2,}/u.test(nextLine) ||
          /^```$/u.test(nextLine)
        ) {
          break;
        }
        if (nextLine.trim()) {
          bodyLines.push(nextLine);
        }
      }
      body = bodyLines.join("\n").trim();

      comments.push({
        line: startLine,
        endLine,
        severity: currentSeverity,
        title,
        body: body || title,
      });
    }

    if (comments.length === 0) {
      return [];
    }

    return [{ filePath, comments }];
  }

  private static normalizeSeverity(raw: unknown): ReviewSeverity {
    if (typeof raw !== "string") return "info";
    const lower = raw.toLowerCase();
    if (lower.includes("critical") || lower === "high" || lower === "error") {
      return "critical";
    }
    if (
      lower.includes("moderate") ||
      lower === "medium" ||
      lower === "warning"
    ) {
      return "moderate";
    }
    if (lower.includes("minor") || lower === "low" || lower === "info") {
      return "minor";
    }
    return "info";
  }
}
