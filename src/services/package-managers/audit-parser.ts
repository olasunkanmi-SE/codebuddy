import { VulnerabilitySummary } from "./i-package-manager";

/** Shape of JSON returned by `npm audit --json` and `pnpm audit --json`. */
interface StandardAuditJson {
  metadata?: { vulnerabilities?: Record<string, number> };
  vulnerabilities?: Record<string, number>;
}

function isStandardAuditJson(value: unknown): value is StandardAuditJson {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.metadata !== undefined ||
    (typeof obj.vulnerabilities === "object" && obj.vulnerabilities !== null)
  );
}

const SEVERITY_LEVELS = ["critical", "high", "moderate", "low"] as const;

/**
 * Parse standard audit JSON (shared by npm and pnpm).
 * Populates `result.vulnerabilities` and `result.total` in-place.
 */
export function parseStandardAuditJson(
  json: string,
  result: { vulnerabilities: VulnerabilitySummary[]; total: number },
): void {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isStandardAuditJson(parsed)) return;

    const meta =
      parsed.metadata?.vulnerabilities ?? parsed.vulnerabilities ?? {};
    for (const severity of SEVERITY_LEVELS) {
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
