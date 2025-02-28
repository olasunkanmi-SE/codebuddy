/* eslint-disable @typescript-eslint/no-explicit-any */
export type vsCodeProviderProps = {
  children: React.ReactNode;
};

export interface IVSCodeContextType {
  postMessage: (message: any) => any;
}
