import * as vscode from "vscode";
import { Logger } from "../../infrastructure/logger/logger";
import * as fs from "fs/promises";
import * as path from "path";
import { IPackageManager, detectPackageManager } from "../package-managers";

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
  packageManager: string;
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

      // Auto-detect the package manager for this workspace folder
      const pm = await detectPackageManager(folder.uri.fsPath);
      this.logger.info(
        `Detected package manager: ${pm.name} for ${folder.name}`,
      );

      const report: DependencyReport = {
        wildcardDeps: [],
        outdatedDeps: [],
        vulnerabilities: [],
        totalVulnerabilities: 0,
        lockfileSynced: true,
        packageManager: pm.name,
      };

      // 1. Check for wildcard versions (package.json parse — PM-agnostic)
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

      // 2. Check for outdated packages via detected package manager
      try {
        report.outdatedDeps = await pm.getOutdatedPackages(folder.uri.fsPath);
      } catch (e) {
        this.logger.warn(`${pm.name} outdated check failed`, e);
      }

      // 3. Run security audit via detected package manager
      try {
        const audit = await pm.getAuditReport(folder.uri.fsPath);
        report.vulnerabilities = audit.vulnerabilities;
        report.totalVulnerabilities = audit.total;
      } catch (e) {
        this.logger.warn(`${pm.name} audit failed`, e);
      }

      // 4. Check lockfile sync
      report.lockfileSynced = await pm.isLockfileSynced(
        folder.uri.fsPath,
        packageJsonPath,
      );

      this.showReport(report, folder.name, packageJsonPath, pm);
    }
  }

  private showReport(
    report: DependencyReport,
    folderName: string,
    packageJsonPath: string,
    pm: IPackageManager,
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
      issues.push(`${pm.lockfileName} may be out of sync`);
    }

    if (issues.length === 0) {
      this.logger.info(`Dependency check passed for ${folderName}.`);
      return;
    }

    // Build detailed output
    this.outputChannel.clear();
    this.outputChannel.appendLine("=== DEPENDENCY HEALTH REPORT ===");
    this.outputChannel.appendLine(
      `Workspace: ${folderName} | Package Manager: ${pm.name} | Generated: ${new Date().toLocaleString()}`,
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
        `  → Run "${pm.auditFixCommand}" to attempt automatic fixes`,
      );
      this.outputChannel.appendLine("");
    }

    if (report.outdatedDeps.length > 0) {
      this.outputChannel.appendLine("📦 Outdated Packages:");
      const sorted = [...report.outdatedDeps].sort((a, b) => {
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
        `🔒 ${pm.lockfileName} may be out of sync with package.json.`,
      );
      this.outputChannel.appendLine(
        `  → Run "${pm.installCommand}" to regenerate.\n`,
      );
    }

    // Notification with actions
    const severity =
      report.totalVulnerabilities > 0
        ? "showWarningMessage"
        : "showInformationMessage";
    const message = `Dependency Check (${pm.name}): ${issues.join(", ")}.`;

    const fixLabel = `Run ${pm.auditFixCommand}`;
    const actions = ["View Report"];
    if (report.totalVulnerabilities > 0) {
      actions.push(fixLabel);
    }
    actions.push("Open package.json");

    (vscode.window[severity] as Function)(message, ...actions).then(
      (selection: string | undefined) => {
        if (selection === "View Report") {
          this.outputChannel.show(true);
        } else if (selection === fixLabel) {
          const terminal = vscode.window.createTerminal(pm.auditFixCommand);
          terminal.show();
          terminal.sendText(pm.auditFixCommand);
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
}
