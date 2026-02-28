import * as cp from "child_process";

export class CommandResult extends Error {
  constructor(
    public stdout: string,
    public stderr: string,
    public originalError: Error,
  ) {
    super(originalError.message);
  }
}

/**
 * Run a command using child_process.spawn (no shell interpolation).
 * @param cwd   Working directory
 * @param cmd   Executable name (e.g. "npm", "yarn", "pnpm")
 * @param args  Arguments array (e.g. ["outdated", "--json"])
 * @param timeoutMs Timeout in milliseconds (default: 30 000)
 */
export function runCommand(
  cwd: string,
  cmd: string,
  args: string[] = [],
  timeoutMs = 30000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(cmd, args, { cwd });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timeoutId = setTimeout(() => {
      killed = true;
      child.kill();
      reject(
        new CommandResult(
          stdout,
          stderr,
          new Error(
            `Command timed out after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`,
          ),
        ),
      );
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code: number | null) => {
      clearTimeout(timeoutId);
      if (killed) return;
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new CommandResult(
            stdout,
            stderr,
            new Error(
              `Command failed with code ${code}: ${cmd} ${args.join(" ")}`,
            ),
          ),
        );
      }
    });

    child.on("error", (err: Error) => {
      clearTimeout(timeoutId);
      if (killed) return;
      reject(new CommandResult(stdout, stderr, err));
    });
  });
}
