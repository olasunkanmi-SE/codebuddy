import * as assert from "assert";
import * as sinon from "sinon";
import { BrowserHandler } from "../../webview-providers/handlers/browser-handler";
import { HandlerContext } from "../../webview-providers/handlers/types";
import { SqliteDatabaseService } from "../../services/sqlite-database.service";

suite("BrowserHandler Bookmark Tests", () => {
  let handler: BrowserHandler;
  let ctx: HandlerContext;
  let dbStub: sinon.SinonStubbedInstance<SqliteDatabaseService>;
  let postMessageStub: sinon.SinonStub;
  let loggerWarnStub: sinon.SinonStub;

  setup(() => {
    // Stub SqliteDatabaseService singleton
    dbStub = sinon.createStubInstance(SqliteDatabaseService);
    dbStub.ensureInitialized.resolves();
    dbStub.executeSqlCommand.returns({ changes: 1, lastInsertRowid: 1 });
    dbStub.executeSql.returns([]);

    sinon
      .stub(SqliteDatabaseService, "getInstance")
      .returns(dbStub as unknown as SqliteDatabaseService);

    // Stub HandlerContext
    postMessageStub = sinon.stub().resolves(true);
    loggerWarnStub = sinon.stub();

    ctx = {
      webview: { webview: { postMessage: postMessageStub } },
      logger: { warn: loggerWarnStub },
      extensionUri: {} as any,
      sendResponse: sinon.stub(),
    } as unknown as HandlerContext;

    // Create handler with dummy dependencies
    const agentServiceStub = { addChatMessage: sinon.stub() } as any;
    handler = new BrowserHandler(agentServiceStub, () => "session-1");
  });

  teardown(() => {
    sinon.restore();
  });

  // ── add-bookmark ────────────────────────────────────────────────

  test("add-bookmark inserts row with correct SQL and params", async () => {
    await handler.handle(
      { command: "add-bookmark", url: "https://example.com", title: "Example" },
      ctx,
    );

    assert.ok(dbStub.executeSqlCommand.calledOnce);
    const [query, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("INSERT OR IGNORE INTO bookmarks"));
    assert.deepStrictEqual(params, ["https://example.com", "Example"]);
  });

  test("add-bookmark uses URL as title when title is missing", async () => {
    await handler.handle(
      { command: "add-bookmark", url: "https://no-title.com" },
      ctx,
    );

    const [, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.deepStrictEqual(params, [
      "https://no-title.com",
      "https://no-title.com",
    ]);
  });

  test("add-bookmark posts updated bookmarks list back to webview", async () => {
    const mockBookmarks = [
      { url: "https://example.com", title: "Example", created_at: "2025-01-01" },
    ];
    dbStub.executeSql.returns(mockBookmarks);

    await handler.handle(
      { command: "add-bookmark", url: "https://example.com", title: "Example" },
      ctx,
    );

    assert.ok(postMessageStub.calledOnce);
    const msg = postMessageStub.firstCall.args[0];
    assert.strictEqual(msg.type, "bookmarks-list");
    assert.deepStrictEqual(msg.bookmarks, mockBookmarks);
  });

  test("add-bookmark does nothing when url is missing", async () => {
    await handler.handle({ command: "add-bookmark" }, ctx);

    assert.ok(dbStub.executeSqlCommand.notCalled);
    assert.ok(postMessageStub.notCalled);
  });

  test("add-bookmark swallows db errors and logs warning", async () => {
    dbStub.ensureInitialized.rejects(new Error("db init failed"));

    await handler.handle(
      { command: "add-bookmark", url: "https://fail.com", title: "Fail" },
      ctx,
    );

    assert.ok(loggerWarnStub.calledOnce);
    assert.ok(
      loggerWarnStub.firstCall.args[0].includes("Failed to add bookmark"),
    );
  });

  // ── remove-bookmark ─────────────────────────────────────────────

  test("remove-bookmark deletes by URL", async () => {
    await handler.handle(
      { command: "remove-bookmark", url: "https://example.com" },
      ctx,
    );

    assert.ok(dbStub.executeSqlCommand.calledOnce);
    const [query, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("DELETE FROM bookmarks"));
    assert.deepStrictEqual(params, ["https://example.com"]);
  });

  test("remove-bookmark posts updated list to webview", async () => {
    dbStub.executeSql.returns([]);

    await handler.handle(
      { command: "remove-bookmark", url: "https://example.com" },
      ctx,
    );

    assert.ok(postMessageStub.calledOnce);
    assert.strictEqual(postMessageStub.firstCall.args[0].type, "bookmarks-list");
  });

  test("remove-bookmark does nothing when url is missing", async () => {
    await handler.handle({ command: "remove-bookmark" }, ctx);

    assert.ok(dbStub.executeSqlCommand.notCalled);
  });

  test("remove-bookmark swallows db errors and logs warning", async () => {
    dbStub.ensureInitialized.rejects(new Error("db gone"));

    await handler.handle(
      { command: "remove-bookmark", url: "https://fail.com" },
      ctx,
    );

    assert.ok(loggerWarnStub.calledOnce);
    assert.ok(
      loggerWarnStub.firstCall.args[0].includes("Failed to remove bookmark"),
    );
  });

  // ── get-bookmarks ───────────────────────────────────────────────

  test("get-bookmarks returns sorted list from DB", async () => {
    const mockBookmarks = [
      { url: "https://b.com", title: "B", created_at: "2025-01-02" },
      { url: "https://a.com", title: "A", created_at: "2025-01-01" },
    ];
    dbStub.executeSql.returns(mockBookmarks);

    await handler.handle({ command: "get-bookmarks" }, ctx);

    assert.ok(dbStub.executeSql.calledOnce);
    const [query] = dbStub.executeSql.firstCall.args;
    assert.ok(query.includes("ORDER BY created_at DESC"));

    assert.ok(postMessageStub.calledOnce);
    assert.deepStrictEqual(
      postMessageStub.firstCall.args[0].bookmarks,
      mockBookmarks,
    );
  });

  test("get-bookmarks swallows db errors and logs warning", async () => {
    dbStub.ensureInitialized.rejects(new Error("oops"));

    await handler.handle({ command: "get-bookmarks" }, ctx);

    assert.ok(loggerWarnStub.calledOnce);
    assert.ok(
      loggerWarnStub.firstCall.args[0].includes("Failed to get bookmarks"),
    );
  });
});
