import * as vscode from "vscode";
import { Logger } from "../../infrastructure/logger/logger";
import { GitService } from "../git.service";

export class EndOfDaySummaryTask {
  private logger: Logger;
  private outputChannel: vscode.OutputChannel;
  private gitService: GitService;

  constructor(deps?: { logger?: Logger; gitService?: GitService }) {
    this.logger = deps?.logger ?? Logger.initialize("EndOfDaySummaryTask", {});
    this.outputChannel = vscode.window.createOutputChannel(
      "CodeBuddy Daily Summary",
    );
    this.gitService = deps?.gitService ?? GitService.getInstance();
  }

  public async execute(): Promise<void> {
    this.logger.info("Generating End-of-Day Summary...");

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const today = new Date();

    // 1. Commits today
    const commits = await this.getTodaysCommits(rootPath);

    // 2. Files touched today
    const filesTouched = await this.getFilesTouchedToday(rootPath);

    // 3. Current error count
    // Cap iteration to avoid perf issues in large workspaces.
    const MAX_DIAGNOSTICS = 500;
    let errorCount = 0;
    outer: for (const [, diagnostics] of vscode.languages.getDiagnostics()) {
      for (const diag of diagnostics) {
        if (diag.severity === vscode.DiagnosticSeverity.Error) {
          errorCount++;
          if (errorCount >= MAX_DIAGNOSTICS) break outer;
        }
      }
    }

    // 4. Lines changed today
    const linesChanged = await this.getLinesChangedToday(rootPath);

    // 5. Current branch
    let currentBranch = "";
    try {
      currentBranch = (
        await this.gitService.runGitCommand(rootPath, [
          "rev-parse",
          "--abbrev-ref",
          "HEAD",
        ])
      ).trim();
    } catch {
      // not a git repo
    }

    // 6. Uncommitted changes
    let uncommittedCount = 0;
    try {
      const status = await this.gitService.runGitCommand(rootPath, [
        "status",
        "--porcelain",
      ]);
      uncommittedCount = status
        .split("\n")
        .filter((l) => l.trim().length > 0).length;
    } catch {
      // ignore
    }

    // Build the report
    this.outputChannel.clear();
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine("       END-OF-DAY SUMMARY");
    this.outputChannel.appendLine(
      `       ${today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
    );
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine("");

    if (currentBranch) {
      this.outputChannel.appendLine(`Branch: ${currentBranch}`);
      this.outputChannel.appendLine("");
    }

    // Commits
    this.outputChannel.appendLine(`📦 Commits Today: ${commits.length}`);
    if (commits.length > 0) {
      commits.forEach((c) => {
        this.outputChannel.appendLine(`  ${c}`);
      });
    } else {
      this.outputChannel.appendLine("  No commits today.");
    }
    this.outputChannel.appendLine("");

    // Lines changed
    if (linesChanged) {
      this.outputChannel.appendLine(`📊 Lines Changed: ${linesChanged}`);
      this.outputChannel.appendLine("");
    }

    // Files touched
    this.outputChannel.appendLine(`📝 Files Touched: ${filesTouched.length}`);
    if (filesTouched.length > 0) {
      filesTouched.slice(0, 20).forEach((f) => {
        this.outputChannel.appendLine(`  ${f}`);
      });
      if (filesTouched.length > 20) {
        this.outputChannel.appendLine(
          `  ... and ${filesTouched.length - 20} more`,
        );
      }
    }
    this.outputChannel.appendLine("");

    // Status
    this.outputChannel.appendLine("📋 Status:");
    this.outputChannel.appendLine(
      `  Active errors: ${errorCount === 0 ? "None 🎉" : errorCount}`,
    );
    this.outputChannel.appendLine(
      `  Uncommitted files: ${uncommittedCount === 0 ? "None ✅" : uncommittedCount}`,
    );
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine("Great work today! See you tomorrow. 🌙");

    // Build markdown for clipboard
    const markdown = this.toMarkdown(
      today,
      currentBranch,
      commits,
      filesTouched,
      linesChanged,
      errorCount,
      uncommittedCount,
    );

    // Notification
    const commitWord = commits.length === 1 ? "commit" : "commits";
    const summary = `End of Day: ${commits.length} ${commitWord}, ${filesTouched.length} files touched${errorCount > 0 ? `, ${errorCount} errors remaining` : ""}`;

    vscode.window
      .showInformationMessage(summary, "View Summary", "Copy as Markdown")
      .then((selection) => {
        if (selection === "View Summary") {
          this.outputChannel.show(true);
        } else if (selection === "Copy as Markdown") {
          vscode.env.clipboard.writeText(markdown);
          vscode.window.showInformationMessage(
            "Daily summary copied to clipboard.",
          );
        }
      });
  }

  private async getTodaysCommits(rootPath: string): Promise<string[]> {
    try {
      const raw = await this.gitService.runGitCommand(rootPath, [
        "log",
        "--since=midnight",
        "--oneline",
        "--no-merges",
      ]);
      return raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } catch {
      return [];
    }
  }

  private async getFilesTouchedToday(rootPath: string): Promise<string[]> {
    try {
      const raw = await this.gitService.runGitCommand(rootPath, [
        "log",
        "--since=midnight",
        "--pretty=format:",
        "--name-only",
        "--diff-filter=ACMR",
      ]);
      const files = [
        ...new Set(
          raw
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0),
        ),
      ];
      return files;
    } catch {
      return [];
    }
  }

  private async getLinesChangedToday(rootPath: string): Promise<string | null> {
    try {
      const raw = await this.gitService.runGitCommand(rootPath, [
        "log",
        "--since=midnight",
        "--pretty=format:",
        "--shortstat",
      ]);
      // Aggregate insertions and deletions
      let totalInsertions = 0;
      let totalDeletions = 0;
      raw.split("\n").forEach((line) => {
        const insertMatch = line.match(/(\d+) insertion/);
        const deleteMatch = line.match(/(\d+) deletion/);
        if (insertMatch) totalInsertions += parseInt(insertMatch[1], 10);
        if (deleteMatch) totalDeletions += parseInt(deleteMatch[1], 10);
      });

      if (totalInsertions === 0 && totalDeletions === 0) return null;
      return `+${totalInsertions} / -${totalDeletions}`;
    } catch {
      return null;
    }
  }

  private toMarkdown(
    date: Date,
    branch: string,
    commits: string[],
    filesTouched: string[],
    linesChanged: string | null,
    errorCount: number,
    uncommittedCount: number,
  ): string {
    const lines: string[] = [];
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    lines.push(`## Daily Summary — ${dateStr}`);
    lines.push("");

    if (branch) {
      lines.push(`**Branch:** \`${branch}\``);
      lines.push("");
    }

    lines.push(`### Commits (${commits.length})`);
    if (commits.length > 0) {
      commits.forEach((c) => lines.push(`- ${c}`));
    } else {
      lines.push("- No commits today");
    }
    lines.push("");

    if (linesChanged) {
      lines.push(`**Lines changed:** ${linesChanged}`);
      lines.push("");
    }

    lines.push(`### Files Touched (${filesTouched.length})`);
    filesTouched.slice(0, 15).forEach((f) => lines.push(`- \`${f}\``));
    if (filesTouched.length > 15) {
      lines.push(`- ... and ${filesTouched.length - 15} more`);
    }
    lines.push("");

    lines.push("### Status");
    lines.push(`- Errors: ${errorCount === 0 ? "None" : errorCount}`);
    lines.push(
      `- Uncommitted: ${uncommittedCount === 0 ? "None" : uncommittedCount}`,
    );

    return lines.join("\n");
  }
}
