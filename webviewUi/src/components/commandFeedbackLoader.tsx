import React from "react";
import styled, { keyframes } from "styled-components";

interface CommandFeedbackLoaderProps {
  commandAction?: string;
  commandDescription?: string;
}

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin: 4px 0;
  border-radius: 8px;
  background: var(--vscode-editor-background, rgba(255, 255, 255, 0.03));
`;

const Dots = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const Dot = styled.span<{ $delay: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vscode-progressBar-background, #0078d4);
  animation: ${bounce} 1.2s infinite ease-in-out;
  animation-delay: ${props => props.$delay};
`;

const Label = styled.span`
  font-size: 12px;
  color: var(--vscode-descriptionForeground, rgba(255, 255, 255, 0.5));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CommandFeedbackLoader: React.FC<CommandFeedbackLoaderProps> = ({
  commandAction = "Processing",
}) => {
  return (
    <Container>
      <Dots>
        <Dot $delay="0s" />
        <Dot $delay="0.15s" />
        <Dot $delay="0.3s" />
      </Dots>
      <Label>{commandAction}...</Label>
    </Container>
  );
};
