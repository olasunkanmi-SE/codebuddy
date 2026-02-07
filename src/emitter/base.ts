import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { IEventPayload } from "./interface";
import { IEvent, IEventEmitter } from "../interfaces/events";
import { createEventEmitter } from "./factory";

export class BaseEmitter<EventMap extends Record<string, IEventPayload>> {
  protected logger: Logger;
  constructor() {
    this.logger = Logger.initialize("CodeCommandHandler", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }
  private readonly emitters: Map<keyof EventMap, IEventEmitter<any>> =
    new Map();

  /**
   * Creates a new event for the given event name, reusing an existing emitter if one is already registered.
   * @param name The name of the event to create.
   * @returns The event that was created or retrieved.
   */
  protected createEvent<K extends keyof EventMap>(
    name: K,
  ): IEvent<EventMap[K]> {
    try {
      let emitter = this.emitters.get(name);
      if (!emitter) {
        emitter = createEventEmitter<EventMap[K]>();
        this.emitters.set(name, emitter);
      }
      return emitter.event;
    } catch (error: any) {
      this.logger.error("Error generating embeddings", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  /**
   * Emits the given event with the provided data, if an emitter exists for the event name.
   * @param name The name of the event to emit.
   * @param data The data to emit with the event.
   */
  protected emit<K extends keyof EventMap>(name: K, data: EventMap[K]): void {
    try {
      const emitter = this.emitters.get(name);
      if (emitter) emitter.fire(data);
    } catch (error: any) {
      this.logger.error(`Could not emit Event ${String(name)}`, error);
      throw new Error("Could not emit Event");
    }
  }

  /**
   * Disposes of all stored event emitters, freeing up any system resources they were using.
   */
  public dispose(): void {
    this.emitters.forEach((emitter) => emitter.dispose());
  }
}
