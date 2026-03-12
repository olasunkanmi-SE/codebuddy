import React, { useCallback, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
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
  50% { opacity: 0.55; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Frame = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border-radius: 12px;
  padding: 14px 16px;
  margin: 14px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.3px;
`;

const Badge = styled.span<{ $kind?: "active" | "idle" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: ${(p) => (p.$kind === "active" ? "#e4ecff" : "rgba(255,255,255,0.7)")};
  background: ${(p) => (p.$kind === "active" ? "rgba(90, 133, 255, 0.22)" : "rgba(255, 255, 255, 0.06)")};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
`;

const ApprovalBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  margin-top: 8px;
`;

const ApprovalText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
`;

const ApprovalButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ApprovalButton = styled.button<{ $primary?: boolean }>`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: ${(p) => (p.$primary ? "rgba(90,133,255,0.25)" : "rgba(255,255,255,0.06)")};
  color: ${(p) => (p.$primary ? "#eaf0ff" : "rgba(255,255,255,0.8)")};
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: ${(p) => (p.$primary ? "rgba(90,133,255,0.35)" : "rgba(255,255,255,0.1)")};
  }
`;

const Spinner = styled.div`
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: #8cb4ff;
  animation: ${spin} 0.9s linear infinite;
`;

const Section = styled.div`
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
`;

const SectionLabel = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
`;

const Bubble = styled.div<{ $tone?: "thinking" | "plan" | "action" | "result" }>`
  padding: 10px 12px;
  border-radius: 10px;
  background: ${(p) => {
    switch (p.$tone) {
      case "thinking":
        return "linear-gradient(135deg, rgba(105,140,255,0.16), rgba(105,140,255,0.08))";
      case "plan":
        return "linear-gradient(135deg, rgba(124,255,191,0.14), rgba(124,255,191,0.06))";
      case "result":
        return "linear-gradient(135deg, rgba(255,214,102,0.14), rgba(255,214,102,0.06))";
      default:
        return "rgba(255, 255, 255, 0.04)";
    }
  }};
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.5;
  font-size: 13px;
`;

const ThinkingText = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${(p) => (p.$active ? pulse : "none")} 1.6s ease-in-out infinite;
`;

const Steps = styled.ol`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Step = styled.li`
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
`;

const ActionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const ActionRow = styled.div<{ $status: string }>`
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
`;

const ActionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(p) =>
    p.$status === "completed"
      ? "#6ee7a4"
      : p.$status === "failed"
      ? "#f87171"
      : "#8cb4ff"};
  box-shadow: 0 0 0 ${(p) => (p.$status === "active" ? "6px rgba(140,180,255,0.18)" : "0")};
`;

const IconCircle = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.70);
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
`;

const ActionBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ActionTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Meta = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $value: number }>`
  height: 100%;
  width: ${(p) => `${p.$value}%`};
  background: linear-gradient(90deg, #7ab6ff, #9fd5ff);
  transition: width 0.2s ease;
`;

const ActionDetail = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
`;

const Terminal = styled.pre`
  margin: 8px 0 0;
  padding: 10px;
  background: #11131b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
  font-size: 12px;
  color: #e3e7ef;
  max-height: 180px;
  overflow: auto;
  white-space: pre-wrap;
`;

const CollapseButton = styled.button<{ $open: boolean }>`
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  span {
    display: inline-block;
    transform: ${(p) => (p.$open ? "rotate(90deg)" : "rotate(0deg)")};
  }
`;

const Empty = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
`;

const StatusPill = styled.span<{ $status: string }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: ${(p) =>
    p.$status === "completed"
      ? "#c6f6d5"
      : p.$status === "failed"
      ? "#fecaca"
      : "#dfe8ff"};
  background: ${(p) =>
    p.$status === "completed"
      ? "rgba(110, 231, 164, 0.14)"
      : p.$status === "failed"
      ? "rgba(248, 113, 113, 0.14)"
      : "rgba(140, 180, 255, 0.16)"};
`;

/** Inline SVG icons — 14×14, stroke-based, no emoji. */
const svgIcon = (d: string, stroke = "currentColor") => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ActionIcon: Record<string, React.ReactNode> = {
  tool:        svgIcon("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"),
  decision:    svgIcon("M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"),
  reading:     svgIcon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"),
  searching:   svgIcon("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"),
  reviewing:   svgIcon("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"),
  analyzing:   svgIcon("M18 20V10M12 20V4M6 20v-6"),
  executing:   svgIcon("M4 17l6-6-6-6M12 19h8"),
  working:     svgIcon("M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"),
  summarizing: svgIcon("M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"),
};

const formatLabel = (action: AgentTimelineState["actions"][number]) => {
  // For tool events, show the friendly label directly
  if (action.type === "tool" && action.label && action.label !== "Tool") {
    return action.label;
  }
  // For activity events, show the label if it's a friendly name (not raw type)
  if (action.label && action.label !== action.type) {
    return action.label;
  }
  // Capitalize fallback
  return action.type.charAt(0).toUpperCase() + action.type.slice(1);
};

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

  const formatDuration = useMemo(
    () =>
      (ms?: number) => {
        if (ms === undefined || ms === null) return "";
        if (ms < 1000) return `${Math.round(ms)} ms`;
        const seconds = ms / 1000;
        if (seconds < 60) return `${seconds.toFixed(1)} s`;
        const minutes = Math.floor(seconds / 60);
        const rem = (seconds % 60).toFixed(0);
        return `${minutes}m ${rem}s`;
      },
    [],
  );

  if (!hasContent) {
    return null;
  }

  return (
    <Frame>
      <Header>
        <Title>Agent</Title>
        <Badge $kind={isActive ? "active" : "idle"}>
          {isActive ? <Spinner /> : null}
          {isActive ? "Working" : "Ready"}
        </Badge>
      </Header>

      {pendingApproval && isLive && (
        <ApprovalBar>
          <ApprovalText>
            Approve {pendingApproval.toolName || "tool"} — {pendingApproval.description || "Ready to run"}
          </ApprovalText>
          <ApprovalButtons>
            <ApprovalButton onClick={onDeny}>Deny</ApprovalButton>
            <ApprovalButton $primary onClick={onApprove}>Approve</ApprovalButton>
          </ApprovalButtons>
        </ApprovalBar>
      )}

      {timeline.thinking && (
        <Section>
          <SectionLabel>Thinking</SectionLabel>
          <Bubble $tone="thinking">
            <ThinkingText $active={timeline.thinking.status === "active"}>
              {timeline.thinking.content}
            </ThinkingText>
          </Bubble>
        </Section>
      )}

      {timeline.plan && (
        <Section>
          <SectionLabel>Next steps</SectionLabel>
          <Bubble $tone="plan">
            {timeline.plan.steps.length > 0 ? (
              <Steps>
                {timeline.plan.steps.map((step, idx) => (
                  <Step key={`${step}-${idx}`}>{step}</Step>
                ))}
              </Steps>
            ) : (
              <div>{timeline.plan.raw}</div>
            )}
          </Bubble>
        </Section>
      )}

      <Section>
        <SectionLabel>Actions</SectionLabel>
        {timeline.actions.length === 0 ? (
          <Empty>No actions yet.</Empty>
        ) : (
          <ActionsList>
            {timeline.actions.map((action) => (
              <ActionRow key={action.id} $status={action.status}>
                <ActionHeader>
                  <StatusDot $status={action.status} />
                  <IconCircle>{ActionIcon[action.type] || ActionIcon.tool}</IconCircle>
                  <ActionBody>
                    <ActionTitle>
                      {formatLabel(action)}
                      {action.status !== "active" && (
                        <StatusPill $status={action.status}>{action.status === "completed" ? "done" : action.status}</StatusPill>
                      )}
                      {action.duration !== undefined && action.duration !== null && (
                        <Meta style={{ display: "inline", marginLeft: 4 }}>{formatDuration(action.duration)}</Meta>
                      )}
                    </ActionTitle>
                    <Meta>
                      {action.detail || ""}
                    </Meta>
                    {typeof action.progress === "number" && action.progress >= 0 && action.progress <= 100 && (
                      <ProgressBar>
                        <ProgressFill $value={action.progress} />
                      </ProgressBar>
                    )}
                  </ActionBody>
                  {(action.detail || action.terminalOutput || action.result) && (
                    <CollapseButton $open={!!expanded[action.id]} onClick={() => toggle(action.id)}>
                      <span>{expanded[action.id] ? "v" : ">"}</span> Details
                    </CollapseButton>
                  )}
                </ActionHeader>

                {expanded[action.id] && (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {action.detail && <ActionDetail>{action.detail}</ActionDetail>}
                    {action.result && <ActionDetail>Result: {action.result}</ActionDetail>}
                    {action.terminalOutput && <Terminal>{action.terminalOutput}</Terminal>}
                  </div>
                )}
              </ActionRow>
            ))}
          </ActionsList>
        )}
      </Section>

      {timeline.summarizing && (
        <Section>
          <SectionLabel>Result</SectionLabel>
          <Bubble $tone="result">
            <ResultRow>
              <Spinner /> Preparing response...
            </ResultRow>
          </Bubble>
        </Section>
      )}
    </Frame>
  );
};

export default AgentTimeline;
