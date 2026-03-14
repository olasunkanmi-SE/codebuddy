import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

// ─── Review Comment Model ────────────────────────────────

export type ReviewSeverity = "critical" | "moderate" | "minor" | "info";

export interface ReviewComment {
  /** 1-based absolute line number in the file. */
  line: number;
  /** Optional end line for multi-line ranges (1-based). */
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

/**
 * Shape expected from the LLM's REVIEW_COMMENTS JSON block.
 * Used to validate / narrow the parsed result before conversion.
 */
interface RawJsonComment {
  line: number;
  endLine?: number;
  severity?: string;
  title?: string;
  body?: string;
  message?: string;
  file?: string;
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
  private static instance: InlineReviewService | undefined;
  private static readonly MAX_THREADS = 500;

  private readonly commentController: vscode.CommentController;
  private threads: vscode.CommentThread[] = [];
  private readonly logger: Logger;
  private disposed = false;

  private constructor() {
    this.commentController = vscode.comments.createCommentController(
      "codebuddy-review",
      "CodeBuddy Code Review",
    );
    // Comments are read-only — no reply widget
    this.commentController.commentingRangeProvider = undefined;

    this.logger = Logger.initialize("InlineReviewService", {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): InlineReviewService {
    if (
      !InlineReviewService.instance ||
      InlineReviewService.instance.disposed
    ) {
      InlineReviewService.instance?.dispose();
      InlineReviewService.instance = new InlineReviewService();
    }
    return InlineReviewService.instance;
  }

  /** Called during extension deactivation or test teardown. */
  static resetInstance(): void {
    InlineReviewService.instance?.dispose();
    InlineReviewService.instance = undefined;
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

    const totalIncoming = fileReviews.reduce(
      (sum, f) => sum + f.comments.length,
      0,
    );
    if (totalIncoming > InlineReviewService.MAX_THREADS) {
      this.logger.warn(
        `[InlineReview] ${totalIncoming} comments exceed MAX_THREADS (${InlineReviewService.MAX_THREADS}). Showing first ${InlineReviewService.MAX_THREADS} only.`,
      );
    }

    let threadCount = 0;
    for (const fileReview of fileReviews) {
      if (threadCount >= InlineReviewService.MAX_THREADS) break;

      const uri = this.resolveUri(fileReview.filePath);
      if (!uri) {
        this.logger.warn(
          `[InlineReview] Could not resolve URI for "${fileReview.filePath}"`,
        );
        continue;
      }

      for (const comment of fileReview.comments) {
        if (threadCount >= InlineReviewService.MAX_THREADS) break;

        const startLine = Math.max(0, comment.line - 1); // 1-based → 0-based
        const endLine = comment.endLine
          ? Math.max(0, comment.endLine - 1)
          : startLine;

        const range = new vscode.Range(startLine, 0, endLine, 0);

        const thread = this.commentController.createCommentThread(uri, range, [
          {
            author: { name: "Code Review" },
            body: this.buildCommentMarkdown(comment),
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
        threadCount++;
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
    if (this.disposed) return;
    this.disposed = true;
    this.clearComments();
    this.commentController.dispose();
    if (InlineReviewService.instance === this) {
      InlineReviewService.instance = undefined;
    }
  }

  // ── Markdown Sanitization ──────────────────────────────

  /**
   * Build a safe MarkdownString from untrusted LLM content.
   * Strips VS Code command URIs and HTML to prevent injection.
   */
  private buildCommentMarkdown(comment: ReviewComment): vscode.MarkdownString {
    const sanitizedTitle = InlineReviewService.sanitizeMarkdown(comment.title);
    const sanitizedBody = InlineReviewService.sanitizeMarkdown(comment.body);
    const label = SEVERITY_LABEL[comment.severity] ?? "ℹ️ Info";

    const md = new vscode.MarkdownString(
      `**${label}** — ${sanitizedTitle}\n\n${sanitizedBody}`,
    );
    md.isTrusted = false;
    md.supportHtml = false;
    return md;
  }

  /**
   * Strip markdown command links and HTML from untrusted LLM content.
   * Preserves inline code, bold, italic, and standard links.
   */
  private static sanitizeMarkdown(input: string): string {
    return (
      input
        // Remove VS Code command URI links: [label](command:...)
        .replace(/\[([^\]]*)\]\(command:[^)]*\)/gi, "$1")
        // Remove bare command: URIs
        .replace(/command:[^\s)"']*/gi, "")
        // Strip raw HTML tags
        .replace(/<[^>]+>/g, "")
        // Limit length to prevent UI flooding
        .slice(0, 2000)
    );
  }

  // ── URI Resolution ─────────────────────────────────────

  private resolveUri(filePath: string): vscode.Uri | undefined {
    // Absolute paths (Unix and Windows)
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
   * 2. Fall back to section-aware regex heuristics that only extract
   *    line references from recognized "issues" sections.
   *
   * @param markdown    The full review response from the LLM.
   * @param filePath    The file that was reviewed (used when the LLM
   *                    doesn't explicitly state the file path).
   * @param lineOffset  0-based selection start line. The LLM reports 1-based
   *                    lines relative to the selection. To map back to the file:
   *                    `absolute_1based = llm_1based + lineOffset`.
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

    // ── Strategy 2: Section-aware regex heuristics ───────
    return InlineReviewService.extractFromMarkdown(
      markdown,
      filePath,
      lineOffset,
    );
  }

  /**
   * Look for ```json ... ``` block with a REVIEW_COMMENTS marker.
   */
  private static extractJsonBlock(markdown: string): RawJsonComment[] | null {
    const jsonPattern =
      /```json\s*\n\s*\/\/\s*REVIEW_COMMENTS\s*\n([\s\S]*?)```/i;
    const match = jsonPattern.exec(markdown);
    if (!match) return null;

    try {
      const parsed: unknown = JSON.parse(match[1]);
      if (!Array.isArray(parsed)) return null;
      // Basic structural validation
      return parsed.filter(
        (item: unknown): item is RawJsonComment =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as RawJsonComment).line === "number",
      );
    } catch {
      return null;
    }
  }

  /**
   * Validate and normalise JSON-parsed review comment objects.
   */
  private static normalizeJsonComments(
    raw: RawJsonComment[],
    defaultFilePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    const byFile = new Map<string, ReviewComment[]>();

    for (const item of raw) {
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

    return [...byFile.entries()].map(([fp, comments]) => ({
      filePath: fp,
      comments,
    }));
  }

  /**
   * Section-aware regex fallback: only extracts line references from
   * recognized "issues" sections (Critical, Moderate, Minor) and ignores
   * Strengths, Recommendations, Examples, and Learning Resources sections
   * to avoid false positives.
   */
  private static extractFromMarkdown(
    markdown: string,
    filePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    const comments: ReviewComment[] = [];

    const ISSUE_SECTION = /issue|problem|fix|bug|vulnerab|risk/i;
    const STOP_SECTION =
      /strength|learning|resource|diagram|example|recommendation|optimization|checklist/i;

    let inIssueSection = false;
    let currentSeverity: ReviewSeverity = "info";

    const lines = markdown.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section boundaries (H2/H3 headers)
      if (/^#{2,3}\s/.test(line)) {
        if (STOP_SECTION.test(line)) {
          inIssueSection = false;
          continue;
        }
        if (ISSUE_SECTION.test(line)) {
          inIssueSection = true;
        }
      }

      // Detect severity from emoji/keyword patterns anywhere
      if (/critical\s*issues?/i.test(line) || /🔴/u.test(line)) {
        currentSeverity = "critical";
        inIssueSection = true;
        continue;
      }
      if (/moderate\s*issues?/i.test(line) || /🟡/u.test(line)) {
        currentSeverity = "moderate";
        inIssueSection = true;
        continue;
      }
      if (/minor\s*issues?/i.test(line) || /🔵/u.test(line)) {
        currentSeverity = "minor";
        inIssueSection = true;
        continue;
      }
      if (/strengths/i.test(line) || /✅/u.test(line)) {
        inIssueSection = false;
        continue;
      }
      if (/optimization|recommendation/i.test(line) || /🚀|🎯/u.test(line)) {
        inIssueSection = false;
        continue;
      }

      // Only extract line references when inside a recognized issues section
      if (!inIssueSection) continue;

      // Match location patterns
      const locationMatch = line.match(
        /(?:\/\/\s*)?(?:Location:\s*)?[Ll]ines?\s+(\d+)(?:\s*[-–to]+\s*(\d+))?/,
      );
      if (!locationMatch) continue;

      // Require corroborating issue context within nearby lines
      const contextSlice = lines
        .slice(Math.max(0, i - 5), Math.min(lines.length, i + 5))
        .join("\n");
      if (
        !/issue|problem|fix|vulnerability|impact|benefit/i.test(contextSlice)
      ) {
        continue;
      }

      const startLine = parseInt(locationMatch[1], 10) + lineOffset;
      const endLine = locationMatch[2]
        ? parseInt(locationMatch[2], 10) + lineOffset
        : undefined;

      // Extract the issue title from the nearby "// Issue:" line
      let title = "Review Issue";
      let body = "";

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
