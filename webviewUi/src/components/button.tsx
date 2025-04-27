import React, { useState } from "react";

interface ButtonProps {
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  className?: string;
  id?: string;
  initialText?: string;
  clickedText?: string;
  duration?: number;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  variant = "primary",
  size = "small",
  disabled = false,
  className = "",
  id,
  initialText = "click",
  clickedText = "clicked",
  duration = 2000,
}) => {
  const [text, setText] = useState(initialText);

  const handleClick = () => {
    if (disabled || !onClick) return;

    setText(clickedText);

    setTimeout(() => {
      setText(initialText);
    }, duration); // Revert back after duration

    onClick();
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "button-small";
      case "large":
        return "button-large";
      default:
        return "button-medium";
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      className={`button ${getSizeClass()} ${variant} ${disabled ? "disabled" : ""} ${className}`}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
