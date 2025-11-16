import React from "react";
import { BotIcon } from "./botIcon";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

export const SkeletonLoaderContainer = styled.div`
  background-color: transparent;
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  max-width: 500px; /* Adjust as needed */
  margin: 0 auto; /* Center the loader */
`;

export const SkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

export const SkeletonLine = styled.div`
  height: 12px;
  background: linear-gradient(to right, #333, #444, #333);
  background-size: 2000px 100%;
  animation: ${shimmer} 2s linear infinite;
  border-radius: 4px;
  margin-bottom: 8px;
`;

export const SkeletonLineShort = styled(SkeletonLine)`
  width: 30%;
`;

export const SkeletonLineMedium = styled(SkeletonLine)`
  width: 70%;
`;

export const SkeletonLineLong = styled(SkeletonLine)`
  width: 90%;
`;

export const SkeletonLoader: React.FC = () => {
  return (
    <SkeletonLoaderContainer>
      <SkeletonHeader>
        <BotIcon isBlinking={true} />
        <SkeletonLineShort />
      </SkeletonHeader>
      <div>
        <SkeletonLine />
        <SkeletonLineMedium />
        <SkeletonLineLong />
        <SkeletonLineShort />
        <SkeletonLineMedium />
      </div>
    </SkeletonLoaderContainer>
  );
};
