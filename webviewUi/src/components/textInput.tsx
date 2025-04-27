import React, { ChangeEvent, forwardRef } from "react";

interface InputComponentProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  maxLength?: number;
}

const TextInput = forwardRef<HTMLInputElement, InputComponentProps>(
  (
    {
      placeholder = "",
      value,
      onChange,
      disabled = false,
      style,
      className,
      maxLength,
    },
    ref
  ) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.slice(0, maxLength);
      }
      onChange(e);
    };
    return (
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        style={style}
        onChange={handleChange}
        value={value}
        disabled={disabled}
        className={className}
      />
    );
  }
);

TextInput.displayName = "InputComponent";

export default TextInput;
