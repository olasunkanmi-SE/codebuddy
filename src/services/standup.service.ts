import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import * as fs from "fs";
import { Logger } from "../infrastructure/logger/logger";
import { AgentService } from "./agent-state";
import { ChatHistoryManager } from "./chat-history-manager";

export interface StandupReport {
  lastContext: string[];
  modifiedFiles: string[];
  activeErrors: { file: string; message: string; severity: string }[];
  jiraTickets: string[];
  gitlabIssues: string[];
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

    // 4. Get Jira Tickets
    const jiraTickets = await this.getJiraTickets();

    // 5. Get GitLab Issues
    const gitlabIssues = await this.getGitLabIssues();

    // 6. Generate Greeting
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const greeting = `${timeGreeting}! Ready to co-work? Here is your daily standup.`;

    const report = {
      lastContext,
      modifiedFiles,
      activeErrors: activeErrors.slice(0, 5),
      jiraTickets,
      gitlabIssues,
      greeting,
    };

    // Show the report
    this.showReport(report);

    return report;
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

    // Show information message
    vscode.window
      .showInformationMessage(
        `Daily Standup: ${report.modifiedFiles.length} files modified, ${report.activeErrors.length} errors.`,
        "View Report",
      )
      .then((selection) => {
        if (selection === "View Report") {
          this.outputChannel.show(true);
        }
      });
  }
}
