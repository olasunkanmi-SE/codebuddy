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

export function runCommand(
  cwd: string,
  command: string,
  timeoutMs = 30000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command, { cwd, timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        reject(new CommandResult(stdout, stderr, err));
        return;
      }
      resolve(stdout);
    });
  });
}
