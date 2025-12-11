import React from "react";
import { BotIcon } from "./botIcon";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
`;

const scanline = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

export const SkeletonLoaderContainer = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.3) 0%, rgba(30, 30, 45, 0.3) 100%);
  border: 1px solid rgba(100, 200, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 150, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(100, 200, 255, 0.5), transparent);
    animation: ${scanline} 3s linear infinite;
  }
`;

export const SkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

export const SkeletonLine = styled.div`
  height: 10px;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 5px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(100, 200, 255, 0.3) 50%,
      transparent 100%
    );
    animation: ${shimmer} 2s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(100, 200, 255, 0.05) 50%,
      transparent 100%
    );
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

export const SkeletonLineShort = styled(SkeletonLine)`
  width: 35%;
`;

export const SkeletonLineMedium = styled(SkeletonLine)`
  width: 65%;
`;

export const SkeletonLineLong = styled(SkeletonLine)`
  width: 85%;
`;

const BotIconWrapper = styled.div`
  animation: ${pulse} 2s ease-in-out infinite;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(100, 200, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00d9ff;
    box-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
    animation: ${pulse} 1s ease-in-out infinite;
  }
`;

export const SkeletonLoader: React.FC = () => {
  return (
    <SkeletonLoaderContainer>
      <SkeletonHeader>
        <BotIconWrapper>
          <BotIcon isBlinking={true} />
        </BotIconWrapper>
        <StatusIndicator>Processing</StatusIndicator>
      </SkeletonHeader>
      <div>
        <SkeletonLineLong />
        <SkeletonLineMedium />
        <SkeletonLine />
        <SkeletonLineShort />
        <SkeletonLineMedium />
      </div>
    </SkeletonLoaderContainer>
  );
};