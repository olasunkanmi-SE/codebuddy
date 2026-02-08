import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";

export const createBranchFromJiraCommand = async () => {
  const logger = Logger.initialize("CreateBranchFromJira", {});
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }
  const rootPath = workspaceFolders[0].uri.fsPath;
  const jiraBinPath = path.join(rootPath, ".codebuddy", "bin", "jira");

  if (!fs.existsSync(jiraBinPath)) {
    vscode.window.showErrorMessage(
      "Jira CLI not found. Please install the 'jira' skill.",
    );
    return;
  }

  // Helper to run Jira command
  const runJira = (args: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      cp.exec(
        `${jiraBinPath} ${args}`,
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
          label: "$(person) My Tickets",
          description: "Issues assigned to me",
          id: "me",
        },
        {
          label: "$(organization) Teammate's Tickets",
          description: "Search by assignee",
          id: "teammate",
        },
        {
          label: "$(list-unordered) All Tickets",
          description: "List all open issues",
          id: "all",
        },
      ],
      { placeHolder: "Whose tickets do you want to see?" },
    );

    if (!mode) return;

    let assigneeArgs = "";

    if (mode.id === "me") {
      // Try to resolve 'me'.
      // Method 1: Try '-a me' (works in some CLI versions)
      // Method 2: Fetch 'jira me' and extract ID.

      // Let's try to fetch 'jira me' first to get a precise handle
      try {
        // 'jira me' usually outputs details. We'll look for "Email" or "Name" or "Username"
        // Or we can just try passing '-a me' and if it fails/returns nothing, we fallback.
        // However, '-a me' is the most standard 'magic' value if supported.
        assigneeArgs = "-a me";
      } catch (e) {
        logger.warn("Could not determine 'me', defaulting to no filter");
      }
    } else if (mode.id === "teammate") {
      const teammate = await vscode.window.showInputBox({
        placeHolder: "e.g. 'john.doe' or 'jdoe@example.com'",
        prompt: "Enter the teammate's Jira username or email",
      });
      if (!teammate) return;
      assigneeArgs = `-a "${teammate}"`;
    }
    // else id === 'all', no args

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Fetching Jira tickets (${mode.label})...`,
        cancellable: false,
      },
      async () => {
        try {
          // List issues
          // --plain: easy parsing
          // --limit 20: reasonable batch
          const stdout = await runJira(
            `issue list --plain --limit 20 ${assigneeArgs}`,
          );

          const lines = stdout.split("\n").filter((l) => l.trim().length > 0);
          const items: vscode.QuickPickItem[] = [];

          for (const line of lines) {
            // Skip header if present
            if (line.startsWith("TYPE") || line.startsWith("KEY")) continue;

            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              let key = "";
              let summary = "";

              // Heuristic parsing
              if (/^[A-Z]+-\d+$/.test(parts[0])) {
                key = parts[0];
                summary = parts.slice(1).join(" ");
              } else if (/^[A-Z]+-\d+$/.test(parts[1])) {
                key = parts[1];
                summary = parts.slice(2).join(" ");
              }

              if (key) {
                items.push({
                  label: key,
                  description: summary,
                  detail:
                    mode.id === "teammate"
                      ? `Assigned to ${assigneeArgs.replace("-a ", "").replace(/"/g, "")}`
                      : undefined,
                });
              }
            }
          }

          if (items.length === 0) {
            vscode.window.showInformationMessage(
              `No tickets found for selection: ${mode.label}`,
            );
            return;
          }

          const selected = await vscode.window.showQuickPick(items, {
            placeHolder:
              "Select a ticket to start working on (creates a branch)",
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
                  description: "View ticket in Jira",
                  id: "browser",
                },
              ],
              { placeHolder: `Action for ${selected.label}` },
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
              // Open in browser: jira issue view <KEY> --web
              cp.exec(`${jiraBinPath} issue view ${selected.label} --web`, {
                cwd: rootPath,
              });
            }
          }
        } catch (err: any) {
          logger.error("Failed to fetch tickets", err);
          vscode.window.showErrorMessage(`Failed to fetch tickets: ${err}`);
        }
      },
    );
  } catch (error) {
    logger.error("Error in createBranchFromJiraCommand", error);
  }
};
