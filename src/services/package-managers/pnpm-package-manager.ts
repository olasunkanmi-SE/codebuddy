import * as fs from "fs/promises";
import * as path from "path";
import {
  IPackageManager,
  OutdatedPackage,
  VulnerabilitySummary,
} from "./i-package-manager";
import { runCommand, CommandResult } from "./command-runner";
import { parseStandardAuditJson } from "./audit-parser";

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
      const stdout = await runCommand(cwd, "pnpm", [
        "outdated",
        "--format",
        "json",
      ]);
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
      const parsed: unknown = JSON.parse(json);
      const entries: unknown[] = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null
          ? Object.entries(parsed as Record<string, unknown>).map(
              ([name, info]) => ({
                name,
                ...(typeof info === "object" && info !== null ? info : {}),
              }),
            )
          : [];

      for (const entry of entries) {
        if (typeof entry !== "object" || entry === null) continue;
        const e = entry as Record<string, unknown>;
        const name =
          (typeof e.name === "string" ? e.name : null) ??
          (typeof e.packageName === "string" ? e.packageName : "");
        const current = typeof e.current === "string" ? e.current : "N/A";
        const latest = typeof e.latest === "string" ? e.latest : "N/A";
        const wanted = typeof e.wanted === "string" ? e.wanted : "N/A";
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
      const stdout = await runCommand(cwd, "pnpm", ["audit", "--json"]);
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
