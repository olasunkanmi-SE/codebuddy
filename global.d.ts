declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: <T extends object>(message: T) => void;
      getState: <T>() => T | undefined;
      setState: <T>(state: T) => void;
    };
  }
}
