import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { AgentService } from "./agent-state";
import { ChatHistoryManager } from "./chat-history-manager";

export interface StandupReport {
  lastContext: string[];
  modifiedFiles: string[];
  activeErrors: { file: string; message: string; severity: string }[];
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

    // 4. Generate Greeting
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
      greeting,
    };

    // Show the report
    this.showReport(report);

    return report;
  }

  private showReport(report: StandupReport): void {
    this.outputChannel.clear();
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine(`       CODEBUDDY DAILY STANDUP            `);
    this.outputChannel.appendLine("==========================================");
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine(report.greeting);
    this.outputChannel.appendLine("");
    
    this.outputChannel.appendLine("--- 🧠 Recent Context (Last 3 User Prompts) ---");
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
        report.modifiedFiles.forEach(file => {
            this.outputChannel.appendLine(`- ${file}`);
        });
    } else {
        this.outputChannel.appendLine("No active file modifications detected.");
    }
    this.outputChannel.appendLine("");

    this.outputChannel.appendLine("--- 🚨 Active Errors (Top 5) ---");
    if (report.activeErrors.length > 0) {
        report.activeErrors.forEach(err => {
            this.outputChannel.appendLine(`[${err.file}] ${err.message}`);
        });
    } else {
        this.outputChannel.appendLine("No active errors detected. Great job! 🎉");
    }
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine("==========================================");

    // Show information message
    vscode.window.showInformationMessage(
        `Daily Standup: ${report.modifiedFiles.length} files modified, ${report.activeErrors.length} errors.`,
        "View Report"
    ).then(selection => {
        if (selection === "View Report") {
            this.outputChannel.show(true);
        }
    });
  }
}
