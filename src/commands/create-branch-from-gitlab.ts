import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";

export const createBranchFromGitLabCommand = async () => {
  const logger = Logger.initialize("CreateBranchFromGitLab", {});
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }
  const rootPath = workspaceFolders[0].uri.fsPath;

  // Find glab executable
  let glabPath = "glab"; // Default to global
  const localBinPath = path.join(rootPath, ".codebuddy", "bin", "glab");

  if (fs.existsSync(localBinPath)) {
    glabPath = localBinPath;
  } else {
    // Check if glab is in PATH (simple check)
    try {
      cp.execSync("glab --version", { cwd: rootPath });
    } catch (e) {
      const installOption = "Install Guide";
      const selection = await vscode.window.showErrorMessage(
        "GitLab CLI (glab) not found. Please install it to use this feature.",
        installOption,
      );
      if (selection === installOption) {
        vscode.env.openExternal(
          vscode.Uri.parse("https://gitlab.com/gitlab-org/cli#installation"),
        );
      }
      return;
    }
  }

  // Helper to run Glab command
  const runGlab = (args: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      cp.exec(
        `${glabPath} ${args}`,
        { cwd: rootPath },
        (err, stdout, stderr) => {
          if (err) {
            reject(stderr || err.message);
          } else {
            resolve(stdout);
          }
        },
      );
    });
  };

  try {
    // Step 1: Choose Source
    const mode = await vscode.window.showQuickPick(
      [
        {
          label: "$(person) My Issues",
          description: "Issues assigned to me",
          id: "me",
        },
        {
          label: "$(organization) Teammate's Issues",
          description: "Search by assignee",
          id: "teammate",
        },
        {
          label: "$(list-unordered) All Issues",
          description: "List all open issues",
          id: "all",
        },
      ],
      { placeHolder: "Whose issues do you want to see?" },
    );

    if (!mode) return;

    let assigneeArgs = "";

    if (mode.id === "me") {
      assigneeArgs = "--assignee @me";
    } else if (mode.id === "teammate") {
      const teammate = await vscode.window.showInputBox({
        placeHolder: "e.g. 'jdoe'",
        prompt: "Enter the teammate's GitLab username",
      });
      if (!teammate) return;
      assigneeArgs = `--assignee "${teammate}"`;
    }
    // else id === 'all', no args

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Fetching GitLab issues (${mode.label})...`,
        cancellable: false,
      },
      async () => {
        try {
          // List issues
          // glab issue list --per-page 20
          const stdout = await runGlab(
            `issue list --per-page 20 ${assigneeArgs}`,
          );

          const lines = stdout.split("\n").filter((l) => l.trim().length > 0);
          const items: vscode.QuickPickItem[] = [];

          for (const line of lines) {
            // Output format is usually: #ID  Title  Labels  Time
            // e.g. #123  Fix login bug  (bug)  2h ago
            const match = line.match(/^#(\d+)\s+(.+?)\s+(\(.+\))?\s+\d+/);
            // Or simplified: just split by tab or regex
            // Actually glab output is tabular but space separated.
            // Let's look for #\d+ at start

            const idMatch = line.trim().match(/^#(\d+)\s+(.*)/);
            if (idMatch) {
              const id = idMatch[1];
              const rest = idMatch[2];

              // Try to clean up "rest" (remove time, labels if possible)
              // This is heuristics based.

              items.push({
                label: id,
                description: rest,
                detail:
                  mode.id === "teammate"
                    ? `Assigned to ${assigneeArgs}`
                    : undefined,
              });
            }
          }

          if (items.length === 0) {
            // Try parsing JSON if table parsing failed?
            // Or maybe no issues.
            vscode.window.showInformationMessage(
              `No issues found for selection: ${mode.label}`,
            );
            return;
          }

          const selected = await vscode.window.showQuickPick(items, {
            placeHolder: "Select an issue to start working on",
          });

          if (selected) {
            const cleanSummary = (selected.description || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .substring(0, 50);

            const branchName = `feature/${selected.label}-${cleanSummary}`;

            const action = await vscode.window.showQuickPick(
              [
                {
                  label: "$(git-branch) Create Branch",
                  description: `Checkout ${branchName}`,
                  id: "branch",
                },
                {
                  label: "$(browser) Open in Browser",
                  description: "View issue in GitLab",
                  id: "browser",
                },
              ],
              { placeHolder: `Action for Issue #${selected.label}` },
            );

            if (action?.id === "branch") {
              const confirmName = await vscode.window.showInputBox({
                value: branchName,
                prompt: "Confirm branch name",
              });

              if (confirmName) {
                cp.exec(
                  `git checkout -b ${confirmName}`,
                  { cwd: rootPath },
                  (gitErr, gitOut, gitStderr) => {
                    if (gitErr) {
                      vscode.window.showErrorMessage(
                        `Failed to create branch: ${gitStderr || gitErr.message}`,
                      );
                    } else {
                      vscode.window.showInformationMessage(
                        `Created and checked out branch: ${confirmName}`,
                      );
                    }
                  },
                );
              }
            } else if (action?.id === "browser") {
              // glab issue view <ID> --web
              cp.exec(`${glabPath} issue view ${selected.label} --web`, {
                cwd: rootPath,
              });
            }
          }
        } catch (err: any) {
          logger.error("Failed to fetch issues", err);
          vscode.window.showErrorMessage(`Failed to fetch issues: ${err}`);
        }
      },
    );
  } catch (error) {
    logger.error("Error in createBranchFromGitLabCommand", error);
  }
};
