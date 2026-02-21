import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  const { t } = useTranslation();
  const [displayedText, setDisplayedText] = useState("");
  const greeting = username ? t("welcome.greetingWithName", { username }) : t("welcome.greetingDefault");

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
        {t("welcome.subtitle")}
      </WelcomeSubtitle>

      <TipsContainer>
        <TipsTitle>{t("welcome.tipsTitle")}</TipsTitle>
        <TipsList>
          <TipItem>{t("welcome.tipsHint")}</TipItem>
          <TipItem><strong>{t("welcome.featureAgentMode")}</strong> — {t("welcome.featureAgentModeDesc")}</TipItem>
          <TipItem><strong>{t("welcome.featureAskMode")}</strong> — {t("welcome.featureAskModeDesc")}</TipItem>
          <TipItem><strong>{t("welcome.featureProviders")}</strong> — {t("welcome.featureProvidersDesc")}</TipItem>
          <TipItem><strong>{t("welcome.featureDiffReview")}</strong> — {t("welcome.featureDiffReviewDesc")}</TipItem>
          <TipItem><strong>{t("welcome.featureMCP")}</strong> — {t("welcome.featureMCPDesc")}</TipItem>
          <TipItem><strong>{t("welcome.featureMentions")}</strong> — {t("welcome.featureMentionsDesc")}</TipItem>
        </TipsList>
      </TipsContainer>
    </WelcomeContainer>
  );
};