import { createContext } from "react";
import { IVSCodeContextType } from "../interfaces/genric.interface";

export const VSCodeContext = createContext<IVSCodeContextType>(
  {} as IVSCodeContextType
);
