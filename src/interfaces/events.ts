import { IDisposable } from "./disposable";

/**
 * Represents a typed event.
 * A function that represents an event to which you subscribe.
 * The call subscribes to the event and returns a disposable.
 */
export interface IEvent<T> {
  /**
   * A function that represents an event to which you subscribe.
   * @param listener The listener function will be called when the event happens.
   * @param thisArgs The 'this' argument which will be used when calling the event listener.
   * @param disposables An array to which a {@link IDisposable} will be added.
   * @return A disposable which unsubscribes the event listener.
   */
  (
    listener: (e: T) => any,
    thisArgs?: any,
    disposables?: IDisposable[],
  ): IDisposable;
}

/**
 * An event emitter can be used to create and manage an {@link IEvent} for others to subscribe to.
 * One emitter always owns one short-lived {@link IEvent}.
 */
export interface IEventEmitter<T> extends IDisposable {
  /**
   * The event listener can subscribe to.
   */
  event: IEvent<T>;

  /**
   * Notify all subscribers of the {@link IEvent event}. Failure
   * of one or more listener will not fail this function call.
   *
   * @param data The event data.
   */
  fire(data: T): void;
}
