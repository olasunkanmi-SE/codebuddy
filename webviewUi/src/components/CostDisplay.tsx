import { useState } from "react";
import type { IConversationCostData } from "../hooks/useStreamingChat";
import { BUDGET_ALTERNATIVES, estimateCostForModel } from "../constants/constant";
import "./CostDisplay.css";

/**
 * Formats a token count to a human-readable string (e.g. 1,234 or 12.3k).
 */
function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 10_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toLocaleString();
}

/**
 * Formats a USD cost for display. Shows up to 4 significant fractional digits.
 */
function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

interface CostDisplayProps {
  costData: IConversationCostData | null;
  isStreaming?: boolean;
}

export function CostDisplay({ costData, isStreaming }: CostDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!costData || costData.totalTokens === 0) return null;

  const alt = BUDGET_ALTERNATIVES[costData.provider];
  const altCost =
    alt && alt.model !== costData.model
      ? estimateCostForModel(alt.model, costData.inputTokens, costData.outputTokens)
      : null;
  const savings =
    altCost !== null ? costData.estimatedCostUSD - altCost : null;

  return (
    <div className={`cost-display${isStreaming ? " cost-display--active" : ""}`}>
      <div className="cost-display__main" onClick={() => setExpanded((v) => !v)} role="button" tabIndex={0}>
        <span className="cost-display__tokens" title="Total tokens used">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM8 4a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 8 4z" />
          </svg>
          {formatTokens(costData.totalTokens)} tokens
        </span>
        <span className="cost-display__separator">·</span>
        <span className="cost-display__cost" title={`Input: ${formatTokens(costData.inputTokens)} · Output: ${formatTokens(costData.outputTokens)}`}>
          {formatCost(costData.estimatedCostUSD)}
        </span>
        <span className="cost-display__separator">·</span>
        <span className="cost-display__model" title={`Provider: ${costData.provider}`}>
          {costData.model}
        </span>
        {altCost !== null && (
          <span className="cost-display__expand-hint">{expanded ? "▾" : "▸"}</span>
        )}
      </div>
      {expanded && altCost !== null && (
        <div className="cost-display__comparison">
          <span className="cost-display__alt">
            On <strong>{alt!.label}</strong>: {formatCost(altCost)}
          </span>
          {savings !== null && savings > 0 && (
            <span className="cost-display__savings">
              save {formatCost(savings)} ({Math.round((savings / costData.estimatedCostUSD) * 100)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
