import React from "react";
import styled, { keyframes } from "styled-components";

interface ErrorCardProps {
  message: string;
  suggestion?: string;
  reason?: string;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const CardContainer = styled.div`
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 14px;
  margin: 8px 0;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const ErrorIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
`;

const Title = styled.span`
  color: var(--vscode-errorForeground, #f87171);
  font-size: 13px;
  font-weight: 500;
`;

const MessageText = styled.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground);
`;

const SuggestionBox = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 10px 12px;
  margin-top: 10px;
`;

const SuggestionTitle = styled.div`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SuggestionText = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vscode-foreground);
  opacity: 0.9;
`;

const SuggestionList = styled.ul`
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: var(--vscode-foreground);
  opacity: 0.85;

  li {
    margin-bottom: 4px;
  }
`;

const ReasonBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 10px;
  color: var(--vscode-errorForeground, #f87171);
  margin-left: auto;
`;

const ErrorCard: React.FC<ErrorCardProps> = ({ message, suggestion, reason }) => {
  // Determine suggestions based on error type
  const getSuggestions = (): string[] => {
    if (message.includes("maximum iterations") || message.includes("multiple times")) {
      return [
        "Try a more specific question",
        "Break down complex requests into smaller parts",
        "For GitHub data, visit the repository directly",
        "Use simpler keywords in your query",
      ];
    }
    if (message.includes("timeout") || message.includes("timed out")) {
      return [
        "Check your internet connection",
        "Try again in a few moments",
        "The service might be temporarily unavailable",
      ];
    }
    if (message.includes("API") || message.includes("rate limit")) {
      return [
        "Wait a few minutes before trying again",
        "Check your API key configuration",
      ];
    }
    return [
      "Try rephrasing your question",
      "Check if the information is publicly available",
    ];
  };

  const suggestions = getSuggestions();

  return (
    <CardContainer>
      <Header>
        <ErrorIcon />
        <Title>Request could not be completed</Title>
        {reason && <ReasonBadge>{reason.replace(/_/g, " ")}</ReasonBadge>}
      </Header>

      <MessageText>{message}</MessageText>

      <SuggestionBox>
        <SuggestionTitle>Suggestions</SuggestionTitle>
        {suggestion ? (
          <SuggestionText>{suggestion}</SuggestionText>
        ) : (
          <SuggestionList>
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </SuggestionList>
        )}
      </SuggestionBox>
    </CardContainer>
  );
};

export default ErrorCard;
