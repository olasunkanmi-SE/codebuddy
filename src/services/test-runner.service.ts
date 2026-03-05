import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface TestResult {
  framework: string;
  command: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: string;
  success: boolean;
  failures: TestFailure[];
  rawOutput: string;
  /** True when no framework-specific regex matched — counts derived from exit code only */
  parseWarning?: string;
}

export interface TestFailure {
  testName: string;
  file?: string;
  message: string;
  expected?: string;
  actual?: string;
}

interface DetectedFramework {
  name: string;
  /** The executable (e.g. "npx") */
  executable: string;
  /** Base arguments (e.g. ["vitest", "run"]) */
  baseArgs: string[];
}

// Characters that could be used for shell injection
const SHELL_META = /[;&|`$(){}!<>\\#\n\r]/;

/**
 * Validate a user-supplied argument to prevent shell injection.
 * Only allows filesystem paths, glob patterns, and alphanumeric test names.
 */
function sanitizeArg(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  if (trimmed.length > 500) {
    throw new Error(`${label} is too long (max 500 chars).`);
  }
  if (SHELL_META.test(trimmed)) {
    throw new Error(
      `${label} contains disallowed characters. Only file paths, globs, and alphanumeric patterns are accepted.`,
    );
  }
  return trimmed;
}

/**
 * Service that detects the project's test framework, runs tests,
 * and parses results into structured output the agent can iterate on.
 */
export class TestRunnerService {
  private static instance: TestRunnerService;
  private readonly logger: Logger;
  private readonly MAX_OUTPUT_LENGTH = 15_000;
  private readonly DEFAULT_TIMEOUT_MS = 120_000;

  private constructor() {
    this.logger = Logger.initialize("TestRunnerService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): TestRunnerService {
    return (TestRunnerService.instance ??= new TestRunnerService());
  }

  /**
   * Detect the testing framework from package.json or config files.
   */
  private async detectFramework(
    workspaceRoot: string,
  ): Promise<DetectedFramework | null> {
    const pkgPath = path.join(workspaceRoot, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

        // Check for a user-defined "test" script first
        const testScript = pkg.scripts?.test;
        if (
          testScript &&
          testScript !== 'echo "Error: no test specified" && exit 1'
        ) {
          if (testScript.includes("vitest")) {
            return {
              name: "vitest",
              executable: "npx",
              baseArgs: ["vitest", "run"],
            };
          }
          if (testScript.includes("jest")) {
            return { name: "jest", executable: "npx", baseArgs: ["jest"] };
          }
          if (testScript.includes("mocha")) {
            return {
              name: "mocha",
              executable: "npm",
              baseArgs: ["test", "--"],
            };
          }
          if (testScript.includes("pytest")) {
            return {
              name: "pytest",
              executable: "python",
              baseArgs: ["-m", "pytest"],
            };
          }
          // Generic — use npm test
          return {
            name: "npm-test",
            executable: "npm",
            baseArgs: ["test", "--"],
          };
        }

        // Check devDependencies for known frameworks
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };
        if (deps["vitest"]) {
          return {
            name: "vitest",
            executable: "npx",
            baseArgs: ["vitest", "run"],
          };
        }
        if (deps["jest"]) {
          return { name: "jest", executable: "npx", baseArgs: ["jest"] };
        }
        if (deps["mocha"]) {
          return { name: "mocha", executable: "npx", baseArgs: ["mocha"] };
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Python projects
    if (
      fs.existsSync(path.join(workspaceRoot, "pytest.ini")) ||
      fs.existsSync(path.join(workspaceRoot, "pyproject.toml")) ||
      fs.existsSync(path.join(workspaceRoot, "setup.py"))
    ) {
      return {
        name: "pytest",
        executable: "python",
        baseArgs: ["-m", "pytest"],
      };
    }

    // Go projects
    if (fs.existsSync(path.join(workspaceRoot, "go.mod"))) {
      return { name: "go-test", executable: "go", baseArgs: ["test", "./..."] };
    }

    // Rust projects
    if (fs.existsSync(path.join(workspaceRoot, "Cargo.toml"))) {
      return { name: "cargo-test", executable: "cargo", baseArgs: ["test"] };
    }

    return null;
  }

  /**
   * Run tests and return structured results.
   *
   * @param testPath  Optional file or pattern to run specific tests
   * @param testName  Optional test name / grep filter
   */
  async runTests(testPath?: string, testName?: string): Promise<TestResult> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      throw new Error("No workspace folder is open.");
    }

    // Allow user override via settings
    const customCommand = vscode.workspace
      .getConfiguration("codebuddy")
      .get<string>("testCommand");

    let executable: string;
    let args: string[];
    let frameworkName: string;

    if (customCommand && customCommand.trim().length > 0) {
      // Split the custom command into executable + args (no shell interpretation)
      const parts = customCommand.trim().split(/\s+/);
      executable = parts[0];
      args = parts.slice(1);
      frameworkName = "custom";
    } else {
      const detected = await this.detectFramework(workspaceRoot);
      if (!detected) {
        throw new Error(
          "Could not detect a test framework. Set `codebuddy.testCommand` in settings or add a test script to package.json.",
        );
      }
      executable = detected.executable;
      args = [...detected.baseArgs];
      frameworkName = detected.name;
    }

    // Sanitize and append path filter
    if (testPath) {
      const safePath = sanitizeArg(testPath, "testPath");
      args.push(safePath);
    }

    // Sanitize and append test name filter as separate arguments (no shell quoting)
    if (testName) {
      const safeName = sanitizeArg(testName, "testName");
      const filterArgs: Record<string, string[]> = {
        jest: ["--testNamePattern", safeName],
        vitest: ["--reporter=verbose", "-t", safeName],
        mocha: ["--grep", safeName],
        pytest: ["-k", safeName],
        "go-test": ["-run", safeName],
        "cargo-test": ["--", safeName],
        "npm-test": [],
        custom: [],
      };
      const extra = filterArgs[frameworkName] ?? [];
      args.push(...extra);
    }

    const commandDisplay = `${executable} ${args.join(" ")}`;
    this.logger.info(`Running tests: ${commandDisplay}`);

    const timeout = vscode.workspace
      .getConfiguration("codebuddy")
      .get<number>("testTimeout", this.DEFAULT_TIMEOUT_MS);
    const rawOutput = await this.executeCommand(
      executable,
      args,
      workspaceRoot,
      timeout,
    );

    const result = this.parseOutput(rawOutput, frameworkName, commandDisplay);
    this.logger.info(
      `Tests finished: ${result.passed}/${result.total} passed, ${result.failed} failed`,
    );
    return result;
  }

  private executeCommand(
    executable: string,
    args: string[],
    cwd: string,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = "";
      let killed = false;

      // No shell: true — arguments are passed as an array, preventing injection
      const proc = spawn(executable, args, {
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: "0",
          CI: "true",
        },
      });

      const timer = setTimeout(() => {
        killed = true;
        proc.kill("SIGTERM");
        reject(
          new Error(
            `Test command timed out after ${timeoutMs / 1000}s. Output so far:\n${output.slice(-3000)}`,
          ),
        );
      }, timeoutMs);

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        output += data.toString();
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        if (!killed) {
          reject(new Error(`Failed to run tests: ${err.message}`));
        }
      });

      proc.on("close", (exitCode) => {
        clearTimeout(timer);
        if (!killed) {
          // Capture exit code in output so parsers can use it as a fallback
          if (exitCode !== null && exitCode !== 0) {
            output += `\n[exit code: ${exitCode}]`;
          }
          resolve(output);
        }
      });
    });
  }

  parseOutput(
    rawOutput: string,
    framework: string,
    command: string,
  ): TestResult {
    const truncated =
      rawOutput.length > this.MAX_OUTPUT_LENGTH
        ? rawOutput.slice(-this.MAX_OUTPUT_LENGTH)
        : rawOutput;

    const failures = this.parseFailures(truncated, framework);
    const counts = this.parseCounts(truncated, framework);

    // Detect when parsing found nothing useful — signal to the agent
    const exitCodeMatch = rawOutput.match(/\[exit code: (\d+)\]/);
    const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1]) : 0;
    let parseWarning: string | undefined;

    if (counts.total === 0 && failures.length === 0) {
      if (exitCode !== 0) {
        parseWarning =
          "Could not parse structured test results. The command exited with a non-zero status — check the raw output below for details.";
      } else {
        parseWarning =
          "Could not parse structured test results. The command succeeded (exit 0) but no test counts were found — the framework output format may be unrecognized.";
      }
    }

    return {
      framework,
      command,
      passed: counts.passed,
      failed: counts.failed,
      skipped: counts.skipped,
      total: counts.total,
      duration: counts.duration,
      success: counts.failed === 0 && exitCode === 0,
      failures,
      rawOutput: truncated,
      parseWarning,
    };
  }

  parseCounts(
    output: string,
    _framework: string,
  ): {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: string;
  } {
    let passed = 0,
      failed = 0,
      skipped = 0,
      total = 0,
      duration = "unknown";

    // Try all patterns regardless of framework — the output is the truth, not the label.
    // This makes parsing resilient when the detected framework name is imprecise.

    // Jest / Vitest: "Tests: 3 passed, 1 failed, 4 total"
    const jestMatch = output.match(
      /Tests:\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*skipped,?\s*)?(?:(\d+)\s*passed,?\s*)?(\d+)\s*total/i,
    );
    if (jestMatch) {
      failed = parseInt(jestMatch[1] || "0");
      skipped = parseInt(jestMatch[2] || "0");
      passed = parseInt(jestMatch[3] || "0");
      total = parseInt(jestMatch[4] || "0");
      return { passed, failed, skipped, total, duration };
    }

    // Mocha: "X passing", "Y failing"
    const mochaPass = output.match(/(\d+)\s+passing/i);
    const mochaFail = output.match(/(\d+)\s+failing/i);
    const mochaPend = output.match(/(\d+)\s+pending/i);
    if (mochaPass || mochaFail) {
      passed = mochaPass ? parseInt(mochaPass[1]) : 0;
      failed = mochaFail ? parseInt(mochaFail[1]) : 0;
      skipped = mochaPend ? parseInt(mochaPend[1]) : 0;
      total = passed + failed + skipped;
      // Mocha duration: "passing (Xms)"
      const mochaDur = output.match(/passing\s*\((.+?)\)/i);
      if (mochaDur) duration = mochaDur[1];
      return { passed, failed, skipped, total, duration };
    }

    // Pytest: "X passed, Y failed" in "====== X passed in Ys ======"
    const pytestMatch = output.match(/=+\s*([\d\w, ]+)\s*in\s*([\d.]+s)/);
    if (pytestMatch) {
      const countsStr = pytestMatch[1];
      duration = pytestMatch[2];
      const passMatch = countsStr.match(/(\d+)\s+passed/);
      const failMatch = countsStr.match(/(\d+)\s+failed/);
      const skipMatch = countsStr.match(/(\d+)\s+skipped/);
      passed = passMatch ? parseInt(passMatch[1]) : 0;
      failed = failMatch ? parseInt(failMatch[1]) : 0;
      skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
      total = passed + failed + skipped;
      return { passed, failed, skipped, total, duration };
    }

    // Go test: "ok" or "FAIL" lines
    const goPass = output.match(/^ok\s/gm);
    const goFail = output.match(/^FAIL\s/gm);
    if (goPass || goFail) {
      passed = goPass?.length ?? 0;
      failed = goFail?.length ?? 0;
      total = passed + failed;
      return { passed, failed, skipped, total, duration };
    }

    // Cargo test: "test result: ok. X passed; Y failed"
    const cargoMatch = output.match(
      /test result:.*?(\d+)\s*passed;\s*(\d+)\s*failed;\s*(\d+)\s*ignored/,
    );
    if (cargoMatch) {
      passed = parseInt(cargoMatch[1]);
      failed = parseInt(cargoMatch[2]);
      skipped = parseInt(cargoMatch[3]);
      total = passed + failed + skipped;
      return { passed, failed, skipped, total, duration };
    }

    // Duration fallback
    const durMatch = output.match(
      /(?:Time|Duration|Ran)[:.]?\s*([\d.]+\s*m?s)/i,
    );
    if (durMatch) {
      duration = durMatch[1];
    }

    return { passed, failed, skipped, total, duration };
  }

  parseFailures(output: string, _framework: string): TestFailure[] {
    const failures: TestFailure[] = [];

    // Jest/Vitest failure blocks: "● Test Name"
    const jestRegex =
      /●\s+(.+?)(?:\n\n|\n\s*\n)([\s\S]*?)(?=\n●|\nTest Suites:|\n\n\s*$)/g;
    let match: RegExpExecArray | null;
    while ((match = jestRegex.exec(output)) !== null) {
      const block = match[2].trim();
      const failure: TestFailure = {
        testName: match[1].trim(),
        message: block.split("\n").slice(0, 10).join("\n"),
      };
      const expectedMatch = block.match(/Expected[:\s]+(.+)/);
      const receivedMatch = block.match(/Received[:\s]+(.+)/);
      if (expectedMatch) failure.expected = expectedMatch[1].trim();
      if (receivedMatch) failure.actual = receivedMatch[1].trim();
      const atMatch = block.match(/at\s+.*?\((.+?:\d+:\d+)\)/);
      if (atMatch) failure.file = atMatch[1];
      failures.push(failure);
    }

    // Mocha failure blocks: "N) test name:"
    const mochaRegex =
      /\d+\)\s+(.+?):\n([\s\S]*?)(?=\n\s*\d+\)|\n\s*\d+\s+passing|\s*$)/g;
    while ((match = mochaRegex.exec(output)) !== null) {
      const block = match[2].trim();
      const failure: TestFailure = {
        testName: match[1].trim(),
        message: block.split("\n").slice(0, 10).join("\n"),
      };
      const expectedMatch = block.match(/expected\s+'?(.+?)'?\s+to/);
      const actualMatch = block.match(/AssertionError:\s+(.+)/);
      if (expectedMatch) failure.expected = expectedMatch[1];
      if (actualMatch) failure.message = actualMatch[1];
      const atMatch = block.match(/at\s+.*?\((.+?:\d+:\d+)\)/);
      if (atMatch) failure.file = atMatch[1];
      failures.push(failure);
    }

    // Pytest failure blocks: "FAILED test_file.py::test_name"
    const pytestRegex = /FAILED\s+([\w./]+::\w+)/g;
    while ((match = pytestRegex.exec(output)) !== null) {
      failures.push({
        testName: match[1],
        message: `Test failed: ${match[1]}`,
      });
    }

    // Cargo test: "test name ... FAILED"
    const cargoRegex = /test\s+([\w:]+)\s+\.\.\.\s+FAILED/g;
    while ((match = cargoRegex.exec(output)) !== null) {
      failures.push({
        testName: match[1],
        message: `Test failed: ${match[1]}`,
      });
    }

    return failures;
  }

  /**
   * Format a TestResult into a concise string the agent can reason over.
   */
  formatForAgent(result: TestResult): string {
    const header = result.success
      ? `✅ All tests passed (${result.passed}/${result.total}) in ${result.duration}`
      : `❌ ${result.failed}/${result.total} tests failed (${result.passed} passed, ${result.skipped} skipped) in ${result.duration}`;

    const lines = [
      header,
      `Framework: ${result.framework}`,
      `Command: ${result.command}`,
    ];

    if (result.parseWarning) {
      lines.push("", `⚠️ ${result.parseWarning}`);
    }

    if (result.failures.length > 0) {
      lines.push("", "## Failures:");
      for (const f of result.failures.slice(0, 10)) {
        lines.push(`\n### ${f.testName}`);
        if (f.file) lines.push(`File: ${f.file}`);
        lines.push(f.message);
        if (f.expected) lines.push(`Expected: ${f.expected}`);
        if (f.actual) lines.push(`Actual: ${f.actual}`);
      }
      if (result.failures.length > 10) {
        lines.push(`\n... and ${result.failures.length - 10} more failures`);
      }
    }

    // Include a truncated snippet of raw output when parsing couldn't extract structure
    // or when there are failures
    if (!result.success || result.parseWarning) {
      const tail = result.rawOutput.slice(-2000);
      lines.push("", "## Raw Output (tail):", "```", tail, "```");
    }

    return lines.join("\n");
  }
}
