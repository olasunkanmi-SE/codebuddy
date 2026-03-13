/**
 * MemoryTool Tests
 *
 * Tests the dual-scope memory persistence system:
 * - add / update / delete / search across user and project scopes
 * - atomic write (tmp + rename) via real temp dirs
 * - FileMutex serialization (concurrent writes don't lose data)
 * - Cross-scope search for update and delete
 * - Error handling for missing fields and unknown actions
 */

import * as assert from "assert";
import * as sinon from "sinon";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import { MemoryTool } from "../../tools/memory";

let tmpRoot: string;
let userDir: string;
let projectDir: string;
let originalHome: string | undefined;

/**
 * Create isolated temp dirs and redirect MemoryTool storage paths.
 * os.homedir() is non-configurable so we redirect via the HOME env var instead.
 */
function setupTempDirs() {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "memory-test-"));
  userDir = path.join(tmpRoot, "user-home");
  projectDir = path.join(tmpRoot, "workspace");
  fs.mkdirSync(userDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  originalHome = process.env.HOME;
  process.env.HOME = userDir;

  sinon.stub(vscode.workspace, "workspaceFolders").value([
    { uri: { fsPath: projectDir }, name: "test-ws", index: 0 },
  ]);
}

function teardownTempDirs() {
  sinon.restore();
  if (originalHome !== undefined) {
    process.env.HOME = originalHome;
  } else {
    delete process.env.HOME;
  }
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

suite("MemoryTool — Add", () => {
  setup(setupTempDirs);
  teardown(teardownTempDirs);

  test("Adds user-scoped memory and returns confirmation", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("add", {
      content: "Use tabs for indentation",
      category: "Rule",
      title: "Indentation",
      scope: "user",
    });
    assert.ok(result.includes("Memory added"));
    assert.ok(result.includes("Indentation"));
  });

  test("Adds project-scoped memory to workspace dir", async () => {
    const tool = new MemoryTool();
    await tool.execute("add", {
      content: "Project uses ESM",
      category: "Knowledge",
      title: "Module System",
      scope: "project",
    });
    const filePath = path.join(projectDir, ".codebuddy", "memory.json");
    assert.ok(fs.existsSync(filePath), "Project memory file should be created");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].title, "Module System");
  });

  test("Returns error when required fields are missing", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("add", { content: "partial" });
    assert.ok(result.startsWith("Error:"));
  });

  test("Multiple adds accumulate in the same file", async () => {
    const tool = new MemoryTool();
    await tool.execute("add", {
      content: "a",
      category: "Rule",
      title: "A",
      scope: "user",
    });
    await tool.execute("add", {
      content: "b",
      category: "Rule",
      title: "B",
      scope: "user",
    });

    const filePath = path.join(userDir, ".codebuddy", "user-memory.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.strictEqual(data.length, 2);
  });
});

suite("MemoryTool — Search", () => {
  setup(setupTempDirs);
  teardown(teardownTempDirs);

  test("Search with no query returns all memories across both scopes", async () => {
    const tool = new MemoryTool();
    await tool.execute("add", {
      content: "User preference",
      category: "Rule",
      title: "User Pref",
      scope: "user",
    });
    await tool.execute("add", {
      content: "Project rule",
      category: "Knowledge",
      title: "Project Rule",
      scope: "project",
    });

    const result = await tool.execute("search");
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.length, 2);
  });

  test("Search with query filters by title, content, and keywords", async () => {
    const tool = new MemoryTool();
    await tool.execute("add", {
      content: "Always use TypeScript",
      category: "Rule",
      title: "Language",
      scope: "user",
      keywords: "typescript|ts",
    });
    await tool.execute("add", {
      content: "Use Python for scripts",
      category: "Rule",
      title: "Scripts",
      scope: "user",
    });

    const result = await tool.execute("search", undefined, "typescript");
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].title, "Language");
  });

  test("Search returns 'No matching' when no results", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("search", undefined, "nonexistent");
    assert.ok(result.includes("No matching"));
  });
});

suite("MemoryTool — Update", () => {
  setup(setupTempDirs);
  teardown(teardownTempDirs);

  test("Updates memory content in the scope where it lives", async () => {
    const tool = new MemoryTool();
    await tool.execute("add", {
      content: "old content",
      category: "Rule",
      title: "Test",
      scope: "user",
    });

    // Read back to get the ID
    const allResult = await tool.execute("search");
    const all = JSON.parse(allResult);
    const id = all[0].id;

    const updateResult = await tool.execute("update", {
      id,
      content: "new content",
    });
    assert.ok(updateResult.includes("updated"));

    const after = JSON.parse(await tool.execute("search"));
    assert.strictEqual(after[0].content, "new content");
  });

  test("Returns error when ID is missing", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("update", { content: "something" });
    assert.ok(result.startsWith("Error:"));
  });

  test("Returns error when ID is not found", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("update", { id: "nonexistent" });
    assert.ok(result.includes("not found"));
  });
});

suite("MemoryTool — Delete", () => {
  setup(setupTempDirs);
  teardown(teardownTempDirs);

  test("Deletes memory by ID from correct scope", async () => {
    const tool = new MemoryTool();
    await tool.execute("add", {
      content: "to delete",
      category: "Experience",
      title: "Ephemeral",
      scope: "project",
    });

    const allResult = await tool.execute("search");
    const id = JSON.parse(allResult)[0].id;

    const deleteResult = await tool.execute("delete", { id });
    assert.ok(deleteResult.includes("deleted"));

    const afterResult = await tool.execute("search");
    const after = JSON.parse(afterResult);
    assert.strictEqual(after.length, 0);
  });

  test("Returns error when ID is missing", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("delete", {});
    assert.ok(result.startsWith("Error:"));
  });

  test("Returns error when ID is not found", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("delete", { id: "nonexistent" });
    assert.ok(result.includes("not found"));
  });
});

suite("MemoryTool — Invalid Action", () => {
  setup(setupTempDirs);
  teardown(teardownTempDirs);

  test("Returns error for unknown action", async () => {
    const tool = new MemoryTool();
    const result = await tool.execute("purge");
    assert.ok(result.includes("Invalid action"));
  });
});

suite("MemoryTool — Concurrent Writes (FileMutex)", () => {
  setup(setupTempDirs);
  teardown(teardownTempDirs);

  test("Concurrent adds to the same scope do not lose entries", async () => {
    const tool = new MemoryTool();
    const count = 10;
    const promises: Promise<string>[] = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        tool.execute("add", {
          content: `item ${i}`,
          category: "Rule",
          title: `Rule ${i}`,
          scope: "user",
        }),
      );
    }
    await Promise.all(promises);

    const allResult = await tool.execute("search");
    const all = JSON.parse(allResult);
    assert.strictEqual(all.length, count, `Expected ${count} entries, got ${all.length} — some writes were lost`);
  });
});

suite("MemoryTool — config()", () => {
  test("Returns valid tool configuration", () => {
    const tool = new MemoryTool();
    const cfg = tool.config();
    assert.strictEqual(cfg.name, "manage_core_memory");
    assert.ok(cfg.description);
    assert.ok(cfg.parameters);
    assert.ok(cfg.parameters.properties.action);
    assert.ok(cfg.parameters.properties.memory);
    assert.ok(cfg.parameters.properties.query);
  });
});
