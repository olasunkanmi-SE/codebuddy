 

import { vsCodeProviderProps } from "../interfaces/genric.interface";
import { VSCodeContext } from "./vscodeContext";
import { vscode } from "../utils/vscode";

export const VSCodeProvider = ({ children }: vsCodeProviderProps) => {
  return (
    <VSCodeContext.Provider value={vscode}>{children}</VSCodeContext.Provider>
  );
};
