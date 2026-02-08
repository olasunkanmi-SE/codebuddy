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

    // 1. Check Index Freshness
    const pcu = PersistentCodebaseUnderstandingService.getInstance();
    const summary = await pcu.getAnalysisSummary();
    const needsRefresh =
      !summary.lastAnalysis ||
      Date.now() - new Date(summary.lastAnalysis).getTime() >
        24 * 60 * 60 * 1000;

    // 2. Scan for Tech Debt (TODOs and Large Files)
    // Limit to 50 files to avoid performance impact
    const files = await vscode.workspace.findFiles(
      "**/*.{ts,js,py,tsx,java,go,rs}",
      "**/node_modules/**",
      50,
    );

    let todoCount = 0;
    let largeFileCount = 0;
    const largeFileThreshold = 300; // lines

    for (const file of files) {
      try {
        const doc = await vscode.workspace.openTextDocument(file);
        const text = doc.getText();

        // Simple string match is faster than regex for counting
        const matches = text.match(/TODO:|FIXME:|HACK:/g);
        if (matches) {
          todoCount += matches.length;
        }

        if (doc.lineCount > largeFileThreshold) {
          largeFileCount++;
        }
      } catch (e) {
        // Ignore errors opening files
      }
    }

    // 3. Construct Report Message
    const parts = [];
    if (needsRefresh) parts.push("Index is outdated");
    if (todoCount > 0) parts.push(`${todoCount} TODOs found`);
    if (largeFileCount > 0)
      parts.push(
        `${largeFileCount} large files (> ${largeFileThreshold} lines)`,
      );

    if (parts.length > 0) {
      const message = `Code Health: ${parts.join(", ")}.`;

      vscode.window
        .showInformationMessage(
          message,
          needsRefresh ? "Refresh Index" : "View Details",
          "Dismiss",
        )
        .then((selection) => {
          if (selection === "Refresh Index") {
            vscode.commands.executeCommand("CodeBuddy.refreshAnalysis");
          } else if (selection === "View Details") {
            // Could open a virtual doc or output channel
            this.showHealthDetails(todoCount, largeFileCount, needsRefresh);
          }
        });
    }
  }

  private showHealthDetails(
    todoCount: number,
    largeFileCount: number,
    needsRefresh: boolean,
  ) {
    const output = vscode.window.createOutputChannel("CodeBuddy Health");
    output.show();
    output.appendLine("=== CODE HEALTH REPORT ===");
    output.appendLine(`Generated: ${new Date().toLocaleString()}`);
    output.appendLine("");
    output.appendLine(
      `Index Status: ${needsRefresh ? "Outdated (Needs Refresh)" : "Healthy"}`,
    );
    output.appendLine(`Tech Debt Indicators (Sampled):`);
    output.appendLine(`- TODO/FIXME/HACK count: ${todoCount}`);
    output.appendLine(`- Large Files (>300 lines): ${largeFileCount}`);
    output.appendLine("");
    output.appendLine(
      "Tip: Frequent TODOs often indicate areas needing refactoring.",
    );
  }
}
