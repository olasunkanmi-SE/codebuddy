import React from "react";
import styled, { keyframes } from "styled-components";

export interface ActivityItem {
  id: string;
  type:
    | "tool_start"
    | "tool_end"
    | "thinking"
    | "planning"
    | "summarizing"
    | "progress";
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

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const Container = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 14px;
  margin: 8px 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const HeaderIcon = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
`;

const HeaderTitle = styled.span`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActivityItemContainer = styled.div<{ $status: string }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  border-left: 2px solid
    ${(props) =>
      props.$status === "active"
        ? "#3b82f6"
        : props.$status === "completed"
          ? "#22c55e"
          : "#ef4444"};
  animation: ${slideIn} 0.2s ease-out;
`;

const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  background: ${(props) => (props.$active ? "#3b82f6" : "#22c55e")};
  box-shadow: ${(props) =>
    props.$active ? "0 0 8px rgba(59, 130, 246, 0.6)" : "none"};
  animation: ${(props) => (props.$active ? pulse : "none")} 1.5s ease-in-out
    infinite;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
`;

const ToolName = styled.span`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;



const TimeStamp = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
`;

const Description = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
`;

const ResultSummary = styled.div`
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(34, 197, 94, 0.08);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Duration = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-left: auto;
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
  default: { displayName: "Tool" },
};

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  activities,
  isActive,
}) => {
  const getToolInfo = (
    toolName: string,
  ): { displayName: string } => {
    return TOOL_INFO[toolName] || TOOL_INFO.default;
  };

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <Container>
      <Header>
        <HeaderIcon />
        <HeaderTitle>
          {isActive ? "Working" : "Complete"}
        </HeaderTitle>
      </Header>
      <ActivityList>
        {activities.map((activity) => {
          const toolInfo = getToolInfo(activity.toolName || activity.type);
          return (
            <ActivityItemContainer key={activity.id} $status={activity.status}>
              <StatusIndicator $active={activity.status === "active"} />
              <ActivityContent>
                <ActivityHeader>
                  <ToolName>
                    {toolInfo.displayName}
                  </ToolName>
                  <TimeStamp>{formatTime(activity.timestamp)}</TimeStamp>
                </ActivityHeader>
                <Description>{activity.description}</Description>
                {activity.result?.summary && activity.status === "completed" && (
                  <ResultSummary>
                    {activity.result.summary}
                    {activity.result.itemCount !== undefined && (
                      <span>({activity.result.itemCount} items)</span>
                    )}
                    {activity.duration && (
                      <Duration>{formatDuration(activity.duration)}</Duration>
                    )}
                  </ResultSummary>
                )}
              </ActivityContent>
            </ActivityItemContainer>
          );
        })}
      </ActivityList>
    </Container>
  );
};

export default AgentActivityFeed;
