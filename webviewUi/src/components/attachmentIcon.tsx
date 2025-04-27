import React from "react";

interface AttachmentIconProps {
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  disabled?: boolean; // Add a disabled prop
}

const AttachmentIcon: React.FC<AttachmentIconProps> = ({
  onClick,
  isActive = false,
  className = "",
  disabled = false,
}) => {
  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) {
      event.preventDefault(); // Prevent default SVG behavior if disabled
      event.stopPropagation(); // Stop event propagation to parent elements
      return; // Do nothing if disabled
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <svg
      className={`attachment-icon ${isActive ? "active" : ""} ${className} ${disabled ? "disabled" : ""}`}
      onClick={handleClick}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        cursor: disabled ? "not-allowed" : "pointer", // Change cursor on hover when disabled (optional)
        pointerEvents: disabled ? "none" : "auto", // Prevent hover effect
      }}
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
};

export default AttachmentIcon;
