import React from "react";
import styled from "styled-components";
import { vscode } from "../../utils/vscode";

interface CoWorkerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dailyStandupEnabled: boolean;
  codeHealthEnabled: boolean;
  dependencyCheckEnabled: boolean;
  gitWatchdogEnabled: boolean;
  endOfDaySummaryEnabled: boolean;
  onDailyStandupChange: (enabled: boolean) => void;
  onCodeHealthChange: (enabled: boolean) => void;
  onDependencyCheckChange: (enabled: boolean) => void;
  onGitWatchdogChange: (enabled: boolean) => void;
  onEndOfDaySummaryChange: (enabled: boolean) => void;
}

/* ─── Styled Components ─── */
const PanelOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(p) => (p.$isOpen ? "flex" : "none")};
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const PanelContainer = styled.div`
  width: 420px;
  height: 100%;
  background: var(--vscode-editor-background);
  border-left: 1px solid var(--vscode-widget-border);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.2s ease-in-out;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--vscode-widget-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 5px;
    border: 2px solid var(--vscode-editor-background);
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--vscode-descriptionForeground);
`;

const TaskRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const TaskInfo = styled.div`
  flex: 1;
  margin-right: 12px;
`;

const TaskLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-foreground);
  margin-bottom: 4px;
`;

const TaskDescription = styled.div`
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
`;

const TaskControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ToggleTrack = styled.div<{ $checked: boolean }>`
  width: 36px;
  height: 18px;
  border-radius: 9px;
  background: ${(p) =>
    p.$checked
      ? "var(--vscode-inputOption-activeBackground, #007acc)"
      : "rgba(255, 255, 255, 0.15)"};
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
`;

const ToggleThumb = styled.div<{ $checked: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: ${(p) => (p.$checked ? "20px" : "2px")};
  transition: left 0.2s ease;
`;

const TriggerButton = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--vscode-foreground);
  font-size: 11px;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.97);
  }
`;

/* ─── Helper ─── */
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <ToggleTrack $checked={checked} onClick={() => onChange(!checked)}>
    <ToggleThumb $checked={checked} />
  </ToggleTrack>
);

const triggerCommand = (commandId: string) => {
  vscode.postMessage({ command: "execute-command", commandId });
};

/* ─── Tasks Config ─── */
interface TaskDef {
  section: string;
  label: string;
  description: string;
  commandId: string;
}

const TASKS: TaskDef[] = [
  {
    section: "Morning Briefing",
    label: "Daily Standup",
    description: "Git activity summary, recent commits, uncommitted changes, active errors, and tickets. Scheduled daily at 8:00 AM.",
    commandId: "codebuddy.triggerDailyStandup",
  },
  {
    section: "Codebase Pulse",
    label: "Code Health Check",
    description: "TODOs/FIXMEs, large files, hotspot detection, and health trends. Scheduled daily at 9:00 AM.",
    commandId: "codebuddy.triggerCodeHealth",
  },
  {
    section: "Codebase Pulse",
    label: "Dependency Guardian",
    description: "Audits packages for vulnerabilities, outdated deps, and lockfile sync. Scheduled daily at 11:00 AM.",
    commandId: "codebuddy.triggerDependencyCheck",
  },
  {
    section: "Git Guardian",
    label: "Git Watchdog",
    description: "Monitors uncommitted changes, stale branches, and upstream drift. Scheduled every 2 hours.",
    commandId: "codebuddy.triggerGitWatchdog",
  },
  {
    section: "Daily Wrap-up",
    label: "End-of-Day Summary",
    description: "Commits, files touched, lines changed, remaining errors. Scheduled daily at 5:30 PM.",
    commandId: "codebuddy.triggerEndOfDaySummary",
  },
];

/* ─── Component ─── */
export const CoWorkerPanel: React.FC<CoWorkerPanelProps> = ({
  isOpen,
  onClose,
  dailyStandupEnabled,
  codeHealthEnabled,
  dependencyCheckEnabled,
  gitWatchdogEnabled,
  endOfDaySummaryEnabled,
  onDailyStandupChange,
  onCodeHealthChange,
  onDependencyCheckChange,
  onGitWatchdogChange,
  onEndOfDaySummaryChange,
}) => {
  const toggleMap: Record<string, { checked: boolean; onChange: (v: boolean) => void }> = {
    "Daily Standup": { checked: dailyStandupEnabled, onChange: onDailyStandupChange },
    "Code Health Check": { checked: codeHealthEnabled, onChange: onCodeHealthChange },
    "Dependency Guardian": { checked: dependencyCheckEnabled, onChange: onDependencyCheckChange },
    "Git Watchdog": { checked: gitWatchdogEnabled, onChange: onGitWatchdogChange },
    "End-of-Day Summary": { checked: endOfDaySummaryEnabled, onChange: onEndOfDaySummaryChange },
  };

  // Group tasks by section
  const sections = TASKS.reduce<Record<string, TaskDef[]>>((acc, task) => {
    (acc[task.section] ??= []).push(task);
    return acc;
  }, {});

  return (
    <PanelOverlay $isOpen={isOpen} onClick={onClose}>
      <PanelContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            <CoWorkerIconSmall />
            Co-Worker
          </Title>
          <CloseButton onClick={onClose} aria-label="Close co-worker panel">
            <span className="codicon codicon-close"></span>
          </CloseButton>
        </Header>
        <Content>
          {Object.entries(sections).map(([sectionName, tasks]) => (
            <Section key={sectionName}>
              <SectionTitle>{sectionName}</SectionTitle>
              {tasks.map((task) => {
                const toggle = toggleMap[task.label];
                return (
                  <TaskRow key={task.label}>
                    <TaskInfo>
                      <TaskLabel>{task.label}</TaskLabel>
                      <TaskDescription>{task.description}</TaskDescription>
                    </TaskInfo>
                    <TaskControls>
                      <Toggle checked={toggle.checked} onChange={toggle.onChange} />
                      <TriggerButton onClick={() => triggerCommand(task.commandId)}>
                        Trigger
                      </TriggerButton>
                    </TaskControls>
                  </TaskRow>
                );
              })}
            </Section>
          ))}
        </Content>
      </PanelContainer>
    </PanelOverlay>
  );
};

/* ─── Icon (small, for header) ─── */
const CoWorkerIconSmall = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="9" cy="16" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="15" cy="16" r="1.5" fill="currentColor" stroke="none" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
