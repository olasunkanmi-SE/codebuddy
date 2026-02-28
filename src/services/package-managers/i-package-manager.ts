/**
 * Abstraction for package manager interactions.
 * Implementations exist for npm, yarn, and pnpm.
 */
export interface OutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
}

export interface VulnerabilitySummary {
  severity: string;
  count: number;
}

export interface PackageManagerReport {
  outdatedDeps: OutdatedPackage[];
  vulnerabilities: VulnerabilitySummary[];
  totalVulnerabilities: number;
  lockfileSynced: boolean;
  lockfileName: string;
}

export interface IPackageManager {
  /** Display name, e.g. "npm", "yarn", "pnpm" */
  readonly name: string;

  /** The lockfile this manager uses (e.g. "package-lock.json") */
  readonly lockfileName: string;

  /** The fix command label shown in notifications */
  readonly auditFixCommand: string;

  /** The install command to regenerate the lockfile */
  readonly installCommand: string;

  /** Check if this package manager is in use for the given workspace folder */
  detectLockfile(cwd: string): Promise<boolean>;

  /** Return outdated packages */
  getOutdatedPackages(cwd: string): Promise<OutdatedPackage[]>;

  /** Run a security audit and return vulnerability summary */
  getAuditReport(cwd: string): Promise<{
    vulnerabilities: VulnerabilitySummary[];
    total: number;
  }>;

  /** Check whether the lockfile is in sync with package.json */
  isLockfileSynced(cwd: string, packageJsonPath: string): Promise<boolean>;
}
