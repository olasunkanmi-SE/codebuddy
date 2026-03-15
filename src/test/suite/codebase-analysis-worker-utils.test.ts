import * as assert from "assert";
import { extractTomlSection } from "../../workers/codebase-analysis.worker";

suite("extractTomlSection", () => {
  test("extracts simple section", () => {
    const toml = `
[dependencies]
serde = "1.0"
tokio = "1.0"

[dev-dependencies]
assert_cmd = "2.0"
`;
    const lines = extractTomlSection(toml, "dependencies");
    assert.ok(lines.some((l) => l.includes("serde")));
    assert.ok(lines.some((l) => l.includes("tokio")));
    assert.ok(!lines.some((l) => l.includes("assert_cmd")));
  });

  test("stops at next regular section", () => {
    const toml = `
[package]
name = "myapp"
version = "0.1.0"

[dependencies]
serde = "1.0"
`;
    const lines = extractTomlSection(toml, "package");
    assert.ok(lines.some((l) => l.includes("name")));
    assert.ok(!lines.some((l) => l.includes("serde")));
  });

  test("handles dotted section names", () => {
    const toml = `
[tool.poetry.dependencies]
python = "^3.9"
django = "^4.0"

[tool.poetry.dev-dependencies]
pytest = "^7.0"
`;
    const lines = extractTomlSection(toml, "tool.poetry.dependencies");
    assert.ok(lines.some((l) => l.includes("python")));
    assert.ok(lines.some((l) => l.includes("django")));
    assert.ok(!lines.some((l) => l.includes("pytest")));
  });

  test("does not break on array-of-tables [[...]]", () => {
    const toml = `
[dependencies]
serde = "1.0"
tokio = "1.0"

[[bin]]
name = "myapp"
path = "src/main.rs"
`;
    const lines = extractTomlSection(toml, "dependencies");
    assert.ok(lines.some((l) => l.includes("serde")));
    assert.ok(lines.some((l) => l.includes("tokio")));
    // Should NOT include [[bin]] content — array tables terminate the section
    assert.ok(!lines.some((l) => l.includes("myapp")));
  });

  test("stops at array-of-tables header", () => {
    const toml = `
[package]
name = "test"

[[bench]]
name = "bench1"
`;
    const lines = extractTomlSection(toml, "package");
    assert.ok(lines.some((l) => l.includes("name")));
    assert.strictEqual(
      lines.filter((l) => l.includes("name")).length,
      1,
      "Should only contain the package name, not bench name",
    );
  });

  test("skips comments within section", () => {
    const toml = `
[dependencies]
# This is a comment
serde = "1.0"
# Another comment
tokio = "1.0"
`;
    const lines = extractTomlSection(toml, "dependencies");
    assert.ok(!lines.some((l) => l.trim().startsWith("#")));
    assert.ok(lines.some((l) => l.includes("serde")));
    assert.ok(lines.some((l) => l.includes("tokio")));
  });

  test("handles section with trailing comment", () => {
    const toml = `
[dependencies] # workspace deps
serde = "1.0"
`;
    const lines = extractTomlSection(toml, "dependencies");
    assert.ok(lines.some((l) => l.includes("serde")));
  });

  test("returns empty array for nonexistent section", () => {
    const toml = `
[dependencies]
serde = "1.0"
`;
    const lines = extractTomlSection(toml, "nonexistent");
    assert.strictEqual(lines.length, 0);
  });

  test("returns empty array for empty content", () => {
    const lines = extractTomlSection("", "dependencies");
    assert.strictEqual(lines.length, 0);
  });

  test("handles special regex characters in section name", () => {
    // Section names shouldn't contain regex-special chars normally,
    // but the escaping should prevent crashes
    const toml = `
[my.special+section]
key = "value"

[other]
key2 = "value2"
`;
    const lines = extractTomlSection(toml, "my.special+section");
    assert.ok(lines.some((l) => l.includes("key")));
  });
});
