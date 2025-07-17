import React, { useState } from "react";

interface DownloadIconProps {
  onClick: () => void;
  className?: string;
  title?: string;
}

export const DownloadIcon: React.FC<DownloadIconProps> = ({
  onClick,
  className = "",
  title = "Download as Markdown",
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    setIsDownloading(true);
    try {
      await onClick();
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`download-button ${className} ${isDownloading ? "downloading" : ""}`}
      title={title}
      aria-label={title}
      disabled={isDownloading}
    >
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="download-text">{isDownloading ? "..." : "MD"}</span>
    </button>
  );
};
