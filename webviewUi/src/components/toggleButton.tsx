import React, { useState, useEffect } from "react";

interface ToggleButtonProps {
  initialState?: boolean;
  onToggle?: (isActive: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
  label?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  id?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  initialState = false,
  onToggle,
  activeColor = "#4CAF50",
  inactiveColor = "#ccc",
  disabled = false,
  label,
  size = "small",
  className = "",
  id,
}) => {
  const [isActive, setIsActive] = useState<boolean>(initialState);

  useEffect(() => {
    setIsActive(initialState);
  }, [initialState]);

  const handleToggle = () => {
    if (disabled) return;

    const newState = !isActive;
    setIsActive(newState);

    if (onToggle) {
      onToggle(newState);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "toggle-button-small";
      case "large":
        return "toggle-button-large";
      default:
        return "toggle-button-medium";
    }
  };

  const style = {
    "--active-color": activeColor,
    "--inactive-color": inactiveColor,
  } as React.CSSProperties;

  return (
    <div className={`toggle-button-container ${className}`} style={style}>
      {label && (
        <label htmlFor={id} className="toggle-button-label">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={handleToggle}
        className={`toggle-button ${isActive ? "active" : "inactive"} ${getSizeClass()} ${disabled ? "disabled" : ""}`}
        disabled={disabled}
        aria-pressed={isActive}
      >
        <span className="toggle-slider"></span>
      </button>
    </div>
  );
};

export default ToggleButton;
