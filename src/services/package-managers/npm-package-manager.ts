import * as fs from "fs/promises";
import * as path from "path";
import {
  IPackageManager,
  OutdatedPackage,
  VulnerabilitySummary,
} from "./i-package-manager";
import { runCommand, CommandResult } from "./command-runner";

export class NpmPackageManager implements IPackageManager {
  readonly name = "npm";
  readonly lockfileName = "package-lock.json";
  readonly auditFixCommand = "npm audit fix";
  readonly installCommand = "npm install";

  async detectLockfile(cwd: string): Promise<boolean> {
    try {
      await fs.access(path.join(cwd, this.lockfileName));
      return true;
    } catch {
      return false;
    }
  }

  async getOutdatedPackages(cwd: string): Promise<OutdatedPackage[]> {
    const results: OutdatedPackage[] = [];
    try {
      const stdout = await runCommand(cwd, "npm outdated --json");
      this.parseOutdated(stdout, results);
    } catch (e) {
      // npm outdated exits with code 1 when there are outdated packages
      if (e instanceof CommandResult && e.stdout.trim()) {
        this.parseOutdated(e.stdout, results);
      }
    }
    return results;
  }

  private parseOutdated(json: string, results: OutdatedPackage[]): void {
    try {
      const outdated = JSON.parse(json);
      for (const [name, info] of Object.entries(outdated) as [string, any][]) {
        if (info.current !== info.latest) {
          results.push({
            name,
            current: info.current || "N/A",
            wanted: info.wanted || "N/A",
            latest: info.latest || "N/A",
          });
        }
      }
    } catch {
      // Could not parse
    }
  }

  async getAuditReport(
    cwd: string,
  ): Promise<{ vulnerabilities: VulnerabilitySummary[]; total: number }> {
    const result = { vulnerabilities: [] as VulnerabilitySummary[], total: 0 };
    try {
      const stdout = await runCommand(cwd, "npm audit --json");
      this.parseAudit(stdout, result);
    } catch (e) {
      if (e instanceof CommandResult && e.stdout.trim()) {
        this.parseAudit(e.stdout, result);
      }
    }
    return result;
  }

  private parseAudit(
    json: string,
    result: { vulnerabilities: VulnerabilitySummary[]; total: number },
  ): void {
    try {
      const audit = JSON.parse(json);
      const meta =
        audit.metadata?.vulnerabilities || audit.vulnerabilities || {};
      for (const severity of ["critical", "high", "moderate", "low"]) {
        const count = meta[severity] || 0;
        if (count > 0) {
          result.vulnerabilities.push({ severity, count });
          result.total += count;
        }
      }
    } catch {
      // Could not parse
    }
  }

  async isLockfileSynced(
    cwd: string,
    packageJsonPath: string,
  ): Promise<boolean> {
    try {
      const lockfilePath = path.join(cwd, this.lockfileName);
      await fs.access(lockfilePath);
      const pkgStat = await fs.stat(packageJsonPath);
      const lockStat = await fs.stat(lockfilePath);
      return pkgStat.mtimeMs <= lockStat.mtimeMs;
    } catch {
      return false;
    }
  }
}
