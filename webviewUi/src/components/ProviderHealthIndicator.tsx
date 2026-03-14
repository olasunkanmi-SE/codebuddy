interface ProviderHealth {
  provider: string;
  status: "healthy" | "degraded" | "down";
  errorCount: number;
  lastError?: string;
  lastErrorReason?: string;
  cooldownUntil: number;
}

interface ProviderHealthIndicatorProps {
  activeProvider?: string;
  health?: ProviderHealth[];
}

const STATUS_COLORS: Record<string, string> = {
  healthy: "var(--vscode-testing-iconPassed, #4ec9b0)",
  degraded: "var(--vscode-editorWarning-foreground, #cca700)",
  down: "var(--vscode-errorForeground, #f14c4c)",
};

const STATUS_LABELS: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

export function ProviderHealthIndicator({
  activeProvider,
  health,
}: ProviderHealthIndicatorProps) {
  if (!activeProvider || !health || health.length === 0) return null;

  const activeHealth = health.find(
    (h) => h.provider.toLowerCase() === activeProvider.toLowerCase(),
  );
  if (!activeHealth) return null;

  const color = STATUS_COLORS[activeHealth.status] ?? STATUS_COLORS.healthy;
  const label = STATUS_LABELS[activeHealth.status] ?? "Unknown";

  const fallbackCount = health.filter(
    (h) =>
      h.provider.toLowerCase() !== activeProvider.toLowerCase() &&
      h.status !== "down",
  ).length;

  const tooltip = [
    `${activeProvider}: ${label}`,
    activeHealth.errorCount > 0
      ? `Errors: ${activeHealth.errorCount}`
      : undefined,
    activeHealth.lastErrorReason
      ? `Last: ${activeHealth.lastErrorReason.replace(/_/g, " ")}`
      : undefined,
    fallbackCount > 0 ? `${fallbackCount} fallback(s) available` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      className="provider-health-indicator"
      title={tooltip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
        opacity: 0.8,
        cursor: "default",
        marginRight: "6px",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "var(--vscode-descriptionForeground)" }}>
        {activeProvider}
      </span>
    </span>
  );
}
