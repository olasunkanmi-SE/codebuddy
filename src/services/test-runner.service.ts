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
  command: string;
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
          // Identify the framework from the script
          if (testScript.includes("vitest")) {
            return { name: "vitest", command: "npx vitest run" };
          }
          if (testScript.includes("jest")) {
            return { name: "jest", command: "npx jest" };
          }
          if (testScript.includes("mocha")) {
            return { name: "mocha", command: testScript };
          }
          if (testScript.includes("pytest")) {
            return { name: "pytest", command: "python -m pytest" };
          }
          // Generic — use the test script directly
          return { name: "npm-test", command: "npm test" };
        }

        // Check devDependencies for known frameworks
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };
        if (deps["vitest"]) {
          return { name: "vitest", command: "npx vitest run" };
        }
        if (deps["jest"]) {
          return { name: "jest", command: "npx jest" };
        }
        if (deps["mocha"]) {
          return { name: "mocha", command: "npx mocha" };
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
      return { name: "pytest", command: "python -m pytest" };
    }

    // Go projects
    if (fs.existsSync(path.join(workspaceRoot, "go.mod"))) {
      return { name: "go-test", command: "go test ./..." };
    }

    // Rust projects
    if (fs.existsSync(path.join(workspaceRoot, "Cargo.toml"))) {
      return { name: "cargo-test", command: "cargo test" };
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

    let command: string;
    let frameworkName: string;

    if (customCommand) {
      command = customCommand;
      frameworkName = "custom";
    } else {
      const detected = await this.detectFramework(workspaceRoot);
      if (!detected) {
        throw new Error(
          "Could not detect a test framework. Set `codebuddy.testCommand` in settings or add a test script to package.json.",
        );
      }
      command = detected.command;
      frameworkName = detected.name;
    }

    // Append path/name filters
    if (testPath) {
      command += ` ${testPath}`;
    }
    if (testName) {
      const filterFlags: Record<string, string> = {
        jest: `--testNamePattern="${testName}"`,
        vitest: `--reporter=verbose -t "${testName}"`,
        mocha: `--grep "${testName}"`,
        pytest: `-k "${testName}"`,
        "go-test": `-run "${testName}"`,
        "cargo-test": `-- "${testName}"`,
        "npm-test": "",
        custom: "",
      };
      const flag = filterFlags[frameworkName] ?? "";
      if (flag) {
        command += ` ${flag}`;
      }
    }

    this.logger.info(`Running tests: ${command}`);

    const timeout = vscode.workspace
      .getConfiguration("codebuddy")
      .get<number>("testTimeout", this.DEFAULT_TIMEOUT_MS);
    const rawOutput = await this.executeCommand(
      command,
      workspaceRoot,
      timeout,
    );

    const result = this.parseOutput(rawOutput, frameworkName, command);
    this.logger.info(
      `Tests finished: ${result.passed}/${result.total} passed, ${result.failed} failed`,
    );
    return result;
  }

  private executeCommand(
    command: string,
    cwd: string,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = "";
      let killed = false;

      const proc = spawn(command, {
        shell: true,
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: "0", // Disable ANSI colors for cleaner parsing
          CI: "true", // Many frameworks simplify output in CI mode
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

      proc.on("close", () => {
        clearTimeout(timer);
        if (!killed) {
          resolve(output);
        }
      });
    });
  }

  private parseOutput(
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

    return {
      framework,
      command,
      passed: counts.passed,
      failed: counts.failed,
      skipped: counts.skipped,
      total: counts.total,
      duration: counts.duration,
      success: counts.failed === 0,
      failures,
      rawOutput: truncated,
    };
  }

  private parseCounts(
    output: string,
    framework: string,
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

    // Jest / Vitest: "Tests: 3 passed, 1 failed, 4 total"
    const jestMatch = output.match(
      /Tests:\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*skipped,?\s*)?(?:(\d+)\s*passed,?\s*)?(\d+)\s*total/i,
    );
    if (jestMatch) {
      failed = parseInt(jestMatch[1] || "0");
      skipped = parseInt(jestMatch[2] || "0");
      passed = parseInt(jestMatch[3] || "0");
      total = parseInt(jestMatch[4] || "0");
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
    }

    // Pytest: "X passed, Y failed"
    const pytestMatch = output.match(/=+\s*([\d\w, ]+)\s*in\s*([\d.]+s)/);
    if (pytestMatch) {
      const counts = pytestMatch[1];
      duration = pytestMatch[2];
      const passMatch = counts.match(/(\d+)\s+passed/);
      const failMatch = counts.match(/(\d+)\s+failed/);
      const skipMatch = counts.match(/(\d+)\s+skipped/);
      passed = passMatch ? parseInt(passMatch[1]) : 0;
      failed = failMatch ? parseInt(failMatch[1]) : 0;
      skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
      total = passed + failed + skipped;
    }

    // Go test: "ok" or "FAIL"
    const goPass = output.match(/^ok\s/gm);
    const goFail = output.match(/^FAIL\s/gm);
    if (goPass || goFail) {
      passed = goPass?.length ?? 0;
      failed = goFail?.length ?? 0;
      total = passed + failed;
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
    }

    // Duration fallback
    if (duration === "unknown") {
      const durMatch = output.match(
        /(?:Time|Duration|Ran)[:.]?\s*([\d.]+\s*m?s)/i,
      );
      if (durMatch) {
        duration = durMatch[1];
      }
    }

    // Total fallback
    if (total === 0 && (passed > 0 || failed > 0)) {
      total = passed + failed + skipped;
    }

    return { passed, failed, skipped, total, duration };
  }

  private parseFailures(output: string, framework: string): TestFailure[] {
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

    // Include a truncated snippet of raw output for context
    if (!result.success) {
      const tail = result.rawOutput.slice(-2000);
      lines.push("", "## Raw Output (tail):", "```", tail, "```");
    }

    return lines.join("\n");
  }
}
