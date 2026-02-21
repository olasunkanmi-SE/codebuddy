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
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '';
    display: block;
    width: 3px;
    height: 16px;
    background: var(--vscode-activityBarBadge-background);
    border-radius: 1px;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
  padding: 0 10px;
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
  border-bottom: 1px solid
    ${(props) =>
      props.active ? "var(--vscode-tab-activeBorder)" : "transparent"};
  font-size: 11px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.15s ease;
  outline: none;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${(props) => (props.active ? "1" : "0.7")};

  &:hover {
    color: var(--vscode-tab-hoverForeground);
    opacity: 1;
    background: var(--vscode-tab-hoverBackground);
  }

  &:focus {
    outline: none;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--vscode-editor-background);
`;

const LogContainer = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-y: auto;
  height: 100%;
  background: var(--vscode-editor-background);
  padding: 16px;
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

const TraceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
`;

const TraceCard = styled.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--vscode-focusBorder);
  }
`;

const TraceHeader = styled.div`
  padding: 8px 12px;
  background: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TraceTitle = styled.div`
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--vscode-foreground);
`;

const WaterfallContainer = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--vscode-editor-background);
`;

const WaterfallRow = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr 100px;
  gap: 0;
  align-items: stretch;
  font-size: 11px;
  border-bottom: 1px solid var(--vscode-panel-border);
  min-height: 32px;
  
  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--vscode-list-hoverBackground);
  }
`;

const SpanName = styled.div<{ depth: number }>`
  padding-left: ${props => 12 + props.depth * 16}px;
  padding-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
  border-right: 1px solid var(--vscode-panel-border);
  color: var(--vscode-foreground);

  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: var(--vscode-symbolIcon-functionForeground);
    flex-shrink: 0;
  }
`;

const SpanBarWrapper = styled.div`
  padding: 0 16px;
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(0, 0, 0, 0.05);
`;

const SpanBar = styled.div<{ left: number; width: number; status: string }>`
  position: absolute;
  left: ${props => props.left}%;
  width: ${props => props.width}%;
  height: 14px;
  background: ${props => props.status === 'ERROR' ? 'var(--vscode-errorForeground)' : 'var(--vscode-progressBar-background)'};
  border-radius: 2px;
  opacity: 0.9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  
  &:hover {
    opacity: 1;
    filter: brightness(1.1);
  }
`;

const SpanDuration = styled.div`
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: var(--vscode-descriptionForeground);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  border-left: 1px solid var(--vscode-panel-border);
`;

const SpanDetails = styled.div`
  padding: 12px 20px;
  background: var(--vscode-sideBar-background);
  border-top: 1px solid var(--vscode-panel-border);
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 8px;
  
  span:first-child {
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    min-width: 100px;
  }
  
  span:last-child {
    font-family: 'JetBrains Mono', monospace;
    color: var(--vscode-foreground);
    word-break: break-all;
  }
`;

const TimeGrid = styled.div`
  position: absolute;
  top: 0;
  left: 240px;
  right: 100px;
  height: 100%;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  opacity: 0.1;
  border-left: 1px solid var(--vscode-panel-border);
  border-right: 1px solid var(--vscode-panel-border);
`;

const GridLine = styled.div`
  width: 1px;
  height: 100%;
  background: var(--vscode-panel-border);
`;

const GridLabel = styled.div`
  position: absolute;
  top: -15px;
  font-size: 9px;
  color: var(--vscode-descriptionForeground);
  transform: translateX(-50%);
`;

const GridLabels = styled.div`
  position: relative;
  height: 20px;
  margin-left: 240px;
  margin-right: 100px;
  margin-bottom: 4px;
`;

const TraceInfo = styled.div`
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-top: 4px;
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
  height: 300px;
  color: var(--vscode-descriptionForeground);
  gap: 16px;
  text-align: center;
  opacity: 0.8;

  .codicon {
    font-size: 48px;
    opacity: 0.5;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 13px;
    max-width: 240px;
  }
`;

interface ObservabilityPanelProps {
  vsCode: any;
  logs: any[];
  metrics: any;
  traces: any[];
}

export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({ vsCode, logs, metrics, traces }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    vsCode.postMessage({ command: "observability-get-metrics" });
    vsCode.postMessage({ command: "observability-get-logs" });
    vsCode.postMessage({ command: "observability-get-traces" });
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
    vsCode.postMessage({ command: "observability-get-traces" });
  };

  const handleSendTestTrace = () => {
    vsCode.postMessage({ command: "observability-send-test-trace" });
  };

  const handleClear = () => {
    if (activeTab === "traces") {
      vsCode.postMessage({ command: "observability-clear-traces" });
    }
    // Add other clear handlers if needed
  };

  return (
    <Container>
      <Header>
        <Title>Observability Center</Title>
        <div style={{ display: 'flex', gap: '4px' }}>
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
            <VSCodeButton appearance="icon" onClick={handleRefresh} title="Refresh Data">
                <span className="codicon codicon-refresh"></span>
            </VSCodeButton>
        </div>
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
        <Tab active={activeTab === "traces"} onClick={() => setActiveTab("traces")}>
            <span className="codicon codicon-history" style={{ marginRight: '6px' }}></span>
            Traces
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

        {activeTab === "traces" && (
          <TraceContainer>
            {traces && traces.length > 0 ? (
              // Group spans by traceId
              Object.entries(
                traces.reduce((acc: any, span: any) => {
                  const traceId = span.context?.traceId || 'unknown';
                  if (!acc[traceId]) acc[traceId] = [];
                  acc[traceId].push(span);
                  return acc;
                }, {})
              ).map(([traceId, spans]: [string, any]) => {
                const rootSpan = spans.find((s: any) => !s.parentSpanId) || spans[0];
                const startTime = Math.min(...spans.map((s: any) => s.startTime?.[0] * 1000 + s.startTime?.[1] / 1000000));
                const endTime = Math.max(...spans.map((s: any) => s.endTime?.[0] * 1000 + s.endTime?.[1] / 1000000));
                const totalDuration = endTime - startTime;

                // Sort spans by start time and build a simple tree depth
                const sortedSpans = [...spans].sort((a, b) => {
                    const aStart = a.startTime?.[0] * 1000 + a.startTime?.[1] / 1000000;
                    const bStart = b.startTime?.[0] * 1000 + b.startTime?.[1] / 1000000;
                    return aStart - bStart;
                });

                return (
                  <TraceCard key={traceId}>
                    <TraceHeader>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <TraceTitle>
                          <span className="codicon codicon-git-pull-request"></span>
                          {rootSpan.name}
                          <span style={{ opacity: 0.5, fontSize: '11px', fontWeight: 'normal' }}>{traceId.substring(0, 8)}...</span>
                        </TraceTitle>
                        <TraceInfo>
                          <span>Started: {new Date(startTime).toLocaleTimeString()}</span>
                          <span>Duration: {totalDuration.toFixed(2)}ms</span>
                        </TraceInfo>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <VSCodeTag>{spans.length} spans</VSCodeTag>
                        <VSCodeButton appearance="icon" onClick={() => setSelectedSpanId(null)} title="Collapse Details">
                          <span className="codicon codicon-chevron-up"></span>
                        </VSCodeButton>
                      </div>
                    </TraceHeader>
                    
                    <GridLabels>
                      {[0, 25, 50, 75, 100].map(p => (
                        <GridLabel key={p} style={{ left: `${p}%` }}>
                          {((totalDuration * p) / 100).toFixed(0)}ms
                        </GridLabel>
                      ))}
                    </GridLabels>

                    <WaterfallContainer style={{ position: 'relative' }}>
                      <TimeGrid>
                        {[25, 50, 75].map(p => <GridLine key={p} />)}
                      </TimeGrid>
                      
                      {sortedSpans.map((span: any) => {
                        const spanStart = span.startTime?.[0] * 1000 + span.startTime?.[1] / 1000000;
                        const spanEnd = span.endTime?.[0] * 1000 + span.endTime?.[1] / 1000000;
                        const spanDuration = spanEnd - spanStart;
                        const left = ((spanStart - startTime) / totalDuration) * 100;
                        const width = Math.max((spanDuration / totalDuration) * 100, 0.5);
                        const isSelected = selectedSpanId === span.context?.spanId;
                        
                        // Simple depth calculation
                        let depth = 0;
                        let current = span;
                        while (current.parentSpanId) {
                            depth++;
                            current = spans.find((s: any) => s.context?.spanId === current.parentSpanId) || {};
                            if (depth > 10) break; // safety
                        }

                        return (
                          <React.Fragment key={span.context?.spanId}>
                            <WaterfallRow 
                              onClick={() => setSelectedSpanId(isSelected ? null : span.context?.spanId)}
                              style={{ cursor: 'pointer', background: isSelected ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent' }}
                            >
                              <SpanName depth={depth} title={span.name}>{span.name}</SpanName>
                              <SpanBarWrapper>
                                <SpanBar 
                                  left={left} 
                                  width={width} 
                                  status={span.status?.code === 2 ? 'ERROR' : 'OK'} 
                                  title={`${span.name}: ${spanDuration.toFixed(2)}ms`}
                                />
                              </SpanBarWrapper>
                              <SpanDuration>{spanDuration.toFixed(1)}ms</SpanDuration>
                            </WaterfallRow>
                            
                            {isSelected && (
                              <SpanDetails>
                                <DetailRow>
                                  <span>Span ID</span>
                                  <span>{span.context?.spanId}</span>
                                </DetailRow>
                                <DetailRow>
                                  <span>Status</span>
                                  <span>{span.status?.code === 2 ? 'ERROR' : 'OK'}</span>
                                </DetailRow>
                                {span.attributes && Object.entries(span.attributes).map(([k, v]: [string, any]) => (
                                  <DetailRow key={k}>
                                    <span>{k}</span>
                                    <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                  </DetailRow>
                                ))}
                              </SpanDetails>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </WaterfallContainer>
                  </TraceCard>
                );
              })
            ) : (
              <EmptyState>
                <span className="codicon codicon-history"></span>
                <h3>No traces captured yet</h3>
                <p>Execute commands or interact with the agent to see traces here.</p>
                <VSCodeButton appearance="secondary" onClick={handleRefresh}>
                    Refresh Traces
                </VSCodeButton>
              </EmptyState>
            )}
          </TraceContainer>
        )}
      </Content>
    </Container>
  );
};
