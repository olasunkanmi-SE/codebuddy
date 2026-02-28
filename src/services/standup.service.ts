import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";
import { AgentService } from "./agent-state";
import { ChatHistoryManager } from "./chat-history-manager";

export interface GitSummary {
  branch: string;
  recentCommits: string[];
  diffStat: string;
  uncommittedChanges: string[];
}

export interface StandupReport {
  lastContext: string[];
  modifiedFiles: string[];
  activeErrors: { file: string; message: string; severity: string }[];
  jiraTickets: string[];
  gitlabIssues: string[];
  gitSummary: GitSummary;
  greeting: string;
}

export class StandupService {
  private static instance: StandupService;
  private logger: Logger;
  private agentService: AgentService;

  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.logger = Logger.initialize("StandupService", {});
    this.agentService = AgentService.getInstance();
    this.outputChannel = vscode.window.createOutputChannel("CodeBuddy Standup");
  }

  public static getInstance(): StandupService {
    if (!StandupService.instance) {
      StandupService.instance = new StandupService();
    }
    return StandupService.instance;
  }

  public async generateReport(): Promise<StandupReport> {
    this.logger.info("Generating Daily Standup Report...");

    // 1. Get Last Context (Recent Chat History)
    // Assuming 'default' agent or finding the most recent one
    const agentId = "default";
    let lastContext: string[] = [];
    try {
      const history = await this.agentService.getChatHistory(agentId);
      if (history) {
        lastContext = history
          .filter((msg: any) => msg.role === "user")
          .slice(-3)
          .map((msg: any) => {
            const content =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);
            return (
              content.substring(0, 100) + (content.length > 100 ? "..." : "")
            );
          });
      }
    } catch (e) {
      this.logger.warn("Could not fetch chat history for standup", e);
    }

    // 2. Get Modified Files (Git Status - simplified via dirty files)
    // Ideally we check git status, but for now we check open dirty files or recent edits if we tracked them.
    // Let's use dirty files for "Active Work"
    const modifiedFiles = vscode.workspace.textDocuments
      .filter((doc) => doc.isDirty)
      .map((doc) => vscode.workspace.asRelativePath(doc.uri));

    // 3. Get Active Errors
    const activeErrors: { file: string; message: string; severity: string }[] =
      [];
    vscode.languages.getDiagnostics().forEach(([uri, diagnostics]) => {
      diagnostics.forEach((diag) => {
        if (diag.severity === vscode.DiagnosticSeverity.Error) {
          activeErrors.push({
            file: vscode.workspace.asRelativePath(uri),
            message: diag.message,
            severity: "Error",
          });
        }
      });
    });

    // 4. Get Git Summary (branch, recent commits, diff stats)
    const gitSummary = await this.getGitSummary();

    // 5. Get Jira Tickets
    const jiraTickets = await this.getJiraTickets();

    // 6. Get GitLab Issues
    const gitlabIssues = await this.getGitLabIssues();

    // 7. Generate Greeting
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const greeting = `${timeGreeting}! Ready to co-work? Here is your daily standup.`;

    const report: StandupReport = {
      lastContext,
      modifiedFiles,
      activeErrors: activeErrors.slice(0, 5),
      jiraTickets,
      gitlabIssues,
      gitSummary,
      greeting,
    };

    // Show the report
    this.showReport(report);

    return report;
  }

  private async getGitSummary(): Promise<GitSummary> {
    const empty: GitSummary = {
      branch: "",
      recentCommits: [],
      diffStat: "",
      uncommittedChanges: [],
    };

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return empty;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    try {
      // Current branch
      const branch = (
        await this.runGitCommand(rootPath, [
          "rev-parse",
          "--abbrev-ref",
          "HEAD",
        ])
      ).trim();

      // Recent commits (last 24h)
      const recentCommitsRaw = await this.runGitCommand(rootPath, [
        "log",
        "--since=24 hours ago",
        "--oneline",
        "--no-merges",
        "--max-count=10",
      ]);
      const recentCommits = recentCommitsRaw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Diff stat (what changed since yesterday)
      let diffStat = "";
      try {
        diffStat = (
          await this.runGitCommand(rootPath, ["diff", "--stat", "HEAD~1", "--"])
        ).trim();
      } catch {
        // No previous commit or shallow clone
      }

      // Uncommitted changes with file-level detail
      const statusRaw = await this.runGitCommand(rootPath, [
        "status",
        "--porcelain",
      ]);
      const uncommittedChanges = statusRaw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, 15);

      return { branch, recentCommits, diffStat, uncommittedChanges };
    } catch (e) {
      this.logger.warn("Could not fetch git summary for standup", e);
      return empty;
    }
  }

  private runGitCommand(cwd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const git = cp.spawn("git", args, { cwd });
      let output = "";
      let error = "";

      git.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      git.stderr.on("data", (data: Buffer) => {
        error += data.toString();
      });

      git.on("close", (code: number | null) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Git command failed: ${error}`));
        }
      });
    });
  }

  private async getJiraTickets(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const binPath = path.join(rootPath, ".codebuddy", "bin", "jira");

    if (!fs.existsSync(binPath)) {
      return [];
    }

    return new Promise((resolve) => {
      // List issues assigned to current user
      // We use '-a me' to filter for the authenticated user
      cp.exec(
        `${binPath} issue list --plain --limit 5 -a me`,
        { cwd: rootPath },
        (err, stdout, stderr) => {
          if (err) {
            // Fallback: try without '-a me' if it fails (e.g. 'me' not supported)
            cp.exec(
              `${binPath} issue list --plain --limit 5`,
              { cwd: rootPath },
              (err2, stdout2) => {
                if (err2) {
                  this.logger.warn("Error fetching Jira tickets", err2);
                  resolve([]);
                  return;
                }
                this.processJiraOutput(stdout2, resolve);
              },
            );
            return;
          }
          this.processJiraOutput(stdout, resolve);
        },
      );
    });
  }

  private processJiraOutput(
    stdout: string,
    resolve: (value: string[]) => void,
  ) {
    const lines = stdout
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 5); // Take top 5

    resolve(lines);
  }

  private async getGitLabIssues(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Find glab
    let glabPath = "glab";
    const localBinPath = path.join(rootPath, ".codebuddy", "bin", "glab");
    if (fs.existsSync(localBinPath)) {
      glabPath = localBinPath;
    }

    return new Promise((resolve) => {
      // List issues assigned to me
      // glab issue list --assignee @me --per-page 5
      cp.exec(
        `${glabPath} issue list --assignee @me --per-page 5`,
        { cwd: rootPath },
        (err, stdout, stderr) => {
          if (err) {
            // If glab not found or error, just return empty
            // We don't want to spam logs if they don't use GitLab
            resolve([]);
            return;
          }
          const lines = stdout
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .slice(0, 5);
          resolve(lines);
        },
      );
    });
  }

  private showReport(report: StandupReport): void {
    this.outputChannel.clear();
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine(`       CODEBUDDY DAILY STANDUP            `);
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine(report.greeting);
    this.outputChannel.appendLine("");

    // Git Summary
    if (report.gitSummary.branch) {
      this.outputChannel.appendLine("--- 🌿 Git Summary ---");
      this.outputChannel.appendLine(`Branch: ${report.gitSummary.branch}`);
      if (report.gitSummary.recentCommits.length > 0) {
        this.outputChannel.appendLine(`\nRecent Commits (last 24h):`);
        report.gitSummary.recentCommits.forEach((c) => {
          this.outputChannel.appendLine(`  ${c}`);
        });
      } else {
        this.outputChannel.appendLine("No commits in the last 24 hours.");
      }
      if (report.gitSummary.diffStat) {
        this.outputChannel.appendLine(`\nDiff Stats:`);
        this.outputChannel.appendLine(report.gitSummary.diffStat);
      }
      if (report.gitSummary.uncommittedChanges.length > 0) {
        this.outputChannel.appendLine(
          `\nUncommitted Changes (${report.gitSummary.uncommittedChanges.length}):`,
        );
        report.gitSummary.uncommittedChanges.forEach((f) => {
          this.outputChannel.appendLine(`  ${f}`);
        });
      }
      this.outputChannel.appendLine("");
    }

    this.outputChannel.appendLine(
      "--- 🧠 Recent Context (Last 3 User Prompts) ---",
    );
    if (report.lastContext.length > 0) {
      report.lastContext.forEach((ctx, index) => {
        this.outputChannel.appendLine(`${index + 1}. ${ctx}`);
      });
    } else {
      this.outputChannel.appendLine("No recent context found.");
    }
    this.outputChannel.appendLine("");

    this.outputChannel.appendLine("--- 📝 Active Work (Dirty Files) ---");
    if (report.modifiedFiles.length > 0) {
      report.modifiedFiles.forEach((file) => {
        this.outputChannel.appendLine(`- ${file}`);
      });
    } else {
      this.outputChannel.appendLine("No active file modifications detected.");
    }
    this.outputChannel.appendLine("");

    if (report.jiraTickets.length > 0) {
      this.outputChannel.appendLine("--- 🎫 Jira Tickets (Recent) ---");
      report.jiraTickets.forEach((ticket) => {
        this.outputChannel.appendLine(`- ${ticket}`);
      });
      this.outputChannel.appendLine("");
    }

    if (report.gitlabIssues.length > 0) {
      this.outputChannel.appendLine("--- 🦊 GitLab Issues (Recent) ---");
      report.gitlabIssues.forEach((issue) => {
        this.outputChannel.appendLine(`- ${issue}`);
      });
      this.outputChannel.appendLine("");
    }

    this.outputChannel.appendLine("--- 🚨 Active Errors (Top 5) ---");
    if (report.activeErrors.length > 0) {
      report.activeErrors.forEach((err) => {
        this.outputChannel.appendLine(`[${err.file}] ${err.message}`);
      });
    } else {
      this.outputChannel.appendLine("No active errors detected. Great job! 🎉");
    }
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine("==========================================");

    // Show information message with actions
    const commitCount = report.gitSummary.recentCommits.length;
    const uncommitted = report.gitSummary.uncommittedChanges.length;
    const summary = [
      `${commitCount} commits today`,
      `${report.modifiedFiles.length} files in progress`,
      `${report.activeErrors.length} errors`,
      uncommitted > 0 ? `${uncommitted} uncommitted` : null,
    ]
      .filter(Boolean)
      .join(", ");

    vscode.window
      .showInformationMessage(
        `Daily Standup: ${summary}`,
        "View Report",
        "Copy as Markdown",
      )
      .then((selection) => {
        if (selection === "View Report") {
          this.outputChannel.show(true);
        } else if (selection === "Copy as Markdown") {
          const markdown = this.toMarkdown(report);
          vscode.env.clipboard.writeText(markdown);
          vscode.window.showInformationMessage(
            "Standup report copied to clipboard as Markdown.",
          );
        }
      });
  }

  private toMarkdown(report: StandupReport): string {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    lines.push(`## Daily Standup — ${date}`);
    lines.push("");

    if (report.gitSummary.branch) {
      lines.push(`**Branch:** \`${report.gitSummary.branch}\``);
      lines.push("");
    }

    if (report.gitSummary.recentCommits.length > 0) {
      lines.push("### What I did");
      report.gitSummary.recentCommits.forEach((c) => {
        lines.push(`- ${c}`);
      });
      lines.push("");
    }

    if (
      report.modifiedFiles.length > 0 ||
      report.gitSummary.uncommittedChanges.length > 0
    ) {
      lines.push("### What I'm working on");
      report.modifiedFiles.forEach((f) => {
        lines.push(`- \`${f}\` (in progress)`);
      });
      if (report.gitSummary.uncommittedChanges.length > 0) {
        lines.push(
          `- ${report.gitSummary.uncommittedChanges.length} uncommitted file(s)`,
        );
      }
      lines.push("");
    }

    if (report.activeErrors.length > 0) {
      lines.push("### Blockers");
      report.activeErrors.forEach((err) => {
        lines.push(`- \`${err.file}\`: ${err.message}`);
      });
      lines.push("");
    }

    if (report.jiraTickets.length > 0) {
      lines.push("### Jira Tickets");
      report.jiraTickets.forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }

    if (report.gitlabIssues.length > 0) {
      lines.push("### GitLab Issues");
      report.gitlabIssues.forEach((i) => lines.push(`- ${i}`));
      lines.push("");
    }

    return lines.join("\n");
  }
}
