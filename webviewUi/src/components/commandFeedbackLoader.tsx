import React from "react";
import { BotIcon } from "./botIcon";
import { SkeletonLoader } from "./skeletonLoader";

interface CommandFeedbackLoaderProps {
  commandAction?: string;
  commandDescription?: string;
}

export const CommandFeedbackLoader: React.FC<CommandFeedbackLoaderProps> = ({
  commandAction = "Processing your request",
  commandDescription = "CodeBuddy is analyzing your code...",
}) => {
  return (
    <div className="command-feedback-container">
      <div className="command-feedback-header">
        <BotIcon isBlinking={true} />
        <div className="command-info">
          <div className="command-action">{commandAction}</div>
          <div className="command-description">{commandDescription}</div>
        </div>
      </div>

      {/* Use the existing SkeletonLoader component for consistency */}
      <SkeletonLoader />

      <div className="command-status">
        <div className="status-indicator">
          <div className="pulsing-dot"></div>
          <span>Generating response...</span>
        </div>
      </div>
    </div>
  );
};
