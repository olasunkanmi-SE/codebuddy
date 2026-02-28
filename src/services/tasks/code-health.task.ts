import { Logger } from "../../infrastructure/logger/logger";
import { PersistentCodebaseUnderstandingService } from "../persistent-codebase-understanding.service";
import { SqliteDatabaseService } from "../sqlite-database.service";
import * as vscode from "vscode";
import * as cp from "child_process";

interface TodoItem {
  file: string;
  line: number;
  type: string;
  text: string;
}

interface HealthSnapshot {
  todoCount: number;
  largeFileCount: number;
  avgFunctionsPerFile: number;
  hotspotCount: number;
}

export class CodeHealthTask {
  private logger: Logger;
  private outputChannel: vscode.OutputChannel;
  private dbService: SqliteDatabaseService;

  constructor() {
    this.logger = Logger.initialize("CodeHealthTask", {});
    this.outputChannel = vscode.window.createOutputChannel("CodeBuddy Health");
    this.dbService = SqliteDatabaseService.getInstance();
    this.ensureHealthTable();
  }

  private ensureHealthTable(): void {
    try {
      this.dbService.executeSqlCommand(`
        CREATE TABLE IF NOT EXISTS health_snapshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          todo_count INTEGER DEFAULT 0,
          large_file_count INTEGER DEFAULT 0,
          avg_complexity REAL DEFAULT 0,
          hotspot_count INTEGER DEFAULT 0
        )
      `);
    } catch (e) {
      this.logger.warn("Could not create health_snapshots table", e);
    }
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

    // 2. Scan for Tech Debt (TODOs and Large Files) — increased to 200 files
    const files = await vscode.workspace.findFiles(
      "**/*.{ts,js,py,tsx,jsx,java,go,rs,rb,cs}",
      "{**/node_modules/**,**/dist/**,**/out/**,**/build/**}",
      200,
    );

    let todoCount = 0;
    let largeFileCount = 0;
    const largeFileThreshold = 300;
    const todoItems: TodoItem[] = [];
    const largeFiles: { file: string; lines: number }[] = [];
    const functionLengths: number[] = [];

    for (const file of files) {
      try {
        const doc = await vscode.workspace.openTextDocument(file);
        const text = doc.getText();
        const relPath = vscode.workspace.asRelativePath(file);

        // Collect TODO locations with context
        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/(TODO|FIXME|HACK):\s*(.*)/);
          if (match) {
            todoCount++;
            if (todoItems.length < 50) {
              todoItems.push({
                file: relPath,
                line: i + 1,
                type: match[1],
                text: match[2].trim().substring(0, 80),
              });
            }
          }
        }

        // Large file detection
        if (doc.lineCount > largeFileThreshold) {
          largeFileCount++;
          largeFiles.push({ file: relPath, lines: doc.lineCount });
        }

        // Simple function length heuristic (count lines between function boundaries)
        const funcMatches = text.match(
          /(?:function\s+\w+|(?:async\s+)?(?:\w+)\s*\(.*\)\s*(?::\s*\w+)?\s*\{)/g,
        );
        if (funcMatches) {
          functionLengths.push(funcMatches.length);
        }
      } catch (e) {
        // Ignore errors opening files
      }
    }

    // Sort large files by size descending
    largeFiles.sort((a, b) => b.lines - a.lines);

    // 3. Detect hotspots via git log churn
    const hotspots = await this.getGitHotspots();

    // 4. Calculate average functions per file
    const avgFunctionsPerFile =
      functionLengths.length > 0
        ? functionLengths.reduce((a, b) => a + b, 0) / functionLengths.length
        : 0;

    // 5. Store snapshot for trend tracking
    const snapshot: HealthSnapshot = {
      todoCount,
      largeFileCount,
      avgFunctionsPerFile: Math.round(avgFunctionsPerFile * 10) / 10,
      hotspotCount: hotspots.length,
    };
    this.storeSnapshot(snapshot);

    // 6. Get trend data
    const trend = this.getTrend();

    // 7. Construct Report
    this.showHealthDetails(
      needsRefresh,
      todoCount,
      todoItems,
      largeFileCount,
      largeFiles,
      hotspots,
      snapshot,
      trend,
    );

    // Summary notification
    const parts = [];
    if (needsRefresh) parts.push("Index outdated");
    if (todoCount > 0) parts.push(`${todoCount} TODOs`);
    if (largeFileCount > 0) parts.push(`${largeFileCount} large files`);
    if (hotspots.length > 0) parts.push(`${hotspots.length} hotspots`);
    if (trend) parts.push(trend);

    if (parts.length > 0) {
      const message = `Code Health: ${parts.join(", ")}.`;

      vscode.window
        .showInformationMessage(
          message,
          needsRefresh ? "Refresh Index" : "View Report",
          "View Report",
        )
        .then((selection) => {
          if (selection === "Refresh Index") {
            vscode.commands.executeCommand("CodeBuddy.refreshAnalysis");
          } else if (selection === "View Report") {
            this.outputChannel.show(true);
          }
        });
    } else {
      vscode.window.showInformationMessage(
        "Code Health: Everything looks clean! 🎉",
      );
    }
  }

  private async getGitHotspots(): Promise<{ file: string; changes: number }[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];

    const rootPath = workspaceFolders[0].uri.fsPath;

    try {
      const result = await new Promise<string>((resolve, reject) => {
        cp.exec(
          'git log --since="30 days ago" --pretty=format: --name-only --diff-filter=ACMR | sort | uniq -c | sort -rn | head -10',
          { cwd: rootPath, timeout: 15000 },
          (err, stdout) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(stdout);
          },
        );
      });

      const hotspotMinChanges = vscode.workspace
        .getConfiguration("codebuddy.automations.codeHealth")
        .get<number>("hotspotMinChanges", 3);

      return result
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((line) => {
          const match = line.match(/^\s*(\d+)\s+(.+)$/);
          if (match) {
            return {
              changes: parseInt(match[1], 10),
              file: match[2],
            };
          }
          return null;
        })
        .filter(
          (item): item is { file: string; changes: number } =>
            item !== null && item.changes >= hotspotMinChanges,
        );
    } catch {
      return [];
    }
  }

  private storeSnapshot(snapshot: HealthSnapshot): void {
    try {
      this.dbService.executeSqlCommand(
        `INSERT INTO health_snapshots (todo_count, large_file_count, avg_complexity, hotspot_count) VALUES (?, ?, ?, ?)`,
        [
          snapshot.todoCount,
          snapshot.largeFileCount,
          snapshot.avgFunctionsPerFile,
          snapshot.hotspotCount,
        ],
      );
    } catch (e) {
      this.logger.warn("Could not store health snapshot", e);
    }
  }

  private getTrend(): string | null {
    try {
      const rows = this.dbService.executeSql(
        `SELECT todo_count, large_file_count FROM health_snapshots ORDER BY recorded_at DESC LIMIT 7`,
      );

      if (rows.length < 2) return null;

      const latest = rows[0];
      const previous = rows[rows.length - 1];
      const todoDiff = latest.todo_count - previous.todo_count;

      if (todoDiff > 0) {
        return `Tech debt ↑ +${todoDiff} TODOs this week`;
      } else if (todoDiff < 0) {
        return `Tech debt ↓ ${todoDiff} TODOs this week`;
      }
      return "Tech debt stable";
    } catch {
      return null;
    }
  }

  private showHealthDetails(
    needsRefresh: boolean,
    todoCount: number,
    todoItems: TodoItem[],
    largeFileCount: number,
    largeFiles: { file: string; lines: number }[],
    hotspots: { file: string; changes: number }[],
    snapshot: HealthSnapshot,
    trend: string | null,
  ) {
    this.outputChannel.clear();
    this.outputChannel.appendLine("=== CODE HEALTH REPORT ===");
    this.outputChannel.appendLine(`Generated: ${new Date().toLocaleString()}`);
    this.outputChannel.appendLine("");

    this.outputChannel.appendLine(
      `Index Status: ${needsRefresh ? "⚠ Outdated (Needs Refresh)" : "✅ Healthy"}`,
    );
    if (trend) {
      this.outputChannel.appendLine(`Trend: ${trend}`);
    }
    this.outputChannel.appendLine("");

    // Hotspots
    if (hotspots.length > 0) {
      this.outputChannel.appendLine(
        "🔥 Hotspot Files (most changed in 30 days):",
      );
      hotspots.forEach((h) => {
        this.outputChannel.appendLine(`  ${h.file} — ${h.changes} changes`);
      });
      this.outputChannel.appendLine("");
    }

    // TODOs with locations
    this.outputChannel.appendLine(`📌 Tech Debt Markers: ${todoCount} total`);
    if (todoItems.length > 0) {
      // Group by type
      const grouped = new Map<string, TodoItem[]>();
      for (const item of todoItems) {
        const list = grouped.get(item.type) || [];
        list.push(item);
        grouped.set(item.type, list);
      }

      for (const [type, items] of grouped) {
        this.outputChannel.appendLine(`  ${type} (${items.length}):`);
        items.slice(0, 10).forEach((item) => {
          this.outputChannel.appendLine(
            `    ${item.file}:${item.line} — ${item.text}`,
          );
        });
        if (items.length > 10) {
          this.outputChannel.appendLine(
            `    ... and ${items.length - 10} more`,
          );
        }
      }
    }
    this.outputChannel.appendLine("");

    // Large files
    this.outputChannel.appendLine(
      `📏 Large Files (>300 lines): ${largeFileCount}`,
    );
    if (largeFiles.length > 0) {
      largeFiles.slice(0, 10).forEach((f) => {
        this.outputChannel.appendLine(`  ${f.file} — ${f.lines} lines`);
      });
    }
    this.outputChannel.appendLine("");

    this.outputChannel.appendLine("--- Snapshot ---");
    this.outputChannel.appendLine(
      `TODOs: ${snapshot.todoCount} | Large Files: ${snapshot.largeFileCount} | Hotspots: ${snapshot.hotspotCount} | Avg functions/file: ${snapshot.avgFunctionsPerFile}`,
    );
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine(
      "Tip: Focus refactoring on files that appear in both hotspots and large files lists.",
    );

    this.outputChannel.show(false);
  }
}
