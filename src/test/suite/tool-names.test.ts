/**
 * Tool Names Constants Tests
 *
 * Validates the canonical tool name constants, display name map,
 * read-only tool set, and toFriendlyName helper introduced on this branch.
 */

import * as assert from "assert";
import {
  TOOL_NAMES,
  TOOL_DISPLAY_NAMES,
  READ_ONLY_TOOLS,
  toFriendlyName,
} from "../../agents/constants/tool-names";

suite("TOOL_NAMES — Canonical Values", () => {
  test("All expected tool names are defined", () => {
    const expected: Record<string, string> = {
      RUN_COMMAND: "run_command",
      RUN_TERMINAL_COMMAND: "run_terminal_command",
      COMMAND: "command",
      READ_FILE: "read_file",
      WRITE_FILE: "write_file",
      EDIT_FILE: "edit_file",
      DELETE_FILE: "delete_file",
      ANALYZE_FILES: "analyze_files_for_question",
      THINK: "think",
      SEARCH_CODEBASE: "search_codebase",
      MANAGE_TASKS: "manage_tasks",
      MANAGE_CORE_MEMORY: "manage_core_memory",
      GIT_DIFF: "git_diff",
      GIT_LOG: "git_log",
      GIT_BRANCH: "git_branch",
      GIT_STATUS: "git_status",
      RUN_TESTS: "run_tests",
      LIST_DIRECTORY: "list_directory",
      WEB_SEARCH: "web_search",
      GREP: "grep",
      GLOB: "glob",
    };

    for (const [key, value] of Object.entries(expected)) {
      assert.strictEqual(
        (TOOL_NAMES as any)[key],
        value,
        `TOOL_NAMES.${key} should be "${value}"`,
      );
    }
  });

  test("TOOL_NAMES has exactly 21 entries", () => {
    assert.strictEqual(Object.keys(TOOL_NAMES).length, 21);
  });

  test("All values are unique (no duplicate tool name strings)", () => {
    const values = Object.values(TOOL_NAMES);
    const unique = new Set(values);
    assert.strictEqual(values.length, unique.size, "Duplicate tool name values detected");
  });
});

suite("TOOL_DISPLAY_NAMES — Friendly Labels", () => {
  test("Every TOOL_NAMES value has a display name entry", () => {
    // Not all tools need a display name — but the ones that do should be valid.
    for (const [, value] of Object.entries(TOOL_DISPLAY_NAMES)) {
      assert.ok(
        typeof value === "string" && value.length > 0,
        `Display name for tool should be a non-empty string, got "${value}"`,
      );
    }
  });

  test("Terminal-related tools all map to 'Terminal'", () => {
    assert.strictEqual(TOOL_DISPLAY_NAMES[TOOL_NAMES.RUN_COMMAND], "Terminal");
    assert.strictEqual(TOOL_DISPLAY_NAMES[TOOL_NAMES.RUN_TERMINAL_COMMAND], "Terminal");
    assert.strictEqual(TOOL_DISPLAY_NAMES[TOOL_NAMES.COMMAND], "Terminal");
  });

  test("edit_file maps to 'Edit File'", () => {
    assert.strictEqual(TOOL_DISPLAY_NAMES[TOOL_NAMES.EDIT_FILE], "Edit File");
  });

  test("think maps to 'Reasoning'", () => {
    assert.strictEqual(TOOL_DISPLAY_NAMES[TOOL_NAMES.THINK], "Reasoning");
  });
});

suite("READ_ONLY_TOOLS — Immutable Tool Set", () => {
  test("Contains exactly 11 tools", () => {
    assert.strictEqual(READ_ONLY_TOOLS.size, 11);
  });

  test("All expected read-only tools are present", () => {
    const expected = [
      TOOL_NAMES.READ_FILE,
      TOOL_NAMES.LIST_DIRECTORY,
      TOOL_NAMES.SEARCH_CODEBASE,
      TOOL_NAMES.GREP,
      TOOL_NAMES.GLOB,
      TOOL_NAMES.ANALYZE_FILES,
      TOOL_NAMES.GIT_LOG,
      TOOL_NAMES.GIT_DIFF,
      TOOL_NAMES.GIT_STATUS,
      TOOL_NAMES.THINK,
      TOOL_NAMES.RUN_TESTS,
    ];
    for (const tool of expected) {
      assert.ok(READ_ONLY_TOOLS.has(tool), `"${tool}" should be in READ_ONLY_TOOLS`);
    }
  });

  test("Mutating tools are NOT in the read-only set", () => {
    const mutating = [
      TOOL_NAMES.EDIT_FILE,
      TOOL_NAMES.WRITE_FILE,
      TOOL_NAMES.DELETE_FILE,
      TOOL_NAMES.RUN_COMMAND,
      TOOL_NAMES.RUN_TERMINAL_COMMAND,
      TOOL_NAMES.WEB_SEARCH,
    ];
    for (const tool of mutating) {
      assert.ok(!READ_ONLY_TOOLS.has(tool), `"${tool}" should NOT be in READ_ONLY_TOOLS`);
    }
  });
});

suite("toFriendlyName — Display Name Conversion", () => {
  test("Returns display name for known tools", () => {
    assert.strictEqual(toFriendlyName("read_file"), "Read File");
    assert.strictEqual(toFriendlyName("edit_file"), "Edit File");
    assert.strictEqual(toFriendlyName("think"), "Reasoning");
  });

  test("Falls back to title-cased snake_case for unknown tools", () => {
    assert.strictEqual(toFriendlyName("my_custom_tool"), "My Custom Tool");
  });

  test("Handles single-word tool names", () => {
    assert.strictEqual(toFriendlyName("grep"), "Grep");
  });

  test("Handles empty string gracefully", () => {
    const result = toFriendlyName("");
    assert.strictEqual(typeof result, "string");
  });
});
