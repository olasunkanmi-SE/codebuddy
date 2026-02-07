import { IDisposable } from "../interfaces/disposable";
import { IEvent, IEventEmitter } from "../interfaces/events";

export class NodeEventEmitter<T> implements IEventEmitter<T> {
  private _listeners: { callback: (e: T) => any; thisArg?: any }[] = [];
  private _disposed = false;

  get event(): IEvent<T> {
    return (
      listener: (e: T) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ) => {
      if (this._disposed) {
        return {
          dispose: () => {
            /* no-op */
          },
        };
      }

      const listenerObj = { callback: listener, thisArg: thisArgs };
      this._listeners.push(listenerObj);

      const disposable = {
        dispose: () => {
          const index = this._listeners.indexOf(listenerObj);
          if (index > -1) {
            this._listeners.splice(index, 1);
          }
        },
      };

      if (disposables) {
        disposables.push(disposable);
      }

      return disposable;
    };
  }

  fire(data: T): void {
    if (this._disposed) {
      return;
    }
    // Clone to prevent interference during emission
    const listeners = [...this._listeners];
    for (const listener of listeners) {
      try {
        listener.callback.call(listener.thisArg, data);
      } catch (e) {
        console.error("Error in event listener:", e);
      }
    }
  }

  dispose(): void {
    this._listeners = [];
    this._disposed = true;
  }
}
