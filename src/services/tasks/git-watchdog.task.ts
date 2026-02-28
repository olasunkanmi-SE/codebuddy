import * as vscode from "vscode";
import * as cp from "child_process";
import { Logger } from "../../infrastructure/logger/logger";

interface BranchInfo {
  name: string;
  isMerged: boolean;
  lastCommitAge: string;
}

export class GitWatchdogTask {
  private logger: Logger;

  constructor() {
    this.logger = Logger.initialize("GitWatchdogTask", {});
  }

  public async execute(): Promise<void> {
    this.logger.info("Running Git Watchdog Task...");

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    try {
      // 1. Check for uncommitted changes with context
      const status = await this.runGitCommand(rootPath, [
        "status",
        "--porcelain",
      ]);

      if (status && status.trim() !== "") {
        await this.handleUncommittedChanges(rootPath, status);
      }

      // 2. Check branch hygiene
      await this.checkBranchHygiene(rootPath);

      // 3. Check for upstream divergence
      await this.checkUpstreamDivergence(rootPath);
    } catch (error) {
      this.logger.error("Error in Git Watchdog", error);
    }
  }

  private async handleUncommittedChanges(
    rootPath: string,
    status: string,
  ): Promise<void> {
    // Check time of last commit
    let lastCommitTimeStr: string;
    try {
      lastCommitTimeStr = await this.runGitCommand(rootPath, [
        "log",
        "-1",
        "--format=%ct",
      ]);
    } catch {
      return; // No commits yet
    }

    if (!lastCommitTimeStr) return;

    const lastCommitTime = parseInt(lastCommitTimeStr.trim(), 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const diffSeconds = currentTime - lastCommitTime;
    const diffHours = diffSeconds / 3600;

    // Only alert if >2 hours since last commit
    if (diffHours <= 2) return;

    // Parse change details
    const changes = status
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const staged = changes.filter((c) => c[0] !== " " && c[0] !== "?").length;
    const unstaged = changes.filter((c) => c[0] === " " || c[0] === "M").length;
    const untracked = changes.filter((c) => c.startsWith("??")).length;

    // Get a short diff stat for staged + modified files
    let diffSummary = "";
    try {
      diffSummary = (
        await this.runGitCommand(rootPath, ["diff", "--shortstat"])
      ).trim();
    } catch {
      // ignore
    }

    const parts = [];
    if (staged > 0) parts.push(`${staged} staged`);
    if (unstaged > 0) parts.push(`${unstaged} modified`);
    if (untracked > 0) parts.push(`${untracked} untracked`);

    const changeSummary = parts.join(", ");
    const timeStr = diffHours.toFixed(1);
    const message = `Git Watchdog: ${changeSummary} file(s) uncommitted for ${timeStr}h.${diffSummary ? ` (${diffSummary})` : ""}`;

    const selection = await vscode.window.showInformationMessage(
      message,
      "Generate Commit Message",
      "Open Source Control",
      "Snooze",
    );

    if (selection === "Open Source Control") {
      vscode.commands.executeCommand("workbench.view.scm");
    } else if (selection === "Generate Commit Message") {
      // Leverage the existing generate-commit-message command
      vscode.commands.executeCommand("CodeBuddy.generateCommitMessage");
    }
  }

  private async checkBranchHygiene(rootPath: string): Promise<void> {
    try {
      // Find merged branches that haven't been cleaned up
      const currentBranch = (
        await this.runGitCommand(rootPath, [
          "rev-parse",
          "--abbrev-ref",
          "HEAD",
        ])
      ).trim();

      const mergedBranchesRaw = await this.runGitCommand(rootPath, [
        "branch",
        "--merged",
        "HEAD",
      ]);

      const staleBranches = mergedBranchesRaw
        .split("\n")
        .map((b) => b.trim().replace(/^\*\s*/, ""))
        .filter(
          (b) =>
            b.length > 0 &&
            b !== currentBranch &&
            b !== "main" &&
            b !== "master" &&
            b !== "develop" &&
            b !== "dev",
        );

      if (staleBranches.length >= 3) {
        const selection = await vscode.window.showInformationMessage(
          `Git Hygiene: ${staleBranches.length} merged branches can be cleaned up (${staleBranches.slice(0, 3).join(", ")}${staleBranches.length > 3 ? "..." : ""}).`,
          "View Branches",
          "Dismiss",
        );

        if (selection === "View Branches") {
          vscode.commands.executeCommand("workbench.view.scm");
        }
      }
    } catch {
      // Not a git repo or no branches
    }
  }

  private async checkUpstreamDivergence(rootPath: string): Promise<void> {
    try {
      // Fetch quietly to get latest remote state
      await this.runGitCommand(rootPath, ["fetch", "--quiet"]);

      const currentBranch = (
        await this.runGitCommand(rootPath, [
          "rev-parse",
          "--abbrev-ref",
          "HEAD",
        ])
      ).trim();

      // Check if upstream tracking branch exists
      let upstream: string;
      try {
        upstream = (
          await this.runGitCommand(rootPath, [
            "rev-parse",
            "--abbrev-ref",
            `${currentBranch}@{upstream}`,
          ])
        ).trim();
      } catch {
        return; // No upstream
      }

      // Count commits behind
      const behindRaw = await this.runGitCommand(rootPath, [
        "rev-list",
        "--count",
        `${currentBranch}..${upstream}`,
      ]);
      const behind = parseInt(behindRaw.trim(), 10);

      if (behind > 5) {
        vscode.window
          .showWarningMessage(
            `Git Watchdog: Your branch "${currentBranch}" is ${behind} commits behind ${upstream}. Consider pulling to avoid merge conflicts.`,
            "Pull Now",
          )
          .then((selection) => {
            if (selection === "Pull Now") {
              const terminal = vscode.window.createTerminal("git pull");
              terminal.show();
              terminal.sendText("git pull");
            }
          });
      }
    } catch {
      // Fetch failed or no remote — not critical
    }
  }

  private runGitCommand(cwd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const git = cp.spawn("git", args, { cwd });
      let output = "";
      let error = "";

      git.stdout.on("data", (data) => {
        output += data.toString();
      });

      git.stderr.on("data", (data) => {
        error += data.toString();
      });

      git.on("close", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Git command failed: ${error}`));
        }
      });
    });
  }
}
