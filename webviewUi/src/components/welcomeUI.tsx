import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

interface WelcomeScreenProps {
  username?: string;
  onGetStarted?: () => void;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;


const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
  animation: ${fadeIn} 0.6s ease-out;
`;


const WelcomeTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px 0;
  animation: ${fadeIn} 0.6s ease-out 0.1s both;
  letter-spacing: -0.5px;
`;

const WelcomeSubtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 48px 0;
  animation: ${fadeIn} 0.6s ease-out 0.2s both;
  text-align: center;
  max-width: 380px;
  line-height: 1.6;
`;


const TipsContainer = styled.div`
  max-width: 480px;
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  animation: ${fadeIn} 0.6s ease-out 0.4s both;
`;

const TipsTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
`;

const TipsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TipItem = styled.div`
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
  }
    
`;

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ username }) => {
  const [displayedText, setDisplayedText] = useState("");
  const greeting = username ? `Welcome back, ${username}` : "Welcome to CodeBuddy";

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= greeting.length) {
        setDisplayedText(greeting.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [greeting]);


  return (
    <WelcomeContainer>
      <WelcomeTitle>{displayedText}</WelcomeTitle>

      <WelcomeSubtitle>
        Your AI coding assistant ready to help you build better software
      </WelcomeSubtitle>

      <TipsContainer>
        <TipsTitle>
          <span>💡</span>
          <span>Quick Tips</span>
        </TipsTitle>
        <TipsList>
          <TipItem>Check out the FAQ and SETTINGS section to configure your AI assistant</TipItem>
          <TipItem>Select code in editor to ask questions about it</TipItem>
          <TipItem>Use context selector to include multiple files</TipItem>
          <TipItem>Switch modes for different assistance types</TipItem>
        </TipsList>
      </TipsContainer>
    </WelcomeContainer>
  );
};