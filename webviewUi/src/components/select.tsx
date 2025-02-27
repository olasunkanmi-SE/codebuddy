/* eslint-disable @typescript-eslint/no-explicit-any */
import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import React from "react";

interface ModelDropdownProps {
  value: string;
  onChange: (e: any) => void;
  id?: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  value,
  onChange,
  id,
  options,
  defaultValue,
}) => {
  console.log({ value, onChange, id, options, defaultValue });
  return (
    <VSCodeDropdown
      defaultValue={defaultValue}
      value={value}
      id={id}
      onChange={onChange}
    >
      {options.map((option) => (
        <VSCodeOption key={option.value} value={option.value}>
          {option.label}
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );
};
