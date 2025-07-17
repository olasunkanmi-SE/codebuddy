import simpleGit, { GitError, SimpleGit, SimpleGitOptions } from "simple-git";
import * as vscode from "vscode";

export interface GitDiffResult {
  file: string;
  diff: string | null;
  error: string | null;
}

export interface BranchInfo {
  current: string;
  upstream?: string;
  remote?: string;
}

export class GitActions {
  private readonly git: SimpleGit;
  private readonly rootPath: string;

  constructor(rootPath?: string) {
    this.rootPath = rootPath || this.getWorkspaceRoot();
    const options: Partial<SimpleGitOptions> = {
      binary: "git",
      maxConcurrentProcesses: 6,
      trimmed: false,
      baseDir: this.rootPath,
    };
    this.git = simpleGit(options);
  }

  /**
   * Get the workspace root path
   */
  private getWorkspaceRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error("No workspace folder is open");
    }
    return workspaceFolders[0].uri.fsPath;
  }

  /**
   * Get staged differences summary for commit message generation
   */
  async getStagedDifferenceSummary(): Promise<string> {
    try {
      const stagedDiffSummary = await this.git.diffSummary("--staged");

      const fileDifferencePromises = stagedDiffSummary.files.map(
        async (file) => {
          try {
            let fileDiff;
            if (file.file.includes("_deleted_")) {
              fileDiff = "File deleted";
            } else {
              fileDiff = await this.git.diff(["--staged", file.file]);
            }
            return { file: file.file, diff: fileDiff, error: null };
          } catch (error: any) {
            if (
              error instanceof GitError &&
              error.message.includes(
                "unknown revision or path not in the working tree",
              )
            ) {
              try {
                const fileContent = await this.git.catFile([
                  "-p",
                  `:0:${file.file}`,
                ]);
                return {
                  file: file.file,
                  diff: `New file: ${file.file}\n${fileContent}`,
                  error: null,
                };
              } catch (catError: any) {
                return {
                  file: file.file,
                  diff: null,
                  error: `Error getting content for new file: ${catError.message}`,
                };
              }
            } else {
              return { file: file.file, diff: null, error: error.message };
            }
          }
        },
      );

      const fileDiffs = await Promise.all(fileDifferencePromises);
      let differenceSummary = "";

      fileDiffs.forEach(({ file, diff, error }) => {
        if (error) {
          console.error(`Error processing ${file}: ${error}`);
        } else if (diff) {
          differenceSummary += `\nFile: ${file}\n${diff}\n`;
        }
      });

      return differenceSummary;
    } catch (error) {
      console.error("Error getting staged differences:", error);
      throw error;
    }
  }

  /**
   * Get the current branch information including upstream tracking
   */
  async getCurrentBranchInfo(): Promise<BranchInfo> {
    try {
      const currentBranch = await this.git.branch();
      const branchInfo: BranchInfo = {
        current: currentBranch.current,
      };

      // Try to get upstream tracking branch
      try {
        const upstreamBranch = await this.git.raw([
          "rev-parse",
          "--abbrev-ref",
          `${currentBranch.current}@{upstream}`,
        ]);
        branchInfo.upstream = upstreamBranch.trim();
      } catch {
        // No upstream branch set
      }

      // Try to get remote tracking branch
      try {
        const remoteBranch = await this.git.raw([
          "for-each-ref",
          "--format=%(upstream:short)",
          `refs/heads/${currentBranch.current}`,
        ]);
        branchInfo.remote = remoteBranch.trim();
      } catch {
        // No remote branch
      }

      return branchInfo;
    } catch (error) {
      console.error("Error getting branch info:", error);
      throw error;
    }
  }

  /**
   * Get the base branch from which the current branch was created
   */
  async getBaseBranch(): Promise<string> {
    try {
      // First try to get the merge base with common default branches
      const defaultBranches = ["main", "master", "develop", "dev"];

      for (const defaultBranch of defaultBranches) {
        try {
          // Check if the branch exists
          await this.git.raw(["rev-parse", "--verify", defaultBranch]);

          // Get merge base
          const mergeBase = await this.git.raw([
            "merge-base",
            "HEAD",
            defaultBranch,
          ]);

          // If merge base exists and is not the same as current HEAD
          const currentHead = await this.git.raw(["rev-parse", "HEAD"]);
          if (mergeBase.trim() !== currentHead.trim()) {
            return defaultBranch;
          }
        } catch {
          // Branch doesn't exist or no merge base, continue to next
          continue;
        }
      }

      // If no default branch found, try to find the branch this was created from
      try {
        const branchInfo = await this.getCurrentBranchInfo();
        if (branchInfo.upstream) {
          return branchInfo.upstream.split("/").pop() || "main";
        }
      } catch {
        // Fallback to main
      }

      // Final fallback
      return "main";
    } catch (error) {
      console.error("Error getting base branch:", error);
      return "main";
    }
  }

  /**
   * Get PR differences against the base branch
   */
  async getPRDifferenceSummary(targetBranch?: string): Promise<string> {
    try {
      const baseBranch = targetBranch || (await this.getBaseBranch());

      // Get the merge base between current branch and base branch
      const mergeBase = await this.git.raw(["merge-base", "HEAD", baseBranch]);

      // Get diff from merge base to current HEAD
      const diffSummary = await this.git.diffSummary([
        mergeBase.trim(),
        "HEAD",
      ]);

      const fileDifferencePromises = diffSummary.files.map(async (file) => {
        try {
          let fileDiff;
          if (file.file.includes("_deleted_")) {
            fileDiff = "File deleted";
          } else {
            fileDiff = await this.git.diff([
              mergeBase.trim(),
              "HEAD",
              "--",
              file.file,
            ]);
          }
          return { file: file.file, diff: fileDiff, error: null };
        } catch (error: any) {
          return {
            file: file.file,
            diff: null,
            error: `Error getting diff for ${file.file}: ${error.message}`,
          };
        }
      });

      const fileDiffs = await Promise.all(fileDifferencePromises);
      let differenceSummary = `Comparing against base branch: ${baseBranch}\n`;
      differenceSummary += `Merge base: ${mergeBase.trim()}\n\n`;

      fileDiffs.forEach(({ file, diff, error }) => {
        if (error) {
          console.error(`Error processing ${file}: ${error}`);
        } else if (diff) {
          differenceSummary += `\nFile: ${file}\n${diff}\n`;
        }
      });

      return differenceSummary;
    } catch (error) {
      console.error("Error getting PR differences:", error);
      throw error;
    }
  }

  /**
   * Get list of available branches
   */
  async getAvailableBranches(): Promise<string[]> {
    try {
      const branches = await this.git.branch(["-a"]);
      return branches.all
        .filter((branch) => !branch.startsWith("remotes/origin/HEAD"))
        .map((branch) => branch.replace("remotes/origin/", ""));
    } catch (error) {
      console.error("Error getting available branches:", error);
      throw error;
    }
  }

  /**
   * Get commit history between two branches
   */
  async getCommitHistory(
    baseBranch: string,
    targetBranch: string = "HEAD",
  ): Promise<string[]> {
    try {
      const log = await this.git.log({
        from: baseBranch,
        to: targetBranch,
      });
      return log.all.map(
        (commit) => `${commit.hash.substring(0, 7)}: ${commit.message}`,
      );
    } catch (error) {
      console.error("Error getting commit history:", error);
      throw error;
    }
  }

  /**
   * Get repository status
   */
  async getRepositoryStatus(): Promise<any> {
    try {
      return await this.git.status();
    } catch (error) {
      console.error("Error getting repository status:", error);
      throw error;
    }
  }

  /**
   * Check if repository is clean (no uncommitted changes)
   */
  async isRepositoryClean(): Promise<boolean> {
    try {
      const status = await this.getRepositoryStatus();
      return status.files.length === 0;
    } catch (error) {
      console.error("Error checking repository status:", error);
      return false;
    }
  }

  /**
   * Get file content at specific commit
   */
  async getFileAtCommit(filePath: string, commitHash: string): Promise<string> {
    try {
      return await this.git.raw(["show", `${commitHash}:${filePath}`]);
    } catch (error) {
      console.error(
        `Error getting file ${filePath} at commit ${commitHash}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get list of modified files between two commits
   */
  async getModifiedFiles(
    baseBranch: string,
    targetBranch: string = "HEAD",
  ): Promise<string[]> {
    try {
      const diff = await this.git.raw([
        "diff",
        "--name-only",
        baseBranch,
        targetBranch,
      ]);
      return diff.trim().split("\n").filter(Boolean);
    } catch (error) {
      console.error("Error getting modified files:", error);
      throw error;
    }
  }

  /**
   * Get detailed diff statistics
   */
  async getDiffStats(
    baseBranch: string,
    targetBranch: string = "HEAD",
  ): Promise<string> {
    try {
      return await this.git.raw(["diff", "--stat", baseBranch, targetBranch]);
    } catch (error) {
      console.error("Error getting diff stats:", error);
      throw error;
    }
  }

  /**
   * Check if branch exists
   */
  async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.git.raw(["rev-parse", "--verify", branchName]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get remote URL
   */
  async getRemoteUrl(remoteName: string = "origin"): Promise<string> {
    try {
      return await this.git.raw(["remote", "get-url", remoteName]);
    } catch (error) {
      console.error(`Error getting remote URL for ${remoteName}:`, error);
      throw error;
    }
  }
}
