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
 * @returns Safely escaped argument for Windows
 */
export function escapeShellArgWindows(arg: string): string {
  if (arg === null || arg === undefined) {
    return '""';
  }

  const str = String(arg);

  if (str === "") {
    return '""';
  }

  // Escape special characters for cmd.exe
  // Characters that need escaping: " % ^ &amp; | < > ( )
  let escaped = str
    .replace(/"/g, '""')
    .replace(/%/g, "%%")
    .replace(/\^/g, "^^")
    .replace(/&amp;/g, "^&amp;")
    .replace(/\|/g, "^|")
    .replace(/</g, "^<")
    .replace(/>/g, "^>")
    .replace(/\(/g, "^(")
    .replace(/\)/g, "^)");

  // Wrap in double quotes if it contains spaces or special chars
  if (/[\s"^&amp;|<>()]/.test(str)) {
    escaped = '"' + escaped + '"';
  }

  return escaped;
}

/**
 * Escape an argument based on the current platform.
 *
 * @param arg - The argument string to escape
 * @returns Safely escaped argument for the current platform
 */
export function escapeShellArgPlatform(arg: string): string {
  return process.platform === "win32"
    ? escapeShellArgWindows(arg)
    : escapeShellArg(arg);
}

/**
 * Escape multiple arguments and join them with spaces.
 *
 * @param args - Array of arguments to escape
 * @returns Space-separated escaped arguments
 *
 * @example
 * escapeShellArgs(["ls", "-la", "/path/with spaces"])
 * // "'ls' '-la' '/path/with spaces'"
 */
export function escapeShellArgs(args: string[]): string {
  return args.map(escapeShellArgPlatform).join(" ");
}

/**
 * Build a safe shell command from a command and arguments.
 * The command itself is NOT escaped (assumed to be a known, safe binary name).
 * Only the arguments are escaped.
 *
 * @param command - The command/binary to run (NOT escaped)
 * @param args - Arguments to escape and append
 * @returns Complete shell command string
 *
 * @example
 * buildSafeCommand("gh", ["pr", "list", "--repo", "user/repo"])
 * // "gh 'pr' 'list' '--repo' 'user/repo'"
 */
export function buildSafeCommand(command: string, args: string[]): string {
  if (args.length === 0) {
    return command;
  }
  return `${command} ${escapeShellArgs(args)}`;
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
