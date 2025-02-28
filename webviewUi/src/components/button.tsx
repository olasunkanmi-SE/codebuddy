import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import React from "react";

interface ButtonProps {
  text: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  isActive = false,
  disabled = false,
  className = "",
}) => {
  return (
    <VSCodeButton
      className={`custom-VSCodeButton ${isActive ? "active" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </VSCodeButton>
  );
};

export default Button;
