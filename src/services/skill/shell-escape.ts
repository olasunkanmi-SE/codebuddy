/**
 * Shell Escape Utilities
 *
 * Provides secure shell argument escaping to prevent command injection attacks.
 * These utilities should be used whenever constructing shell commands from
 * dynamic or user-provided input.
 */

/**
 * Escape a single argument for safe shell use (POSIX shells).
 * Wraps the argument in single quotes and escapes embedded single quotes.
 *
 * @param arg - The argument string to escape
 * @returns Safely escaped argument
 *
 * @example
 * escapeShellArg("hello world")  // "'hello world'"
 * escapeShellArg("it's a test")  // "'it'\\''s a test'"
 * escapeShellArg("$(whoami)")    // "'$(whoami)'" - command substitution neutralized
 */
export function escapeShellArg(arg: string): string {
  // Handle null/undefined
  if (arg === null || arg === undefined) {
    return "''";
  }

  // Convert to string
  const str = String(arg);

  // Empty string case
  if (str === "") {
    return "''";
  }

  // Single quotes are the safest; escape any embedded single quotes
  // by ending the quoted string, adding an escaped single quote, then starting a new quoted string
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

/**
 * Escape an argument for Windows command prompt (cmd.exe).
 * Uses double quotes and escapes special characters.
 *
 * @param arg - The argument string to escape
 * @returns Safely escaped argument for Windows cmd.exe
 */
export function escapeShellArgWindows(arg: string): string {
  if (arg === null || arg === undefined) {
    return '""';
  }

  const str = String(arg);

  if (str === "") {
    return '""';
  }

  // cmd.exe escaping rules:
  // - Double quotes need to be escaped as \"
  // - Backlashes before quotes need escaping
  // - Percent signs need doubling (%%)
  // - Caret (^) is the escape character for special chars outside quotes
  // - Special chars inside quotes: only " and % need escaping

  // Escape backslashes that precede quotes
  let escaped = str.replace(/(\\*)("|$)/g, (_match, slashes, quote) => {
    // Double the backslashes before a quote or end of string
    return slashes + slashes + (quote ? '\\"' : "");
  });

  // Escape percent signs (batch variable expansion)
  escaped = escaped.replace(/%/g, "%%");

  // Always wrap in double quotes for safety
  return '"' + escaped + '"';
}

/**
 * Escape an argument for Windows PowerShell.
 * Uses single quotes which treat everything as literals except single quotes.
 *
 * @param arg - The argument string to escape
 * @returns Safely escaped argument for PowerShell
 */
export function escapeShellArgPowershell(arg: string): string {
  if (arg === null || arg === undefined) {
    return "''";
  }

  const str = String(arg);

  if (str === "") {
    return "''";
  }

  // PowerShell single quotes are the safest escaping mechanism:
  // - Everything inside is treated as a literal string
  // - Single quotes are the only character that needs escaping
  // - Escape a single quote by doubling it: ''
  return "'" + str.replace(/'/g, "''") + "'";
}

/**
 * Escape an argument based on the current platform.
 *
 * @param arg - The argument string to escape
 * @param shell - Optional: specify 'cmd' or 'powershell' for Windows
 * @returns Safely escaped argument for the current platform
 */
export function escapeShellArgPlatform(
  arg: string,
  shell?: "cmd" | "powershell",
): string {
  if (process.platform === "win32") {
    return shell === "powershell"
      ? escapeShellArgPowershell(arg)
      : escapeShellArgWindows(arg);
  }
  return escapeShellArg(arg);
}

/**
 * Escape multiple arguments for safe shell use.
 *
 * @param args - Array of arguments to escape
 * @param shell - Optional: specify 'cmd' or 'powershell' for Windows
 * @returns Array of escaped arguments
 *
 * @example
 * escapeShellArgs(["ls", "-la", "/path/with spaces"])
 * // ["'ls'", "'-la'", "'/path/with spaces'"]
 */
export function escapeShellArgs(
  args: string[],
  shell?: "cmd" | "powershell",
): string[] {
  return args.map((arg) => escapeShellArgPlatform(arg, shell));
}

/**
 * Build a safe shell command from a command and arguments.
 * The command itself is NOT escaped (assumed to be a known, safe binary name).
 * Only the arguments are escaped.
 *
 * @param command - The command/binary to run (NOT escaped)
 * @param args - Arguments to escape and append
 * @param shell - Optional: specify 'cmd' or 'powershell' for Windows
 * @returns Complete shell command string
 *
 * @example
 * buildSafeCommand("gh", ["pr", "list", "--repo", "user/repo"])
 * // "gh 'pr' 'list' '--repo' 'user/repo'"
 */
export function buildSafeCommand(
  command: string,
  args: string[],
  shell?: "cmd" | "powershell",
): string {
  if (args.length === 0) {
    return command;
  }
  return `${command} ${escapeShellArgs(args, shell).join(" ")}`;
}

/**
 * Validate that a string is a safe command name (no path traversal or injection).
 * Only allows alphanumeric characters, hyphens, underscores, and dots.
 *
 * @param command - The command name to validate
 * @returns true if the command name is safe
 */
export function isSafeCommandName(command: string): boolean {
  // Only allow basic command names without path separators or special characters
  return /^[a-zA-Z0-9_.-]+$/.test(command);
}

/**
 * Sanitize environment variable names.
 * Only allows uppercase letters, digits, and underscores.
 *
 * @param name - The environment variable name
 * @returns true if the name is valid
 */
export function isValidEnvVarName(name: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}

/**
 * Build environment variable export string for shell.
 * Escapes values to prevent injection.
 *
 * @param envVars - Record of environment variable names to values
 * @returns Safe export commands for POSIX shells
 *
 * @example
 * buildEnvExports({ API_KEY: "secret123", PATH: "/usr/bin" })
 * // "export API_KEY='secret123' PATH='/usr/bin'"
 */
export function buildEnvExports(envVars: Record<string, string>): string {
  const exports: string[] = [];

  for (const [name, value] of Object.entries(envVars)) {
    // Skip invalid env var names
    if (!isValidEnvVarName(name)) {
      console.warn(`Skipping invalid env var name: ${name}`);
      continue;
    }

    exports.push(`${name}=${escapeShellArg(value)}`);
  }

  if (exports.length === 0) {
    return "";
  }

  return `export ${exports.join(" ")}`;
}
