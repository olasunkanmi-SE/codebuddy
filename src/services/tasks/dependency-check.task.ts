import * as vscode from "vscode";
import { Logger } from "../../infrastructure/logger/logger";
import * as fs from "fs/promises";
import * as path from "path";
import * as cp from "child_process";

interface DependencyReport {
  wildcardDeps: string[];
  outdatedDeps: {
    name: string;
    current: string;
    wanted: string;
    latest: string;
  }[];
  vulnerabilities: { severity: string; count: number }[];
  totalVulnerabilities: number;
  lockfileSynced: boolean;
}

export class DependencyCheckTask {
  private logger: Logger;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.logger = Logger.initialize("DependencyCheckTask", {});
    this.outputChannel = vscode.window.createOutputChannel(
      "CodeBuddy Dependencies",
    );
  }

  public async execute(): Promise<void> {
    this.logger.info("Running Dependency Check...");

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    for (const folder of workspaceFolders) {
      const packageJsonPath = path.join(folder.uri.fsPath, "package.json");
      try {
        await fs.access(packageJsonPath);
      } catch {
        continue;
      }

      const report: DependencyReport = {
        wildcardDeps: [],
        outdatedDeps: [],
        vulnerabilities: [],
        totalVulnerabilities: 0,
        lockfileSynced: true,
      };

      // 1. Check for wildcard versions
      try {
        const content = await fs.readFile(packageJsonPath, "utf-8");
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        for (const [name, version] of Object.entries(deps)) {
          if (typeof version === "string") {
            if (version === "*" || version === "latest") {
              report.wildcardDeps.push(name);
            }
          }
        }
      } catch (e) {
        this.logger.warn("Error reading package.json", e);
      }

      // 2. Check for outdated packages
      try {
        const outdatedJson = await this.runCommand(
          folder.uri.fsPath,
          "npm outdated --json",
        );
        if (outdatedJson.trim()) {
          const outdated = JSON.parse(outdatedJson);
          for (const [name, info] of Object.entries(outdated) as [
            string,
            any,
          ][]) {
            if (info.current !== info.latest) {
              report.outdatedDeps.push({
                name,
                current: info.current || "N/A",
                wanted: info.wanted || "N/A",
                latest: info.latest || "N/A",
              });
            }
          }
        }
      } catch (e) {
        // npm outdated exits with code 1 when there are outdated packages — parse stdout anyway
        if (e instanceof CommandResult && e.stdout.trim()) {
          try {
            const outdated = JSON.parse(e.stdout);
            for (const [name, info] of Object.entries(outdated) as [
              string,
              any,
            ][]) {
              if (info.current !== info.latest) {
                report.outdatedDeps.push({
                  name,
                  current: info.current || "N/A",
                  wanted: info.wanted || "N/A",
                  latest: info.latest || "N/A",
                });
              }
            }
          } catch {
            // Could not parse, skip
          }
        }
      }

      // 3. Run npm audit for vulnerabilities
      try {
        const auditJson = await this.runCommand(
          folder.uri.fsPath,
          "npm audit --json",
        );
        this.parseAuditResult(auditJson, report);
      } catch (e) {
        // npm audit exits with non-zero when vulnerabilities found
        if (e instanceof CommandResult && e.stdout.trim()) {
          this.parseAuditResult(e.stdout, report);
        }
      }

      // 4. Check lockfile sync
      try {
        const lockfilePath = path.join(folder.uri.fsPath, "package-lock.json");
        await fs.access(lockfilePath);
        // Quick heuristic: if lockfile exists but package.json is newer, might be out of sync
        const pkgStat = await fs.stat(packageJsonPath);
        const lockStat = await fs.stat(lockfilePath);
        if (pkgStat.mtimeMs > lockStat.mtimeMs) {
          report.lockfileSynced = false;
        }
      } catch {
        // No lockfile
        report.lockfileSynced = false;
      }

      this.showReport(report, folder.name, packageJsonPath);
    }
  }

  private parseAuditResult(auditJson: string, report: DependencyReport): void {
    try {
      const audit = JSON.parse(auditJson);
      const meta =
        audit.metadata?.vulnerabilities || audit.vulnerabilities || {};
      const severities = ["critical", "high", "moderate", "low"];
      for (const severity of severities) {
        const count = meta[severity] || 0;
        if (count > 0) {
          report.vulnerabilities.push({ severity, count });
          report.totalVulnerabilities += count;
        }
      }
    } catch {
      // Could not parse audit result
    }
  }

  private showReport(
    report: DependencyReport,
    folderName: string,
    packageJsonPath: string,
  ): void {
    const issues: string[] = [];

    if (report.wildcardDeps.length > 0) {
      issues.push(`${report.wildcardDeps.length} wildcard versions`);
    }
    if (report.outdatedDeps.length > 0) {
      issues.push(`${report.outdatedDeps.length} outdated packages`);
    }
    if (report.totalVulnerabilities > 0) {
      issues.push(`${report.totalVulnerabilities} vulnerabilities`);
    }
    if (!report.lockfileSynced) {
      issues.push("lockfile may be out of sync");
    }

    if (issues.length === 0) {
      this.logger.info(`Dependency check passed for ${folderName}.`);
      return;
    }

    // Build detailed output
    this.outputChannel.clear();
    this.outputChannel.appendLine("=== DEPENDENCY HEALTH REPORT ===");
    this.outputChannel.appendLine(
      `Workspace: ${folderName} | Generated: ${new Date().toLocaleString()}`,
    );
    this.outputChannel.appendLine("");

    if (report.totalVulnerabilities > 0) {
      this.outputChannel.appendLine("🔴 Security Vulnerabilities:");
      report.vulnerabilities.forEach((v) => {
        const icon =
          v.severity === "critical"
            ? "🔴"
            : v.severity === "high"
              ? "🟠"
              : v.severity === "moderate"
                ? "🟡"
                : "⚪";
        this.outputChannel.appendLine(
          `  ${icon} ${v.severity}: ${v.count} issue(s)`,
        );
      });
      this.outputChannel.appendLine(
        '  → Run "npm audit fix" to attempt automatic fixes',
      );
      this.outputChannel.appendLine("");
    }

    if (report.outdatedDeps.length > 0) {
      this.outputChannel.appendLine("📦 Outdated Packages:");
      // Show up to 15 most important (sorted by version drift)
      const sorted = [...report.outdatedDeps].sort((a, b) => {
        // Prioritize major version differences
        const aMajorDrift = this.majorVersionDiff(a.current, a.latest);
        const bMajorDrift = this.majorVersionDiff(b.current, b.latest);
        return bMajorDrift - aMajorDrift;
      });
      sorted.slice(0, 15).forEach((dep) => {
        const majorDrift = this.majorVersionDiff(dep.current, dep.latest);
        const tag = majorDrift > 0 ? " ⚠ MAJOR" : "";
        this.outputChannel.appendLine(
          `  ${dep.name}: ${dep.current} → ${dep.latest}${tag}`,
        );
      });
      if (sorted.length > 15) {
        this.outputChannel.appendLine(`  ... and ${sorted.length - 15} more`);
      }
      this.outputChannel.appendLine("");
    }

    if (report.wildcardDeps.length > 0) {
      this.outputChannel.appendLine("⚠ Wildcard Versions (risky):");
      report.wildcardDeps.forEach((name) => {
        this.outputChannel.appendLine(`  ${name}: * or latest`);
      });
      this.outputChannel.appendLine("");
    }

    if (!report.lockfileSynced) {
      this.outputChannel.appendLine(
        "🔒 Lockfile may be out of sync with package.json.",
      );
      this.outputChannel.appendLine('  → Run "npm install" to regenerate.\n');
    }

    // Notification with actions
    const severity =
      report.totalVulnerabilities > 0
        ? "showWarningMessage"
        : "showInformationMessage";
    const message = `Dependency Check: ${issues.join(", ")}.`;

    const actions = ["View Report"];
    if (report.totalVulnerabilities > 0) {
      actions.push("Run npm audit fix");
    }
    actions.push("Open package.json");

    (vscode.window[severity] as Function)(message, ...actions).then(
      (selection: string | undefined) => {
        if (selection === "View Report") {
          this.outputChannel.show(true);
        } else if (selection === "Run npm audit fix") {
          const terminal = vscode.window.createTerminal("npm audit fix");
          terminal.show();
          terminal.sendText("npm audit fix");
        } else if (selection === "Open package.json") {
          vscode.workspace
            .openTextDocument(packageJsonPath)
            .then((doc) => vscode.window.showTextDocument(doc));
        }
      },
    );
  }

  private majorVersionDiff(current: string, latest: string): number {
    try {
      const cMajor = parseInt(
        current.replace(/^[^0-9]*/, "").split(".")[0],
        10,
      );
      const lMajor = parseInt(latest.replace(/^[^0-9]*/, "").split(".")[0], 10);
      return isNaN(cMajor) || isNaN(lMajor) ? 0 : lMajor - cMajor;
    } catch {
      return 0;
    }
  }

  private runCommand(cwd: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cp.exec(command, { cwd, timeout: 30000 }, (err, stdout, stderr) => {
        if (err) {
          reject(new CommandResult(stdout, stderr, err));
          return;
        }
        resolve(stdout);
      });
    });
  }
}

class CommandResult extends Error {
  constructor(
    public stdout: string,
    public stderr: string,
    public originalError: Error,
  ) {
    super(originalError.message);
  }
}
