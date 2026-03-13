import React, { useCallback, useMemo, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { AgentTimelineState } from "../hooks/useStreamingChat";

interface AgentTimelineProps {
  timeline: AgentTimelineState;
  isActive: boolean;
  pendingApproval?: { toolName?: string; description?: string; threadId?: string } | null;
  onApprove?: () => void;
  onDeny?: () => void;
  isLive?: boolean;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/* ── Minimal Frame ──────────────────────────────────────────────── */

const Frame = styled.div`
  border: 1px solid var(--vscode-widget-border, rgba(255, 255, 255, 0.07));
  background: var(--vscode-editor-background, rgba(255, 255, 255, 0.02));
  border-radius: 8px;
  padding: 12px 14px;
  margin: 10px 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const Title = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-foreground, rgba(255, 255, 255, 0.9));
  letter-spacing: 0.2px;
`;

const Badge = styled.span<{ $kind?: "active" | "idle" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: ${(p) => (p.$kind === "active" ? "var(--vscode-charts-blue, #8cb4ff)" : "var(--vscode-descriptionForeground, rgba(255,255,255,0.5))")};
`;

const Spinner = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-top-color: var(--vscode-charts-blue, #8cb4ff);
  animation: ${spin} 0.8s linear infinite;
`;

/* ── Approval ───────────────────────────────────────────────────── */

const ApprovalBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px dashed var(--vscode-widget-border, rgba(255, 255, 255, 0.15));
  border-radius: 6px;
  margin-bottom: 8px;
`;

const ApprovalText = styled.div`
  font-size: 12px;
  color: var(--vscode-foreground, rgba(255, 255, 255, 0.85));
`;

const ApprovalButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const ApprovalButton = styled.button<{ $primary?: boolean }>`
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--vscode-widget-border, rgba(255, 255, 255, 0.12));
  background: ${(p) => (p.$primary ? "var(--vscode-button-background, rgba(90,133,255,0.25))" : "transparent")};
  color: ${(p) => (p.$primary ? "var(--vscode-button-foreground, #fff)" : "var(--vscode-foreground, rgba(255,255,255,0.8))")};
  font-size: 11px;
  cursor: pointer;
  &:hover {
    opacity: 0.85;
  }
`;

/* ── Sections ───────────────────────────────────────────────────── */

const Divider = styled.div`
  height: 1px;
  background: var(--vscode-widget-border, rgba(255, 255, 255, 0.06));
  margin: 8px 0;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.45));
  margin-bottom: 6px;
`;

/* ── Plan (Next Steps) ──────────────────────────────────────────── */

const PlanWrap = styled.div<{ $pulse?: boolean }>`
  font-size: 12px;
  color: var(--vscode-foreground, rgba(255, 255, 255, 0.85));
  line-height: 1.55;
  ${(p) => p.$pulse && css`animation: ${pulse} 1.6s ease-in-out infinite;`}
`;

const Steps = styled.ol`
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const Step = styled.li`
  color: var(--vscode-foreground, rgba(255, 255, 255, 0.8));
  font-size: 12px;
  &::marker {
    color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.4));
  }
`;

/* ── Actions ────────────────────────────────────────────────────── */

const ActionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ActionRow = styled.div<{ $status: string }>`
  padding: 6px 0;
`;

const ActionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
`;

const StatusIndicator = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) =>
    p.$status === "completed"
      ? "var(--vscode-charts-green, #6ee7a4)"
      : p.$status === "failed"
        ? "var(--vscode-charts-red, #f87171)"
        : "var(--vscode-charts-blue, #8cb4ff)"};
  ${(p) => p.$status === "active" && css`animation: ${pulse} 1.6s ease-in-out infinite;`}
`;

const ActionLabel = styled.span`
  font-size: 12px;
  color: var(--vscode-foreground, rgba(255, 255, 255, 0.85));
`;

const ActionMeta = styled.span`
  font-size: 11px;
  color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.4));
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DetailToggle = styled.button`
  background: none;
  border: none;
  color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.4));
  font-size: 11px;
  cursor: pointer;
  padding: 0 2px;
  &:hover {
    color: var(--vscode-foreground, rgba(255, 255, 255, 0.8));
  }
`;

const DetailPane = styled.div`
  margin: 4px 0 2px 14px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.6));
  line-height: 1.5;
`;

const Terminal = styled.pre`
  margin: 4px 0 0;
  padding: 8px;
  background: var(--vscode-terminal-background, #11131b);
  border: 1px solid var(--vscode-widget-border, rgba(255, 255, 255, 0.06));
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family, "Menlo", monospace);
  font-size: 11px;
  color: var(--vscode-terminal-foreground, #e3e7ef);
  max-height: 150px;
  overflow: auto;
  white-space: pre-wrap;
`;

/* ── Progress (thin inline bar) ─────────────────────────────────── */

const ProgressBar = styled.div`
  width: 48px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $value: number }>`
  height: 100%;
  width: ${(p) => `${p.$value}%`};
  background: var(--vscode-charts-blue, #8cb4ff);
  transition: width 0.25s ease;
`;

/* ── Result ─────────────────────────────────────────────────────── */

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--vscode-foreground, rgba(255, 255, 255, 0.8));
  animation: ${pulse} 1.6s ease-in-out infinite;
`;

const Empty = styled.div`
  font-size: 11px;
  color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.4));
`;

/* ── Helpers ────────────────────────────────────────────────────── */

const formatLabel = (action: AgentTimelineState["actions"][number]) => {
  if (action.type === "tool" && action.label && action.label !== "Tool") {
    return action.label;
  }
  if (action.label && action.label !== action.type) {
    return action.label;
  }
  return action.type.charAt(0).toUpperCase() + action.type.slice(1);
};

const statusText = (s: string): string | null =>
  s === "completed" ? "done" : s === "failed" ? "fail" : null;

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  timeline,
  isActive,
  pendingApproval,
  onApprove,
  onDeny,
  isLive = true,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const hasContent =
    !!timeline.thinking || !!timeline.plan || timeline.actions.length > 0 || timeline.summarizing;

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const fmtDur = useMemo(
    () => (ms?: number | null) => {
      if (ms == null) return "";
      if (ms < 1000) return `${Math.round(ms)}ms`;
      const s = ms / 1000;
      if (s < 60) return `${s.toFixed(1)}s`;
      return `${Math.floor(s / 60)}m${Math.round(s % 60)}s`;
    },
    [],
  );

  if (!hasContent) return null;

  return (
    <Frame>
      {/* ── Header ───────────────────────────────────────────── */}
      <Header>
        <Title>Agent</Title>
        <Badge $kind={isActive ? "active" : "idle"}>
          {isActive && <Spinner />}
          {isActive ? "Working" : "Ready"}
        </Badge>
      </Header>

      {/* ── Approval ─────────────────────────────────────────── */}
      {pendingApproval && isLive && (
        <ApprovalBar>
          <ApprovalText>
            Run <strong>{pendingApproval.toolName || "tool"}</strong>?
          </ApprovalText>
          <ApprovalButtons>
            <ApprovalButton onClick={onDeny}>Deny</ApprovalButton>
            <ApprovalButton $primary onClick={onApprove}>Allow</ApprovalButton>
          </ApprovalButtons>
        </ApprovalBar>
      )}

      {/* ── Thinking ─────────────────────────────────────────── */}
      {timeline.thinking && (
        <>
          <PlanWrap $pulse={timeline.thinking.status === "active"}>
            {timeline.thinking.content}
          </PlanWrap>
          <Divider />
        </>
      )}

      {/* ── Plan / Next Steps ────────────────────────────────── */}
      {timeline.plan && (
        <>
          <SectionLabel>Next steps</SectionLabel>
          <PlanWrap>
            {timeline.plan.steps.length > 0 ? (
              <Steps>
                {timeline.plan.steps.map((step, idx) => (
                  <Step key={`${step}-${idx}`}>{step}</Step>
                ))}
              </Steps>
            ) : (
              <span>{timeline.plan.raw}</span>
            )}
          </PlanWrap>
          <Divider />
        </>
      )}

      {/* ── Actions ──────────────────────────────────────────── */}
      {timeline.actions.length > 0 && (
        <>
          <SectionLabel>Actions</SectionLabel>
          <ActionsList>
            {timeline.actions.map((action) => {
              const hasDetails = !!(action.detail || action.terminalOutput || action.result);
              const isOpen = !!expanded[action.id];
              return (
                <ActionRow key={action.id} $status={action.status}>
                  <ActionHeader>
                    <StatusIndicator $status={action.status} />
                    <ActionLabel>{formatLabel(action)}</ActionLabel>

                    <ActionMeta>
                      {typeof action.progress === "number" && action.progress > 0 && action.progress < 100 && (
                        <ProgressBar><ProgressFill $value={action.progress} /></ProgressBar>
                      )}
                      {statusText(action.status) && (
                        <span>{statusText(action.status)}</span>
                      )}
                      {action.duration != null && (
                        <span>{fmtDur(action.duration)}</span>
                      )}
                      {hasDetails && (
                        <DetailToggle onClick={() => toggle(action.id)}>
                          {isOpen ? "▾" : "▸"}
                        </DetailToggle>
                      )}
                    </ActionMeta>
                  </ActionHeader>

                  {isOpen && (
                    <DetailPane>
                      {action.detail && <div>{action.detail}</div>}
                      {action.result && <div>Result: {action.result}</div>}
                      {action.terminalOutput && <Terminal>{action.terminalOutput}</Terminal>}
                    </DetailPane>
                  )}
                </ActionRow>
              );
            })}
          </ActionsList>
        </>
      )}

      {timeline.actions.length === 0 && !timeline.thinking && !timeline.plan && (
        <Empty>No actions yet.</Empty>
      )}

      {/* ── Result / Summarizing ─────────────────────────────── */}
      {timeline.summarizing && (
        <>
          <Divider />
          <ResultRow>
            <Spinner /> Preparing response…
          </ResultRow>
        </>
      )}
    </Frame>
  );
};

export default AgentTimeline;
