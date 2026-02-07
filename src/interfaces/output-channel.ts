import { IDisposable } from "./disposable";

export interface IOutputChannel extends IDisposable {
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(preserveFocus?: boolean): void;
  hide(): void;
  name: string;
}
