import { IEvent } from "./events";
import { IDisposable } from "./disposable";

export interface ICancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: IEvent<any>;
}

export class CancellationError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "CancellationError";
  }
}
