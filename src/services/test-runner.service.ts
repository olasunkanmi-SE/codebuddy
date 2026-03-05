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

// -------------------------------------------------------------------------
// Strategy pattern for test framework detection, parsing, and arguments
// -------------------------------------------------------------------------

export interface TestFrameworkStrategy {
  /** Framework name (e.g. "jest", "pytest") */
  readonly name: string;

  /**
   * Return a DetectedFramework if this strategy's framework is present in the
   * workspace, or null if not.
   */
  detect(
    workspaceRoot: string,
    pkg: Record<string, unknown> | null,
  ): DetectedFramework | null;

  /**
   * Try to parse test counts from the raw output.
   * Return null if this strategy's patterns don't match.
   */
  parseCounts(output: string): {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: string;
  } | null;

  /**
   * Parse failure details from the raw output.
   * Returns an empty array when no failures matching this strategy's patterns are found.
   */
  parseFailures(output: string): TestFailure[];
}

// ---- Jest / Vitest Strategy ----

class JestVitestStrategy implements TestFrameworkStrategy {
  constructor(public readonly name: "jest" | "vitest") {}

  detect(
    workspaceRoot: string,
    pkg: Record<string, unknown> | null,
  ): DetectedFramework | null {
    if (!pkg) return null;
    const scripts = (pkg as { scripts?: Record<string, string> }).scripts;
    const testScript = scripts?.test;
    const isVitest = this.name === "vitest";

    // Check test script first
    if (
      testScript &&
      testScript !== 'echo "Error: no test specified" && exit 1'
    ) {
      if (isVitest && testScript.includes("vitest")) {
        return {
          name: "vitest",
          executable: "npx",
          baseArgs: ["vitest", "run"],
        };
      }
      if (
        !isVitest &&
        testScript.includes("jest") &&
        !testScript.includes("vitest")
      ) {
        return { name: "jest", executable: "npx", baseArgs: ["jest"] };
      }
    }

    // Check devDependencies
    const deps = {
      ...(pkg as Record<string, Record<string, string>>).dependencies,
      ...(pkg as Record<string, Record<string, string>>).devDependencies,
    };
    if (isVitest && deps?.["vitest"]) {
      return { name: "vitest", executable: "npx", baseArgs: ["vitest", "run"] };
    }
    if (!isVitest && deps?.["jest"] && !deps?.["vitest"]) {
      return { name: "jest", executable: "npx", baseArgs: ["jest"] };
    }
    return null;
  }

  parseCounts(output: string) {
    // "Tests: 3 passed, 1 failed, 4 total"
    const m = output.match(
      /Tests:\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*skipped,?\s*)?(?:(\d+)\s*passed,?\s*)?(\d+)\s*total/i,
    );
    if (!m) return null;
    return {
      failed: parseInt(m[1] || "0"),
      skipped: parseInt(m[2] || "0"),
      passed: parseInt(m[3] || "0"),
      total: parseInt(m[4] || "0"),
      duration: "unknown",
    };
  }

  parseFailures(output: string): TestFailure[] {
    const failures: TestFailure[] = [];
    const regex =
      /●\s+(.+?)(?:\n\n|\n\s*\n)([\s\S]*?)(?=\n●|\nTest Suites:|\n\n\s*$)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(output)) !== null) {
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
    return failures;
  }
}

// ---- Mocha Strategy ----

class MochaStrategy implements TestFrameworkStrategy {
  readonly name = "mocha";

  detect(
    _workspaceRoot: string,
    pkg: Record<string, unknown> | null,
  ): DetectedFramework | null {
    if (!pkg) return null;
    const scripts = (pkg as { scripts?: Record<string, string> }).scripts;
    const testScript = scripts?.test;
    if (
      testScript &&
      testScript !== 'echo "Error: no test specified" && exit 1' &&
      testScript.includes("mocha")
    ) {
      return { name: "mocha", executable: "npm", baseArgs: ["test", "--"] };
    }
    const deps = {
      ...(pkg as Record<string, Record<string, string>>).dependencies,
      ...(pkg as Record<string, Record<string, string>>).devDependencies,
    };
    if (deps?.["mocha"]) {
      return { name: "mocha", executable: "npx", baseArgs: ["mocha"] };
    }
    return null;
  }

  parseCounts(output: string) {
    const mochaPass = output.match(/(\d+)\s+passing/i);
    const mochaFail = output.match(/(\d+)\s+failing/i);
    const mochaPend = output.match(/(\d+)\s+pending/i);
    if (!mochaPass && !mochaFail) return null;
    const passed = mochaPass ? parseInt(mochaPass[1]) : 0;
    const failed = mochaFail ? parseInt(mochaFail[1]) : 0;
    const skipped = mochaPend ? parseInt(mochaPend[1]) : 0;
    const total = passed + failed + skipped;
    let duration = "unknown";
    const mochaDur = output.match(/passing\s*\((.+?)\)/i);
    if (mochaDur) duration = mochaDur[1];
    return { passed, failed, skipped, total, duration };
  }

  parseFailures(output: string): TestFailure[] {
    const failures: TestFailure[] = [];
    const regex =
      /\d+\)\s+(.+?):\n([\s\S]*?)(?=\n\s*\d+\)|\n\s*\d+\s+passing|\s*$)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(output)) !== null) {
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
    return failures;
  }
}

// ---- Pytest Strategy ----

class PytestStrategy implements TestFrameworkStrategy {
  readonly name = "pytest";

  detect(
    workspaceRoot: string,
    pkg: Record<string, unknown> | null,
  ): DetectedFramework | null {
    if (pkg) {
      const scripts = (pkg as { scripts?: Record<string, string> }).scripts;
      const testScript = scripts?.test;
      if (testScript && testScript.includes("pytest")) {
        return {
          name: "pytest",
          executable: "python",
          baseArgs: ["-m", "pytest"],
        };
      }
    }
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
    return null;
  }

  parseCounts(output: string) {
    const m = output.match(/=+\s*([\d\w, ]+)\s*in\s*([\d.]+s)/);
    if (!m) return null;
    const countsStr = m[1];
    const duration = m[2];
    const passMatch = countsStr.match(/(\d+)\s+passed/);
    const failMatch = countsStr.match(/(\d+)\s+failed/);
    const skipMatch = countsStr.match(/(\d+)\s+skipped/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    return {
      passed,
      failed,
      skipped,
      total: passed + failed + skipped,
      duration,
    };
  }

  parseFailures(output: string): TestFailure[] {
    const failures: TestFailure[] = [];
    const regex = /FAILED\s+([\w./]+::\w+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(output)) !== null) {
      failures.push({
        testName: match[1],
        message: `Test failed: ${match[1]}`,
      });
    }
    return failures;
  }
}

// ---- Go Test Strategy ----

class GoTestStrategy implements TestFrameworkStrategy {
  readonly name = "go-test";

  detect(
    workspaceRoot: string,
    _pkg: Record<string, unknown> | null,
  ): DetectedFramework | null {
    if (fs.existsSync(path.join(workspaceRoot, "go.mod"))) {
      return { name: "go-test", executable: "go", baseArgs: ["test", "./..."] };
    }
    return null;
  }

  parseCounts(output: string) {
    const goPass = output.match(/^ok\s/gm);
    const goFail = output.match(/^FAIL\s/gm);
    if (!goPass && !goFail) return null;
    const passed = goPass?.length ?? 0;
    const failed = goFail?.length ?? 0;
    return {
      passed,
      failed,
      skipped: 0,
      total: passed + failed,
      duration: "unknown",
    };
  }

  parseFailures(_output: string): TestFailure[] {
    return [];
  }
}

// ---- Cargo Test Strategy ----

class CargoTestStrategy implements TestFrameworkStrategy {
  readonly name = "cargo-test";

  detect(
    workspaceRoot: string,
    _pkg: Record<string, unknown> | null,
  ): DetectedFramework | null {
    if (fs.existsSync(path.join(workspaceRoot, "Cargo.toml"))) {
      return { name: "cargo-test", executable: "cargo", baseArgs: ["test"] };
    }
    return null;
  }

  parseCounts(output: string) {
    const m = output.match(
      /test result:.*?(\d+)\s*passed;\s*(\d+)\s*failed;\s*(\d+)\s*ignored/,
    );
    if (!m) return null;
    const passed = parseInt(m[1]);
    const failed = parseInt(m[2]);
    const skipped = parseInt(m[3]);
    return {
      passed,
      failed,
      skipped,
      total: passed + failed + skipped,
      duration: "unknown",
    };
  }

  parseFailures(output: string): TestFailure[] {
    const failures: TestFailure[] = [];
    const regex = /test\s+([\w:]+)\s+\.\.\.\s+FAILED/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(output)) !== null) {
      failures.push({
        testName: match[1],
        message: `Test failed: ${match[1]}`,
      });
    }
    return failures;
  }
}

/**
 * Registry of all framework strategies, ordered by detection priority.
 * Vitest is listed before Jest since Vitest projects may also have "jest"
 * in their dependency tree.
 */
const FRAMEWORK_STRATEGIES: TestFrameworkStrategy[] = [
  new JestVitestStrategy("vitest"),
  new JestVitestStrategy("jest"),
  new MochaStrategy(),
  new PytestStrategy(),
  new GoTestStrategy(),
  new CargoTestStrategy(),
];

// Characters that could be used for shell injection
const SHELL_META = /[;&|`$(){}!<>\\#\n\r]/;

/**
 * Validate a user-supplied argument to prevent shell injection.
 * Only allows filesystem paths, glob patterns, and alphanumeric test names.
 */
export function sanitizeArg(value: string, label: string): string {
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
 * Parse a command-line string into [executable, ...args], respecting
 * double-quoted and single-quoted segments so that paths with spaces work.
 */
export function parseCommandLine(command: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inDouble = false;
  let inSingle = false;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === " " && !inDouble && !inSingle) {
      if (current.length > 0) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) {
    parts.push(current);
  }
  return parts;
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
   * Detect the testing framework using the strategy registry.
   */
  private async detectFramework(
    workspaceRoot: string,
  ): Promise<DetectedFramework | null> {
    let pkg: Record<string, unknown> | null = null;
    const pkgPath = path.join(workspaceRoot, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      } catch {
        // Ignore parse errors
      }
    }

    // Try each strategy in priority order
    for (const strategy of FRAMEWORK_STRATEGIES) {
      const detected = strategy.detect(workspaceRoot, pkg);
      if (detected) return detected;
    }

    // Fallback: if there's a package.json with a non-default test script, use npm test
    if (pkg) {
      const scripts = (pkg as { scripts?: Record<string, string> }).scripts;
      const testScript = scripts?.test;
      if (
        testScript &&
        testScript !== 'echo "Error: no test specified" && exit 1'
      ) {
        return {
          name: "npm-test",
          executable: "npm",
          baseArgs: ["test", "--"],
        };
      }
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
      // Parse the custom command respecting quoted segments
      const parts = parseCommandLine(customCommand.trim());
      if (parts.length === 0) {
        throw new Error("codebuddy.testCommand is empty after parsing.");
      }
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
    // Try all strategies regardless of framework — the output is the truth, not the label.
    for (const strategy of FRAMEWORK_STRATEGIES) {
      const result = strategy.parseCounts(output);
      if (result) return result;
    }

    // Duration fallback
    let duration = "unknown";
    const durMatch = output.match(
      /(?:Time|Duration|Ran)[:.]?\s*([\d.]+\s*m?s)/i,
    );
    if (durMatch) {
      duration = durMatch[1];
    }

    return { passed: 0, failed: 0, skipped: 0, total: 0, duration };
  }

  parseFailures(output: string, _framework: string): TestFailure[] {
    // Try each strategy — return the first one that finds failures
    for (const strategy of FRAMEWORK_STRATEGIES) {
      const failures = strategy.parseFailures(output);
      if (failures.length > 0) return failures;
    }
    return [];
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
