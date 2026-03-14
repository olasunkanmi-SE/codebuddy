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
 * Snapshot of the editor state captured atomically before streaming.
 * Used to detect stale context after asynchronous operations.
 */
export interface ReviewContext {
  filePath: string;
  selectionStartLine: number;
  documentVersion: number;
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

/**
 * Read-only statistics exposed for testing without accessing private fields.
 */
export interface InlineReviewStats {
  threadCount: number;
}

// ─── Severity helpers ────────────────────────────────────

const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  critical: "🔴 Critical",
  moderate: "🟡 Moderate",
  minor: "🔵 Minor",
  info: "ℹ️ Info",
};

/** Exhaustive lookup table for severity normalization. */
const SEVERITY_MAP: Record<string, ReviewSeverity> = {
  critical: "critical",
  high: "critical",
  error: "critical",
  moderate: "moderate",
  medium: "moderate",
  warning: "moderate",
  minor: "minor",
  low: "minor",
  info: "info",
  hint: "info",
};

// ─── Line Classifier ─────────────────────────────────────

type LineClassification =
  | { type: "stop" }
  | { type: "severity"; severity: ReviewSeverity }
  | { type: "section_issue" }
  | { type: "content" };

const STOP_SECTION =
  /strength|learning|resource|diagram|example|recommendation|optimization|checklist/i;

function classifyLine(line: string): LineClassification {
  const isHeader = /^#{2,3}\s/.test(line);

  // Stop sections — strengths, learning, recommendations, etc.
  if (/strengths/i.test(line) || /✅/u.test(line)) {
    return { type: "stop" };
  }
  if (/optimization|recommendation/i.test(line) || /🚀|🎯/u.test(line)) {
    return { type: "stop" };
  }
  if (isHeader && STOP_SECTION.test(line)) {
    return { type: "stop" };
  }

  // Severity-carrying lines
  if (/critical\s*issues?/i.test(line) || /🔴/u.test(line)) {
    return { type: "severity", severity: "critical" };
  }
  if (/moderate\s*issues?/i.test(line) || /🟡/u.test(line)) {
    return { type: "severity", severity: "moderate" };
  }
  if (/minor\s*issues?/i.test(line) || /🔵/u.test(line)) {
    return { type: "severity", severity: "minor" };
  }

  // Generic issue section header without explicit severity
  if (isHeader && /issue|problem|fix|bug|vulnerab|risk/i.test(line)) {
    return { type: "section_issue" };
  }

  return { type: "content" };
}

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
   * Capture the current editor state atomically for use after streaming.
   * Returns undefined if no active editor is open.
   */
  static captureReviewContext(): ReviewContext | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;
    return {
      filePath: editor.document.uri.fsPath,
      selectionStartLine: editor.selection.start.line,
      documentVersion: editor.document.version,
    };
  }

  /**
   * Check whether the document has changed since the snapshot was taken.
   * Does NOT require the document to be the active editor — we just verify
   * the document version hasn't changed so line numbers are still valid.
   */
  static isContextStale(ctx: ReviewContext): boolean {
    // Try to find the document in open text documents
    const uri = vscode.Uri.file(ctx.filePath);
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.fsPath === uri.fsPath,
    );

    // If doc not open, we can still create comments (they'll open it)
    if (!doc) return false;

    // Only stale if the document version changed (edits were made)
    return doc.version !== ctx.documentVersion;
  }

  /**
   * Read-only statistics for testing and observability.
   */
  getStats(): InlineReviewStats {
    return { threadCount: this.threads.length };
  }

  /**
   * @internal Exposed for testing only. Do not use in production code.
   * Provides compile-time safe access to threads for assertions.
   */
  getThreads(): readonly vscode.CommentThread[] {
    return this.threads;
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
    let firstUri: vscode.Uri | undefined;
    let firstLine = 0;

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

        // Validate line number before use
        if (!Number.isInteger(comment.line) || comment.line < 1) {
          this.logger.warn(
            `[InlineReview] Skipping comment with invalid line: ${comment.line}`,
          );
          continue;
        }

        const startLine = comment.line - 1; // 1-based → 0-based (safe after validation)
        const endLine =
          comment.endLine != null && comment.endLine >= comment.line
            ? comment.endLine - 1
            : startLine;

        // Track first comment location to open file
        if (!firstUri) {
          firstUri = uri;
          firstLine = startLine;
        }

        const range = new vscode.Range(startLine, 0, endLine, 0);

        const thread = this.commentController.createCommentThread(uri, range, [
          {
            author: {
              name: "CodeBuddy",
              iconPath: this.getIconUri(),
            },
            body: this.buildCommentMarkdown(comment),
            mode: vscode.CommentMode.Preview,
          },
        ]);
        thread.canReply = false;
        thread.label = SEVERITY_LABEL[comment.severity];
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

    // Open file and reveal first comment without stealing focus
    if (firstUri && this.threads.length > 0) {
      try {
        // Check if file is already visible
        const isAlreadyVisible = vscode.window.visibleTextEditors.some(
          (e) => e.document.uri.fsPath === firstUri!.fsPath,
        );

        if (!isAlreadyVisible) {
          // Open in preview tab without stealing focus
          const doc = await vscode.workspace.openTextDocument(firstUri);
          await vscode.window.showTextDocument(doc, {
            preview: true,
            preserveFocus: true,
          });
        } else {
          // File already visible — scroll to first comment
          const editor = vscode.window.visibleTextEditors.find(
            (e) => e.document.uri.fsPath === firstUri!.fsPath,
          );
          if (editor) {
            const position = new vscode.Position(firstLine, 0);
            editor.revealRange(
              new vscode.Range(position, position),
              vscode.TextEditorRevealType.InCenter,
            );
          }
        }

        // Show non-blocking notification instead of forcing panel
        const action = await vscode.window.showInformationMessage(
          `CodeBuddy: ${this.threads.length} review comment(s) added.`,
          "Show Comments",
          "Dismiss",
        );
        if (action === "Show Comments") {
          await vscode.commands.executeCommand(
            "workbench.panel.comments.focus",
          );
        }
      } catch (err) {
        this.logger.warn(
          "[InlineReview] Failed to open file with comments",
          err,
        );
      }
    }
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

  // ── Branding ───────────────────────────────────────────

  private getIconUri(): vscode.Uri | undefined {
    const ext = vscode.extensions.getExtension(
      "fiatinnovations.ola-code-buddy",
    );
    if (!ext) return undefined;
    return vscode.Uri.joinPath(ext.extensionUri, "images", "codebuddylogo.svg");
  }

  // ── Markdown Sanitization ──────────────────────────────

  /**
   * Build a safe MarkdownString from untrusted LLM content.
   * Applies context-sensitive escaping: titles are inline-escaped
   * to prevent markdown structural breakout; bodies are block-sanitized.
   */
  private buildCommentMarkdown(comment: ReviewComment): vscode.MarkdownString {
    const label = SEVERITY_LABEL[comment.severity] ?? "ℹ️ Info";
    // Title is inline — escape structural chars to prevent breakout
    const safeTitle = InlineReviewService.escapeMarkdownStructure(
      InlineReviewService.sanitizeMarkdown(comment.title),
    );
    // Body is block-level — sanitize but allow markdown formatting
    const safeBody = InlineReviewService.sanitizeMarkdown(comment.body);

    const md = new vscode.MarkdownString(
      `**${label}** — ${safeTitle}\n\n${safeBody}`,
    );
    md.isTrusted = false;
    md.supportHtml = false;
    return md;
  }

  /**
   * Escape markdown structural characters in inline context
   * to prevent bold/link/heading breakout from untrusted titles.
   */
  private static escapeMarkdownStructure(input: string): string {
    return input
      .replace(/[*_`[\]()#]/g, "\\$&")
      .replace(/\n/g, " ")
      .slice(0, 500);
  }

  /**
   * Strip markdown command links and HTML from untrusted LLM content.
   * Truncation is applied FIRST (before stripping) to prevent an attacker
   * from padding past the limit and hiding malicious markup.
   */
  private static sanitizeMarkdown(input: string): string {
    return (
      input
        // Limit length FIRST to prevent padding attacks
        .slice(0, 5000)
        // Remove VS Code command URI links: [label](command:...)
        .replace(/\[([^\]]*)\]\(command:[^)]*\)/gi, "$1")
        // Remove bare command: URIs
        .replace(/command:[^\s)"']*/gi, "")
        // Strip raw HTML tags
        .replace(/<[^>]+>/g, "")
    );
  }

  // ── URI Resolution ─────────────────────────────────────

  private resolveUri(filePath: string): vscode.Uri | undefined {
    // Empty path — cannot resolve
    if (!filePath || !filePath.trim()) {
      return undefined;
    }

    const trimmed = filePath.trim();

    // Absolute paths (Unix and Windows) — validate within workspace for relative safety
    if (trimmed.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(trimmed)) {
      const normalizedPath = trimmed.replace(/\.\.\/|\.\.\\/g, ""); // Strip ../ traversal
      return vscode.Uri.file(normalizedPath);
    }

    // Reject obvious path traversal attempts in relative paths
    if (trimmed.includes("..")) {
      this.logger.warn(
        `[InlineReview] Rejecting path with traversal: ${trimmed}`,
      );
      return undefined;
    }

    // Relative to workspace root — check ALL folders, not just [0]
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of workspaceFolders) {
      const candidate = vscode.Uri.joinPath(folder.uri, trimmed);
      // Verify resolved path stays within workspace folder
      if (candidate.fsPath.startsWith(folder.uri.fsPath)) {
        return candidate;
      }
    }

    // No workspace — try to find matching open document by filename
    const fileName = trimmed.split(/[\\/]/).pop() ?? trimmed;
    const matchingDoc = vscode.workspace.textDocuments.find((doc) =>
      doc.uri.fsPath.endsWith(fileName),
    );
    if (matchingDoc) {
      return matchingDoc.uri;
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
   * Validate that a line number is a finite positive integer.
   * Returns the adjusted value (with offset) or null if invalid.
   */
  private static sanitizeLine(raw: number, offset: number): number | null {
    if (!Number.isFinite(raw) || raw < 1 || !Number.isInteger(raw)) {
      return null;
    }
    return Math.max(1, raw + offset);
  }

  /**
   * Validate and normalise JSON-parsed review comment objects.
   * If the JSON includes a `file` field, line numbers are assumed absolute.
   * Otherwise, lineOffset is applied to convert selection-relative to absolute.
   */
  private static normalizeJsonComments(
    raw: RawJsonComment[],
    defaultFilePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    const byFile = new Map<string, ReviewComment[]>();

    for (const item of raw) {
      // If LLM provided file path, lines are already absolute (no offset)
      // Otherwise, apply offset to convert selection-relative to absolute
      const hasExplicitFile = typeof item.file === "string" && item.file.trim();
      const effectiveOffset = hasExplicitFile ? 0 : lineOffset;

      const line = InlineReviewService.sanitizeLine(item.line, effectiveOffset);
      if (line === null) continue;

      const endLine =
        typeof item.endLine === "number"
          ? InlineReviewService.sanitizeLine(item.endLine, effectiveOffset)
          : undefined;

      // Validate endLine >= line
      const validatedEndLine =
        endLine !== undefined && endLine !== null && endLine >= line
          ? endLine
          : undefined;

      const fp = hasExplicitFile ? item.file!.trim() : defaultFilePath;

      const severity = InlineReviewService.normalizeSeverity(item.severity);
      const comment: ReviewComment = {
        line,
        endLine: validatedEndLine,
        severity,
        title:
          typeof item.title === "string" && item.title.trim()
            ? item.title.trim().slice(0, 500)
            : "Review Issue",
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
   * Section-aware regex fallback using classifyLine() for single-pass
   * header classification. Only extracts line references from recognized
   * "issues" sections and ignores Strengths, Recommendations, etc.
   */
  private static extractFromMarkdown(
    markdown: string,
    filePath: string,
    lineOffset = 0,
  ): FileReviewComments[] {
    const comments: ReviewComment[] = [];

    let inIssueSection = false;
    let currentSeverity: ReviewSeverity = "info";

    const lines = markdown.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Single-pass line classification
      const cls = classifyLine(line);
      if (cls.type !== "content") {
        if (cls.type === "stop") {
          inIssueSection = false;
        } else if (cls.type === "severity") {
          currentSeverity = cls.severity;
          inIssueSection = true;
        } else if (cls.type === "section_issue") {
          inIssueSection = true;
        }
        continue;
      }

      // Only extract line references when inside a recognized issues section
      if (!inIssueSection) continue;

      // Match location patterns — covers: Line 45, Lines 10-15, L45, line 45:, (line 45), at line 45
      const locationMatch = line.match(
        /(?:\/\/\s*Location:\s*|[Ll]ines?\s+|[Ll]\s*)(\d+)(?:\s*[-–—to]+\s*(\d+))?(?:[:\s,)]|$)/,
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

      // Collect body: gather next lines until we hit another location,
      // section header, or any fenced code block (with or without language tag)
      const bodyLines: string[] = [];
      for (let j = i + 1; j < lines.length && j <= i + 50; j++) {
        const nextLine = lines[j];
        if (
          /\/\/\s*Issue:/i.test(nextLine) ||
          /^#{2,}/u.test(nextLine) ||
          /^```/u.test(nextLine)
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

  /**
   * Normalize arbitrary severity strings to the ReviewSeverity union.
   * Uses an exhaustive lookup table for exact matches, then substring
   * matching for compound values like "critical-security".
   */
  private static normalizeSeverity(raw: unknown): ReviewSeverity {
    if (typeof raw !== "string") return "info";
    const lower = raw.toLowerCase().trim();

    // Exact match first — O(1)
    if (lower in SEVERITY_MAP) {
      return SEVERITY_MAP[lower];
    }

    // Substring match for compound values
    for (const [key, severity] of Object.entries(SEVERITY_MAP)) {
      if (lower.includes(key)) return severity;
    }

    return "info";
  }
}
