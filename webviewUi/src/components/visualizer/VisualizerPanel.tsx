import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { VSCodeButton, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import MermaidDiagram from "../MermaidDiagram";

const Container = styled.div<{ $hasGraph: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${props => props.$hasGraph ? '0' : '16px'};
  gap: ${props => props.$hasGraph ? '0' : '16px'};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--vscode-foreground);
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Description = styled.p`
  color: var(--vscode-descriptionForeground);
  font-size: 13px;
  margin: 0;
`;

interface VisualizerPanelProps {
  vsCode: any;
  graph: string | null;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({ vsCode, graph }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (graph) {
      setLoading(false);
    }
  }, [graph]);

  const handleGenerate = (force = false) => {
    setLoading(true);
    vsCode.postMessage({ command: "get-dependency-graph", force });
  };

  return (
    <Container $hasGraph={!!graph && !loading}>
      <Header style={{ padding: graph && !loading ? '16px 16px 0 16px' : '0' }}>
        <Title>Workspace Visualizer</Title>
        <VSCodeButton appearance="icon" onClick={() => handleGenerate(true)} disabled={loading}>
          <span className="codicon codicon-refresh"></span>
        </VSCodeButton>
      </Header>
      
      <Content>
        {!graph && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Description>
                    Visualize your workspace structure and dependencies.
                    Click the button below to generate a dependency map.
                </Description>
                <div style={{ marginTop: "16px" }}>
                    <VSCodeButton onClick={() => handleGenerate(false)}>Generate Map</VSCodeButton>
                </div>
            </div>
        )}

        {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <VSCodeProgressRing />
            </div>
        )}

        {graph && !loading && (
            <MermaidDiagram chart={graph} fullHeight={true} />
        )}
      </Content>
    </Container>
  );
};
