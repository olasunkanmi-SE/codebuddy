import * as fs from "fs/promises";
import * as path from "path";
import {
  IPackageManager,
  OutdatedPackage,
  VulnerabilitySummary,
} from "./i-package-manager";
import { runCommand, CommandResult } from "./command-runner";
import { parseStandardAuditJson } from "./audit-parser";

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
      const stdout = await runCommand(cwd, "npm", ["outdated", "--json"]);
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
      const outdated: unknown = JSON.parse(json);
      if (typeof outdated !== "object" || outdated === null) return;
      for (const [name, info] of Object.entries(
        outdated as Record<string, unknown>,
      )) {
        if (typeof info !== "object" || info === null) continue;
        const entry = info as Record<string, unknown>;
        const current =
          typeof entry.current === "string" ? entry.current : "N/A";
        const wanted = typeof entry.wanted === "string" ? entry.wanted : "N/A";
        const latest = typeof entry.latest === "string" ? entry.latest : "N/A";
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
      const stdout = await runCommand(cwd, "npm", ["audit", "--json"]);
      parseStandardAuditJson(stdout, result);
    } catch (e) {
      if (e instanceof CommandResult && e.stdout.trim()) {
        parseStandardAuditJson(e.stdout, result);
      }
    }
    return result;
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
