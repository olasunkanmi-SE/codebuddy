import * as fs from "fs/promises";
import * as path from "path";
import {
  IPackageManager,
  OutdatedPackage,
  VulnerabilitySummary,
} from "./i-package-manager";
import { runCommand, CommandResult } from "./command-runner";

export class PnpmPackageManager implements IPackageManager {
  readonly name = "pnpm";
  readonly lockfileName = "pnpm-lock.yaml";
  readonly auditFixCommand = "pnpm audit --fix";
  readonly installCommand = "pnpm install";

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
      const stdout = await runCommand(cwd, "pnpm outdated --format json");
      this.parseOutdated(stdout, results);
    } catch (e) {
      // pnpm outdated exits with non-zero when there are outdated packages
      if (e instanceof CommandResult && e.stdout.trim()) {
        this.parseOutdated(e.stdout, results);
      }
    }
    return results;
  }

  private parseOutdated(json: string, results: OutdatedPackage[]): void {
    try {
      // pnpm outdated --format json returns an array of objects or a record
      const parsed = JSON.parse(json);
      const entries = Array.isArray(parsed)
        ? parsed
        : Object.entries(parsed).map(([name, info]: [string, any]) => ({
            name,
            ...info,
          }));

      for (const entry of entries) {
        const name = entry.name || entry.packageName || "";
        const current = entry.current || "N/A";
        const latest = entry.latest || "N/A";
        const wanted = entry.wanted || "N/A";
        if (current !== latest) {
          results.push({ name, current, wanted, latest });
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
      const stdout = await runCommand(cwd, "pnpm audit --json");
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
      // pnpm audit --json mirrors npm audit output format
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
