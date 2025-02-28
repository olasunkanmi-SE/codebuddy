/* eslint-disable @typescript-eslint/no-explicit-any */

import { vsCodeProviderProps } from "../interfaces/genric.interface";
import { VSCodeContext } from "./vscodeContext";

export const VSCodeProvider = ({ children }: vsCodeProviderProps) => {
  const vscode = (() => {
    if (typeof window !== "undefined" && "acquireVsCodeApi" in window) {
      return (window as any).acquireVsCodeApi;
    }
    return {
      postMessage: (message: any) => {
        console.log("Message to VS Code:", message);
      },
    };
  })();
  return (
    <VSCodeContext.Provider value={vscode}>{children}</VSCodeContext.Provider>
  );
};
