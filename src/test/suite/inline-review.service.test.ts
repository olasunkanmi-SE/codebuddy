/**
 * InlineReviewService Tests
 *
 * Tests the inline code-review comment system: markdown parsing (JSON + regex),
 * severity normalization, sanitization, singleton lifecycle, URI resolution,
 * thread management, and MAX_THREADS enforcement.
 */

import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
  InlineReviewService,
  type FileReviewComments,
  type ReviewComment,
} from "../../services/inline-review.service";

// ── Helpers ──────────────────────────────────────────────

/** Build a valid REVIEW_COMMENTS JSON block. */
function jsonBlock(comments: unknown[]): string {
  return [
    "Some intro text...",
    "",
    "```json",
    "// REVIEW_COMMENTS",
    JSON.stringify(comments, null, 2),
    "```",
    "",
    "Some closing text...",
  ].join("\n");
}

/** Build a markdown review with issue sections and line references. */
function markdownReview(sections: {
  critical?: string[];
  moderate?: string[];
  minor?: string[];
  strengths?: string[];
}): string {
  const parts: string[] = [];
  if (sections.critical) {
    parts.push("## 🔴 Critical Issues");
    parts.push(...sections.critical);
  }
  if (sections.moderate) {
    parts.push("## 🟡 Moderate Issues");
    parts.push(...sections.moderate);
  }
  if (sections.minor) {
    parts.push("## 🔵 Minor Issues");
    parts.push(...sections.minor);
  }
  if (sections.strengths) {
    parts.push("## ✅ Strengths");
    parts.push(...sections.strengths);
  }
  return parts.join("\n");
}

const TEST_FILE = "/src/example.ts";

// ── parseReviewMarkdown — JSON Strategy ──────────────────

suite("InlineReviewService", () => {
  suite("parseReviewMarkdown — JSON block strategy", () => {
    test("parses a valid REVIEW_COMMENTS JSON block", () => {
      const md = jsonBlock([
        {
          line: 10,
          endLine: 12,
          severity: "critical",
          title: "SQL Injection",
          body: "Use parameterized queries.",
        },
        {
          line: 25,
          severity: "moderate",
          title: "N+1 query",
          body: "Batch the queries.",
        },
      ]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, TEST_FILE);
      assert.strictEqual(result[0].comments.length, 2);

      const c1 = result[0].comments[0];
      assert.strictEqual(c1.line, 10);
      assert.strictEqual(c1.endLine, 12);
      assert.strictEqual(c1.severity, "critical");
      assert.strictEqual(c1.title, "SQL Injection");
      assert.strictEqual(c1.body, "Use parameterized queries.");

      const c2 = result[0].comments[1];
      assert.strictEqual(c2.line, 25);
      assert.strictEqual(c2.endLine, undefined);
      assert.strictEqual(c2.severity, "moderate");
    });

    test("applies lineOffset to JSON block comments", () => {
      const md = jsonBlock([
        { line: 5, endLine: 8, severity: "minor", title: "Style", body: "Fix indentation." },
      ]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE, 50);
      assert.strictEqual(result[0].comments[0].line, 55);
      assert.strictEqual(result[0].comments[0].endLine, 58);
    });

    test("groups comments by file when 'file' field is present", () => {
      const md = jsonBlock([
        { line: 1, severity: "minor", title: "A", body: "a", file: "/src/a.ts" },
        { line: 2, severity: "minor", title: "B", body: "b", file: "/src/b.ts" },
        { line: 3, severity: "minor", title: "C", body: "c", file: "/src/a.ts" },
      ]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 2);

      const fileA = result.find((r) => r.filePath === "/src/a.ts");
      const fileB = result.find((r) => r.filePath === "/src/b.ts");
      assert.ok(fileA);
      assert.ok(fileB);
      assert.strictEqual(fileA!.comments.length, 2);
      assert.strictEqual(fileB!.comments.length, 1);
    });

    test("uses default filePath when 'file' field is absent", () => {
      const md = jsonBlock([
        { line: 1, severity: "minor", title: "A", body: "a" },
      ]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].filePath, TEST_FILE);
    });

    test("uses 'message' field as fallback when 'body' is absent", () => {
      const md = jsonBlock([
        { line: 1, severity: "minor", title: "T", message: "fallback message" },
      ]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].body, "fallback message");
    });

    test("defaults title to 'Review Issue' when absent", () => {
      const md = jsonBlock([{ line: 1, severity: "minor", body: "b" }]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].title, "Review Issue");
    });

    test("filters out objects without a numeric 'line' field", () => {
      const md = jsonBlock([
        { line: 10, severity: "minor", title: "Valid", body: "ok" },
        { severity: "critical", title: "NoLine", body: "missing" },
        { line: "not-a-number", severity: "minor", title: "Bad", body: "bad" },
        "just a string",
        null,
      ]);

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments.length, 1);
      assert.strictEqual(result[0].comments[0].title, "Valid");
    });

    test("returns empty array for malformed JSON", () => {
      const md = [
        "```json",
        "// REVIEW_COMMENTS",
        "{ this is not valid json }",
        "```",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("returns empty array when JSON block is a non-array", () => {
      const md = [
        "```json",
        "// REVIEW_COMMENTS",
        '{"line": 1, "severity": "minor", "title": "T", "body": "b"}',
        "```",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("returns empty for an empty JSON array", () => {
      const md = jsonBlock([]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });
  });

  // ── parseReviewMarkdown — Severity Normalization ───────

  suite("parseReviewMarkdown — severity normalization", () => {
    const severityCases: Array<[string, string]> = [
      ["critical", "critical"],
      ["CRITICAL", "critical"],
      ["high", "critical"],
      ["error", "critical"],
      ["moderate", "moderate"],
      ["medium", "moderate"],
      ["warning", "moderate"],
      ["minor", "minor"],
      ["low", "minor"],
      ["info", "info"],
      ["hint", "info"],
      ["unknown-value", "info"],
    ];

    severityCases.forEach(([input, expected]) => {
      test(`severity "${input}" → "${expected}"`, () => {
        const md = jsonBlock([
          { line: 1, severity: input, title: "T", body: "b" },
        ]);
        const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
        assert.strictEqual(result[0].comments[0].severity, expected);
      });
    });

    test("non-string severity defaults to 'info'", () => {
      const md = jsonBlock([
        { line: 1, severity: 42, title: "T", body: "b" },
      ]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].severity, "info");
    });

    test("missing severity defaults to 'info'", () => {
      const md = jsonBlock([{ line: 1, title: "T", body: "b" }]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].severity, "info");
    });
  });

  // ── parseReviewMarkdown — Regex Fallback Strategy ──────

  suite("parseReviewMarkdown — regex fallback strategy", () => {
    test("extracts issues from a critical section with line references", () => {
      const md = markdownReview({
        critical: [
          "// Issue: Missing input validation",
          "// Location: Line 45",
          "This is a vulnerability that needs fixing.",
          "Impact: High risk of injection attacks.",
        ],
      });

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].comments.length, 1);
      assert.strictEqual(result[0].comments[0].severity, "critical");
      assert.strictEqual(result[0].comments[0].line, 45);
      assert.strictEqual(result[0].comments[0].title, "Missing input validation");
    });

    test("extracts line ranges (e.g. Line 10-15)", () => {
      const md = markdownReview({
        moderate: [
          "// Issue: Duplicated logic",
          "// Location: Lines 10-15",
          "This is a problem that should be fixed.",
        ],
      });

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].line, 10);
      assert.strictEqual(result[0].comments[0].endLine, 15);
    });

    test("applies lineOffset in regex fallback", () => {
      const md = markdownReview({
        critical: [
          "// Issue: Bug fix needed",
          "// Location: Line 5",
          "This issue impacts the system.",
        ],
      });

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE, 100);
      assert.strictEqual(result[0].comments[0].line, 105);
    });

    test("does NOT extract from Strengths section", () => {
      const md = markdownReview({
        strengths: [
          "Good error handling at Line 20",
          "Well structured code is a benefit.",
        ],
      });

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("does NOT extract from non-issue sections", () => {
      const md = [
        "## 🚀 Optimization Recommendations",
        "// Issue: Could be faster",
        "// Location: Line 30",
        "This could impact performance.",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("stops extracting when entering a stop section", () => {
      const md = [
        "## 🔴 Critical Issues",
        "// Issue: Real problem",
        "// Location: Line 10",
        "This is a vulnerability.",
        "",
        "## ✅ Strengths",
        "// Issue: Not a real issue",
        "// Location: Line 50",
        "This would be a false positive.",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].comments.length, 1);
      assert.strictEqual(result[0].comments[0].line, 10);
    });

    test("tracks severity across multiple issue sections", () => {
      const md = [
        "## 🔴 Critical Issues",
        "// Issue: Critical bug",
        "// Location: Line 10",
        "This impacts security.",
        "",
        "## 🟡 Moderate Issues",
        "// Issue: Moderate bug",
        "// Location: Line 20",
        "This is a problem too.",
        "",
        "## 🔵 Minor Issues",
        "// Issue: Minor style",
        "// Location: Line 30",
        "Fix this issue.",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments.length, 3);
      assert.strictEqual(result[0].comments[0].severity, "critical");
      assert.strictEqual(result[0].comments[1].severity, "moderate");
      assert.strictEqual(result[0].comments[2].severity, "minor");
    });

    test("returns empty array when markdown has no issues", () => {
      const md = "This is a great piece of code with no issues!";
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("requires corroborating issue context near the line reference", () => {
      // Line references without nearby issue/problem/fix/vulnerability/impact/benefit
      // keywords should not be extracted. We place the line reference far enough
      // from any keyword-bearing header so it falls outside the 5-line window.
      const md = [
        "## 🔴 Critical Issues",
        "",
        "No issues were found in this review. The code looks clean.",
        "",
        "",
        "",
        "",
        "",
        "",
        "// Location: Line 42",
        "",
        "Everything looks fine here, no concerns.",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("recognises H3 issue headers", () => {
      const md = [
        "### Bug Fixes Needed",
        "// Issue: Off-by-one",
        "// Location: Line 7",
        "This is a problem in the loop.",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].comments[0].line, 7);
    });
  });

  // ── parseReviewMarkdown — JSON takes priority over regex ─

  suite("parseReviewMarkdown — strategy priority", () => {
    test("JSON block takes precedence over regex heuristics", () => {
      const md = [
        "## 🔴 Critical Issues",
        "// Issue: Regex would find this",
        "// Location: Line 99",
        "This is a vulnerability from regex.",
        "",
        "```json",
        "// REVIEW_COMMENTS",
        JSON.stringify([
          { line: 1, severity: "minor", title: "From JSON", body: "json body" },
        ]),
        "```",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].comments.length, 1);
      assert.strictEqual(result[0].comments[0].title, "From JSON");
      assert.strictEqual(result[0].comments[0].line, 1);
    });
  });

  // ── Singleton lifecycle ────────────────────────────────

  suite("singleton lifecycle", () => {
    teardown(() => {
      InlineReviewService.resetInstance();
    });

    test("getInstance returns the same instance on repeated calls", () => {
      const a = InlineReviewService.getInstance();
      const b = InlineReviewService.getInstance();
      assert.strictEqual(a, b);
    });

    test("resetInstance clears the singleton", () => {
      const a = InlineReviewService.getInstance();
      InlineReviewService.resetInstance();
      const b = InlineReviewService.getInstance();
      assert.notStrictEqual(a, b);
    });

    test("getInstance recreates after dispose", () => {
      const a = InlineReviewService.getInstance();
      a.dispose();
      const b = InlineReviewService.getInstance();
      assert.notStrictEqual(a, b);
    });

    test("dispose is idempotent", () => {
      const a = InlineReviewService.getInstance();
      a.dispose();
      a.dispose(); // should not throw
    });

    test("resetInstance is safe when no instance exists", () => {
      InlineReviewService.resetInstance();
      InlineReviewService.resetInstance(); // should not throw
    });
  });

  // ── isEnabled ──────────────────────────────────────────

  suite("isEnabled", () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
      sandbox = sinon.createSandbox();
    });

    teardown(() => {
      sandbox.restore();
    });

    test("returns true when setting is true", () => {
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox.stub().returns(true),
      } as any);
      assert.strictEqual(InlineReviewService.isEnabled(), true);
    });

    test("returns false when setting is false", () => {
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox.stub().returns(false),
      } as any);
      assert.strictEqual(InlineReviewService.isEnabled(), false);
    });

    test("defaults to true when setting is undefined", () => {
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox.stub().returns(undefined),
      } as any);
      assert.strictEqual(InlineReviewService.isEnabled(), true);
    });
  });

  // ── showReviewComments ─────────────────────────────────

  suite("showReviewComments", () => {
    let service: InlineReviewService;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
      sandbox = sinon.createSandbox();
      service = InlineReviewService.getInstance();
    });

    teardown(() => {
      InlineReviewService.resetInstance();
      sandbox.restore();
    });

    test("creates comment threads for review comments", async () => {
      const fileReviews: FileReviewComments[] = [
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 10, severity: "critical", title: "Bug", body: "Fix this" },
            { line: 20, severity: "minor", title: "Style", body: "Refactor" },
          ],
        },
      ];

      await service.showReviewComments(fileReviews);

      assert.strictEqual(service.getStats().threadCount, 2);
    });

    test("critical threads are expanded, others collapsed", async () => {
      const fileReviews: FileReviewComments[] = [
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 10, severity: "critical", title: "Bug", body: "Fix" },
            { line: 20, severity: "moderate", title: "Warn", body: "Check" },
            { line: 30, severity: "minor", title: "Info", body: "Note" },
          ],
        },
      ];

      await service.showReviewComments(fileReviews);

      // Verify count via public API
      assert.strictEqual(service.getStats().threadCount, 3);
      // Verify collapsible state via internal (thread behavior)
      const threads = service.getThreads();
      assert.strictEqual(
        threads[0].collapsibleState,
        vscode.CommentThreadCollapsibleState.Expanded,
      );
      assert.strictEqual(
        threads[1].collapsibleState,
        vscode.CommentThreadCollapsibleState.Collapsed,
      );
      assert.strictEqual(
        threads[2].collapsibleState,
        vscode.CommentThreadCollapsibleState.Collapsed,
      );
    });

    test("clearPrevious=true disposes existing threads before creating new ones", async () => {
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "A", body: "a" },
            { line: 2, severity: "minor", title: "B", body: "b" },
          ],
        },
      ]);
      assert.strictEqual(service.getStats().threadCount, 2);

      await service.showReviewComments(
        [
          {
            filePath: "/src/test.ts",
            comments: [{ line: 5, severity: "minor", title: "C", body: "c" }],
          },
        ],
        true,
      );
      assert.strictEqual(service.getStats().threadCount, 1);
    });

    test("clearPrevious=false preserves existing threads", async () => {
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [{ line: 1, severity: "minor", title: "A", body: "a" }],
        },
      ]);

      await service.showReviewComments(
        [
          {
            filePath: "/src/test.ts",
            comments: [{ line: 5, severity: "minor", title: "B", body: "b" }],
          },
        ],
        false,
      );
      assert.strictEqual(service.getStats().threadCount, 2);
    });

    test("maps 1-based line numbers to 0-based ranges", async () => {
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "T", body: "b" },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      // line 1 → 0-based startLine 0
      assert.strictEqual(thread.range.start.line, 0);
    });

    test("handles endLine in ranges", async () => {
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 10, endLine: 15, severity: "minor", title: "T", body: "b" },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      assert.strictEqual(thread.range.start.line, 9);
      assert.strictEqual(thread.range.end.line, 14);
    });

    test("skips files with unresolvable URIs", async () => {
      // Stub workspace folders to return empty — relative paths won't resolve
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);

      await service.showReviewComments([
        {
          filePath: "relative/path.ts",
          comments: [
            { line: 1, severity: "minor", title: "T", body: "b" },
          ],
        },
      ]);

      assert.strictEqual(service.getStats().threadCount, 0);
    });

    test("sets canReply to false on all threads", async () => {
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "T", body: "b" },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      assert.strictEqual(thread.canReply, false);
    });
  });

  // ── clearComments ──────────────────────────────────────

  suite("clearComments", () => {
    teardown(() => {
      InlineReviewService.resetInstance();
    });

    test("disposes all threads and empties the array", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "A", body: "a" },
            { line: 2, severity: "minor", title: "B", body: "b" },
          ],
        },
      ]);

      assert.strictEqual(service.getStats().threadCount, 2);
      service.clearComments();
      assert.strictEqual(service.getStats().threadCount, 0);
    });

    test("is safe to call when no threads exist", () => {
      const service = InlineReviewService.getInstance();
      service.clearComments(); // should not throw
      assert.strictEqual(service.getStats().threadCount, 0);
    });
  });

  // ── sanitizeMarkdown (tested via buildCommentMarkdown) ─

  suite("markdown sanitization", () => {
    teardown(() => {
      InlineReviewService.resetInstance();
    });

    test("strips command URI links from comment body", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            {
              line: 1,
              severity: "critical",
              title: "XSS test",
              body: 'Click [here](command:workbench.action.terminal.new) to hack',
            },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      const mdContent = thread.comments[0].body.value;
      assert.ok(!mdContent.includes("command:"), "command URI should be stripped");
      assert.ok(mdContent.includes("here"), "link label should be preserved");
    });

    test("strips bare command URIs", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            {
              line: 1,
              severity: "minor",
              title: "Test",
              body: "Run command:workbench.action.files.save to save",
            },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      const mdContent = thread.comments[0].body.value;
      assert.ok(!mdContent.includes("command:"), "bare command URI should be stripped");
    });

    test("strips HTML tags from comment content", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            {
              line: 1,
              severity: "minor",
              title: "Test",
              body: '<script>alert("xss")</script>Real content',
            },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      const mdContent = thread.comments[0].body.value;
      assert.ok(!mdContent.includes("<script>"), "HTML tags should be stripped");
      assert.ok(mdContent.includes("Real content"), "text content preserved");
    });

    test("truncates excessively long content", async () => {
      const service = InlineReviewService.getInstance();
      const longBody = "x".repeat(6000);
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "Long", body: longBody },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      const mdContent = thread.comments[0].body.value;
      // Body is capped at 5000 + header text
      assert.ok(mdContent.length < 5500, "content should be truncated");
    });

    test("sets isTrusted=false and supportHtml=false", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "T", body: "b" },
          ],
        },
      ]);

      const thread = (service as any).threads[0];
      const md = thread.comments[0].body;
      assert.strictEqual(md.isTrusted, false);
      assert.strictEqual(md.supportHtml, false);
    });
  });

  // ── MAX_THREADS enforcement ────────────────────────────

  suite("MAX_THREADS enforcement", () => {
    teardown(() => {
      InlineReviewService.resetInstance();
    });

    test("caps threads at MAX_THREADS limit", async () => {
      const service = InlineReviewService.getInstance();
      const comments: ReviewComment[] = [];
      for (let i = 1; i <= 600; i++) {
        comments.push({
          line: i,
          severity: "minor",
          title: `Issue ${i}`,
          body: `Body ${i}`,
        });
      }

      await service.showReviewComments([
        { filePath: "/src/test.ts", comments },
      ]);

      assert.strictEqual(service.getStats().threadCount, 500);
    });

    test("caps across multiple files", async () => {
      const service = InlineReviewService.getInstance();
      const makeComments = (count: number): ReviewComment[] =>
        Array.from({ length: count }, (_, i) => ({
          line: i + 1,
          severity: "minor" as const,
          title: `Issue ${i}`,
          body: `Body ${i}`,
        }));

      await service.showReviewComments([
        { filePath: "/src/a.ts", comments: makeComments(300) },
        { filePath: "/src/b.ts", comments: makeComments(300) },
      ]);

      assert.strictEqual(service.getStats().threadCount, 500);
    });
  });

  // ── URI resolution ─────────────────────────────────────

  suite("URI resolution", () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
      sandbox = sinon.createSandbox();
    });

    teardown(() => {
      InlineReviewService.resetInstance();
      sandbox.restore();
    });

    test("resolves absolute Unix paths", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/home/user/project/file.ts",
          comments: [{ line: 1, severity: "minor", title: "T", body: "b" }],
        },
      ]);

      assert.strictEqual(service.getStats().threadCount, 1);
    });

    test("resolves relative paths when workspace folder exists", async () => {
      const mockUri = vscode.Uri.file("/workspace/root");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([
        { uri: mockUri, name: "root", index: 0 },
      ]);

      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "src/file.ts",
          comments: [{ line: 1, severity: "minor", title: "T", body: "b" }],
        },
      ]);

      assert.strictEqual(service.getStats().threadCount, 1);
    });

    test("returns undefined for relative paths without a workspace folder", async () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);

      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "src/file.ts",
          comments: [{ line: 1, severity: "minor", title: "T", body: "b" }],
        },
      ]);

      assert.strictEqual(service.getStats().threadCount, 0);
    });
  });

  // ── Edge cases ─────────────────────────────────────────

  suite("edge cases", () => {
    test("empty markdown returns empty array", () => {
      const result = InlineReviewService.parseReviewMarkdown("", TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("handles markdown with only a JSON block marker but no content", () => {
      const md = "```json\n// REVIEW_COMMENTS\n```";
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("handles REVIEW_COMMENTS marker case-insensitively", () => {
      const md = [
        "```json",
        "// review_comments",
        JSON.stringify([
          { line: 1, severity: "minor", title: "T", body: "b" },
        ]),
        "```",
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
    });

    test("line 0 is rejected as invalid", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [{ line: 0, severity: "minor", title: "T", body: "b" }],
        },
      ]);
      // Line 0 is invalid (1-based), so no threads should be created
      assert.strictEqual(service.getStats().threadCount, 0);
      InlineReviewService.resetInstance();
    });

    test("negative line is rejected as invalid", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [{ line: -5, severity: "minor", title: "T", body: "b" }],
        },
      ]);
      // Negative line is invalid, so no threads should be created
      assert.strictEqual(service.getStats().threadCount, 0);
      InlineReviewService.resetInstance();
    });
  });

  // ── Line validation (normalizeJsonComments) ────────────

  suite("line validation", () => {
    test("skips comments with non-integer line (float)", () => {
      const md = jsonBlock([
        { line: 5.7, severity: "minor", title: "Float", body: "b" },
      ]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("skips comments with line < 1", () => {
      const md = jsonBlock([
        { line: 0, severity: "minor", title: "Zero", body: "b" },
        { line: -3, severity: "minor", title: "Neg", body: "b" },
      ]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("skips comments with Infinity line", () => {
      const md = jsonBlock([
        { line: Infinity, severity: "minor", title: "Inf", body: "b" },
      ]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 0);
    });

    test("validates endLine >= line", () => {
      const md = jsonBlock([
        { line: 10, endLine: 5, severity: "minor", title: "T", body: "b" },
      ]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].endLine, undefined);
    });
  });

  // ── Body truncation ────────────────────────────────────

  suite("body completeness", () => {
    test("preserves long comment bodies from JSON block", () => {
      const longBody = "This is a detailed explanation.\n".repeat(100);
      const md = jsonBlock([
        { line: 1, severity: "minor", title: "T", body: longBody },
      ]);
      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result[0].comments[0].body, longBody);
    });

    test("regex fallback collects up to 50 lines of body", () => {
      const bodyLines = Array.from(
        { length: 45 },
        (_, i) => `Detail line ${i + 1} about this issue`,
      );
      const md = [
        "## 🔴 Critical Issues",
        "// Issue: Complex problem",
        "// Location: Line 10",
        ...bodyLines,
      ].join("\n");

      const result = InlineReviewService.parseReviewMarkdown(md, TEST_FILE);
      assert.strictEqual(result.length, 1);
      const body = result[0].comments[0].body;
      // All 45 body lines should be captured (within the 50-line limit)
      assert.ok(body.includes("Detail line 1"), "first line preserved");
      assert.ok(body.includes("Detail line 45"), "last line preserved");
    });

    test("title escaping preserves informative content", async () => {
      const service = InlineReviewService.getInstance();
      const longTitle =
        "Missing input validation in `processUserData()` function allows SQL injection";
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [{ line: 1, severity: "critical", title: longTitle, body: "b" }],
        },
      ]);
      const thread = (service as any).threads[0];
      const mdContent = thread.comments[0].body.value;
      assert.ok(
        mdContent.includes("Missing input validation"),
        "title substance should be preserved",
      );
      InlineReviewService.resetInstance();
    });
  });

  // ── Branding ───────────────────────────────────────────

  suite("comment branding", () => {
    teardown(() => {
      InlineReviewService.resetInstance();
    });

    test("comment author name is CodeBuddy", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "T", body: "b" },
          ],
        },
      ]);
      const thread = (service as any).threads[0];
      assert.strictEqual(thread.comments[0].author.name, "CodeBuddy");
    });
  });

  // ── getStats ───────────────────────────────────────────

  suite("getStats", () => {
    teardown(() => {
      InlineReviewService.resetInstance();
    });

    test("returns 0 when no threads exist", () => {
      const service = InlineReviewService.getInstance();
      assert.strictEqual(service.getStats().threadCount, 0);
    });

    test("returns correct count after showing comments", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [
            { line: 1, severity: "minor", title: "A", body: "a" },
            { line: 2, severity: "minor", title: "B", body: "b" },
            { line: 3, severity: "minor", title: "C", body: "c" },
          ],
        },
      ]);
      assert.strictEqual(service.getStats().threadCount, 3);
    });

    test("returns 0 after clearing", async () => {
      const service = InlineReviewService.getInstance();
      await service.showReviewComments([
        {
          filePath: "/src/test.ts",
          comments: [{ line: 1, severity: "minor", title: "A", body: "a" }],
        },
      ]);
      service.clearComments();
      assert.strictEqual(service.getStats().threadCount, 0);
    });
  });
});
