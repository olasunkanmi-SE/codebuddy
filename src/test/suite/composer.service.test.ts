import * as assert from "assert";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { ComposerService, FileEdit } from "../../services/composer.service";
import { DiffReviewService } from "../../services/diff-review.service";

suite("ComposerService", () => {
  let service: ComposerService;
  let tmpDir: string;

  suiteSetup(() => {
    // Create temp directory for test files
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "composer-test-"));
  });

  setup(() => {
    // Force fresh singleton for isolation
    (ComposerService as any).instance = undefined;
    service = ComposerService.getInstance();
  });

  suiteTeardown(() => {
    // Clean up temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  // Helper to create a temp file with content
  function createTempFile(name: string, content: string): string {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, "utf8");
    return filePath;
  }

  // -----------------------------------------------------------------------
  // Singleton
  // -----------------------------------------------------------------------
  suite("singleton", () => {
    test("returns the same instance", () => {
      const a = ComposerService.getInstance();
      const b = ComposerService.getInstance();
      assert.strictEqual(a, b);
    });
  });

  // -----------------------------------------------------------------------
  // createSession
  // -----------------------------------------------------------------------
  suite("createSession", () => {
    test("creates a session with given label", async () => {
      const fp = createTempFile("a.ts", "const x = 1;");
      const edits: FileEdit[] = [
        { filePath: fp, mode: "overwrite", content: "const x = 2;" },
      ];
      const { session, errors } = await service.createSession(
        "Add feature A",
        edits,
      );

      assert.ok(session.id.startsWith("composer-"));
      assert.strictEqual(session.label, "Add feature A");
      assert.strictEqual(session.status, "active");
      assert.strictEqual(session.changeIds.length, 1);
      assert.strictEqual(errors.length, 0);
    });

    test("creates multiple pending changes for multiple edits", async () => {
      const fpA = createTempFile("m1.ts", "a");
      const fpB = createTempFile("m2.ts", "b");
      const fpC = createTempFile("m3.ts", "c");

      const edits: FileEdit[] = [
        { filePath: fpA, mode: "overwrite", content: "a2" },
        { filePath: fpB, mode: "overwrite", content: "b2" },
        { filePath: fpC, mode: "overwrite", content: "c2" },
      ];
      const { session, errors } = await service.createSession(
        "Multi edit",
        edits,
      );

      assert.strictEqual(session.changeIds.length, 3);
      assert.strictEqual(errors.length, 0);
    });

    test("reports error for replace mode with missing search", async () => {
      const fp = createTempFile("bad.ts", "test");
      const edits: FileEdit[] = [
        { filePath: fp, mode: "replace", content: "x" },
      ];
      const { session, errors } = await service.createSession(
        "Bad replace",
        edits,
      );

      assert.strictEqual(session.changeIds.length, 0);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes("search"));
    });

    test("handles replace mode with valid search/replace", async () => {
      const fp = createTempFile("rep.ts", "hello world");
      const edits: FileEdit[] = [
        {
          filePath: fp,
          mode: "replace",
          search: "hello",
          replace: "goodbye",
        },
      ];
      const { session, errors } = await service.createSession(
        "Replace edit",
        edits,
      );

      assert.strictEqual(session.changeIds.length, 1);
      assert.strictEqual(errors.length, 0);
    });

    test("replace mode reports error when search text not found", async () => {
      const fp = createTempFile("miss.ts", "hello world");
      const edits: FileEdit[] = [
        {
          filePath: fp,
          mode: "replace",
          search: "notfound",
          replace: "x",
        },
      ];
      const { session, errors } = await service.createSession(
        "Miss search",
        edits,
      );

      assert.strictEqual(session.changeIds.length, 0);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes("not found"));
    });

    test("partial failure: some edits succeed, some fail", async () => {
      const fpA = createTempFile("p1.ts", "ok");
      const fpB = createTempFile("p2.ts", "content");
      const fpC = createTempFile("p3.ts", "also ok");

      const edits: FileEdit[] = [
        { filePath: fpA, mode: "overwrite", content: "ok2" },
        { filePath: fpB, mode: "replace", content: "missing search" },
        { filePath: fpC, mode: "overwrite", content: "also ok2" },
      ];
      const { session, errors } = await service.createSession(
        "Partial",
        edits,
      );

      assert.strictEqual(session.changeIds.length, 2);
      assert.strictEqual(errors.length, 1);
    });

    test("empty edits array creates a session with no changes", async () => {
      const { session, errors } = await service.createSession("Empty", []);
      assert.strictEqual(session.changeIds.length, 0);
      assert.strictEqual(errors.length, 0);
      assert.strictEqual(session.status, "active");
    });

    test("invalid mode reports an error per file", async () => {
      const fp = createTempFile("inv.ts", "data");
      const edits: FileEdit[] = [
        { filePath: fp, mode: "delete" as any },
      ];
      const { session, errors } = await service.createSession(
        "Invalid",
        edits,
      );

      assert.strictEqual(session.changeIds.length, 0);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes("Invalid mode"));
    });
  });

  // -----------------------------------------------------------------------
  // applySession
  // -----------------------------------------------------------------------
  suite("applySession", () => {
    test("applies all pending changes in session", async () => {
      const fpA = createTempFile("ap1.ts", "old-a");
      const fpB = createTempFile("ap2.ts", "old-b");

      const edits: FileEdit[] = [
        { filePath: fpA, mode: "overwrite", content: "new-a" },
        { filePath: fpB, mode: "overwrite", content: "new-b" },
      ];
      const { session } = await service.createSession("Apply test", edits);
      const result = await service.applySession(session.id);

      assert.strictEqual(result.applied, 2);
      assert.strictEqual(result.failed, 0);
      assert.strictEqual(session.status, "applied");

      // Verify files were written
      assert.strictEqual(fs.readFileSync(fpA, "utf8"), "new-a");
      assert.strictEqual(fs.readFileSync(fpB, "utf8"), "new-b");
    });

    test("throws for unknown session ID", async () => {
      await assert.rejects(
        () => service.applySession("nonexistent"),
        /not found/,
      );
    });

    test("skips already-applied changes", async () => {
      const fp = createTempFile("dbl.ts", "orig");
      const edits: FileEdit[] = [
        { filePath: fp, mode: "overwrite", content: "upd" },
      ];
      const { session } = await service.createSession("Double apply", edits);

      await service.applySession(session.id);
      // Second apply — change is already applied, not pending
      const result2 = await service.applySession(session.id);
      assert.strictEqual(result2.applied, 0);
      assert.strictEqual(result2.failed, 0);
    });
  });

  // -----------------------------------------------------------------------
  // rejectSession
  // -----------------------------------------------------------------------
  suite("rejectSession", () => {
    test("rejects all pending changes in session", async () => {
      const fpA = createTempFile("rj1.ts", "old-a");
      const fpB = createTempFile("rj2.ts", "old-b");

      const edits: FileEdit[] = [
        { filePath: fpA, mode: "overwrite", content: "new-a" },
        { filePath: fpB, mode: "overwrite", content: "new-b" },
      ];
      const { session } = await service.createSession("Reject test", edits);
      service.rejectSession(session.id);

      assert.strictEqual(session.status, "rejected");
      // Files should NOT be modified
      assert.strictEqual(fs.readFileSync(fpA, "utf8"), "old-a");
      assert.strictEqual(fs.readFileSync(fpB, "utf8"), "old-b");
    });

    test("throws for unknown session ID", () => {
      assert.throws(
        () => service.rejectSession("nonexistent"),
        /not found/,
      );
    });
  });

  // -----------------------------------------------------------------------
  // getSession / getAllSessions / getActiveSessions
  // -----------------------------------------------------------------------
  suite("query methods", () => {
    test("getSession returns the session", async () => {
      const { session } = await service.createSession("Q", []);
      const found = service.getSession(session.id);
      assert.strictEqual(found?.id, session.id);
    });

    test("getSession returns undefined for unknown id", () => {
      assert.strictEqual(service.getSession("nope"), undefined);
    });

    test("getAllSessions includes all sessions", async () => {
      await service.createSession("A", []);
      await service.createSession("B", []);
      assert.strictEqual(service.getAllSessions().length, 2);
    });

    test("getActiveSessions filters completed sessions", async () => {
      const { session: s1 } = await service.createSession("Active", []);
      const { session: s2 } = await service.createSession("Will reject", []);
      service.rejectSession(s2.id);

      const active = service.getActiveSessions();
      assert.strictEqual(active.length, 1);
      assert.strictEqual(active[0].id, s1.id);
    });
  });

  // -----------------------------------------------------------------------
  // getSessionChanges / getSessionForChange
  // -----------------------------------------------------------------------
  suite("change lookups", () => {
    test("getSessionChanges returns PendingChange objects", async () => {
      const fp = createTempFile("lu.ts", "data");
      const edits: FileEdit[] = [
        { filePath: fp, mode: "overwrite", content: "new data" },
      ];
      const { session } = await service.createSession("Lookup", edits);
      const changes = service.getSessionChanges(session.id);
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(changes[0].filePath, fp);
    });

    test("getSessionChanges returns empty for unknown session", () => {
      assert.deepStrictEqual(service.getSessionChanges("nope"), []);
    });

    test("getSessionForChange finds the owning session", async () => {
      const fp = createTempFile("own.ts", "data");
      const edits: FileEdit[] = [
        { filePath: fp, mode: "overwrite", content: "owned" },
      ];
      const { session } = await service.createSession("Owner", edits);
      const changeId = session.changeIds[0];
      const owner = service.getSessionForChange(changeId);
      assert.strictEqual(owner?.id, session.id);
    });

    test("getSessionForChange returns undefined for unowned change", () => {
      assert.strictEqual(
        service.getSessionForChange("orphan-id"),
        undefined,
      );
    });
  });
});

