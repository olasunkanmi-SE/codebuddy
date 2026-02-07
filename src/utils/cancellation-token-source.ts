import { IEvent, IEventEmitter } from "../interfaces/events";
import { ICancellationToken } from "../interfaces/cancellation";
import { EditorHostService } from "../services/editor-host.service";

export class CancellationTokenSource {
  private _token: CancellationToken;
  private _disposed = false;

  constructor() {
    this._token = new CancellationToken();
  }

  get token(): ICancellationToken {
    return this._token;
  }

  cancel(): void {
    if (!this._disposed) {
      this._token.cancel();
    }
  }

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this._token.dispose();
    }
  }
}

class CancellationToken implements ICancellationToken {
  private _isCancellationRequested = false;
  private _onCancellationRequested: IEventEmitter<any> | undefined;

  // constructor() {}

  get isCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }

  get onCancellationRequested(): IEvent<any> {
    if (!this._onCancellationRequested) {
      this._onCancellationRequested = EditorHostService.getInstance()
        .getHost()
        .createEventEmitter<any>();
    }
    return this._onCancellationRequested.event;
  }

  cancel(): void {
    if (!this._isCancellationRequested) {
      this._isCancellationRequested = true;
      this._onCancellationRequested?.fire(undefined);
    }
  }

  dispose(): void {
    this._onCancellationRequested?.dispose();
  }
}
