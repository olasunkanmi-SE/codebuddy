import * as fs from "fs/promises";
import * as path from "path";
import {
  IPackageManager,
  OutdatedPackage,
  VulnerabilitySummary,
} from "./i-package-manager";
import { runCommand, CommandResult } from "./command-runner";

export class YarnPackageManager implements IPackageManager {
  readonly name = "yarn";
  readonly lockfileName = "yarn.lock";
  readonly auditFixCommand = "yarn audit --fix";
  readonly installCommand = "yarn install";

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
      const stdout = await runCommand(cwd, "yarn", ["outdated", "--json"]);
      this.parseOutdated(stdout, results);
    } catch (e) {
      // yarn outdated exits with non-zero when there are outdated packages
      if (e instanceof CommandResult && e.stdout.trim()) {
        this.parseOutdated(e.stdout, results);
      }
    }
    return results;
  }

  private parseOutdated(output: string, results: OutdatedPackage[]): void {
    try {
      // yarn v1 outputs NDJSON lines: {"type":"table","data":{"body":[...]}}
      for (const line of output.split("\n")) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);
        if (parsed.type === "table" && parsed.data?.body) {
          for (const row of parsed.data.body) {
            // row: [name, current, wanted, latest, ...]
            if (row.length >= 4 && row[1] !== row[3]) {
              results.push({
                name: row[0],
                current: row[1] || "N/A",
                wanted: row[2] || "N/A",
                latest: row[3] || "N/A",
              });
            }
          }
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
      const stdout = await runCommand(cwd, "yarn", ["audit", "--json"]);
      this.parseAudit(stdout, result);
    } catch (e) {
      if (e instanceof CommandResult && e.stdout.trim()) {
        this.parseAudit(e.stdout, result);
      }
    }
    return result;
  }

  private parseAudit(
    output: string,
    result: { vulnerabilities: VulnerabilitySummary[]; total: number },
  ): void {
    try {
      // yarn v1 audit outputs NDJSON; the last line has type "auditSummary"
      for (const line of output.split("\n")) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);
        if (parsed.type === "auditSummary" && parsed.data?.vulnerabilities) {
          const meta = parsed.data.vulnerabilities;
          for (const severity of ["critical", "high", "moderate", "low"]) {
            const count = meta[severity] || 0;
            if (count > 0) {
              result.vulnerabilities.push({ severity, count });
              result.total += count;
            }
          }
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
