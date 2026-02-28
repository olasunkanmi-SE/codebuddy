import { IPackageManager } from "./i-package-manager";
import { NpmPackageManager } from "./npm-package-manager";
import { YarnPackageManager } from "./yarn-package-manager";
import { PnpmPackageManager } from "./pnpm-package-manager";

export { IPackageManager } from "./i-package-manager";
export type {
  OutdatedPackage,
  VulnerabilitySummary,
  PackageManagerReport,
} from "./i-package-manager";
export { NpmPackageManager } from "./npm-package-manager";
export { YarnPackageManager } from "./yarn-package-manager";
export { PnpmPackageManager } from "./pnpm-package-manager";

/** All supported package managers, ordered by detection priority. */
const managers: IPackageManager[] = [
  new PnpmPackageManager(),
  new YarnPackageManager(),
  new NpmPackageManager(), // fallback — always last
];

/**
 * Detect which package manager is used in the given directory
 * by checking for lockfiles. Falls back to npm if no lockfile is found.
 */
export async function detectPackageManager(
  cwd: string,
): Promise<IPackageManager> {
  for (const pm of managers) {
    if (await pm.detectLockfile(cwd)) {
      return pm;
    }
  }
  // Default to npm when no lockfile is detected
  return managers[managers.length - 1];
}
