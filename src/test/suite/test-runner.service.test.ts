import * as assert from "assert";
import { TestRunnerService, sanitizeArg, parseCommandLine } from "../../services/test-runner.service";

// ---------------------------------------------------------------------------
// We test parseCounts, parseFailures, sanitizeArg, and parseCommandLine
// via the public surface. The singleton constructor is private, so we
// access parsing methods via getInstance().
// ---------------------------------------------------------------------------

suite("TestRunnerService", () => {
  let service: TestRunnerService;

  suiteSetup(() => {
    service = TestRunnerService.getInstance();
  });

  // -----------------------------------------------------------------------
  // sanitizeArg — direct tests for malicious and edge-case inputs
  // -----------------------------------------------------------------------
  suite("sanitizeArg", () => {
    test("accepts a simple file path", () => {
      assert.strictEqual(sanitizeArg("src/test.ts", "testPath"), "src/test.ts");
    });

    test("accepts a glob pattern", () => {
      assert.strictEqual(sanitizeArg("src/**/*.test.ts", "testPath"), "src/**/*.test.ts");
    });

    test("accepts an alphanumeric test name", () => {
      assert.strictEqual(sanitizeArg("shouldCreateUser", "testName"), "shouldCreateUser");
    });

    test("trims leading/trailing whitespace", () => {
      assert.strictEqual(sanitizeArg("  src/test.ts  ", "testPath"), "src/test.ts");
    });

    test("rejects empty string", () => {
      assert.throws(() => sanitizeArg("", "testPath"), /must not be empty/);
    });

    test("rejects whitespace-only string", () => {
      assert.throws(() => sanitizeArg("   ", "testPath"), /must not be empty/);
    });

    test("rejects string exceeding 500 chars", () => {
      const long = "a".repeat(501);
      assert.throws(() => sanitizeArg(long, "testPath"), /too long/);
    });

    test("accepts exactly 500 chars", () => {
      const exact = "a".repeat(500);
      assert.doesNotThrow(() => sanitizeArg(exact, "testPath"));
    });

    // Shell metacharacters — each one individually
    const shellMetaChars: [string, string][] = [
      [";", "semicolon"],
      ["&", "ampersand"],
      ["|", "pipe"],
      ["`", "backtick"],
      ["$", "dollar sign"],
      ["(", "open paren"],
      [")", "close paren"],
      ["{", "open brace"],
      ["}", "close brace"],
      ["!", "exclamation"],
      ["<", "less-than"],
      [">", "greater-than"],
      ["\\", "backslash"],
      ["#", "hash"],
      ["\n", "newline"],
      ["\r", "carriage return"],
    ];

    for (const [char, description] of shellMetaChars) {
      test(`rejects shell metacharacter: ${description}`, () => {
        assert.throws(
          () => sanitizeArg(`safe${char}path`, "testPath"),
          /disallowed characters/,
        );
      });
    }

    test("rejects command substitution attempt: $(whoami)", () => {
      assert.throws(() => sanitizeArg("$(whoami)", "testPath"), /disallowed characters/);
    });

    test("rejects command chaining: foo ; rm -rf /", () => {
      assert.throws(() => sanitizeArg("foo ; rm -rf /", "testPath"), /disallowed characters/);
    });

    test("rejects pipe injection: foo | cat /etc/passwd", () => {
      assert.throws(() => sanitizeArg("foo | cat /etc/passwd", "testPath"), /disallowed characters/);
    });

    test("rejects backtick injection: `id`", () => {
      assert.throws(() => sanitizeArg("`id`", "testPath"), /disallowed characters/);
    });

    test("includes the label in the error message", () => {
      assert.throws(() => sanitizeArg("", "myLabel"), /myLabel/);
    });
  });

  // -----------------------------------------------------------------------
  // parseCommandLine — quoted argument parsing for custom commands
  // -----------------------------------------------------------------------
  suite("parseCommandLine", () => {
    test("splits simple space-separated command", () => {
      assert.deepStrictEqual(parseCommandLine("npx jest --verbose"), ["npx", "jest", "--verbose"]);
    });

    test("preserves double-quoted segments with spaces", () => {
      assert.deepStrictEqual(
        parseCommandLine('"/path/to/my runner" --config "my config.json"'),
        ["/path/to/my runner", "--config", "my config.json"],
      );
    });

    test("preserves single-quoted segments with spaces", () => {
      assert.deepStrictEqual(
        parseCommandLine("'/path/to/my runner' --config 'my config.json'"),
        ["/path/to/my runner", "--config", "my config.json"],
      );
    });

    test("handles mixed quoting styles", () => {
      assert.deepStrictEqual(
        parseCommandLine(`npx jest "test path" '--grep=my test'`),
        ["npx", "jest", "test path", "--grep=my test"],
      );
    });

    test("handles multiple spaces between arguments", () => {
      assert.deepStrictEqual(parseCommandLine("npx   jest   --ci"), ["npx", "jest", "--ci"]);
    });

    test("returns empty array for empty string", () => {
      assert.deepStrictEqual(parseCommandLine(""), []);
    });

    test("handles leading/trailing whitespace", () => {
      assert.deepStrictEqual(parseCommandLine("  npx jest  "), ["npx", "jest"]);
    });

    test("handles adjacent quoted and unquoted text", () => {
      assert.deepStrictEqual(parseCommandLine('--flag="value with spaces"'), ["--flag=value with spaces"]);
    });
  });

  // -----------------------------------------------------------------------
  // parseCounts
  // -----------------------------------------------------------------------
  suite("parseCounts", () => {
    test("parses Jest/Vitest summary line", () => {
      const output = `
Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 2 passed, 3 total
Time:        4.2s
`;
      const counts = service.parseCounts(output, "jest");
      assert.strictEqual(counts.passed, 2);
      assert.strictEqual(counts.failed, 1);
      assert.strictEqual(counts.total, 3);
    });

    test("parses Jest line with skipped tests", () => {
      const output = "Tests: 2 failed, 1 skipped, 5 passed, 8 total";
      const counts = service.parseCounts(output, "jest");
      assert.strictEqual(counts.failed, 2);
      assert.strictEqual(counts.skipped, 1);
      assert.strictEqual(counts.passed, 5);
      assert.strictEqual(counts.total, 8);
    });

    test("parses Mocha passing/failing output", () => {
      const output = `
  12 passing (340ms)
  3 failing
  1 pending
`;
      const counts = service.parseCounts(output, "mocha");
      assert.strictEqual(counts.passed, 12);
      assert.strictEqual(counts.failed, 3);
      assert.strictEqual(counts.skipped, 1);
      assert.strictEqual(counts.total, 16);
      assert.strictEqual(counts.duration, "340ms");
    });

    test("parses Mocha with only passing", () => {
      const output = "  5 passing (120ms)";
      const counts = service.parseCounts(output, "mocha");
      assert.strictEqual(counts.passed, 5);
      assert.strictEqual(counts.failed, 0);
      assert.strictEqual(counts.total, 5);
    });

    test("parses Pytest summary line", () => {
      const output = "====== 10 passed, 2 failed, 1 skipped in 3.5s ======";
      const counts = service.parseCounts(output, "pytest");
      assert.strictEqual(counts.passed, 10);
      assert.strictEqual(counts.failed, 2);
      assert.strictEqual(counts.skipped, 1);
      assert.strictEqual(counts.total, 13);
      assert.strictEqual(counts.duration, "3.5s");
    });

    test("parses Go test ok/FAIL lines", () => {
      const output = `ok  \tgithub.com/user/pkg\t0.015s
ok  \tgithub.com/user/pkg2\t0.020s
FAIL\tgithub.com/user/pkg3\t0.010s
`;
      const counts = service.parseCounts(output, "go-test");
      assert.strictEqual(counts.passed, 2);
      assert.strictEqual(counts.failed, 1);
      assert.strictEqual(counts.total, 3);
    });

    test("parses Cargo test result line", () => {
      const output = "test result: FAILED. 8 passed; 2 failed; 1 ignored; 0 measured; 0 filtered out";
      const counts = service.parseCounts(output, "cargo-test");
      assert.strictEqual(counts.passed, 8);
      assert.strictEqual(counts.failed, 2);
      assert.strictEqual(counts.skipped, 1);
      assert.strictEqual(counts.total, 11);
    });

    test("returns zeros when no patterns match", () => {
      const output = "some random unrecognized output\ndone";
      const counts = service.parseCounts(output, "custom");
      assert.strictEqual(counts.passed, 0);
      assert.strictEqual(counts.failed, 0);
      assert.strictEqual(counts.total, 0);
      assert.strictEqual(counts.duration, "unknown");
    });

    test("framework-agnostic: Mocha output parsed even when framework is 'jest'", () => {
      // Parsers try all patterns regardless of framework label
      const output = "  7 passing (200ms)\n  1 failing";
      const counts = service.parseCounts(output, "jest");
      // Jest regex won't match, so Mocha regex picks it up
      assert.strictEqual(counts.passed, 7);
      assert.strictEqual(counts.failed, 1);
    });
  });

  // -----------------------------------------------------------------------
  // parseFailures
  // -----------------------------------------------------------------------
  suite("parseFailures", () => {
    test("parses Jest/Vitest failure blocks", () => {
      const output = `● UserService > should create user

    Expected: "John"
    Received: undefined

      at Object.<anonymous> (src/user.test.ts:15:5)

Test Suites: 1 failed, 1 total
`;
      const failures = service.parseFailures(output, "jest");
      assert.strictEqual(failures.length, 1);
      assert.strictEqual(failures[0].testName, "UserService > should create user");
      assert.ok(failures[0].expected?.includes("John"));
      assert.ok(failures[0].actual?.includes("undefined"));
      assert.ok(failures[0].file?.includes("user.test.ts"));
    });

    test("parses Pytest FAILED lines", () => {
      const output = `FAILED tests/test_user.py::test_create_user
FAILED tests/test_user.py::test_delete_user
`;
      const failures = service.parseFailures(output, "pytest");
      assert.strictEqual(failures.length, 2);
      assert.strictEqual(failures[0].testName, "tests/test_user.py::test_create_user");
      assert.strictEqual(failures[1].testName, "tests/test_user.py::test_delete_user");
    });

    test("parses Cargo test FAILED lines", () => {
      const output = `test user::tests::test_create ... FAILED
test user::tests::test_update ... ok
test user::tests::test_delete ... FAILED
`;
      const failures = service.parseFailures(output, "cargo-test");
      assert.strictEqual(failures.length, 2);
      assert.strictEqual(failures[0].testName, "user::tests::test_create");
      assert.strictEqual(failures[1].testName, "user::tests::test_delete");
    });

    test("returns empty array when no failures detected", () => {
      const output = "  5 passing (120ms)";
      const failures = service.parseFailures(output, "mocha");
      assert.strictEqual(failures.length, 0);
    });

    test("parses Go test failure with file and message", () => {
      const output = `--- FAIL: TestAdd (0.00s)
    math_test.go:12: expected 4 but got 5
FAIL\tgithub.com/user/pkg\t0.005s
`;
      const failures = service.parseFailures(output, "go-test");
      assert.strictEqual(failures.length, 1);
      assert.strictEqual(failures[0].testName, "TestAdd");
      assert.ok(failures[0].file?.includes("math_test.go:12"));
      assert.ok(failures[0].message.includes("expected 4 but got 5"));
    });

    test("parses Pytest failure with file and assertion details", () => {
      const output = `
    File "tests/test_math.py", line 8
    AssertionError: 3 != 4
FAILED tests/test_math.py::test_add
`;
      const failures = service.parseFailures(output, "pytest");
      assert.strictEqual(failures.length, 1);
      assert.strictEqual(failures[0].testName, "tests/test_math.py::test_add");
      assert.ok(failures[0].file?.includes("test_math.py:8"));
      assert.ok(failures[0].message.includes("3 != 4"));
    });
  });

  // -----------------------------------------------------------------------
  // parseOutput (integration of parseCounts + parseFailures + warnings)
  // -----------------------------------------------------------------------
  suite("parseOutput", () => {
    test("sets success=true when no failures and exit code 0", () => {
      const output = "  5 passing (120ms)";
      const result = service.parseOutput(output, "mocha", "npx mocha");
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.passed, 5);
      assert.strictEqual(result.parseWarning, undefined);
    });

    test("sets success=false when failures exist", () => {
      const output = "  5 passing (120ms)\n  2 failing";
      const result = service.parseOutput(output, "mocha", "npx mocha");
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.failed, 2);
    });

    test("sets success=false when exit code is non-zero even with 0 parsed fails", () => {
      const output = "some output\n[exit code: 1]";
      const result = service.parseOutput(output, "custom", "my-test");
      assert.strictEqual(result.success, false);
    });

    test("adds parseWarning when no counts parsed and exit code non-zero", () => {
      const output = "error: compilation failed\n[exit code: 1]";
      const result = service.parseOutput(output, "custom", "my-test");
      assert.ok(result.parseWarning);
      assert.ok(result.parseWarning!.includes("non-zero"));
    });

    test("adds parseWarning when no counts parsed and exit code 0", () => {
      const output = "done";
      const result = service.parseOutput(output, "custom", "my-test");
      assert.ok(result.parseWarning);
      assert.ok(result.parseWarning!.includes("exit 0"));
    });

    test("truncates raw output to MAX_OUTPUT_LENGTH", () => {
      const longOutput = "x".repeat(20_000) + "\n  3 passing (50ms)";
      const result = service.parseOutput(longOutput, "mocha", "npx mocha");
      assert.ok(result.rawOutput.length <= 15_001);
      // The tail is kept so parsing should still find the counts
      assert.strictEqual(result.passed, 3);
    });
  });

  // -----------------------------------------------------------------------
  // formatForAgent
  // -----------------------------------------------------------------------
  suite("formatForAgent", () => {
    test("formats success result", () => {
      const output = service.formatForAgent({
        framework: "mocha",
        command: "npx mocha",
        passed: 10,
        failed: 0,
        skipped: 0,
        total: 10,
        duration: "500ms",
        success: true,
        failures: [],
        rawOutput: "...",
      });
      assert.ok(output.includes("✅"));
      assert.ok(output.includes("10/10"));
      assert.ok(!output.includes("Raw Output"));
    });

    test("formats failure result with failure details", () => {
      const output = service.formatForAgent({
        framework: "jest",
        command: "npx jest",
        passed: 3,
        failed: 1,
        skipped: 0,
        total: 4,
        duration: "2s",
        success: false,
        failures: [
          {
            testName: "should work",
            message: "Expected true, got false",
            file: "test.ts:10:5",
            expected: "true",
            actual: "false",
          },
        ],
        rawOutput: "raw test output here",
      });
      assert.ok(output.includes("❌"));
      assert.ok(output.includes("should work"));
      assert.ok(output.includes("Expected: true"));
      assert.ok(output.includes("Actual: false"));
      assert.ok(output.includes("Raw Output"));
    });

    test("includes parseWarning when present", () => {
      const output = service.formatForAgent({
        framework: "custom",
        command: "my-test",
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: "unknown",
        success: false,
        failures: [],
        rawOutput: "something went wrong",
        parseWarning: "Could not parse structured test results.",
      });
      assert.ok(output.includes("⚠️"));
      assert.ok(output.includes("Could not parse"));
    });
  });
});
