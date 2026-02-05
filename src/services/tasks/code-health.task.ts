import { Logger } from "../../infrastructure/logger/logger";
import { PersistentCodebaseUnderstandingService } from "../persistent-codebase-understanding.service";
import * as vscode from "vscode";

export class CodeHealthTask {
  private logger: Logger;

  constructor() {
    this.logger = Logger.initialize("CodeHealthTask", {});
  }

  public async execute(): Promise<void> {
    this.logger.info("Running Code Health Check...");

    // 1. Analyze Cache Status
    const pcu = PersistentCodebaseUnderstandingService.getInstance();
    const summary = await pcu.getAnalysisSummary();

    // 2. Scan for TODOs (simplified)
    const todos = await vscode.workspace.findFiles("**/*.{ts,js,py,tsx}");
    // (This is heavy for a background task, maybe we just sample or rely on other services)

    // For now, let's just surface a "Daily Digest" notification if the user hasn't analyzed code recently.
    if (
      !summary.lastAnalysis ||
      Date.now() - new Date(summary.lastAnalysis).getTime() >
        24 * 60 * 60 * 1000
    ) {
      vscode.window
        .showInformationMessage(
          "CodeBuddy Auto-Assist: It's been 24h since the last codebase analysis. Would you like me to refresh the index while you grab a coffee?",
          "Yes, Refresh Index",
          "Not Now",
        )
        .then((selection) => {
          if (selection === "Yes, Refresh Index") {
            vscode.commands.executeCommand("CodeBuddy.refreshAnalysis");
          }
        });
    }

    // 3. Remind about uncommitted changes (if Git extension is available)
    // We can check git extension API here.
  }
}
