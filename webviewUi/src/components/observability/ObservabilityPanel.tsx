import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

/* ─── Animations ─── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/* ─── Overlay ─── */
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${p => p.$isOpen ? 1 : 0};
  visibility: ${p => p.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 999;
`;

const PanelContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 85%;
  max-width: 600px;
  background: var(--vscode-editor-background);
  transform: translateX(${p => p.$isOpen ? '0' : '-100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--vscode-foreground);
  }
`;

/* ─── Layout ─── */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
  flex-shrink: 0;
  z-index: 2;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--vscode-descriptionForeground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LiveDot = styled.span<{ active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${p => p.active ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-descriptionForeground)'};
  ${p => p.active && css`animation: ${pulse} 2s ease infinite;`}
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
  padding: 0 8px;
  background: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 8px 14px;
  cursor: pointer;
  color: ${p => p.active ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)"};
  border-bottom: 2px solid ${p => p.active ? "var(--vscode-focusBorder)" : "transparent"};
  font-size: 11px;
  font-weight: ${p => (p.active ? "600" : "400")};
  letter-spacing: 0.3px;
  transition: all 0.15s ease;
  outline: none;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: var(--vscode-foreground);
    background: var(--vscode-list-hoverBackground);
  }

  &:focus { outline: none; }
`;

const TabBadge = styled.span`
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  font-weight: 600;
  min-width: 14px;
  text-align: center;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--vscode-editor-background);
  position: relative;
  min-height: 0;
`;

/* ─── Dashboard ─── */
const DashboardScroll = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: ${fadeIn} 0.3s ease;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--vscode-descriptionForeground);
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: var(--vscode-panel-border);
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
`;

const MetricCard = styled.div<{ accent?: string }>`
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  padding: 14px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--vscode-focusBorder);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    border-radius: 6px 0 0 6px;
    background: ${p => p.accent || 'var(--vscode-focusBorder)'};
    opacity: 0.6;
  }
`;

const MetricValue = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--vscode-foreground);
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

const MetricUnit = styled.span`
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--vscode-descriptionForeground);
  margin-left: 2px;
`;

const MetricLabel = styled.div`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  display: flex;
  align-items: center;
  gap: 5px;
`;

const MetricIcon = styled.span`
  font-size: 12px;
  opacity: 0.6;
`;

const MetricSubtext = styled.div`
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  opacity: 0.7;
  margin-top: 2px;
`;

/* ─── MCP Status Card ─── */
const MCPStatusRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const MCPServerChip = styled.div<{ connected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  color: var(--vscode-foreground);

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${p => p.connected ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-errorForeground)'};
  }
`;

/* ─── Logs ─── */
const LogContainer = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 11px;
  line-height: 1.6;
  overflow: auto;
  height: 100%;
  background: var(--vscode-editor-background);
`;

const LogToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
  position: sticky;
  top: 0;
  z-index: 1;
`;

const LogFilterBtn = styled.button<{ active: boolean; color?: string }>`
  background: ${p => p.active ? 'var(--vscode-badge-background)' : 'transparent'};
  color: ${p => p.active ? 'var(--vscode-badge-foreground)' : 'var(--vscode-descriptionForeground)'};
  border: 1px solid ${p => p.active ? 'transparent' : 'var(--vscode-panel-border)'};
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    background: var(--vscode-list-hoverBackground);
    color: var(--vscode-foreground);
  }
`;

const LogEntry = styled.div<{ level: string }>`
  padding: 3px 12px;
  display: grid;
  grid-template-columns: 70px 50px 100px 1fr;
  gap: 8px;
  align-items: baseline;
  border-bottom: 1px solid transparent;
  font-size: 11px;
  min-width: 500px;

  &:hover {
    background: var(--vscode-list-hoverBackground);
    border-bottom-color: var(--vscode-panel-border);
  }
`;

const LogTime = styled.span`
  color: var(--vscode-descriptionForeground);
  opacity: 0.6;
  font-size: 10px;
`;

const LogLevel = styled.span<{ level: string }>`
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1px 4px;
  border-radius: 2px;
  text-align: center;
  background: ${p => {
    switch (p.level) {
      case "ERROR": return "rgba(255, 85, 85, 0.15)";
      case "WARN": return "rgba(255, 170, 0, 0.15)";
      case "DEBUG": return "rgba(100, 150, 255, 0.15)";
      default: return "rgba(128, 128, 128, 0.1)";
    }
  }};
  color: ${p => {
    switch (p.level) {
      case "ERROR": return "var(--vscode-errorForeground)";
      case "WARN": return "var(--vscode-editorWarning-foreground)";
      case "DEBUG": return "var(--vscode-debugConsole-infoForeground)";
      default: return "var(--vscode-descriptionForeground)";
    }
  }};
`;

const LogModule = styled.span`
  color: var(--vscode-symbolIcon-namespaceForeground, var(--vscode-descriptionForeground));
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
`;

const LogMessage = styled.span`
  color: var(--vscode-foreground);
  word-break: break-word;
`;

/* ─── Traces — LangSmith-style ─── */
const TraceContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  animation: ${fadeIn} 0.3s ease;
`;

/** Top-level trace list (when no trace is selected) */
const TraceList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const TraceListItem = styled.div<{ $selected?: boolean; $hasError?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: ${p => p.$selected ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent'};
  &:hover { background: var(--vscode-list-hoverBackground); }
`;

const TraceListDot = styled.span<{ $error?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => p.$error ? 'var(--vscode-errorForeground)' : 'var(--vscode-testing-iconPassed)'};
`;

const TraceListBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const TraceListName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TraceListMeta = styled.div`
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  display: flex;
  gap: 10px;
  margin-top: 2px;
`;

const Badge = styled.span<{ $color?: string }>`
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  color: ${p => p.$color || 'var(--vscode-badge-foreground)'};
  background: var(--vscode-badge-background);
  font-family: 'JetBrains Mono', monospace;
`;

/** Split view: tree (left) + detail (right) */
const TraceSplit = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const TreePane = styled.div`
  width: 260px;
  min-width: 200px;
  border-right: 1px solid var(--vscode-panel-border);
  overflow-y: auto;
  background: var(--vscode-sideBar-background);
`;

const TreeBreadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  position: sticky;
  top: 0;
  background: var(--vscode-sideBar-background);
  z-index: 1;
`;

const TreeBackBtn = styled.button`
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  font-size: 11px;
  &:hover { background: var(--vscode-list-hoverBackground); }
`;

const TreeNode = styled.div<{ $depth: number; $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px ${p => 10 + p.$depth * 14}px;
  cursor: pointer;
  font-size: 11px;
  color: var(--vscode-foreground);
  background: ${p => p.$selected ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent'};
  border-left: 2px solid ${p => p.$selected ? 'var(--vscode-focusBorder)' : 'transparent'};
  &:hover { background: var(--vscode-list-hoverBackground); }
`;

const TreeNodeDot = styled.span<{ $status?: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p =>
    p.$status === 'error' ? 'var(--vscode-errorForeground)' :
    p.$status === 'running' ? 'var(--vscode-progressBar-background)' :
    'var(--vscode-testing-iconPassed)'};
`;

const TreeNodeName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TreeNodeDuration = styled.span`
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
`;

/** Detail (right pane) */
const DetailPane = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--vscode-editor-background);
`;

const DetailHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 0;
  background: var(--vscode-editor-background);
  z-index: 1;
`;

const DetailTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DetailBadges = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const DetailBadge = styled.span<{ $variant?: 'default' | 'success' | 'error' | 'info' }>`
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  border: 1px solid var(--vscode-panel-border);
  color: ${p => {
    switch (p.$variant) {
      case 'success': return 'var(--vscode-testing-iconPassed)';
      case 'error': return 'var(--vscode-errorForeground)';
      case 'info': return 'var(--vscode-charts-blue, #8cb4ff)';
      default: return 'var(--vscode-descriptionForeground)';
    }
  }};
  background: transparent;
`;

const DetailSectionTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  padding: 10px 16px 4px;
`;

const DetailBody = styled.div`
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 11px;

  span:first-child {
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    min-width: 110px;
    font-size: 10px;
    flex-shrink: 0;
  }

  span:last-child {
    font-family: 'JetBrains Mono', monospace;
    color: var(--vscode-foreground);
    word-break: break-all;
    font-size: 10px;
  }
`;

/** Waterfall mini-bar inside the detail pane */
const WaterfallMini = styled.div`
  margin: 8px 16px 0;
  padding: 12px;
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
`;

const WaterfallRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr 70px;
  gap: 0;
  align-items: stretch;
  font-size: 11px;
  border-bottom: 1px solid var(--vscode-panel-border);
  min-height: 24px;
  &:last-child { border-bottom: none; }
`;

const SpanName = styled.div<{ depth: number }>`
  padding-left: ${p => 6 + p.depth * 12}px;
  padding-right: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--vscode-foreground);
  font-size: 10px;
`;

const SpanBarWrapper = styled.div`
  padding: 0 8px;
  display: flex;
  align-items: center;
  position: relative;
`;

const SpanBar = styled.div<{ left: number; width: number; status: string }>`
  position: absolute;
  left: ${p => p.left}%;
  width: ${p => p.width}%;
  height: 8px;
  background: ${p => p.status === 'ERROR' ? 'var(--vscode-errorForeground)' : 'var(--vscode-progressBar-background)'};
  border-radius: 2px;
  opacity: 0.8;
`;

const SpanDuration = styled.div`
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: var(--vscode-descriptionForeground);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
`;

/* ─── Empty States ─── */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  color: var(--vscode-descriptionForeground);
  gap: 12px;
  text-align: center;
  opacity: 0.7;

  .codicon {
    font-size: 36px;
    opacity: 0.4;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 11px;
    max-width: 220px;
  }
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(
    90deg,
    var(--vscode-sideBar-background) 0%,
    var(--vscode-editor-background) 50%,
    var(--vscode-sideBar-background) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease infinite;
  border-radius: 6px;
  height: 80px;
`;

/* ─── Utility Components ─── */
const StatusDot = styled.span<{ status: 'good' | 'warn' | 'error' }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: ${p => {
    switch (p.status) {
      case 'good': return 'var(--vscode-testing-iconPassed)';
      case 'warn': return 'var(--vscode-editorWarning-foreground)';
      case 'error': return 'var(--vscode-errorForeground)';
    }
  }};
`;

const ProgressBarBg = styled.div`
  height: 3px;
  background: var(--vscode-panel-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressBarFill = styled.div<{ pct: number; color?: string }>`
  height: 100%;
  width: ${p => Math.min(p.pct, 100)}%;
  background: ${p => p.color || 'var(--vscode-progressBar-background)'};
  border-radius: 2px;
  transition: width 0.4s ease;
`;

interface ObservabilityPanelProps {
  vsCode: any;
  logs: any[];
  metrics: any;
  traces: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({ vsCode, logs, metrics, traces, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const mcpStats = metrics?.mcpStats;

  useEffect(() => {
    if (isOpen) {
      vsCode.postMessage({ command: "observability-get-metrics" });
      vsCode.postMessage({ command: "observability-get-logs" });
      vsCode.postMessage({ command: "observability-get-traces" });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // If viewing a span detail, go back one level first
        if (selectedSpanId) {
          setSelectedSpanId(null);
        } else if (selectedTraceId) {
          setSelectedTraceId(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedSpanId, selectedTraceId]);

  // Reset trace selection when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTraceId(null);
      setSelectedSpanId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === "logs" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    let interval: NodeJS.Timeout;
    if (activeTab === "dashboard") {
      interval = setInterval(() => {
        vsCode.postMessage({ command: "observability-get-metrics" });
      }, 5000);
    } else if (activeTab === "traces") {
      vsCode.postMessage({ command: "observability-get-traces" });
      interval = setInterval(() => {
        vsCode.postMessage({ command: "observability-get-traces" });
      }, 3000);
    } else if (activeTab === "logs") {
      vsCode.postMessage({ command: "observability-get-logs" });
      interval = setInterval(() => {
        vsCode.postMessage({ command: "observability-get-logs" });
      }, 5000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [activeTab, isOpen]);

  const handleRefresh = () => {
    vsCode.postMessage({ command: "observability-get-metrics" });
    vsCode.postMessage({ command: "observability-get-logs" });
    vsCode.postMessage({ command: "observability-get-traces" });
  };

  const handleSendTestTrace = () => {
    vsCode.postMessage({ command: "observability-send-test-trace" });
  };

  const handleClear = () => {
    if (activeTab === "traces") {
      vsCode.postMessage({ command: "observability-clear-traces" });
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logFilter) return logs;
    return logs.filter(l => l.level === logFilter);
  }, [logs, logFilter]);

  const logCounts = useMemo(() => {
    const counts: Record<string, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
    logs.forEach(l => { if (counts[l.level] !== undefined) counts[l.level]++; });
    return counts;
  }, [logs]);

  const successRate = mcpStats
    ? mcpStats.totalInvocations > 0
      ? ((mcpStats.totalInvocations - mcpStats.failedInvocations) / mcpStats.totalInvocations * 100)
      : 100
    : null;

  /* ── Trace tree helpers ── */
  const spanMs = (s: any) => (s.startTime?.[0] ?? 0) * 1000 + (s.startTime?.[1] ?? 0) / 1e6;
  const spanEndMs = (s: any) => (s.endTime?.[0] ?? 0) * 1000 + (s.endTime?.[1] ?? 0) / 1e6;

  /** Group spans by traceId, compute summary per trace */
  const traceGroups = useMemo(() => {
    if (!traces?.length) return [];
    const groups: Record<string, any[]> = {};
    for (const span of traces) {
      const tid = span.context?.traceId || 'unknown';
      (groups[tid] ??= []).push(span);
    }
    return Object.entries(groups).map(([traceId, spans]) => {
      const root = spans.find((s: any) => !s.parentSpanId) || spans[0];
      const start = Math.min(...spans.map(spanMs));
      const end = Math.max(...spans.map(spanEndMs));
      const hasErrors = spans.some((s: any) => s.status?.code === 2);
      const totalTokens = spans.reduce((t: number, s: any) => t + (s.attributes?.['cost.total_tokens'] ?? s.attributes?.['llm.total_tokens'] ?? 0), 0);
      const cost = spans.reduce((t: number, s: any) => t + (s.attributes?.['cost.total_usd'] ?? 0), 0);
      return { traceId, spans, root, start, end, duration: end - start, hasErrors, totalTokens, cost };
    }).sort((a, b) => b.start - a.start);
  }, [traces]);

  /** Build tree-ordered list with depth for the selected trace */
  const selectedTraceTree = useMemo(() => {
    const group = traceGroups.find(g => g.traceId === selectedTraceId);
    if (!group) return [];
    const { spans } = group;
    const children = new Map<string | undefined, any[]>();
    for (const s of spans) {
      const pid = s.parentSpanId || undefined;
      if (!children.has(pid)) children.set(pid, []);
      children.get(pid)!.push(s);
    }
    // Sort children by start time
    for (const arr of children.values()) {
      arr.sort((a: any, b: any) => spanMs(a) - spanMs(b));
    }
    const result: { span: any; depth: number }[] = [];
    const walk = (parentId: string | undefined, depth: number) => {
      for (const s of children.get(parentId) ?? []) {
        result.push({ span: s, depth });
        walk(s.context?.spanId, depth + 1);
      }
    };
    // Start from root(s) — spans without parent or whose parent is not in this trace
    const spanIds = new Set(spans.map((s: any) => s.context?.spanId));
    const roots = spans.filter((s: any) => !s.parentSpanId || !spanIds.has(s.parentSpanId));
    roots.sort((a: any, b: any) => spanMs(a) - spanMs(b));
    for (const r of roots) {
      result.push({ span: r, depth: 0 });
      walk(r.context?.spanId, 1);
    }
    return result;
  }, [traceGroups, selectedTraceId]);

  /** Currently selected span's data */
  const selectedSpan = useMemo(() => {
    if (!selectedSpanId || !selectedTraceTree.length) return null;
    return selectedTraceTree.find(n => n.span.context?.spanId === selectedSpanId)?.span ?? null;
  }, [selectedSpanId, selectedTraceTree]);

  const handleSelectTrace = useCallback((traceId: string) => {
    setSelectedTraceId(traceId);
    setSelectedSpanId(null);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedTraceId(null);
    setSelectedSpanId(null);
  }, []);

  const fmtDur = (ms: number) => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m${((ms % 60000) / 1000).toFixed(0)}s`;
  };

  const fmtCost = (usd: number) =>
    usd < 0.01 ? `$${usd.toFixed(6)}` : `$${usd.toFixed(4)}`;

  const fmtTokens = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <PanelContainer $isOpen={isOpen} role="dialog" aria-modal="true" aria-label="Observability">
    <Container>
      <Header>
        <Title>
          <LiveDot active={!!metrics} />
          Observability
        </Title>
        <div style={{ display: 'flex', gap: '2px' }}>
          {activeTab === "traces" && (
            <>
              <VSCodeButton appearance="icon" onClick={handleSendTestTrace} title="Send Test Trace">
                <span className="codicon codicon-beaker"></span>
              </VSCodeButton>
              <VSCodeButton appearance="icon" onClick={handleClear} title="Clear Traces">
                <span className="codicon codicon-clear-all"></span>
              </VSCodeButton>
            </>
          )}
          <VSCodeButton appearance="icon" onClick={handleRefresh} title="Refresh">
            <span className="codicon codicon-refresh"></span>
          </VSCodeButton>
          <CloseButton onClick={onClose} aria-label="Close observability panel">
            <span className="codicon codicon-close" style={{ fontSize: '16px' }}></span>
          </CloseButton>
        </div>
      </Header>

      <Tabs>
        <Tab active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
          <span className="codicon codicon-dashboard"></span>
          Dashboard
        </Tab>
        <Tab active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
          <span className="codicon codicon-output"></span>
          Logs
          {logs.length > 0 && <TabBadge>{logs.length > 99 ? '99+' : logs.length}</TabBadge>}
        </Tab>
        <Tab active={activeTab === "traces"} onClick={() => setActiveTab("traces")}>
          <span className="codicon codicon-pulse"></span>
          Traces
          {traces?.length > 0 && <TabBadge>{traces.length}</TabBadge>}
        </Tab>
      </Tabs>

      <Content>
        {activeTab === "dashboard" && (
          <DashboardScroll>
            {/* ── System Performance ── */}
            <div>
              <SectionHeader>
                <span className="codicon codicon-server-process" style={{ fontSize: '11px', opacity: 0.5 }}></span>
                <SectionTitle>System Performance</SectionTitle>
                <SectionLine />
              </SectionHeader>

              {metrics ? (
                <MetricGrid>
                  <MetricCard accent="var(--vscode-charts-blue, #3794ff)">
                    <MetricLabel>
                      <MetricIcon className="codicon codicon-search" />
                      Search Latency
                    </MetricLabel>
                    <MetricValue>
                      {metrics.avgSearchLatency?.toFixed(0) || 0}
                      <MetricUnit>ms</MetricUnit>
                    </MetricValue>
                    {metrics.p95SearchLatency != null && (
                      <MetricSubtext>p95: {metrics.p95SearchLatency?.toFixed(0)}ms</MetricSubtext>
                    )}
                  </MetricCard>

                  <MetricCard accent="var(--vscode-charts-purple, #b180d7)">
                    <MetricLabel>
                      <MetricIcon className="codicon codicon-server-process" />
                      Memory
                    </MetricLabel>
                    <MetricValue>
                      {metrics.avgMemoryUsage?.toFixed(0) || 0}
                      <MetricUnit>MB</MetricUnit>
                    </MetricValue>
                  </MetricCard>

                  <MetricCard accent="var(--vscode-charts-green, #89d185)">
                    <MetricLabel>
                      <MetricIcon className="codicon codicon-database" />
                      Indexing
                    </MetricLabel>
                    <MetricValue>
                      {metrics.avgIndexingThroughput?.toFixed(1) || 0}
                      <MetricUnit>/s</MetricUnit>
                    </MetricValue>
                  </MetricCard>

                  <MetricCard accent={metrics.errorRate > 0.05 ? 'var(--vscode-errorForeground)' : 'var(--vscode-charts-yellow, #cca700)'}>
                    <MetricLabel>
                      <MetricIcon className="codicon codicon-warning" />
                      Error Rate
                    </MetricLabel>
                    <MetricValue style={{ color: metrics.errorRate > 0.05 ? 'var(--vscode-errorForeground)' : 'inherit' }}>
                      {(metrics.errorRate * 100)?.toFixed(1) || 0}
                      <MetricUnit>%</MetricUnit>
                    </MetricValue>
                    <ProgressBarBg>
                      <ProgressBarFill
                        pct={metrics.errorRate * 100 * 10}
                        color={metrics.errorRate > 0.05 ? 'var(--vscode-errorForeground)' : 'var(--vscode-charts-yellow, #cca700)'}
                      />
                    </ProgressBarBg>
                  </MetricCard>

                  <MetricCard accent="var(--vscode-charts-orange, #d18616)">
                    <MetricLabel>
                      <MetricIcon className="codicon codicon-symbol-keyword" />
                      Cache Hit Rate
                    </MetricLabel>
                    <MetricValue>
                      {(metrics.cacheHitRate * 100)?.toFixed(1) || 0}
                      <MetricUnit>%</MetricUnit>
                    </MetricValue>
                    <ProgressBarBg>
                      <ProgressBarFill pct={metrics.cacheHitRate * 100} />
                    </ProgressBarBg>
                  </MetricCard>
                </MetricGrid>
              ) : (
                <MetricGrid>
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </MetricGrid>
              )}
            </div>

            {/* ── MCP Infrastructure ── */}
            <div>
              <SectionHeader>
                <span className="codicon codicon-plug" style={{ fontSize: '11px', opacity: 0.5 }}></span>
                <SectionTitle>MCP Infrastructure</SectionTitle>
                <SectionLine />
                {mcpStats && (
                  <StatusDot status={mcpStats.connectedServers > 0 ? 'good' : 'warn'} />
                )}
              </SectionHeader>

              {mcpStats ? (
                <>
                  <MetricGrid>
                    <MetricCard accent="var(--vscode-charts-green, #89d185)">
                      <MetricLabel>
                        <MetricIcon className="codicon codicon-vm-connect" />
                        Servers Connected
                      </MetricLabel>
                      <MetricValue>{mcpStats.connectedServers}</MetricValue>
                      {mcpStats.isGatewayMode && <MetricSubtext>via Docker Gateway</MetricSubtext>}
                    </MetricCard>

                    <MetricCard accent="var(--vscode-charts-blue, #3794ff)">
                      <MetricLabel>
                        <MetricIcon className="codicon codicon-tools" />
                        Tools Available
                      </MetricLabel>
                      <MetricValue>{mcpStats.totalTools}</MetricValue>
                      <MetricSubtext>{mcpStats.uniqueTools} unique</MetricSubtext>
                    </MetricCard>

                    <MetricCard accent="var(--vscode-charts-purple, #b180d7)">
                      <MetricLabel>
                        <MetricIcon className="codicon codicon-run-all" />
                        Invocations
                      </MetricLabel>
                      <MetricValue>{mcpStats.totalInvocations}</MetricValue>
                      {mcpStats.failedInvocations > 0 && (
                        <MetricSubtext style={{ color: 'var(--vscode-errorForeground)' }}>
                          {mcpStats.failedInvocations} failed
                        </MetricSubtext>
                      )}
                    </MetricCard>

                    <MetricCard accent={successRate !== null && successRate < 90 ? 'var(--vscode-errorForeground)' : 'var(--vscode-charts-green, #89d185)'}>
                      <MetricLabel>
                        <MetricIcon className="codicon codicon-pass" />
                        Success Rate
                      </MetricLabel>
                      <MetricValue>
                        {successRate?.toFixed(0) ?? '--'}
                        <MetricUnit>%</MetricUnit>
                      </MetricValue>
                      <ProgressBarBg>
                        <ProgressBarFill
                          pct={successRate ?? 0}
                          color={successRate !== null && successRate < 90 ? 'var(--vscode-errorForeground)' : 'var(--vscode-charts-green, #89d185)'}
                        />
                      </ProgressBarBg>
                    </MetricCard>
                  </MetricGrid>

                  {mcpStats.toolsByServer && Object.keys(mcpStats.toolsByServer).length > 0 && (
                    <MCPStatusRow style={{ marginTop: '8px' }}>
                      {Object.entries(mcpStats.toolsByServer).map(([name, count]: [string, any]) => (
                        <MCPServerChip key={name} connected>
                          {name}
                          <span style={{ opacity: 0.5, fontSize: '10px' }}>{count} tools</span>
                        </MCPServerChip>
                      ))}
                    </MCPStatusRow>
                  )}
                </>
              ) : (
                <MetricGrid>
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </MetricGrid>
              )}
            </div>
          </DashboardScroll>
        )}

        {activeTab === "logs" && (
          <>
            <LogToolbar>
              <LogFilterBtn active={!logFilter} onClick={() => setLogFilter(null)}>
                ALL ({logs.length})
              </LogFilterBtn>
              {logCounts.ERROR > 0 && (
                <LogFilterBtn active={logFilter === 'ERROR'} onClick={() => setLogFilter(logFilter === 'ERROR' ? null : 'ERROR')}>
                  ERR ({logCounts.ERROR})
                </LogFilterBtn>
              )}
              {logCounts.WARN > 0 && (
                <LogFilterBtn active={logFilter === 'WARN'} onClick={() => setLogFilter(logFilter === 'WARN' ? null : 'WARN')}>
                  WARN ({logCounts.WARN})
                </LogFilterBtn>
              )}
              <LogFilterBtn active={logFilter === 'INFO'} onClick={() => setLogFilter(logFilter === 'INFO' ? null : 'INFO')}>
                INFO ({logCounts.INFO})
              </LogFilterBtn>
              <LogFilterBtn active={logFilter === 'DEBUG'} onClick={() => setLogFilter(logFilter === 'DEBUG' ? null : 'DEBUG')}>
                DBG ({logCounts.DEBUG})
              </LogFilterBtn>
            </LogToolbar>
            <LogContainer>
              {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                <LogEntry key={i} level={log.level}>
                  <LogTime>{new Date(log.timestamp).toLocaleTimeString()}</LogTime>
                  <LogLevel level={log.level}>{log.level}</LogLevel>
                  <LogModule title={log.module}>{log.module}</LogModule>
                  <LogMessage>{log.message}</LogMessage>
                </LogEntry>
              )) : (
                <EmptyState>
                  <span className="codicon codicon-output"></span>
                  <h3>No logs {logFilter ? `with level ${logFilter}` : 'yet'}</h3>
                  <p>Logs will appear here as the extension runs.</p>
                </EmptyState>
              )}
              <div ref={logEndRef} />
            </LogContainer>
          </>
        )}

        {activeTab === "traces" && (
          <TraceContainer>
            {traceGroups.length > 0 ? (
              !selectedTraceId ? (
                /* ── Trace List View ── */
                <TraceList>
                  {traceGroups.map(g => (
                    <TraceListItem key={g.traceId} onClick={() => handleSelectTrace(g.traceId)}>
                      <TraceListDot $error={g.hasErrors} />
                      <TraceListBody>
                        <TraceListName>{g.root.name}</TraceListName>
                        <TraceListMeta>
                          <span>{new Date(g.start).toLocaleTimeString()}</span>
                          <span>{fmtDur(g.duration)}</span>
                          <span>{g.spans.length} span{g.spans.length !== 1 ? 's' : ''}</span>
                          {g.totalTokens > 0 && <span>⌃ {fmtTokens(g.totalTokens)}</span>}
                          {g.cost > 0 && <span>{fmtCost(g.cost)}</span>}
                        </TraceListMeta>
                      </TraceListBody>
                      <Badge>{g.traceId.substring(0, 8)}</Badge>
                    </TraceListItem>
                  ))}
                </TraceList>
              ) : (
                /* ── Trace Detail View (Split: Tree + Detail) ── */
                <TraceSplit>
                  {/* Left: span tree */}
                  <TreePane>
                    <TreeBreadcrumb>
                      <TreeBackBtn onClick={handleBackToList} title="Back to trace list">
                        <span className="codicon codicon-arrow-left" style={{ fontSize: '12px' }}></span>
                      </TreeBackBtn>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {traceGroups.find(g => g.traceId === selectedTraceId)?.root.name ?? 'Trace'}
                      </span>
                    </TreeBreadcrumb>
                    {selectedTraceTree.map(({ span: s, depth }) => {
                      const dur = spanEndMs(s) - spanMs(s);
                      const isErr = s.status?.code === 2;
                      return (
                        <TreeNode
                          key={s.context?.spanId}
                          $depth={depth}
                          $selected={selectedSpanId === s.context?.spanId}
                          onClick={() => setSelectedSpanId(s.context?.spanId)}
                        >
                          <TreeNodeDot $status={isErr ? 'error' : 'good'} />
                          <TreeNodeName title={s.name}>{s.name}</TreeNodeName>
                          <TreeNodeDuration>{fmtDur(dur)}</TreeNodeDuration>
                        </TreeNode>
                      );
                    })}
                  </TreePane>

                  {/* Right: span detail */}
                  <DetailPane>
                    {selectedSpan ? (() => {
                      const group = traceGroups.find(g => g.traceId === selectedTraceId)!;
                      const dur = spanEndMs(selectedSpan) - spanMs(selectedSpan);
                      const attrs = selectedSpan.attributes || {};
                      const isRoot = !selectedSpan.parentSpanId;

                      return (
                        <>
                          <DetailHeader>
                            <DetailTitle>
                              <StatusDot status={selectedSpan.status?.code === 2 ? 'error' : 'good'} />
                              {selectedSpan.name}
                            </DetailTitle>
                            <DetailBadges>
                              <DetailBadge $variant={selectedSpan.status?.code === 2 ? 'error' : 'success'}>
                                {selectedSpan.status?.code === 2 ? 'ERROR' : 'OK'}
                              </DetailBadge>
                              <DetailBadge>{fmtDur(dur)}</DetailBadge>
                              {attrs['llm.provider'] && <DetailBadge $variant="info">{attrs['llm.provider']}</DetailBadge>}
                              {attrs['llm.model'] && <DetailBadge $variant="info">{attrs['llm.model']}</DetailBadge>}
                              {(attrs['llm.total_tokens'] || attrs['cost.total_tokens']) && (
                                <DetailBadge>⌃ {fmtTokens(attrs['llm.total_tokens'] ?? attrs['cost.total_tokens'])}</DetailBadge>
                              )}
                              {attrs['cost.total_usd'] != null && attrs['cost.total_usd'] > 0 && (
                                <DetailBadge>{fmtCost(attrs['cost.total_usd'])}</DetailBadge>
                              )}
                            </DetailBadges>
                          </DetailHeader>

                          {/* Waterfall mini for root span */}
                          {isRoot && group.spans.length > 1 && (
                            <WaterfallMini>
                              {selectedTraceTree.map(({ span: ws, depth: wd }) => {
                                const wsStart = spanMs(ws);
                                const wsEnd = spanEndMs(ws);
                                const wsDur = wsEnd - wsStart;
                                const left = group.duration > 0 ? ((wsStart - group.start) / group.duration) * 100 : 0;
                                const width = group.duration > 0 ? Math.max((wsDur / group.duration) * 100, 0.5) : 100;
                                return (
                                  <WaterfallRow key={ws.context?.spanId}>
                                    <SpanName depth={wd}>{ws.name}</SpanName>
                                    <SpanBarWrapper>
                                      <SpanBar left={left} width={width} status={ws.status?.code === 2 ? 'ERROR' : 'OK'} />
                                    </SpanBarWrapper>
                                    <SpanDuration>{fmtDur(wsDur)}</SpanDuration>
                                  </WaterfallRow>
                                );
                              })}
                            </WaterfallMini>
                          )}

                          {/* Metadata */}
                          <DetailSectionTitle>Metadata</DetailSectionTitle>
                          <DetailBody>
                            <DetailRow><span>Span ID</span><span>{selectedSpan.context?.spanId}</span></DetailRow>
                            <DetailRow><span>Trace ID</span><span>{selectedTraceId}</span></DetailRow>
                            {selectedSpan.parentSpanId && <DetailRow><span>Parent Span</span><span>{selectedSpan.parentSpanId}</span></DetailRow>}
                            <DetailRow><span>Start</span><span>{new Date(spanMs(selectedSpan)).toLocaleTimeString()}</span></DetailRow>
                            <DetailRow><span>Duration</span><span>{fmtDur(dur)}</span></DetailRow>
                            <DetailRow><span>Status</span><span>{selectedSpan.status?.code === 2 ? 'ERROR' : 'OK'}</span></DetailRow>
                          </DetailBody>

                          {/* Attributes */}
                          {Object.keys(attrs).length > 0 && (
                            <>
                              <DetailSectionTitle>Attributes</DetailSectionTitle>
                              <DetailBody>
                                {Object.entries(attrs).map(([k, v]: [string, any]) => (
                                  <DetailRow key={k}>
                                    <span>{k}</span>
                                    <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                  </DetailRow>
                                ))}
                              </DetailBody>
                            </>
                          )}

                          {/* Events */}
                          {selectedSpan.events?.length > 0 && (
                            <>
                              <DetailSectionTitle>Events ({selectedSpan.events.length})</DetailSectionTitle>
                              <DetailBody>
                                {selectedSpan.events.map((ev: any, i: number) => (
                                  <DetailRow key={i}>
                                    <span>{ev.name}</span>
                                    <span>{ev.attributes ? JSON.stringify(ev.attributes) : ''}</span>
                                  </DetailRow>
                                ))}
                              </DetailBody>
                            </>
                          )}
                        </>
                      );
                    })() : (
                      <EmptyState>
                        <span className="codicon codicon-list-tree"></span>
                        <h3>Select a span</h3>
                        <p>Click a span in the tree to view its details, attributes, and timeline.</p>
                      </EmptyState>
                    )}
                  </DetailPane>
                </TraceSplit>
              )
            ) : (
              <EmptyState>
                <span className="codicon codicon-pulse"></span>
                <h3>No traces captured</h3>
                <p>Execute commands or interact with the agent to generate traces.</p>
                <VSCodeButton appearance="secondary" onClick={handleRefresh}>
                  Refresh
                </VSCodeButton>
              </EmptyState>
            )}
          </TraceContainer>
        )}
      </Content>
    </Container>
      </PanelContainer>
    </>
  );
};
