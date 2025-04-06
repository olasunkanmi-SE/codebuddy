/* eslint-disable @typescript-eslint/no-explicit-any */
import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import React from "react";

interface ModelDropdownProps {
  value: string;
  onChange: (e: any) => void;
  id?: string;
  options: any[];
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({ value, onChange, id, options }) => {
  console.log({ value, onChange, id, options });
  return (
    <VSCodeDropdown value={value} id={id} onChange={onChange}>
      {options.map((option) => (
        <VSCodeOption key={option.value} value={option.value}>
          {option.label}
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );
};
