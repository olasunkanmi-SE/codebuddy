import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

export interface ActivityItem {
  id: string;
  type:
    | "tool_start"
    | "tool_end"
    | "thinking"
    | "planning"
    | "summarizing"
    | "progress"
    // New detailed activity types
    | "decision"
    | "reading"
    | "searching"
    | "reviewing"
    | "analyzing"
    | "executing"
    | "working";
  toolName?: string;
  description: string;
  status: "active" | "completed" | "failed";
  timestamp: number;
  result?: {
    summary?: string;
    itemCount?: number;
  };
  duration?: number;
}

interface AgentActivityFeedProps {
  activities: ActivityItem[];
  isActive: boolean;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 12px 0;
`;

const MainStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const DoneIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
`;

const StatusText = styled.div`
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
`;

const ToggleButton = styled.button<{ $expanded: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
  }

  svg {
    width: 12px;
    height: 12px;
    transform: ${(props) => (props.$expanded ? "rotate(180deg)" : "rotate(0)")};
    transition: transform 0.15s ease;
  }
`;

const DetailsContainer = styled.div<{ $expanded: boolean }>`
  max-height: ${(props) => (props.$expanded ? "300px" : "0")};
  overflow: hidden;
  transition: max-height 0.2s ease;
  margin-top: ${(props) => (props.$expanded ? "10px" : "0")};
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const DetailItem = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 11px;
`;

const DetailDot = styled.div<{ $active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? "#3b82f6" : "#22c55e")};
  animation: ${(props) => (props.$active ? pulse : "none")} 1s ease-in-out infinite;
`;

const DetailText = styled.span`
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DetailTime = styled.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
`;

const DecisionBadge = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 8px;
`;

const DecisionLabel = styled.div`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(139, 92, 246, 0.8);
  margin-bottom: 8px;
`;

const ToolChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ToolChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
`;

const ChipCount = styled.span`
  color: rgba(139, 92, 246, 0.9);
  font-weight: 600;
`;

const TOOL_INFO: Record<string, { displayName: string }> = {
  web_search: { displayName: "Web Search" },
  read_file: { displayName: "Read File" },
  analyze_files_for_question: { displayName: "Analyze Code" },
  think: { displayName: "Reasoning" },
  write_file: { displayName: "Write File" },
  edit_file: { displayName: "Edit File" },
  search_codebase: { displayName: "Search Codebase" },
  planning: { displayName: "Planning" },
  summarizing: { displayName: "Summarizing" },
  decision: { displayName: "Decision" },
  reading: { displayName: "Reading" },
  searching: { displayName: "Searching" },
  reviewing: { displayName: "Reviewing" },
  analyzing: { displayName: "Analyzing" },
  executing: { displayName: "Executing" },
  working: { displayName: "Working" },
  git_diff: { displayName: "Git Diff" },
  git_log: { displayName: "Git Log" },
  git_branch: { displayName: "Git Branch" },
  run_command: { displayName: "Terminal" },
  command: { displayName: "Terminal" },
  default: { displayName: "Tool" },
};

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  activities,
  isActive,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getToolInfo = (toolName: string): { displayName: string } => {
    return TOOL_INFO[toolName] || TOOL_INFO.default;
  };

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return "now";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  if (activities.length === 0) {
    return null;
  }

  // Get the current/latest activity for main status
  const latestActivity = activities[activities.length - 1];
  const latestInfo = getToolInfo(latestActivity?.toolName || latestActivity?.type);
  
  // Find decision activities to show prominently
  const decisions = activities.filter((a) => a.type === "decision");
  const latestDecision = decisions[decisions.length - 1];
  
  // Parse decision description into tool chips
  // Format: "Using: Web Search (x2), File Reader (x4)"
  const parseDecisionToChips = (description: string): { name: string; count?: number }[] => {
    // Remove "Using: " or "Decided to use: " prefix
    const toolsPart = description.replace(/^(Using:|Decided to use:)\s*/i, "");
    if (!toolsPart) return [];
    
    return toolsPart.split(", ").map((item) => {
      const match = item.match(/^(.+?)\s*\(x(\d+)\)$/);
      if (match) {
        return { name: match[1].trim(), count: parseInt(match[2], 10) };
      }
      return { name: item.trim() };
    });
  };

  const decisionChips = latestDecision ? parseDecisionToChips(latestDecision.description) : [];
  
  // Count completed items
  const completedCount = activities.filter((a) => a.status === "completed").length;

  // Get main status text
  const getMainStatus = () => {
    if (!isActive && completedCount === activities.length) {
      return `Completed ${completedCount} ${completedCount === 1 ? "action" : "actions"}`;
    }
    if (latestActivity) {
      return `${latestInfo.displayName}: ${latestActivity.description}`;
    }
    return "Working...";
  };

  return (
    <Container>
      <MainStatus>
        {isActive ? (
          <Spinner />
        ) : (
          <DoneIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </DoneIcon>
        )}
        <StatusText>{getMainStatus()}</StatusText>
        {activities.length > 1 && (
          <ToggleButton $expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {activities.length} {activities.length === 1 ? "step" : "steps"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </ToggleButton>
        )}
      </MainStatus>

      {decisionChips.length > 0 && (
        <DecisionBadge>
          <DecisionLabel>Tools in use</DecisionLabel>
          <ToolChips>
            {decisionChips.map((chip, idx) => (
              <ToolChip key={idx}>
                {chip.name}
                {chip.count && chip.count > 1 && <ChipCount>x{chip.count}</ChipCount>}
              </ToolChip>
            ))}
          </ToolChips>
        </DecisionBadge>
      )}

      <DetailsContainer $expanded={expanded}>
        <DetailsList>
          {activities.map((activity) => {
            const toolInfo = getToolInfo(activity.toolName || activity.type);
            return (
              <DetailItem key={activity.id} $status={activity.status}>
                <DetailDot $active={activity.status === "active"} />
                <DetailText>
                  {toolInfo.displayName}: {activity.description}
                </DetailText>
                <DetailTime>{formatTime(activity.timestamp)}</DetailTime>
              </DetailItem>
            );
          })}
        </DetailsList>
      </DetailsContainer>
    </Container>
  );
};

export default AgentActivityFeed;
