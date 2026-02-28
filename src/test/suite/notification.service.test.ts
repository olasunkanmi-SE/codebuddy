import * as assert from "assert";
import * as sinon from "sinon";
import {
  NotificationService,
  NotificationSource,
} from "../../services/notification.service";
import { SqliteDatabaseService } from "../../services/sqlite-database.service";

suite("NotificationService Test Suite", () => {
  let service: NotificationService;
  let dbStub: sinon.SinonStubbedInstance<SqliteDatabaseService>;

  setup(() => {
    // Stub the SqliteDatabaseService singleton
    dbStub = sinon.createStubInstance(SqliteDatabaseService);
    dbStub.initialize.resolves();
    dbStub.executeSqlCommand.returns({ changes: 0, lastInsertRowid: 0 });
    dbStub.executeSql.returns([]);

    sinon
      .stub(SqliteDatabaseService, "getInstance")
      .returns(dbStub as unknown as SqliteDatabaseService);

    // Reset the NotificationService singleton so it picks up the stubbed DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (NotificationService as any).instance = undefined;
    service = NotificationService.getInstance();
  });

  teardown(() => {
    sinon.restore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (NotificationService as any).instance = undefined;
  });

  // ── addNotification ───────────────────────────────────────────────

  test("addNotification inserts a row with correct params", async () => {
    await service.addNotification(
      "info",
      "Test Title",
      "Test message",
      NotificationSource.System,
    );

    assert.ok(dbStub.executeSqlCommand.calledOnce);
    const [query, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("INSERT INTO notifications"));
    assert.deepStrictEqual(params, [
      "info",
      "Test Title",
      "Test message",
      "System",
    ]);
  });

  test("addNotification uses default source when omitted", async () => {
    await service.addNotification("warning", "Title", "Msg");

    const [, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.strictEqual(params![3], "System");
  });

  test("addNotification fires onDidNotificationChange event", async () => {
    let fired = false;
    service.onDidNotificationChange(() => {
      fired = true;
    });

    await service.addNotification(
      "success",
      "T",
      "M",
      NotificationSource.Git,
    );
    assert.strictEqual(fired, true);
  });

  test("addNotification swallows db errors gracefully", async () => {
    dbStub.executeSqlCommand.throws(new Error("db failure"));

    // Should not throw
    await service.addNotification(
      "error",
      "T",
      "M",
      NotificationSource.Commands,
    );
  });

  // ── getNotifications ──────────────────────────────────────────────

  test("getNotifications returns mapped items", async () => {
    dbStub.executeSql.returns([
      {
        id: 1,
        type: "info",
        title: "Hello",
        message: "World",
        timestamp: "2025-01-01T00:00:00.000Z",
        read_status: 0,
        source: "System",
      },
      {
        id: 2,
        type: "error",
        title: "Oops",
        message: "Something broke",
        timestamp: "2025-01-01T00:01:00.000Z",
        read_status: 1,
        source: "Git",
      },
    ]);

    const items = await service.getNotifications();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].read, false);
    assert.strictEqual(items[1].read, true);
    assert.strictEqual(items[1].source, "Git");
  });

  test("getNotifications returns empty array on db error", async () => {
    dbStub.executeSql.throws(new Error("db error"));

    const items = await service.getNotifications();
    assert.deepStrictEqual(items, []);
  });

  // ── deleteNotification ────────────────────────────────────────────

  test("deleteNotification executes DELETE with correct id", async () => {
    await service.deleteNotification(42);

    assert.ok(dbStub.executeSqlCommand.calledOnce);
    const [query, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("DELETE FROM notifications WHERE id = ?"));
    assert.deepStrictEqual(params, [42]);
  });

  test("deleteNotification fires change event", async () => {
    let fired = false;
    service.onDidNotificationChange(() => {
      fired = true;
    });

    await service.deleteNotification(1);
    assert.strictEqual(fired, true);
  });

  test("deleteNotification swallows db errors", async () => {
    dbStub.executeSqlCommand.throws(new Error("db failure"));
    await service.deleteNotification(1); // should not throw
  });

  // ── markAsRead ────────────────────────────────────────────────────

  test("markAsRead updates correct row", async () => {
    await service.markAsRead(7);

    const [query, params] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("UPDATE notifications SET read_status = 1"));
    assert.deepStrictEqual(params, [7]);
  });

  // ── markAllAsRead ─────────────────────────────────────────────────

  test("markAllAsRead updates all unread rows", async () => {
    await service.markAllAsRead();

    const [query] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("UPDATE notifications SET read_status = 1"));
    assert.ok(query.includes("WHERE read_status = 0"));
  });

  // ── clearAll ──────────────────────────────────────────────────────

  test("clearAll deletes all notifications", async () => {
    await service.clearAll();

    const [query] = dbStub.executeSqlCommand.firstCall.args;
    assert.ok(query.includes("DELETE FROM notifications"));
    // Should NOT include WHERE clause
    assert.ok(!query.includes("WHERE"));
  });

  test("clearAll fires change event", async () => {
    let fired = false;
    service.onDidNotificationChange(() => {
      fired = true;
    });

    await service.clearAll();
    assert.strictEqual(fired, true);
  });

  // ── getUnreadCount ────────────────────────────────────────────────

  test("getUnreadCount returns count from db", async () => {
    dbStub.executeSql.returns([{ count: 5 }]);

    const count = await service.getUnreadCount();
    assert.strictEqual(count, 5);
  });

  test("getUnreadCount returns 0 on db error", async () => {
    dbStub.executeSql.throws(new Error("db error"));

    const count = await service.getUnreadCount();
    assert.strictEqual(count, 0);
  });

  // ── NotificationSource enum ───────────────────────────────────────

  test("NotificationSource enum has all expected values", () => {
    assert.strictEqual(NotificationSource.System, "System");
    assert.strictEqual(NotificationSource.Commands, "Commands");
    assert.strictEqual(NotificationSource.Git, "Git");
    assert.strictEqual(NotificationSource.Chat, "Chat");
    assert.strictEqual(NotificationSource.MCP, "MCP");
    assert.strictEqual(NotificationSource.ModelManager, "Model Manager");
    assert.strictEqual(NotificationSource.Workspace, "Workspace");
    assert.strictEqual(NotificationSource.GitLab, "GitLab");
    assert.strictEqual(NotificationSource.Jira, "Jira");
    assert.strictEqual(NotificationSource.PRReview, "PR Review");
    assert.strictEqual(NotificationSource.Agent, "Agent");
  });
});
