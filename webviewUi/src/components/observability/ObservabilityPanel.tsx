import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { VSCodeButton, VSCodeTag } from "@vscode/webview-ui-toolkit/react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    display: block;
    width: 4px;
    height: 14px;
    background: var(--vscode-activityBarBadge-background);
    border-radius: 2px;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 0 20px;
  background: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  color: ${(props) =>
    props.active
      ? "var(--vscode-tab-activeForeground)"
      : "var(--vscode-tab-inactiveForeground)"};
  border-bottom: 2px solid
    ${(props) =>
      props.active ? "var(--vscode-tab-activeBorder)" : "transparent"};
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    color: var(--vscode-tab-hoverForeground);
    background: var(--vscode-toolbar-hoverBackground);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 24px;
`;

const LogContainer = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-y: auto;
  flex: 1;
  background: var(--vscode-editor-background);
  padding: 16px;
  border: 1px solid var(--vscode-widget-border);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LogEntry = styled.div<{ level: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 2px;
  display: grid;
  grid-template-columns: 80px 60px 120px 1fr;
  gap: 8px;
  align-items: start;
  
  &:hover {
    background: var(--vscode-list-hoverBackground);
  }

  color: ${(props) => {
    switch (props.level) {
      case "ERROR": return "var(--vscode-errorForeground)";
      case "WARN": return "var(--vscode-editorWarning-foreground)";
      case "DEBUG": return "var(--vscode-debugConsole-infoForeground)";
      default: return "var(--vscode-foreground)";
    }
  }};
`;

const MetricCard = styled.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--vscode-focusBorder);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: var(--vscode-progressBar-background);
    opacity: 0.5;
  }
`;

const MetricValue = styled.span`
  font-size: 2rem;
  font-weight: 300;
  color: var(--vscode-foreground);
  letter-spacing: -0.5px;
`;

const MetricLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetricIcon = styled.span`
  font-size: 16px;
  opacity: 0.7;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--vscode-descriptionForeground);
  gap: 12px;
`;

interface ObservabilityPanelProps {
  vsCode: any;
  logs: any[];
  metrics: any;
}

export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({ vsCode, logs, metrics }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    vsCode.postMessage({ command: "observability-get-metrics" });
    vsCode.postMessage({ command: "observability-get-logs" });
  }, []);

  useEffect(() => {
    // Scroll to bottom of logs
    if (activeTab === "logs" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Auto-refresh metrics when on dashboard
    let interval: NodeJS.Timeout;
    if (activeTab === "dashboard") {
        interval = setInterval(() => {
            vsCode.postMessage({ command: "observability-get-metrics" });
        }, 5000);
    }
    
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [logs, activeTab]);

  const handleRefresh = () => {
    vsCode.postMessage({ command: "observability-get-metrics" });
    vsCode.postMessage({ command: "observability-get-logs" });
  };

  return (
    <Container>
      <Header>
        <Title>Observability Center</Title>
        <VSCodeButton appearance="icon" onClick={handleRefresh} title="Refresh Data">
          <span className="codicon codicon-refresh"></span>
        </VSCodeButton>
      </Header>
      
      <Tabs>
        <Tab active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
            <span className="codicon codicon-dashboard" style={{ marginRight: '6px' }}></span>
            Dashboard
        </Tab>
        <Tab active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
            <span className="codicon codicon-output" style={{ marginRight: '6px' }}></span>
            System Logs
        </Tab>
      </Tabs>

      <Content>
        {activeTab === "dashboard" && (
          metrics ? (
            <Grid>
              <MetricCard>
                <MetricLabel>
                    <MetricIcon className="codicon codicon-search" />
                    Search Latency
                </MetricLabel>
                <MetricValue>{metrics.avgSearchLatency?.toFixed(0) || 0}<span style={{fontSize: '1rem', marginLeft: '4px'}}>ms</span></MetricValue>
              </MetricCard>
              
              <MetricCard>
                <MetricLabel>
                    <MetricIcon className="codicon codicon-server-process" />
                    Memory Usage
                </MetricLabel>
                <MetricValue>{metrics.avgMemoryUsage?.toFixed(0) || 0}<span style={{fontSize: '1rem', marginLeft: '4px'}}>MB</span></MetricValue>
              </MetricCard>
              
              <MetricCard>
                <MetricLabel>
                    <MetricIcon className="codicon codicon-database" />
                    Indexing Speed
                </MetricLabel>
                <MetricValue>{metrics.avgIndexingThroughput?.toFixed(1) || 0}<span style={{fontSize: '1rem', marginLeft: '4px'}}>/s</span></MetricValue>
              </MetricCard>
              
              <MetricCard>
                <MetricLabel>
                    <MetricIcon className="codicon codicon-error" />
                    Error Rate
                </MetricLabel>
                <MetricValue style={{ color: metrics.errorRate > 0.05 ? 'var(--vscode-errorForeground)' : 'inherit' }}>
                    {(metrics.errorRate * 100)?.toFixed(1) || 0}<span style={{fontSize: '1rem', marginLeft: '4px'}}>%</span>
                </MetricValue>
              </MetricCard>
              
              <MetricCard>
                <MetricLabel>
                    <MetricIcon className="codicon codicon-symbol-keyword" />
                    Cache Hit Rate
                </MetricLabel>
                <MetricValue>{(metrics.cacheHitRate * 100)?.toFixed(1) || 0}<span style={{fontSize: '1rem', marginLeft: '4px'}}>%</span></MetricValue>
              </MetricCard>
            </Grid>
          ) : (
            <EmptyState>
                <VSCodeTag>Loading metrics...</VSCodeTag>
            </EmptyState>
          )
        )}

        {activeTab === "logs" && (
          <LogContainer>
            {logs.length > 0 ? logs.map((log, i) => (
              <LogEntry key={i} level={log.level}>
                <span style={{ opacity: 0.7 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span style={{ fontWeight: 'bold' }}>{log.level}</span>
                <span style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>[{log.module}]</span>
                <span>{log.message}</span>
              </LogEntry>
            )) : (
                <EmptyState>
                    <span className="codicon codicon-output" style={{ fontSize: '32px', marginBottom: '16px' }}></span>
                    <div>No logs available yet</div>
                </EmptyState>
            )}
            <div ref={logEndRef} />
          </LogContainer>
        )}
      </Content>
    </Container>
  );
};
