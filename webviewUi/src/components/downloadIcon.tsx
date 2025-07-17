import React, { useState } from "react";

interface DownloadIconProps {
  onClick: () => void | Promise<void>;
  className?: string;
  title?: string;
}

export const DownloadIcon: React.FC<DownloadIconProps> = ({ onClick, className = "", title = "Copy as Markdown" }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);
    setShowSuccess(false);

    try {
      await onClick();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Copy operation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (showSuccess) return "Copied!";
    if (isProcessing) return "...";
    return "MD";
  };

  return (
    <button
      onClick={handleClick}
      className={`download-button ${className} ${isProcessing ? "processing" : ""} ${showSuccess ? "success" : ""}`}
      title={title}
      aria-label={title}
      disabled={isProcessing}
    >
      {showSuccess ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20,6 9,17 4,12" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span className="download-text">{getButtonText()}</span>
    </button>
  );
};
