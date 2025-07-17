import React from "react";
import { BotIcon } from "./botIcon";

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-header">
        <BotIcon isBlinking={true} />
        <div className="skeleton-line skeleton-line-short"></div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-line-full"></div>
        <div className="skeleton-line skeleton-line-medium"></div>
        <div className="skeleton-line skeleton-line-long"></div>
        <div className="skeleton-line skeleton-line-short"></div>
        <div className="skeleton-line skeleton-line-medium"></div>
      </div>
    </div>
  );
};
