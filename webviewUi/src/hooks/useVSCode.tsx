import { useContext } from "react";
import { IVSCodeContextType } from "../interfaces/genric.interface";
import { VSCodeContext } from "../context/vscodeContext";

export const useVSCode = (): IVSCodeContextType => {
  return useContext(VSCodeContext);
};
