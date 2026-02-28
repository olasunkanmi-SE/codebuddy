import * as cp from "child_process";
import { Logger } from "../infrastructure/logger/logger";

export class GitService {
  private static instance: GitService;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("GitService", {});
  }

  public static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  /**
   * Execute a git command and return stdout.
   * @param cwd Working directory
   * @param args Git command arguments
   * @param timeoutMs Timeout in milliseconds (default: 30000)
   */
  public runGitCommand(
    cwd: string,
    args: string[],
    timeoutMs: number = 30000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const git = cp.spawn("git", args, { cwd });
      let output = "";
      let error = "";
      let killed = false;

      const timeoutId = setTimeout(() => {
        killed = true;
        git.kill();
        reject(
          new Error(
            `Git command timed out after ${timeoutMs}ms: git ${args.join(" ")}`,
          ),
        );
      }, timeoutMs);

      git.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      git.stderr.on("data", (data: Buffer) => {
        error += data.toString();
      });

      git.on("close", (code: number | null) => {
        clearTimeout(timeoutId);
        if (killed) return;
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Git command failed with code ${code}: ${error}`));
        }
      });

      git.on("error", (err: Error) => {
        clearTimeout(timeoutId);
        if (killed) return;
        this.logger.error(
          `Failed to start Git command: git ${args.join(" ")}`,
          err,
        );
        reject(new Error(`Failed to execute Git command: ${err.message}`));
      });
    });
  }
}
