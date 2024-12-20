import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";

export const WebviewUI = () => {
  return (
    <>
      <div className="dropdown-container">
        <label>Choose an option:</label>
        <VSCodeDropdown id="my-dropdown">
          <VSCodeOption>Option Label #1</VSCodeOption>
          <VSCodeOption>Option Label #2</VSCodeOption>
          <VSCodeOption>Option Label #3</VSCodeOption>
        </VSCodeDropdown>
      </div>
    </>
  );
};
