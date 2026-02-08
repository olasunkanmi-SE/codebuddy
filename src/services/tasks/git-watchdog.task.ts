import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import { Logger } from "../../infrastructure/logger/logger";

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
      // Check for uncommitted changes
      const status = await this.runGitCommand(rootPath, [
        "status",
        "--porcelain",
      ]);

      if (!status || status.trim() === "") {
        this.logger.info("No uncommitted changes found.");
        return;
      }

      // Check time of last commit
      const lastCommitTimeStr = await this.runGitCommand(rootPath, [
        "log",
        "-1",
        "--format=%ct",
      ]);

      if (!lastCommitTimeStr) {
        return;
      }

      const lastCommitTime = parseInt(lastCommitTimeStr.trim(), 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const diffSeconds = currentTime - lastCommitTime;
      const diffHours = diffSeconds / 3600;

      // If changes exist and last commit was > 2 hours ago
      if (diffHours > 2) {
        const message = `CodeBuddy Watchdog: You have uncommitted changes and haven't committed in ${diffHours.toFixed(1)} hours. Want to stage and commit?`;

        const selection = await vscode.window.showInformationMessage(
          message,
          "Open Source Control",
          "Snooze",
        );

        if (selection === "Open Source Control") {
          vscode.commands.executeCommand("workbench.view.scm");
        }
      }
    } catch (error) {
      this.logger.error("Error in Git Watchdog", error);
    }
  }

  private runGitCommand(cwd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use system git
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
